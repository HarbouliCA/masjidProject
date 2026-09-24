import { getDictionary, type Locale } from "@/i18n";
import { MasjidManager } from "@/components/lists/MasjidManager";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.masjid}</h1>
      <MasjidManager t={t} />
    </section>
  );
}
