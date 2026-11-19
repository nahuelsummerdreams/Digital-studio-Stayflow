/** Access check for STAYflow Marketing: a code the buyer pastes once, checked by a database function. */

export const ACCESS_KEY = "stayflow-marketing-access-v1";

export type AccessResult = "ok" | "invalid" | "revoked" | "full" | "offline";

export interface Saved {
  code: string;
  device: string;
}

export function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(ACCESS_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Saved>;
    return typeof v.code === "string" && typeof v.device === "string" ? { code: v.code, device: v.device } : null;
  } catch {
    return null;
  }
}

export function save(s: Saved) {
  try {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(s));
  } catch {
    /* Without storage the buyer pastes the code again next visit. */
  }
}

export function forget() {
  try {
    localStorage.removeItem(ACCESS_KEY);
  } catch {
    /* nothing to forget */
  }
}

export function newDeviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, hex);
}

/** Asks the database. A network failure is "offline", never "invalid". */
export async function checkCode(code: string, device: string): Promise<AccessResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "offline";
  try {
    const res = await fetch(`${url}/rest/v1/rpc/marketing_access`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_code: code, p_device: device }),
    });
    if (!res.ok) return "offline";
    const out = (await res.json()) as unknown;
    return out === "ok" || out === "invalid" || out === "revoked" || out === "full" ? out : "offline";
  } catch {
    return "offline";
  }
}

/** "mk-q9a2 l4b3 gqng" becomes "MK-Q9A2-L4B3-GQNG" (what people paste is rarely tidy). */
export function tidyCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = s.startsWith("MK") ? s.slice(2) : s;
  const parts = body.match(/.{1,4}/g) ?? [];
  return ["MK", ...parts.slice(0, 3)].join("-");
}
