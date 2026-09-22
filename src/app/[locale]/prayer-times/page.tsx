import { getDictionary, type Locale } from "@/i18n";
import { PrayerTimesView } from "@/components/lists/PrayerTimesView";

export default async function PrayerTimesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.prayerTimes}</h1>
      <PrayerTimesView t={t} />
    </section>
  );
}
