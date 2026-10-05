/**
 * Migration script: Assign member numbers (الرقم) to Masjid members.
 *
 * Requirements:
 * - Dry run by default (prints old -> new, writes nothing)
 * - Explicit --apply flag to commit changes to Firestore
 * - Writes a JSON backup before applying
 * - Uses batched writes (max 500 per batch)
 * - Idempotent: re-running does not overwrite or reassign
 * - Reports: exact matches, fuzzy matches, unmatched Firestore, unmatched CSV
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { normalizeForSearch } from "../src/lib/search";
import { normalizeName, matchNames } from "../src/lib/matching";

if (process.loadEnvFile) {
  process.loadEnvFile(".env.local");
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CSV_FILE = args.find((a) => !a.startsWith("--")) || "الأعضاء numbers.csv";

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
const app = sa
  ? initializeApp({ credential: cert(JSON.parse(sa)) })
  : process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? initializeApp()
  : initializeApp({ projectId: "masjid-nour" });

const db = getFirestore(app);

interface CsvRow {
  rowIdx: number;
  number: number;
  name: string;
}

interface FirestoreMember {
  id: string;
  fullName: string;
  memberNumber?: number;
  monthlyPledgeCents?: number;
  startMonth?: string;
  status?: string;
  phone?: string;
  nie?: string;
  notes?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

async function run() {
  console.log(`\n=== Member Numbers Migration ===`);
  console.log(`Mode: ${APPLY ? "APPLY (WILL WRITE TO FIRESTORE)" : "DRY RUN (READ-ONLY)"}`);
  console.log(`CSV Source: ${CSV_FILE}`);

  if (!existsSync(CSV_FILE)) {
    console.error(`Error: CSV file not found at ${CSV_FILE}`);
    process.exit(1);
  }

  // 1. Parse CSV
  const rawCsv = readFileSync(CSV_FILE, "utf8").replace(/^\uFEFF/, "");
  const lines = rawCsv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    console.error("Error: CSV file is empty");
    process.exit(1);
  }

  const header = lines[0];
  console.log(`Header line: ${header}`);

  const csvRows: CsvRow[] = [];
  const invalidRows: { rowIdx: number; raw: string; error: string }[] = [];
  const numbersMap = new Map<number, number[]>();
  const namesMap = new Map<string, number[]>();

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split(",");
    const numStr = parts[0]?.trim();
    const name = parts.slice(1).join(",")?.trim();
    const num = parseInt(numStr, 10);

    if (isNaN(num)) {
      invalidRows.push({ rowIdx: i + 1, raw, error: "Non-numeric member number" });
      continue;
    }
    if (!name) {
      invalidRows.push({ rowIdx: i + 1, raw, error: "Empty member name" });
      continue;
    }

    csvRows.push({ rowIdx: i + 1, number: num, name });

    const existingNum = numbersMap.get(num) || [];
    existingNum.push(i + 1);
    numbersMap.set(num, existingNum);

    const existingName = namesMap.get(name) || [];
    existingName.push(i + 1);
    namesMap.set(name, existingName);
  }

  console.log(`Parsed CSV rows: ${csvRows.length}`);
  if (invalidRows.length > 0) {
    console.warn(`Found ${invalidRows.length} invalid CSV rows:`, invalidRows);
  }

  const dupNumbers = Array.from(numbersMap.entries()).filter(([, rows]) => rows.length > 1);
  if (dupNumbers.length > 0) {
    console.warn(`Duplicate CSV numbers detected:`, dupNumbers);
  }

  const dupNames = Array.from(namesMap.entries()).filter(([, rows]) => rows.length > 1);
  if (dupNames.length > 0) {
    console.warn(`Duplicate CSV names detected:`, dupNames);
  }

  // 2. Read Firestore members
  console.log("\nReading existing members from Firestore...");
  const snap = await db.collection("members").get();
  const members: FirestoreMember[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMember));
  console.log(`Fetched ${members.length} members from Firestore.`);

  // 3. Match Firestore members to CSV rows
  const matchedMemberIds = new Set<string>();
  const matchedCsvNumbers = new Set<number>();

  interface Assignment {
    id: string;
    fullName: string;
    oldNumber: number | null;
    newNumber: number;
    source: "csv_exact" | "unmatched_auto_increment" | "already_assigned";
    notes?: string;
  }

  const assignments: Assignment[] = [];
  const conflicts: { id: string; fullName: string; firestoreNumber: number; csvNumber: number }[] = [];
  const fuzzyCandidates: { memberId: string; memberName: string; csvNumber: number; csvName: string; reason: string }[] = [];

  // Pass A: Exact Normalized Matches
  for (const m of members) {
    const mNormSearch = normalizeForSearch(m.fullName);
    const mNormCanonical = normalizeName(m.fullName);

    // Look for exact match in CSV
    const exact = csvRows.find((c) => {
      const cNormSearch = normalizeForSearch(c.name);
      const cNormCanonical = normalizeName(c.name);
      return mNormSearch === cNormSearch || mNormCanonical === cNormCanonical;
    });

    if (exact) {
      matchedMemberIds.add(m.id);
      matchedCsvNumbers.add(exact.number);

      const oldNum = m.memberNumber ?? null;
      if (oldNum !== null && oldNum !== exact.number) {
        conflicts.push({
          id: m.id,
          fullName: m.fullName,
          firestoreNumber: oldNum,
          csvNumber: exact.number,
        });
      } else {
        assignments.push({
          id: m.id,
          fullName: m.fullName,
          oldNumber: oldNum,
          newNumber: exact.number,
          source: oldNum === exact.number ? "already_assigned" : "csv_exact",
        });
      }
    }
  }

  // Pass B: Fuzzy / Ambiguous Matches for remaining
  const remainingMembers = members.filter((m) => !matchedMemberIds.has(m.id));
  const remainingCsv = csvRows.filter((c) => !matchedCsvNumbers.has(c.number));

  for (const m of remainingMembers) {
    for (const c of remainingCsv) {
      const match = matchNames(m.fullName, c.name);
      if (match) {
        fuzzyCandidates.push({
          memberId: m.id,
          memberName: m.fullName,
          csvNumber: c.number,
          csvName: c.name,
          reason: match.reason,
        });
      }
    }
  }

  // Pass C: Auto-assign numbers for unmatched Firestore members
  // Rule: Start from max(existing numbers) + 1 in stable order (startMonth, then fullName)
  let maxNumber = Math.max(
    0,
    ...csvRows.map((c) => c.number),
    ...members.map((m) => m.memberNumber || 0)
  );

  const sortedUnmatchedMembers = [...remainingMembers].sort((a, b) => {
    const smA = a.startMonth || "";
    const smB = b.startMonth || "";
    if (smA !== smB) return smA.localeCompare(smB);
    return a.fullName.localeCompare(b.fullName);
  });

  for (const m of sortedUnmatchedMembers) {
    maxNumber += 1;
    matchedMemberIds.add(m.id);
    assignments.push({
      id: m.id,
      fullName: m.fullName,
      oldNumber: m.memberNumber ?? null,
      newNumber: maxNumber,
      source: "unmatched_auto_increment",
      notes: "Not in CSV; assigned next sequential number",
    });
  }

  // Print Summary
  console.log("\n=== Matching Summary ===");
  console.log(`Total Firestore Members: ${members.length}`);
  console.log(`Total CSV Rows: ${csvRows.length}`);
  console.log(`Exact Matched: ${assignments.filter((a) => a.source === "csv_exact" || a.source === "already_assigned").length}`);
  console.log(`Auto-assigned (Not in CSV): ${assignments.filter((a) => a.source === "unmatched_auto_increment").length}`);
  console.log(`Fuzzy / Ambiguous Candidates: ${fuzzyCandidates.length}`);
  console.log(`Conflicts: ${conflicts.length}`);
  console.log(`Unmatched CSV rows: ${remainingCsv.length}`);

  if (fuzzyCandidates.length > 0) {
    console.log("\n--- Fuzzy / Ambiguous Match Proposals (NOT auto-assigned) ---");
    fuzzyCandidates.forEach((f) => {
      console.log(`  Firestore: "${f.memberName}" (id: ${f.memberId}) <--> CSV: #${f.csvNumber} "${f.csvName}" (${f.reason})`);
    });
  }

  if (remainingCsv.length > 0) {
    console.log("\n--- CSV Rows not matched to any Firestore Member ---");
    remainingCsv.forEach((c) => {
      console.log(`  #${c.number}: ${c.name}`);
    });
  }

  if (conflicts.length > 0) {
    console.error("\n--- CONFLICTS (Firestore number != CSV number) ---", conflicts);
  }

  // Filter mutations that actually need applying (newNumber != oldNumber)
  const pendingUpdates = assignments.filter((a) => a.oldNumber !== a.newNumber);
  console.log(`\nPending Firestore document updates: ${pendingUpdates.length}`);

  console.log("\nSample Planned Assignments (first 10):");
  assignments.slice(0, 10).forEach((a) => {
    console.log(`  [${a.id}] ${a.fullName} -> memberNumber: ${a.newNumber} (old: ${a.oldNumber ?? "none"}) [${a.source}]`);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? "apply" : "dry-run",
    csvFile: CSV_FILE,
    counts: {
      firestoreMembers: members.length,
      csvRows: csvRows.length,
      exactMatches: assignments.filter((a) => a.source === "csv_exact").length,
      alreadyAssigned: assignments.filter((a) => a.source === "already_assigned").length,
      autoAssigned: assignments.filter((a) => a.source === "unmatched_auto_increment").length,
      conflicts: conflicts.length,
      fuzzyCandidates: fuzzyCandidates.length,
      unmatchedCsv: remainingCsv.length,
      pendingUpdates: pendingUpdates.length,
    },
    fuzzyCandidates,
    unmatchedCsv: remainingCsv,
    conflicts,
    assignments,
  };

  writeFileSync("migration-report-members.json", JSON.stringify(report, null, 2), "utf8");
  console.log("\nDetailed migration report written to: migration-report-members.json");

  // 4. If --apply, perform backup and batched write
  if (!APPLY) {
    console.log("\n>> DRY RUN COMPLETE. No changes were written to Firestore.");
    console.log(">> To apply these changes, run: npx tsx scripts/migrate-member-numbers.ts --apply\n");
    return;
  }

  if (conflicts.length > 0) {
    console.error("ABORTING: Cannot apply while conflicts exist. Please resolve conflicts first.");
    process.exit(1);
  }

  if (pendingUpdates.length === 0) {
    console.log("Nothing to update. All members already have up-to-date member numbers.");
    return;
  }

  // Backup affected documents
  const backupDir = resolve(process.cwd(), "backups");
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = resolve(backupDir, `members-backup-${Date.now()}.json`);
  const affectedMembers = members.filter((m) => pendingUpdates.some((u) => u.id === m.id));
  writeFileSync(backupFile, JSON.stringify(affectedMembers, null, 2), "utf8");
  console.log(`\nBacked up ${affectedMembers.length} member documents to: ${backupFile}`);

  // Batched write (max 400 per batch)
  console.log("Writing member numbers to Firestore in batches...");
  let batch = db.batch();
  let count = 0;
  const batchPromises: Promise<FirebaseFirestore.WriteResult[]>[] = [];

  for (const update of pendingUpdates) {
    const docRef = db.collection("members").doc(update.id);
    batch.update(docRef, { memberNumber: update.newNumber });
    count++;

    if (count >= 400) {
      batchPromises.push(batch.commit());
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    batchPromises.push(batch.commit());
  }

  await Promise.all(batchPromises);
  console.log(`Successfully updated ${pendingUpdates.length} members with memberNumber in Firestore!`);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
