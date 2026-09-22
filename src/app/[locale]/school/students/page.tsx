import { getDictionary, type Locale } from "@/i18n";
import { StudentsList } from "@/components/lists/StudentsList";

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);
  return <StudentsList t={t} />;
}
