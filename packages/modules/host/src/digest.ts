import { shortDate } from "./format";
import { todayPlan } from "./logic";
import type { Booking, HostProperty, HostTask } from "./types";

export interface Digest {
  empty: boolean;
  subject: string;
  text: string;
  html: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The morning email: what needs you today. `empty` is true when there is nothing worth sending. */
export function buildDigest(input: { orgName: string; bookings: Booking[]; tasks: HostTask[]; properties: HostProperty[]; today: string; money: (minor: number) => string }): Digest {
  const plan = todayPlan(input.bookings, input.tasks, input.today);
  const prop = (id: string) => input.properties.find((p) => p.id === id)?.name ?? "—";
  const sections: { title: string; lines: string[] }[] = [
    { title: "Llegan hoy", lines: plan.arrivals.map((b) => `${b.guestName} · ${prop(b.propertyId)} · ${b.guestsCount} pers.`) },
    { title: "Salen hoy", lines: plan.departures.map((b) => `${b.guestName} · ${prop(b.propertyId)}`) },
    { title: "Llegan mañana", lines: plan.tomorrowArrivals.map((b) => `${b.guestName} · ${prop(b.propertyId)}`) },
    { title: "Tareas de hoy", lines: plan.tasks.map((t) => t.title) },
    { title: "Tareas vencidas", lines: plan.overdue.map((t) => `${t.title} (${shortDate(t.dueOn as string)})`) },
    { title: "Por cobrar antes de la llegada", lines: plan.collect.map((b) => `${b.guestName} · falta ${input.money(Math.max(0, b.amount - b.paid))}`) },
  ].filter((s) => s.lines.length > 0);
  const empty = sections.length === 0;
  const text = [`Tu día en ${input.orgName}`, ...sections.flatMap((s) => ["", s.title.toUpperCase(), ...s.lines.map((l) => `- ${l}`)])].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px"><h2>Tu día en ${esc(input.orgName)}</h2>${sections
    .map((s) => `<h3 style="margin:18px 0 6px">${esc(s.title)}</h3><ul style="margin:0;padding-left:18px">${s.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`)
    .join("")}</div>`;
  return { empty, subject: `Tu día: ${plan.arrivals.length} llegadas, ${plan.departures.length} salidas`, text, html };
}
