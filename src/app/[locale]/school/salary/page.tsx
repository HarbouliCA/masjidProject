import { getDictionary, type Locale } from "@/i18n";
import { SalaryGrid } from "@/components/lists/SalaryGrid";

export default async function SalaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.salary}</h1>
      <SalaryGrid t={t} />
    </section>
  );
}
