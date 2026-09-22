import { getDictionary, type Locale } from "@/i18n";
import { FamiliesList } from "@/components/lists/FamiliesList";

export default async function FamiliesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);
  return <FamiliesList t={t} />;
}
