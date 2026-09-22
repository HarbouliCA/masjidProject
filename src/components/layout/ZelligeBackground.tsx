/**
 * Reusable Zellige background — subtle Moroccan geometric pattern.
 *
 * The pattern is a CSS background-image (not a DOM SVG), so it is inherently
 * decorative and out of the accessibility tree. It is a flat, non-animated
 * background, so it respects prefers-reduced-motion and never competes with
 * content, cards, or the logo.
 */
export function ZelligeBackground({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`zellige-background ${className}`}>{children}</div>;
}
