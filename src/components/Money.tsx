import { formatEUR } from "@/lib/money";

/**
 * Bidi-isolated money. Wraps the formatted value in an LTR isolate so a string
 * like "1.234,56 €" never scrambles when placed next to Arabic text.
 */
export function Money({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  return (
    <bdi dir="ltr" className={className}>
      {formatEUR(cents)}
    </bdi>
  );
}
