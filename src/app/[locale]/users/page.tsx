import { getDictionary, type Locale } from "@/i18n";
import { RequireRole } from "@/components/auth/RequireRole";
import { UsersManager } from "@/components/lists/UsersManager";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.users}</h1>
      <RequireRole roles={["admin"]}>
        <UsersManager t={t} />
      </RequireRole>
    </section>
  );
}
