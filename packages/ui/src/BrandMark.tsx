/** Stayflow mark: a flowing line in a luminous tile. Follows the accent theme. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))",
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.35), 0 8px 22px -8px rgb(var(--accent) / 0.9)",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%] text-onaccent" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
        <path d="M3 15c2.6 0 2.6-6 6-6s3.4 6 6 6 2.6-6 6-6" />
      </svg>
    </span>
  );
}
