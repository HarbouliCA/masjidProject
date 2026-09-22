import { getDictionary, type Locale } from "@/i18n";
import { InvoicesGrid } from "@/components/lists/InvoicesGrid";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.invoices}</h1>
      <InvoicesGrid t={t} />
    </section>
  );
}
