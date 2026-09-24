import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans_Arabic, Cairo, Amiri, Inter } from "next/font/google";
import "./globals.css";
import { isLocale, dirFor, DEFAULT_LOCALE, type Locale } from "@/i18n";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "منصة مسجد النور", template: "%s · مسجد النور" },
  description:
    "متحدون في الإيمان • متحدون في المجتمع | Unidos en la fe • Unidos en la comunidad",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dir = dirFor(locale);

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${ibmPlexArabic.variable} ${cairo.variable} ${amiri.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
