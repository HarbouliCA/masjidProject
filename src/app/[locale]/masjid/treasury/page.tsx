import { getDictionary, type Locale } from "@/i18n";
import { TreasuryView } from "@/components/lists/TreasuryView";

export default async function TreasuryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.treasury}</h1>
      <TreasuryView t={t} />
    </section>
  );
}
