"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@stayflow/i18n";
import { formatMoney } from "@stayflow/money";
import { EmptyState, Skeleton, cardClass, inputClass } from "@stayflow/ui";
import { shortDate, isLinkablePhone, phoneDigits } from "../format";
import { guestsDirectory } from "../logic";
import type { Booking } from "../types";

interface Props {
  bookings: Booking[];
  loading: boolean;
  currency: string;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";

export function HostGuests({ bookings, loading, currency }: Props) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const guests = useMemo(() => guestsDirectory(bookings), [bookings]);
  const q = query.trim().toLowerCase();
  const shown = q ? guests.filter((g) => `${g.name} ${g.email} ${g.phone}`.toLowerCase().includes(q)) : guests;

  if (loading) return <Skeleton className="h-64 rounded-card" />;
  if (guests.length === 0) return <EmptyState icon="users" title={t("host.guestsEmptyTitle")} body={t("host.guestsEmptyBody")} />;

  return (
    <section className="space-y-4">
      <input
        className={`${inputClass} !mt-0 max-w-sm`}
        type="search"
        placeholder={t("host.searchGuest")}
        aria-label={t("host.searchGuest")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {shown.length === 0 ? (
        <p className={`${cardClass} text-sm text-muted`}>{t("host.noMatches")}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {shown.map((g) => (
            <li key={g.key} className={`${cardClass} flex items-start gap-4 !p-5`}>
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                {initials(g.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{g.name}</p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {g.email && <a href={`mailto:${g.email}`} className="underline-offset-4 hover:underline">{g.email}</a>}
                  {g.email && g.phone && " · "}
                  {g.phone &&
                    (isLinkablePhone(g.phone) ? (
                      <a href={`https://wa.me/${phoneDigits(g.phone)}`} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{g.phone}</a>
                    ) : (
                      g.phone
                    ))}
                </p>
                <p className="mt-2 text-sm">
                  {t("host.stays", { count: g.stays })} · {t("entries.nights", { count: g.nights })}
                  {g.spent > 0 && <> · <span className="text-muted">{t("host.spent")}</span> {formatMoney(g.spent, currency, locale)}</>}
                </p>
                <p className="mt-0.5 text-xs text-muted">{t("host.lastStay", { date: shortDate(g.lastStay, locale, true) })}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
