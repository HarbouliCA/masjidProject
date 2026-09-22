import { getDictionary, type Locale } from "@/i18n";
import { EventsList } from "@/components/lists/EventsList";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.events}</h1>
      <EventsList t={t} />
    </section>
  );
}
