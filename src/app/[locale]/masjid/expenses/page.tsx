import { getDictionary, type Locale } from "@/i18n";
import { ExpensesList } from "@/components/lists/ExpensesList";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.expenses}</h1>
      <ExpensesList t={t} />
    </section>
  );
}
