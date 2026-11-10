/** Remembers which ad brought a visitor (UTM tags and Meta's fbclid), so a lead can be traced back to its campaign. */
const KEY = "stayflow-attr-v1";
const FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
export type Attribution = Partial<Record<(typeof FIELDS)[number] | "landing", string>>;

export function captureAttribution(): void {
  try {
    const q = new URLSearchParams(window.location.search);
    const found: Attribution = {};
    for (const f of FIELDS) {
      const v = q.get(f);
      if (v) found[f] = v.slice(0, 80);
    }
    if (Object.keys(found).length === 0) return;
    found.landing = window.location.pathname.slice(0, 80);
    localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    /* attribution is a nice-to-have */
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}
