/**
 * Consolidated treasury — ONE LEDGER, TWO BOOKS (plan §6 / §9.3.7).
 *
 * Income and expenses are computed per scope; transfers appear as an expense in
 * the sender's book and income in the receiver's, and are ELIMINATED in the
 * consolidated P&L. All amounts are integer cents.
 */
import type {
  Cents,
  Donation,
  Expense,
  Payment,
  PledgeMonth,
  Transfer,
} from "./schema";

export interface ScopeLedger {
  incomeCents: Cents;
  expensesCents: Cents;
  transfersInCents: Cents;
  transfersOutCents: Cents;
  netCents: Cents;
}

export interface Treasury {
  masjid: ScopeLedger;
  school: ScopeLedger;
  consolidated: { incomeCents: Cents; expensesCents: Cents; netCents: Cents };
}

const sum = (xs: Cents[]): Cents => xs.reduce((a, b) => a + b, 0);

export function computeTreasury(input: {
  pledgeMonths: PledgeMonth[];
  donations: Donation[];
  payments: Payment[];
  expenses: Expense[];
  transfers: Transfer[];
}): Treasury {
  const pledgesCollected = sum(input.pledgeMonths.map((p) => p.paidCents));
  const donationsTotal = sum(input.donations.map((d) => d.amountCents));
  const masjidExpenses = sum(
    input.expenses.filter((e) => e.scope === "masjid").map((e) => e.amountCents)
  );
  const schoolExpenses = sum(
    input.expenses.filter((e) => e.scope === "school").map((e) => e.amountCents)
  );
  const schoolPayments = sum(
    input.payments.filter((p) => p.scope === "school").map((p) => p.amountCents)
  );
  const masjidTransfersIn = sum(
    input.transfers.filter((t) => t.toScope === "masjid").map((t) => t.amountCents)
  );
  const schoolTransfersOut = sum(
    input.transfers.filter((t) => t.fromScope === "school").map((t) => t.amountCents)
  );

  const masjidIncome = pledgesCollected + donationsTotal;
  const schoolIncome = schoolPayments;

  return {
    masjid: {
      incomeCents: masjidIncome,
      expensesCents: masjidExpenses,
      transfersInCents: masjidTransfersIn,
      transfersOutCents: 0,
      netCents: masjidIncome + masjidTransfersIn - masjidExpenses,
    },
    school: {
      incomeCents: schoolIncome,
      expensesCents: schoolExpenses,
      transfersInCents: 0,
      transfersOutCents: schoolTransfersOut,
      netCents: schoolIncome - schoolExpenses - schoolTransfersOut,
    },
    consolidated: {
      incomeCents: masjidIncome + schoolIncome,
      expensesCents: masjidExpenses + schoolExpenses,
      netCents: masjidIncome + schoolIncome - masjidExpenses - schoolExpenses,
    },
  };
}
