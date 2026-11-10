import { Sparkline } from "@stayflow/ui";
import { t } from "@/lib/t";

/** A faithful, static picture of the Profit overview. Numbers are illustrative and labelled as such. */
export function ProductPreview() {
  const chip = (label: string, active = false) => (
    <span
      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${active ? "bg-accent text-onaccent" : "text-muted"}`}
    >
      {label}
    </span>
  );
  return (
    <div className="float relative">
      <div aria-hidden className="absolute -inset-10 rounded-[56px] bg-accent/20 blur-3xl" />
      <div className="fx-card fx-hero relative rounded-[28px] p-5 transition-transform duration-700 ease-out lg:[transform:perspective(1400px)_rotateY(-6deg)_rotateX(2deg)] lg:hover:[transform:perspective(1400px)_rotateY(-2deg)_rotateX(1deg)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent">Stayflow Profit</span>
          <span aria-hidden className="flex gap-1.5">
            <i className="h-2 w-2 rounded-full bg-line" />
            <i className="h-2 w-2 rounded-full bg-line" />
            <i className="h-2 w-2 rounded-full bg-line" />
          </span>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl border border-line bg-bg p-1">
          {chip(t("overview.thisMonth"), true)}
          {chip(t("overview.lastMonth"))}
          {chip(t("overview.thisYear"))}
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-bg p-5">
          <p className="text-xs text-muted">{t("overview.netProfit")}</p>
          <p className="font-display mt-1 text-5xl text-money">1.001 €</p>
          <p className="mt-2 text-xs text-muted">{t("overview.earnedSpent", { earned: "1.251 €", spent: "250 €" })}</p>
          <p className="mt-2 text-xs font-medium text-success">
            +25,1 % <span className="font-normal text-muted">{t("overview.vsPrevious")}</span>
          </p>
          <Sparkline values={[2529, 2622, 3130, 2152, 2883, 3410, 4120]} className="mt-3 h-10 w-full" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-bg p-4">
            <p className="text-xs font-medium">Loft Vista al Mar</p>
            <p className="font-display mt-2 text-2xl">1.126 €</p>
            <p className="mt-1 text-[11px] text-muted">{t("overview.margin", { pct: "90" })}</p>
          </div>
          <div className="rounded-2xl border border-line bg-bg p-4">
            <p className="text-xs font-medium">Estudio Casco Antiguo</p>
            <p className="font-display mt-2 text-2xl text-danger">-125 €</p>
            <p className="mt-1 text-[11px] text-muted">{t("overview.margin", { pct: "0" })}</p>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted lg:text-right">{t("landing.hero.sample")}</p>
    </div>
  );
}
