import { getDictionary, type Locale } from "@/i18n";
import { formatGregorianHijri } from "@/lib/hijri";
import { DashboardView } from "@/components/DashboardView";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{t.overview}</h1>
        <p className="mt-1 text-sm text-nour-stone-400">{t.appTagline}</p>
      </div>

      <section className="rounded-xl border border-nour-gold-300/40 bg-surface p-6">
        <p className="text-sm text-nour-stone-400">{t.today}</p>
        <p className="mt-2 text-xl font-medium">{formatGregorianHijri(new Date())}</p>
      </section>

      <DashboardView t={t} />
    </div>
  );
}
