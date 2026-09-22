import { getDictionary, type Locale } from "@/i18n";
import { AttendanceList } from "@/components/lists/AttendanceList";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.attendance}</h1>
      <AttendanceList t={t} />
    </section>
  );
}
