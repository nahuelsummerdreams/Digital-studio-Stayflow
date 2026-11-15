"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@stayflow/ui";
import { track } from "@/lib/analytics";
import { saveLead } from "@/lib/leads";
import { useMessages } from "@/i18n/client";
import { btnPrimary } from "./styles";

/** Invitation to the first 10 real hosts. The email is saved as a lead (source notify-piloto); nothing is sent by itself. */
export function Pilot() {
  const { m } = useMessages();
  const p = m.funnel.pilot;
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    if (trap) return setState("done"); // bots fill the hidden field; pretend it worked
    setState("sending");
    const ok = await saveLead(email, "notify-piloto", { interest: "pilot" });
    if (ok) track("generate_lead", { source: "pilot" });
    setState(ok ? "done" : "error");
  }

  return (
    <section id="piloto" className="mx-auto max-w-6xl px-5 py-14 md:py-20">
      <div className="reveal fx-card relative overflow-hidden rounded-[2rem] p-6 md:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--accent-2)/0.14)] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">{p.eyebrow}</p>
            <h2 className="font-display mt-4 text-3xl leading-tight md:text-4xl">{p.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{p.body}</p>
            <ul className="mt-6 space-y-2.5">
              {p.points.map((x) => (
                <li key={x} className="flex items-start gap-3 text-[15px]"><span className="tick mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"><Icon name="check" className="h-3 w-3" /></span>{x}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-muted">{p.honest}</p>
          </div>
          <form onSubmit={submit} className="rounded-2xl border border-line bg-bg/60 p-5">
            {state === "done" ? (
              <p role="status" className="flex items-start gap-2 text-sm font-medium"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" />{p.thanks}</p>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-muted">
                  {p.email}
                  <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="mt-1 w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-sm text-fg outline-none transition placeholder:text-muted/60 focus:border-accent focus:shadow-[0_0_0_4px_rgb(var(--accent)/0.15)]" />
                </label>
                <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
                <button disabled={state === "sending"} className={`${btnPrimary} w-full !py-3.5 !text-base disabled:opacity-60`}>{state === "sending" ? p.sending : p.cta}</button>
                {state === "error" && <p role="alert" className="text-sm text-danger">{p.error}</p>}
                <p className="text-xs text-muted">{p.consent}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
