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
      <header className="brand-banner relative overflow-hidden border-b-2 border-nour-gold-500/50">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-20 shrink-0">
              <Image
                src="/logo.png"
                alt={t.appName}
                fill
                sizes="80px"
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <Link
                href={`/${locale}`}
                className="font-heading text-2xl font-bold leading-tight text-nour-gold-500"
              >
                {t.appName}
              </Link>
              <p
                dir="rtl"
                className="font-heading text-base font-semibold text-nour-gold-300 sm:text-lg"
              >
                {t.appTagline}
              </p>
            </div>
          </div>
          <p
            className="hidden font-quranic text-xl text-nour-gold-300 md:block"
            dir="rtl"
          >
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </p>
        </div>
      </header>

      <div className="border-b border-nour-gold-300/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2">
          <nav>
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block px-4 py-2 text-sm text-nour-stone-400 hover:text-nour-gold-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
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
