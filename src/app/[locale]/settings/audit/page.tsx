import { getDictionary, type Locale } from "@/i18n";
import { AuditLogView } from "@/components/lists/AuditLogView";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getDictionary(locale as Locale);

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-xl font-semibold">{t.audit}</h1>
      <AuditLogView t={t} />
    </section>
  );
}
