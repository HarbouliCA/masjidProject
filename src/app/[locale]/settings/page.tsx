import { getDictionary, type Locale } from "@/i18n";
import { Money } from "@/components/Money";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section>
      <h1 className="mb-4 font-heading text-xl font-semibold">{t.settings}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "(طفل واحد)", cents: 2000 },
          { label: "(طفلان)", cents: 1800 },
          { label: "(3+ أطفال)", cents: 1500 },
          { label: "رسوم إنجليزية (للطفل)", cents: 1000 },
        ].map((p) => (
          <div
            key={p.label}
            className="rounded-xl border border-nour-gold-300/40 bg-surface p-5"
          >
            <p className="text-sm text-nour-stone-400">{p.label}</p>
            <Money
              cents={p.cents}
              className="mt-2 block font-heading text-xl font-semibold text-nour-green-900 dark:text-nour-cream-50"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
