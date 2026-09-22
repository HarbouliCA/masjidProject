import { getDictionary, type Locale } from "@/i18n";
import { GradebookList } from "@/components/lists/GradebookList";

export default async function GradesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.gradebook}</h1>
      <GradebookList t={t} />
    </section>
  );
}
