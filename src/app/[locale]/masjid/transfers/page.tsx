import { getDictionary, type Locale } from "@/i18n";
import { TransfersList } from "@/components/lists/TransfersList";

export default async function TransfersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.transfers}</h1>
      <TransfersList t={t} />
    </section>
  );
}
