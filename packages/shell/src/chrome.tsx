"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useT } from "@stayflow/i18n";
import { Avatar, Icon, TONE_TEXT, type IconName, type Tone } from "@stayflow/ui";

export interface ShellAlert {
  id: string;
  tone: Tone;
  title: string;
  detail?: string;
  href?: string;
}

export interface SearchItem {
  label: string;
  hint?: string;
  href: string;
  icon?: IconName;
}

/** Open/close state that also closes on Escape and on a click outside. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const ALERT_ICON: Record<Tone, IconName> = { danger: "alert", warning: "alert", accent: "info", success: "check", muted: "info" };

export function BellMenu({ alerts }: { alerts: ShellAlert[] }) {
  const t = useT();
  const { open, setOpen, ref } = usePopover();
  const urgent = alerts.filter((a) => a.tone === "danger" || a.tone === "warning").length;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("shell.notifications")}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface/60 text-muted transition hover:border-accent/50 hover:text-fg"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {urgent > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-onaccent shadow-[0_0_12px_rgb(var(--accent))]">{urgent}</span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label={t("shell.notifications")} className="anim-in fx-card absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] rounded-2xl p-2 shadow-2xl">
          <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t("shell.notifications")}</p>
          {alerts.length === 0 ? (
            <p className="px-3 pb-4 text-sm text-muted">{t("shell.noNotifications")}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {alerts.map((a) => {
                const body: ReactNode = (
                  <>
                    <span className={`mt-0.5 ${TONE_TEXT[a.tone]}`}><Icon name={ALERT_ICON[a.tone]} className="h-4 w-4" /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{a.title}</span>
                      {a.detail && <span className="block text-xs text-muted">{a.detail}</span>}
                    </span>
                  </>
                );
                const cls = "flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-bg/60";
                return (
                  <li key={a.id}>
                    {a.href ? <Link href={a.href} className={cls} onClick={() => setOpen(false)}>{body}</Link> : <div className={cls}>{body}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function UserMenu({ name, detail, onSignOut, onAccount }: { name: string; detail: string; onSignOut: () => void; onAccount: () => void }) {
  const t = useT();
  const { open, setOpen, ref } = usePopover();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("shell.account")}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 py-1.5 pl-1.5 pr-3 transition hover:border-accent/50"
      >
        <Avatar name={name} className="h-8 w-8 text-xs" />
        <span className="hidden min-w-0 text-left leading-tight xl:block">
          <span className="block max-w-[10rem] truncate text-[13px] font-medium">{name}</span>
          <span className="block max-w-[10rem] truncate text-[11px] text-muted">{detail}</span>
        </span>
        <Icon name="chevron" className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div className="anim-in fx-card absolute right-0 top-12 z-50 w-56 rounded-2xl p-2 shadow-2xl">
          <p className="truncate px-3 pb-1 pt-2 text-sm font-medium">{name}</p>
          <p className="truncate px-3 pb-2 text-xs text-muted">{detail}</p>
          <button type="button" onClick={() => { setOpen(false); onAccount(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-bg/60 hover:text-fg">
            <Icon name="settings" className="h-4 w-4" />
            {t("shell.account")}
          </button>
          <button type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-bg/60 hover:text-fg">
            <Icon name="logout" className="h-4 w-4" />
            {t("common.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Ctrl/⌘+K: jump to any screen, property, guest… Arrow keys + Enter, Esc to close. */
export function CommandPalette({ items, open, onClose }: { items: SearchItem[]; open: boolean; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = fold(q.trim());
    const list = needle ? items.filter((i) => fold(`${i.label} ${i.hint ?? ""}`).includes(needle)) : items;
    return list.slice(0, 40);
  }, [items, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIndex(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);
  useEffect(() => setIndex(0), [q]);

  if (!open) return null;
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={t("shell.search")} className="anim-in fx-card fx-hero w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Icon name="search" className="h-[18px] w-[18px] text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            aria-label={t("shell.search")}
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted/70 focus-visible:!outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && results[index]) go(results[index]!.href);
            }}
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t("shell.searchEmpty")}</li>}
          {results.map((r, i) => (
            <li key={`${r.href}-${r.label}`} role="option" aria-selected={i === index}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => go(r.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${i === index ? "bg-accent/12 text-fg" : "text-muted"}`}
              >
                <Icon name={r.icon ?? "arrow"} className={`h-4 w-4 ${i === index ? "text-accent" : ""}`} />
                <span className="min-w-0 flex-1 truncate font-medium text-fg">{r.label}</span>
                {r.hint && <span className="truncate text-xs text-muted">{r.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
