export const inputClass =
  "mt-1 w-full rounded-lg border border-nour-gold-300/60 bg-surface px-3 py-2 focus:border-nour-gold-500 focus:outline-none";

export const buttonClass =
  "rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground";

export const ghostButtonClass =
  "rounded-lg border border-nour-gold-300/60 px-3 py-1.5 text-sm text-muted hover:text-nour-gold-600";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
