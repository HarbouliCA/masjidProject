# Plan: Members Search, Invoices Total, and Member Numbers

## Current State Analysis

**School → الطلاب (Students):**
- **Component:** `src/components/lists/StudentsTab.tsx`
- **Data Hook:** `useStudents()` fetches all students. Client-side state filters them by `showArchived` and `filterClassId`.
- **Form:** Included within `StudentsTab.tsx`.

**Masjid → الأعضاء (Members):**
- **Component:** `src/components/lists/MembersGrid.tsx`
- **Data Hook:** `useMembers()` fetches all members. Client-side state filters by `showArchived`.
- **Form:** `src/components/MemberForm.tsx` handles adding/editing members.

**Firestore Schema:**
- The `Member` schema (in `src/lib/schema.ts`) currently has fields like `id`, `fullName`, `monthlyPledgeCents`, `phone`, `nie`, `isActive`, etc., but does **not** have a member number field.

**الفواتير (Invoices):**
- **Component:** `src/components/lists/InvoicesCalendar.tsx`
- **Current total logic:** The table displays a `grandTotalCollected` per family at the end of the row (summing `paidCents` across all months for that family). There is no bottom total row across all displayed families.

---

## Task 1: Name Search

**What will change:**
1. **Utility (`src/lib/search.ts`):** Create a shared `normalizeForSearch(query: string)` utility that builds on the existing `unifyArabic` and `stripTashkeel` but also lowercases Latin text and tokenizes into words.
2. **StudentsTab (`src/components/lists/StudentsTab.tsx`):**
   - Add a search input `query` state.
   - Update the `visible` filter logic to split the query into words, normalize them, and ensure every word is found as a substring in the normalized student name.
   - Add the input field next to the existing filters using existing `inputClass`.
3. **MembersGrid (`src/components/lists/MembersGrid.tsx`):**
   - Add a search input `query` state.
   - Update the `visibleMembers` filter logic similarly. It will check against the normalized `fullName` and the soon-to-be-added `memberNumber`.

**Data Model Impact:** None.
**Risks:** Client-side filtering performance with many records, but since `useStudents` and `useMembers` already fetch all documents, the array filter overhead is minimal.

---

## Task 2: Member Numbers (Migration script)

**What will change:**
1. **Schema (`src/lib/schema.ts`):** Add `memberNumber: number` to the `Member` interface.
2. **CRUD (`src/lib/crud.ts`):** Update `MemberInput`, `buildMember`, `recordMember`, and `updateMember` to handle `memberNumber`. Add validation to ensure it's unique.
3. **Migration Script (`scripts/migrate-member-numbers.ts`):**
   - A standalone Node/Admin SDK script (similar to `import-excel.ts`).
   - Reads the CSV from `/mnt/user-data/uploads/الأعضاء_numbers.csv`.
   - Normalizes both CSV names and Firestore `fullName` using `normalizeName` (from `matching.ts`).
   - Groups into exact matches, proposed/fuzzy matches, not in CSV, not in Firestore.
   - Auto-assigns numbers to exact matches.
   - For Firestore members not in CSV, finds `max(number) + 1` and assigns them sequentially ordered by creation time (using doc ID or existing `startMonth`), avoiding any conflicts.
   - Idempotent: Skips if `memberNumber` already matches. Logs a conflict if a member has a different number.
   - Uses batched writes (max 500) and writes a JSON backup locally before applying.
   - Requires `--apply` flag to commit changes to Firestore.

**Migration Strategy:**
- **Step 1:** Run `npx tsx scripts/migrate-member-numbers.ts` (dry run). Review the stdout table and the generated `migration-report.json`.
- **Step 2:** Explicitly resolve conflicts if any.
- **Step 3:** Run with `--apply`. The script saves `backup-members-<timestamp>.json` before mutating.
- **Rollback:** A quick script can restore the `backup-members.json` using batched writes if needed.

**Risks:** Fuzzy matches or identical names in Firestore. We will only auto-assign exact matches. The rest will be listed in the report for human review.

---

## Task 3: Update الأعضاء Forms

**What will change:**
1. **MemberForm (`src/components/MemberForm.tsx`):**
   - Add `memberNumber` numeric input field.
   - On "Add", pre-fill it by finding `Math.max(0, ...members.map(m => m.memberNumber || 0)) + 1` from the loaded `useMembers()` data.
   - Validate uniqueness locally before submission: `members.some(m => m.memberNumber === inputNumber && m.id !== editingId)`.
   - Display a clear Arabic error if the number is taken.

**Verification:**
- Open Add form -> see next available number.
- Open Edit form -> see current number.
- Try to change to an existing number -> form rejects submission.
- Save empty -> HTML5 validation rejects.
- Save and see the grid update immediately (via TanStack Query invalidation).

---

## Task 4: الفواتير (Invoices Calendar) Total

**What will change:**
1. **InvoicesCalendar (`src/components/lists/InvoicesCalendar.tsx`):**
   - Add a `<tfoot>` row at the bottom of the table.
   - Calculate two totals for the currently *displayed* families (respecting any filters, though currently it just filters active families):
     - **Expected Subtotal:** Sum of `totalCents` for all active family fee assessments (the "الإجمالي" column).
     - **Collected Subtotal:** Sum of `paidCents` across all invoices for the displayed families.
   - Render these in the footer with the "المجموع" label and `<Money />` component.

**Audit of existing sum logic:**
- Currently, `InvoicesCalendar` calculates `grandTotalCollected` by summing `inv.paidCents` for the family's invoices.
- `fees.totalCents` is calculated via `assessFees(arabic, english, settings)`.
- We will reduce over `activeFamilies` to get the sum of `fees.totalCents` (expected) and sum of all `familyInvoices.paidCents` (collected).
- Everything is in integer cents, avoiding floating-point errors.

**Verification:**
- Load the calendar, note the bottom totals.
- Pick 3 families, sum their expected and collected manually, ensure it matches the bottom.
- Ensure the currency symbol and format matches existing cells.

---

## Test Checklist
- [ ] Task 1: Name search filters correctly regardless of Arabic diacritics, tatweel, and word order.
- [ ] Task 1: Empty state Arabic message shows when no results match.
- [ ] Task 1: Clear button (×) clears the search.
- [ ] Task 2: Migration script dry-run produces accurate JSON report without mutating Firestore.
- [ ] Task 2: Migration script `--apply` creates backup and updates documents correctly.
- [ ] Task 3: `MemberForm` requires `memberNumber`, auto-suggests max+1, and prevents duplicates.
- [ ] Task 4: `InvoicesCalendar` bottom row accurately sums integer cents for expected and collected amounts of displayed rows.

## Open Questions
1. **Task 2 (CSV path):** The prompt mentions `/mnt/user-data/uploads/الأعضاء_numbers.csv`. As I am running on a Windows machine (`C:\Users\Harbouli\Desktop\MasjidNoor`), should I expect the CSV to be provided at a local Windows path (e.g., in the repo root), or will you run the migration script in a Linux environment? I will default to making the path configurable via an argument or env var.
2. **Task 4 (Expected vs Collected):** The grid shows expected fees (monthly columns) and collected (far left or right). I plan to show totals for the "الإجمالي" (Expected monthly total across all displayed families) and "المجموع" (Total collected across all displayed families). Is this the exact aggregation you want, or do you want column-by-column totals for each month as well? By default, I will add column-by-column totals since it's a calendar grid.
