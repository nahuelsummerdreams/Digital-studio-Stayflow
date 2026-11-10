/** Shared Tailwind class strings so every app and module looks the same. Visual effects live in theme.css. */
export const cardClass = "fx-card rounded-card p-6";
export const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-bg/70 px-3 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted/60 focus:border-accent focus:shadow-[0_0_0_4px_rgb(var(--accent)/0.16)]";
export const labelClass = "block text-xs font-medium text-muted";
export const buttonClass =
  "fx-btn inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-onaccent disabled:opacity-50";
export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-line px-3 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-fg active:scale-[0.97] disabled:opacity-50";
export const errorClass = "rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger";
export const infoClass = "rounded-xl bg-success/10 px-3 py-2 text-sm text-success";
/** Active state for tabs and segmented controls. */
export const activeTabClass = "bg-accent text-onaccent shadow-[0_6px_18px_-8px_rgb(var(--accent)/0.9)]";
export const idleTabClass = "text-muted hover:text-fg";
