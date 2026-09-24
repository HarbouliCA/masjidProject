"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFamilies, useStudents, useInvoices, useSettings } from "@/lib/data/hooks";
import { upsertInvoice } from "@/lib/crud";
import { assessFees } from "@/lib/fees";
import { SCHOOL_GRID_MONTHS } from "@/lib/grid";
import { Money } from "../Money";
import { RecordPaymentDialog, type PaymentContext } from "../RecordPaymentDialog";
import type { Dictionary } from "@/i18n";
import type { Invoice, Family } from "@/lib/schema";

export function InvoicesCalendar({ t }: { t: Dictionary }) {
  const { data: families = [] } = useFamilies();
  const { data: students = [] } = useStudents();
  const { data: invoices = [] } = useInvoices();
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();

  const [context, setContext] = useState<PaymentContext | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const activeFamilies = families.filter((f) => f.isActive !== false);

  function scrollToMonth(monthKey: string) {
    const container = tableRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-month="${monthKey}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  const invoiceFor = (familyId: string, month: string): Invoice | null =>
    invoices.find((i) => i.familyId === familyId && i.month === month) ?? null;

  function calculateFamilyFees(family: Family) {
    const familyStudents = students.filter((s) => s.familyId === family.id && s.isActive !== false);
    const arabicCount = familyStudents.length;
    const englishCount = familyStudents.filter((s) => s.englishEnrolled).length;
    return { arabicCount, englishCount, ...assessFees(arabicCount, englishCount, settings) };
  }

  async function togglePaid(family: Family, monthKey: string, currentInvoice: Invoice | null) {
    const fees = calculateFamilyFees(family);
    if (fees.totalCents <= 0) return;

    const currentlyPaid = currentInvoice ? currentInvoice.paidCents >= fees.totalCents : false;
    
    await upsertInvoice({
      familyId: family.id,
      month: monthKey,
      arabicChildren: fees.arabicCount,
      arabicFeeCents: fees.arabicFeeCents,
      englishChildren: fees.englishCount,
      englishFeeCents: fees.englishFeeCents,
      totalCents: fees.totalCents,
      paidCents: currentlyPaid ? 0 : fees.totalCents,
      isManualOverride: false,
    });
    queryClient.invalidateQueries();
  }

  return (
    <>
      <div className="sticky top-0 z-10 overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface p-2">
        <div className="flex gap-1">
          {SCHOOL_GRID_MONTHS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => scrollToMonth(m.key)}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-nour-gold-300/10 hover:text-nour-gold-600"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={tableRef} className="overflow-x-auto rounded-xl border border-nour-gold-300/40 bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-nour-gold-300/40 bg-surface">
              <th className="sticky inset-inline-start-0 bg-surface px-4 py-3 text-start font-medium text-foreground">
                اسم ولي الأمر
              </th>
              <th className="px-2 py-3 text-center font-medium text-foreground whitespace-nowrap">
                عدد الأطفال (عربية)
              </th>
              <th className="px-2 py-3 text-center font-medium text-foreground whitespace-nowrap">
                رسوم العربية (€)
              </th>
              <th className="px-2 py-3 text-center font-medium text-foreground whitespace-nowrap">
                عدد الأطفال (إنجليزية)
              </th>
              <th className="px-2 py-3 text-center font-medium text-foreground whitespace-nowrap">
                رسوم الإنجليزية (€)
              </th>
              <th className="px-2 py-3 text-center font-medium text-foreground whitespace-nowrap bg-nour-gold-300/10">
                الإجمالي (€)
              </th>
              {SCHOOL_GRID_MONTHS.map((m) => (
                <th key={m.key} data-month={m.key} className="min-w-[4rem] px-2 py-3 text-center font-medium text-foreground">
                  {m.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center font-medium text-foreground bg-nour-gold-300/20 whitespace-nowrap">
                المجموع
              </th>
            </tr>
          </thead>
          <tbody>
            {activeFamilies.map((family) => {
              const fees = calculateFamilyFees(family);
              
              const familyInvoices = invoices.filter(inv => inv.familyId === family.id);
              const grandTotalCollected = familyInvoices.reduce((sum, inv) => sum + inv.paidCents, 0);

              return (
                <tr key={family.id} className="border-b border-nour-gold-300/20 last:border-0 hover:bg-nour-gold-300/5">
                  <td className="sticky inset-inline-start-0 bg-surface px-4 py-2 font-medium text-foreground whitespace-nowrap">
                    <span dir="auto">{family.parentName}</span>
                  </td>
                  <td className="px-2 py-2 text-center text-muted">
                    {fees.arabicCount > 0 ? fees.arabicCount : "—"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {fees.arabicFeeCents > 0 ? <Money cents={fees.arabicFeeCents} /> : "—"}
                  </td>
                  <td className="px-2 py-2 text-center text-muted">
                    {fees.englishCount > 0 ? fees.englishCount : "—"}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {fees.englishFeeCents > 0 ? <Money cents={fees.englishFeeCents} /> : "—"}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-foreground bg-nour-gold-300/10">
                    {fees.totalCents > 0 ? <Money cents={fees.totalCents} /> : "—"}
                  </td>
                  
                  {SCHOOL_GRID_MONTHS.map((m) => {
                    const inv = invoiceFor(family.id, m.key);
                    const paid = !!inv && inv.paidCents >= fees.totalCents && fees.totalCents > 0;
                    
                    return (
                      <td key={m.key} className="px-2 py-2 text-center border-s border-nour-gold-300/10">
                         <div className="flex items-center justify-center gap-1.5 h-full w-full">
                           <input
                              type="checkbox"
                              checked={paid}
                              disabled={fees.totalCents <= 0}
                              onChange={() => togglePaid(family, m.key, inv)}
                              className="h-4 w-4 accent-[var(--brand-gold)] cursor-pointer disabled:cursor-not-allowed"
                            />
                         </div>
                      </td>
                    );
                  })}
                  
                  <td className="px-4 py-2 text-center font-bold text-foreground bg-nour-gold-300/20">
                     {grandTotalCollected > 0 ? <Money cents={grandTotalCollected} /> : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <RecordPaymentDialog
        t={t}
        context={context}
        onClose={() => setContext(null)}
      />
    </>
  );
}
