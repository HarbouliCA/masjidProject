import { getDictionary, type Locale } from "@/i18n";
import { TeachersList } from "@/components/lists/TeachersList";

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.teachers}</h1>
      <TeachersList t={t} />
    </section>
  );
}
