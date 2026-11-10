import type { ReactNode } from "react";
import type { TFn } from "@stayflow/i18n";
import { DigitalStudioLogo } from "@stayflow/ui";
import { CopyButton } from "./CopyButton";
import { groupPlaces, telLink, whatsappLink } from "./helpers";
import type { PublicGuide } from "./types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fx-card rounded-card p-6">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-accent">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const Text = ({ children }: { children: string }) => <p className="whitespace-pre-line leading-relaxed text-fg/90">{children}</p>;

const safeHref = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);

/**
 * The guide as a guest sees it. Pure and server-safe: it receives the translator, so it works on the
 * public page (server) and in the editor preview (client). All content is rendered as plain text.
 */
export function GuideView({ guide, t, preview = false }: { guide: PublicGuide; t: TFn; preview?: boolean }) {
  const places = guide.items.filter((i) => i.kind === "place");
  const appliances = guide.items.filter((i) => i.kind === "appliance");
  const faqs = guide.items.filter((i) => i.kind === "faq");
  const wa = whatsappLink(guide.hostPhone);
  const tel = telLink(guide.hostPhone);
  const hasContact = guide.hostName.trim() !== "" || wa !== null;
  const H1 = preview ? "h2" : "h1";

  return (
    <div
      data-theme={guide.accent}
      className={`bg-bg text-fg ${preview ? "rounded-card border border-line" : "min-h-screen"}`}
      style={{ backgroundImage: "radial-gradient(700px 380px at 80% -5%, rgb(var(--accent) / 0.18), transparent 65%)", backgroundRepeat: "no-repeat" }}
    >
      <main className="mx-auto max-w-xl space-y-4 px-5 pb-16 pt-12">
        <header className="pb-4">
          {guide.city && <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{guide.city}</p>}
          <H1 className="font-display mt-3 text-4xl leading-tight">{guide.title || guide.propertyName}</H1>
          {guide.welcome && <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted">{guide.welcome}</p>}
        </header>

        {guide.wifiName && (
          <Section title={t("guide.wifi")}>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <dt className="text-muted">{t("guide.network")}</dt>
                  <dd className="truncate font-medium">{guide.wifiName}</dd>
                </div>
                <CopyButton text={guide.wifiName} label={t("guide.copy")} doneLabel={t("guide.copied")} />
              </div>
              {guide.wifiPassword && (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <dt className="text-muted">{t("guide.password")}</dt>
                    <dd className="truncate font-mono font-medium">{guide.wifiPassword}</dd>
                  </div>
                  <CopyButton text={guide.wifiPassword} label={t("guide.copy")} doneLabel={t("guide.copied")} />
                </div>
              )}
            </dl>
          </Section>
        )}

        {guide.checkin && (
          <Section title={t("guide.checkin")}>
            <Text>{guide.checkin}</Text>
          </Section>
        )}
        {guide.checkout && (
          <Section title={t("guide.checkout")}>
            <Text>{guide.checkout}</Text>
          </Section>
        )}
        {guide.houseRules && (
          <Section title={t("guide.rules")}>
            <Text>{guide.houseRules}</Text>
          </Section>
        )}
        {guide.safety && (
          <Section title={t("guide.safety")}>
            <Text>{guide.safety}</Text>
          </Section>
        )}

        {hasContact && (
          <Section title={t("guide.contact")}>
            {guide.hostName && <p className="font-medium">{guide.hostName}</p>}
            {(wa || tel) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-onaccent"
                  >
                    {t("guide.whatsapp")}
                  </a>
                )}
                {tel && (
                  <a href={tel} className="inline-flex items-center rounded-xl border border-line px-4 py-2.5 text-sm font-medium">
                    {t("guide.call")}
                  </a>
                )}
              </div>
            )}
          </Section>
        )}

        {places.length > 0 && (
          <Section title={t("guide.places")}>
            <div className="space-y-6">
              {groupPlaces(places).map((g) => (
                <div key={g.category}>
                  <h3 className="text-sm font-semibold">{t(`guide.cat.${g.category}`)}</h3>
                  <ul className="mt-2 divide-y divide-line">
                    {g.items.map((p, i) => (
                      <li key={`${p.title}-${i}`} className="flex items-start justify-between gap-3 py-3 text-sm">
                        <span className="min-w-0">
                          <span className="block font-medium">{p.title}</span>
                          {p.body && <span className="mt-0.5 block whitespace-pre-line text-muted">{p.body}</span>}
                        </span>
                        {safeHref(p.url) && (
                          <a
                            href={safeHref(p.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-accent"
                          >
                            {t("guide.see")}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {appliances.length > 0 && (
          <Section title={t("guide.appliances")}>
            <div className="divide-y divide-line">
              {appliances.map((a, i) => (
                <details key={`${a.title}-${i}`} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {a.title}
                    <span aria-hidden className="text-xl leading-none text-accent transition group-open:rotate-45">+</span>
                  </summary>
                  {a.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{a.body}</p>}
                </details>
              ))}
            </div>
          </Section>
        )}

        {faqs.length > 0 && (
          <Section title={t("guide.faq")}>
            <div className="divide-y divide-line">
              {faqs.map((f, i) => (
                <details key={`${f.title}-${i}`} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {f.title}
                    <span aria-hidden className="text-xl leading-none text-accent transition group-open:rotate-45">+</span>
                  </summary>
                  {f.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{f.body}</p>}
                </details>
              ))}
            </div>
          </Section>
        )}

        <footer className="flex flex-col items-center gap-4 pt-8 text-center">
          <p className="text-xs text-muted">{t("guide.poweredBy")}</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{t("common.productBy")}</span>
            <DigitalStudioLogo className="h-5 w-auto text-muted" />
          </div>
        </footer>
      </main>
    </div>
  );
}
