import { getDictionary, type Locale } from "@/i18n";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="py-8">
      <LoginForm t={t} locale={locale} />
    </section>
  );
}
