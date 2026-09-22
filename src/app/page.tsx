import { getLocale, getDictionary } from "@/i18n";
import { formatGregorianHijri } from "@/lib/hijri";
import { Money } from "@/components/Money";

export default function DashboardPage() {
  const locale = getLocale();
  const t = getDictionary(locale);
  const today = new Date();

  const kpis = [
    { label: t.donations, cents: 1466100 },
    { label: t.fridayBox, cents: 575000 },
    { label: t.expenses, cents: 672035 },
    { label: t.balance, cents: 2501100 },
  ];

  return (
    <main className="min-h-screen bg-nour-cream-50 text-nour-green-900 dark:bg-nour-green-900 dark:text-nour-cream-50">
      <header className="border-b border-nour-gold-300/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="font-heading text-2xl font-semibold">{t.appName}</h1>
            <p className="text-sm text-nour-stone-400">{t.appTagline}</p>
          </div>
          <p className="font-quranic text-lg" dir="rtl">
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </p>
        </div>
      </header>

      <nav className="border-b border-nour-gold-300/40">
        <ul className="mx-auto flex max-w-6xl items-center gap-1 px-6">
          {[t.dashboard, t.masjid, t.school, t.settings].map((item, i) => (
            <li
              key={item}
              className={`px-4 py-3 text-sm ${
                i === 0
                  ? "border-b-2 border-nour-gold-500 font-medium text-nour-gold-600"
                  : "text-nour-stone-400"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="rounded-xl border border-nour-gold-300/40 bg-white p-6 dark:bg-nour-green-800">
          <p className="text-sm text-nour-stone-400">{t.today}</p>
          <p className="mt-2 text-xl font-medium">{formatGregorianHijri(today)}</p>
        </section>

        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold">{t.overview}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-nour-gold-300/40 bg-white p-5 dark:bg-nour-green-800"
              >
                <p className="text-sm text-nour-stone-400">{kpi.label}</p>
                <Money
                  cents={kpi.cents}
                  className="mt-2 block font-heading text-2xl font-semibold text-nour-green-900 dark:text-nour-cream-50"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-nour-gold-300/40 bg-white p-6 dark:bg-nour-green-800">
          <p className="text-sm leading-relaxed text-nour-stone-400">
            {t.status}: {t.status_paid} · {t.status_partial} · {t.status_unpaid} ·{" "}
            {t.status_waived}
          </p>
        </section>
      </div>
    </main>
  );
}
