import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LOCALES, getDictionary, type Locale } from "@/i18n";
import { Providers } from "@/components/Providers";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      <header className="border-b border-nour-gold-300/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-16 shrink-0">
              <Image
                src="/logo.png"
                alt={t.appName}
                fill
                sizes="64px"
                priority
                className="object-contain"
              />
            </div>
            <div>
              <Link href={`/${locale}`} className="font-heading text-xl font-semibold">
                {t.appName}
              </Link>
              <p className="text-xs text-nour-stone-400">{t.appTagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-quranic text-lg" dir="rtl">
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
            <ThemeToggle t={t} />
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-6">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block px-4 py-3 text-sm text-nour-stone-400 hover:text-nour-gold-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Providers>{children}</Providers>
      </main>
    </div>
  );
}
