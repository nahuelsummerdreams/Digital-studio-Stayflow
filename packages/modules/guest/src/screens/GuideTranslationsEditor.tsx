"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useT } from "@stayflow/i18n";
import { buttonClass, cardClass, errorClass, inputClass, labelClass } from "@stayflow/ui";
import { saveGuideTranslations, saveItemTranslations } from "../data";
import { GUIDE_LANG_NAMES } from "../languages";
import { EXTRA_LANGS, type ExtraLang, type Guide, type GuideItem, type GuideTextKey, type GuideTranslations, type ItemTranslations } from "../types";

interface Props {
  client: SupabaseClient;
  guide: Guide;
  items: GuideItem[];
  onSaved: () => Promise<void>;
}

const GUIDE_FIELDS: { key: GuideTextKey; area: boolean }[] = [
  { key: "title", area: false },
  { key: "welcome", area: true },
  { key: "checkin", area: true },
  { key: "checkout", area: true },
  { key: "houseRules", area: true },
  { key: "safety", area: true },
];

/** The same guide in English and Portuguese, written by the host. A field left empty simply shows the Spanish text. */
export function GuideTranslationsEditor({ client, guide, items, onSaved }: Props) {
  const t = useT();
  const [lang, setLang] = useState<ExtraLang>("en");
  const [gtr, setGtr] = useState<GuideTranslations>(guide.translations ?? {});
  const [itr, setItr] = useState<Record<string, ItemTranslations>>(Object.fromEntries(items.map((i) => [i.id, i.translations ?? {}])));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<"saved" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = (k: GuideTextKey) => t(`guest.tr.${k}`);
  const filled = (l: ExtraLang) => GUIDE_FIELDS.filter((f) => (gtr[l]?.[f.key] ?? "").trim() !== "").length;

  function setGuideField(k: GuideTextKey, v: string) {
    setMsg(null);
    setGtr({ ...gtr, [lang]: { ...gtr[lang], [k]: v } });
  }
  function setItemField(id: string, k: "title" | "body", v: string) {
    setMsg(null);
    setItr({ ...itr, [id]: { ...itr[id], [lang]: { ...itr[id]?.[lang], [k]: v } } });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveGuideTranslations(client, guide.id, gtr);
      for (const it of items) {
        if (JSON.stringify(itr[it.id] ?? {}) !== JSON.stringify(it.translations ?? {})) await saveItemTranslations(client, it.id, itr[it.id] ?? {});
      }
      await onSaved();
      setMsg("saved");
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${cardClass} space-y-4`}>
      <div>
        <h2 className="text-sm font-medium">{t("guest.trTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("guest.trBody")}</p>
      </div>
      <div role="tablist" className="flex gap-2">
        {EXTRA_LANGS.map((l) => (
          <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)} className={`rounded-full border px-4 py-1.5 text-sm ${lang === l ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}>
            {GUIDE_LANG_NAMES[l]} <span className="text-xs opacity-70">· {filled(l)}/{GUIDE_FIELDS.length}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {GUIDE_FIELDS.map((f) => {
          const base = (guide[f.key as keyof Guide] as string) ?? "";
          if (!base.trim()) return null;
          const value = gtr[lang]?.[f.key] ?? "";
          return (
            <label key={f.key} className={labelClass}>
              {label(f.key)}
              {f.area ? (
                <textarea className={`${inputClass} min-h-20`} rows={3} maxLength={3000} value={value} onChange={(e) => setGuideField(f.key, e.target.value)} placeholder={base} />
              ) : (
                <input className={inputClass} maxLength={120} value={value} onChange={(e) => setGuideField(f.key, e.target.value)} placeholder={base} />
              )}
            </label>
          );
        })}
        {items.length > 0 && <p className="pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">{t("guest.trItems")}</p>}
        {items.map((it) => (
          <div key={it.id} className="space-y-2 rounded-xl border border-line p-3">
            <input className={inputClass} maxLength={120} value={itr[it.id]?.[lang]?.title ?? ""} onChange={(e) => setItemField(it.id, "title", e.target.value)} placeholder={it.title} aria-label={it.title} />
            {it.body.trim() && <textarea className={`${inputClass} min-h-16`} rows={2} maxLength={2000} value={itr[it.id]?.[lang]?.body ?? ""} onChange={(e) => setItemField(it.id, "body", e.target.value)} placeholder={it.body} aria-label={it.title} />}
          </div>
        ))}
      </div>

      {error && <p role="alert" className={errorClass}>{error}</p>}
      <div className="flex items-center gap-3">
        <button type="button" className={buttonClass} disabled={busy} onClick={save}>{busy ? t("guest.saving") : t("guest.save")}</button>
        {msg === "saved" && <span role="status" className="text-sm text-success">{t("guest.saved")}</span>}
      </div>
    </section>
  );
}
