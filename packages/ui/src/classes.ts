/** Shared Tailwind class strings so every app and module looks the same. */
export const cardClass = "rounded-card border border-line bg-surface p-6";
export const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-fg outline-none placeholder:text-muted/60 focus:border-accent";
export const labelClass = "block text-xs font-medium text-muted";
export const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-onaccent shadow-[0_0_24px_-6px_rgb(var(--accent)/0.7)] transition hover:brightness-110 disabled:opacity-50";
export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-line px-3 py-2 text-sm text-muted transition hover:border-muted hover:text-fg disabled:opacity-50";
export const errorClass = "rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger";
export const infoClass = "rounded-xl bg-success/10 px-3 py-2 text-sm text-success";
/** Active state for tabs and segmented controls. */
export const activeTabClass = "bg-accent text-onaccent";
export const idleTabClass = "text-muted hover:text-fg";
