import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LOCALES, getDictionary, type Locale } from "@/i18n";
import { Providers } from "@/components/Providers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AuthStatus } from "@/components/auth/AuthStatus";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale: raw } = await params;
  if (!(LOCALES as string[]).includes(raw)) notFound();
  const locale = raw as Locale;
  const t = getDictionary(locale);

  const nav = [
    { href: `/${locale}`, label: t.dashboard },
    { href: `/${locale}/masjid/members`, label: t.masjid },
    { href: `/${locale}/school/families`, label: t.school },
    { href: `/${locale}/settings`, label: t.settings },
  ];

  return (
    <div className="zellige-background min-h-screen text-foreground">
      <header className="brand-banner relative overflow-hidden border-b-2 border-nour-gold-500/50 dark:border-nour-gold-600/40 transition-colors">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href={`/${locale}`}
              className="group relative flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm ring-1 ring-nour-gold-500/40 transition-transform duration-200 hover:scale-105"
              aria-label={t.appName}
            >
              <Image
                src="/logo.png"
                alt={t.appName}
                fill
                sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
                priority
                className="object-contain p-0.5"
              />
            </Link>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/${locale}`}
                className="font-heading text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight text-white dark:text-nour-green-900 transition-colors hover:opacity-95"
              >
                {t.appName}
              </Link>
              <p
                dir="rtl"
                className="font-heading text-xs sm:text-sm md:text-base font-semibold text-nour-gold-300 dark:text-nour-green-800/90 leading-tight mt-0.5 sm:mt-1 truncate sm:whitespace-normal"
              >
                {t.appTagline}
              </p>
            </div>
          </div>
          <p
            className="hidden font-quranic text-base sm:text-lg md:text-xl text-nour-gold-300 dark:text-nour-green-900 lg:block shrink-0"
            dir="rtl"
          >
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </p>
        </div>
      </header>

      <div className="border-b border-border bg-surface/90 backdrop-blur-xs transition-colors">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <nav aria-label="Main Navigation">
            <ul className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-foreground/80 hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <AuthStatus t={t} locale={locale} />
            <ThemeToggle t={t} />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Providers>
          <RequireAuth locale={locale}>{children}</RequireAuth>
        </Providers>
      </main>
    </div>
  );
}
