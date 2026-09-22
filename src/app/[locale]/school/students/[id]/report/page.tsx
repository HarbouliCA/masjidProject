import { getDictionary, type Locale } from "@/i18n";
import { ReportCard } from "@/components/ReportCard";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = getDictionary(locale as Locale);

  return <ReportCard t={t} studentId={id} />;
}
