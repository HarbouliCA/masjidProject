import { getDictionary, type Locale } from "@/i18n";
import { AnnouncementsList } from "@/components/lists/AnnouncementsList";

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.announcements}</h1>
      <AnnouncementsList t={t} />
    </section>
  );
}
