import { getDictionary, type Locale } from "@/i18n";
import { DonationBanner } from "@/components/DonationBanner";

export default async function DonatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return <DonationBanner t={t} />;
}
