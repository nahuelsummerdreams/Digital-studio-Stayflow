"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { errorKey, useT } from "@stayflow/i18n";
import { THEMES, buttonClass, cardClass, errorClass, ghostButtonClass, inputClass, labelClass } from "@stayflow/ui";
import { CopyButton } from "../CopyButton";
import { addItem, loadGuideByProperty, removeItem, rotateSlug, saveGuide, setPublished } from "../data";
import { asCategory, completeness, guideUrl, normalizeUrl } from "../helpers";
import { ACCENTS, PLACE_CATEGORIES, type Accent, type Guide, type GuideFields, type GuideItem, type ItemKind, type PublicGuide } from "../types";
import { GuideView } from "../view";
import { QrCode } from "./QrCode";

interface Props {
  client: SupabaseClient;
  property: { id: string; name: string; city: string | null };
  /** Origin where the guide app is served. Empty = use this page's origin. */
  publicBaseUrl: string;
  onBack: () => void;
}

const toFields = (g: Guide): GuideFields => ({
  title: g.title, welcome: g.welcome, accent: g.accent, wifiName: g.wifiName, wifiPassword: g.wifiPassword,
  checkin: g.checkin, checkout: g.checkout, houseRules: g.houseRules, safety: g.safety, hostName: g.hostName, hostPhone: g.hostPhone,
});

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${cardClass} space-y-4`}>
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

export function GuideEditor({ client, property, publicBaseUrl, onBack }: Props) {
  const t = useT();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [items, setItems] = useState<GuideItem[]>([]);
  const [form, setForm] = useState<GuideFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [origin, setOrigin] = useState(publicBaseUrl);

  useEffect(() => {
    if (!publicBaseUrl) setOrigin(window.location.origin);
  }, [publicBaseUrl]);

  const load = useCallback(async () => {
    try {
      const found = await loadGuideByProperty(client, property.id);
      if (found) {
        setGuide(found.guide);
        setItems(found.items);
        setForm((prev) => prev ?? toFields(found.guide));
      }
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setLoading(false);
    }
  }, [client, property.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => !!guide && !!form && JSON.stringify(form) !== JSON.stringify(toFields(guide)), [guide, form]);
  const progress = useMemo(() => (form ? completeness(form, items) : { pct: 0, missing: [] }), [form, items]);

  if (loading) return <p className="text-sm text-muted">{t("common.loading")}</p>;
  if (!guide || !form) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">{t("guest.notFound")}</p>
        <button type="button" className={ghostButtonClass} onClick={onBack}>{t("guest.back")}</button>
      </div>
    );
  }

  const set = <K extends keyof GuideFields>(key: K, value: GuideFields[K]) => {
    setSavedAt(false);
    setForm({ ...form, [key]: value });
  };

  async function save(): Promise<boolean> {
    if (!guide || !form) return false;
    setSaving(true);
    setError(null);
    try {
      await saveGuide(client, guide.id, form);
      setGuide({ ...guide, ...form });
      setSavedAt(true);
      return true;
    } catch (err) {
      setError(t(errorKey(err)) === t("errors.generic") ? t("guest.saveError") : t(errorKey(err)));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await save();
  }

  async function togglePublish() {
    if (!guide) return;
    setError(null);
    // Unsaved edits would be missing from what guests see, so save first.
    if (dirty && !(await save())) return;
    try {
      await setPublished(client, guide.id, !guide.published);
      await load();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  async function rotate() {
    if (!guide || !window.confirm(t("guest.rotateConfirm"))) return;
    try {
      await rotateSlug(client, guide.id);
      await load();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  const link = guideUrl(origin, guide.slug);
  const missingLabels = progress.missing.map((k) => t(`guest.missing${k.charAt(0).toUpperCase()}${k.slice(1)}` as "guest.missingWifi"));

  const preview: PublicGuide = {
    ...form,
    propertyName: property.name,
    city: property.city,
    items: items.map(({ id: _id, ...rest }) => rest),
  };

  const text = (key: keyof GuideFields, label: string, opts: { area?: boolean; hint?: string; max?: number } = {}) => (
    <label className={labelClass}>
      {label}
      {opts.area ? (
        <textarea className={`${inputClass} min-h-24`} rows={4} maxLength={opts.max ?? 3000} value={form[key]} onChange={(e) => set(key, e.target.value as never)} />
      ) : (
        <input className={inputClass} maxLength={opts.max ?? 120} value={form[key]} onChange={(e) => set(key, e.target.value as never)} placeholder={opts.hint} />
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="text-sm text-muted underline-offset-4 hover:underline">{t("guest.back")}</button>
        <p className="truncate text-sm font-medium">{property.name}</p>
      </div>

      {error && <p role="alert" className={errorClass}>{error}</p>}

      <Card title={t("guest.completenessTitle", { pct: progress.pct })}>
        <div className="h-2 rounded-full bg-bg" aria-hidden>
          <div className="h-full rounded-full" style={{ width: `${progress.pct}%`, background: "linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))" }} />
        </div>
        {missingLabels.length > 0 && <p className="text-sm text-muted">{t("guest.missing", { list: missingLabels.join(", ") })}</p>}
      </Card>

      <Card title={t("guest.publishTitle")}>
        <p className="text-sm text-muted">{guide.published ? t("guest.publishedHelp") : t("guest.draftHelp")}</p>
        <button type="button" className={guide.published ? ghostButtonClass : buttonClass} onClick={togglePublish}>
          {guide.published ? t("guest.unpublish") : t("guest.publish")}
        </button>
      </Card>

      {guide.published && (
        <Card title={t("guest.linkTitle")}>
          <p className="break-all rounded-xl border border-line bg-bg px-3 py-2.5 text-sm" data-testid="guide-link">{link}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={link} label={t("guest.copyLink")} doneLabel={t("guest.copied")} className="!px-4 !py-2 !text-sm" />
            <a href={link} target="_blank" rel="noopener noreferrer" className={ghostButtonClass}>{t("guest.open")}</a>
            <button type="button" className={ghostButtonClass} onClick={rotate}>{t("guest.rotate")}</button>
          </div>
          <QrCode value={link} filename={`guia-${guide.slug}`} />
        </Card>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card title={t("guest.secWelcome")}>
          <fieldset>
            <legend className={labelClass}>{t("guest.accent")}</legend>
            <div role="radiogroup" aria-label={t("guest.accent")} className="mt-2 flex gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  role="radio"
                  aria-checked={form.accent === th.id}
                  aria-label={t(`themes.${th.id}`)}
                  title={t(`themes.${th.id}`)}
                  onClick={() => set("accent", th.id as Accent)}
                  style={{ backgroundColor: th.swatch }}
                  className={`h-7 w-7 rounded-full transition ${form.accent === th.id ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : "opacity-60 hover:opacity-100"}`}
                />
              ))}
            </div>
          </fieldset>
          {text("title", t("guest.title"))}
          {text("welcome", t("guest.welcome"), { area: true, max: 2000 })}
        </Card>

        <Card title={t("guest.secWifi")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("wifiName", t("guest.wifiName"), { max: 100 })}
            {text("wifiPassword", t("guest.wifiPassword"), { max: 100 })}
          </div>
        </Card>

        <Card title={t("guest.secStay")}>
          {text("checkin", t("guest.checkin"), { area: true })}
          {text("checkout", t("guest.checkout"), { area: true })}
        </Card>

        <Card title={t("guest.secRules")}>{text("houseRules", t("guest.rules"), { area: true })}</Card>
        <Card title={t("guest.secSafety")}>{text("safety", t("guest.safety"), { area: true })}</Card>

        <Card title={t("guest.secHost")}>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("hostName", t("guest.hostName"), { max: 100 })}
            {text("hostPhone", t("guest.hostPhone"), { max: 40, hint: t("guest.hostPhoneHint") })}
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 backdrop-blur">
          <button className={buttonClass} disabled={saving || !dirty}>{saving ? t("guest.saving") : t("guest.save")}</button>
          <span role="status" className={`text-sm ${savedAt && !dirty ? "text-success" : "text-muted"}`}>
            {dirty ? t("guest.unsaved") : savedAt ? t("guest.saved") : ""}
          </span>
        </div>
      </form>

      <ItemsSection kind="place" title={t("guest.placesTitle")} guide={guide} items={items} client={client} onChange={load} setError={setError} />
      <ItemsSection kind="appliance" title={t("guest.appliancesTitle")} guide={guide} items={items} client={client} onChange={load} setError={setError} />
      <ItemsSection kind="faq" title={t("guest.faqTitle")} guide={guide} items={items} client={client} onChange={load} setError={setError} />

      <div>
        <button type="button" className={ghostButtonClass} onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview}>
          {showPreview ? t("guest.hidePreview") : t("guest.preview")}
        </button>
        {showPreview && (
          <div className="mt-4">
            <GuideView guide={preview} t={t} preview />
          </div>
        )}
      </div>
    </div>
  );
}

function ItemsSection({
  kind, title, guide, items, client, onChange, setError,
}: {
  kind: ItemKind;
  title: string;
  guide: Guide;
  items: GuideItem[];
  client: SupabaseClient;
  onChange: () => Promise<void>;
  setError: (message: string | null) => void;
}) {
  const t = useT();
  const mine = items.filter((i) => i.kind === kind);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const labels = {
    place: [t("guest.placeName"), t("guest.placeBody")],
    appliance: [t("guest.applianceName"), t("guest.applianceBody")],
    faq: [t("guest.question"), t("guest.answer")],
  }[kind];

  async function add(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const cleanUrl = kind === "place" ? normalizeUrl(url) : "";
    if (cleanUrl === null) {
      setLocalError(t("guest.urlError"));
      return;
    }
    setBusy(true);
    try {
      await addItem(client, {
        guideId: guide.id,
        kind,
        category: kind === "place" ? asCategory(category) : "",
        title: name,
        body,
        url: cleanUrl,
        sort: items.length,
      });
      setName("");
      setBody("");
      setUrl("");
      await onChange();
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setLocalError(code === "23514" ? t("guest.limitError") : t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: GuideItem) {
    try {
      await removeItem(client, item.id);
      await onChange();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  }

  return (
    <section className={`${cardClass} space-y-4`}>
      <h2 className="text-sm font-medium">{title}</h2>
      {mine.length === 0 ? (
        <p className="text-sm text-muted">{t("guest.noItems")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {mine.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium">{i.title}</span>
                {kind === "place" && <span className="block text-xs text-accent">{t(`guide.cat.${asCategory(i.category)}`)}</span>}
                {i.body && <span className="mt-0.5 block whitespace-pre-line text-muted">{i.body}</span>}
              </span>
              <button type="button" className={ghostButtonClass} onClick={() => remove(i)} aria-label={t("guest.removeLabel", { title: i.title })}>
                {t("guest.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="space-y-3 border-t border-line pt-4">
        {kind === "place" && (
          <label className={labelClass}>
            {t("guest.category")}
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {PLACE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`guide.cat.${c}`)}</option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClass}>
          {labels[0]}
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        </label>
        <label className={labelClass}>
          {labels[1]}
          <textarea className={`${inputClass} min-h-20`} rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        </label>
        {kind === "place" && (
          <label className={labelClass}>
            {t("guest.link")}
            <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} inputMode="url" />
          </label>
        )}
        {localError && <p role="alert" className={errorClass}>{localError}</p>}
        <button className={ghostButtonClass} disabled={busy}>{busy ? t("guest.adding") : t("guest.add")}</button>
      </form>
    </section>
  );
}

