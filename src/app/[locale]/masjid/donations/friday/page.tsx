import { getDictionary, type Locale } from "@/i18n";
import { FridayTracker } from "@/components/lists/FridayTracker";

export default async function FridayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.fridayBox}</h1>
      <FridayTracker t={t} />
    </section>
  );
}
