import { getDictionary, type Locale } from "@/i18n";
import { MembersGrid } from "@/components/lists/MembersGrid";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.members}</h1>
      <MembersGrid t={t} />
    </section>
  );
}
