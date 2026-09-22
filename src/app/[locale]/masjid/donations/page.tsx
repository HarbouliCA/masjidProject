import { getDictionary, type Locale } from "@/i18n";
import { DonationsList } from "@/components/lists/DonationsList";

export default async function DonationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.donations}</h1>
      <DonationsList t={t} />
    </section>
  );
}
