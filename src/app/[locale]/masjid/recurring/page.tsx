import { getDictionary, type Locale } from "@/i18n";
import { RecurringList } from "@/components/lists/RecurringList";

export default async function RecurringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.recurringExpenses}</h1>
      <RecurringList t={t} />
    </section>
  );
}
