import type { Dictionary } from "@/i18n";
import { inputClass } from "./forms/shared";

export function SearchInput({
  t,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  t: Dictionary;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        dir="auto"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t.searchPlaceholder}
        className={`${inputClass} pe-10 mt-0`} // pe-10 for the close button, mt-0 to override default mt-1 from inputClass
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted hover:text-foreground"
          aria-label={t.close}
          title={t.close}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}
