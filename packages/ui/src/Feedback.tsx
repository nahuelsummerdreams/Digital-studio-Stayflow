import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Shimmering placeholder shown while data loads. Keeps the page from jumping when it arrives. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-xl ${className}`} />;
}

/** A calm "nothing here yet" with the one thing to do next. */
export function EmptyState({ icon, title, body, children }: { icon: IconName; title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="anim-in flex flex-col items-center rounded-card border border-dashed border-line px-6 py-14 text-center">
      <span className="pulse-ring flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h2 className="font-display mt-5 text-lg">{title}</h2>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
