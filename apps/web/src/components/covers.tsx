import Image from "next/image";
import { BrandMark } from "@stayflow/ui";
import { PACKS, PRODUCTS, type PackId, type ProductId } from "@/lib/catalog";
import { getMessages } from "@/i18n";
import { ProductBox } from "./box";
import { boxWidth, type BoxSize } from "./box-dims";
import { ProductArt } from "./visuals";

const m = getMessages();

/** One colour per product, so a shelf of boxes reads as a family. */
export const HUE: Record<ProductId, number> = { host: 215, guest: 268, ai: 305, profit: 150, operations: 28, listing: 190, academy: 44, experiences: 338, website: 172 };
/** Real screenshots of the apps that exist today. The rest show a preview drawn in code. */
const SHOT: Partial<Record<ProductId, string>> = { host: "/covers/host.webp", profit: "/covers/profit.webp", guest: "/covers/guest.webp" };
const WORD: Record<ProductId, string> = { host: "HOST", guest: "GUEST", ai: "AI", profit: "PROFIT", operations: "OPERATIONS", listing: "LISTING", academy: "ACADEMY", experiences: "EXPERIENCES", website: "WEBSITE" };
const KEYWORDS: Record<ProductId, string> = {
  host: "RESERVAS · CRONOGRAMA · TAREAS",
  guest: "GUÍA · QR · CHECK-IN",
  ai: "RESPUESTAS · PLANTILLAS",
  profit: "INGRESOS · GASTOS · GANANCIA",
  operations: "LIMPIEZA · CHECKLISTS",
  listing: "TÍTULOS · TEXTOS · IDEAS",
  academy: "LECCIONES · PASO A PASO",
  experiences: "EXPERIENCIAS · SERVICIOS",
  website: "TU SITIO · FOTOS · RESERVAS",
};

const gold = "hsl(42 70% 58%)";
const coverBg = (hue: number) => ({ background: `radial-gradient(120% 70% at 50% 0%, hsl(${hue} 70% 24%), hsl(${hue} 60% 8%) 70%), #05070d` });

function Seal({ text, hue }: { text: string; hue: number }) {
  return (
    <span className="absolute right-[0.7em] top-[0.7em] flex h-[3.2em] w-[3.2em] -rotate-12 flex-col items-center justify-center rounded-full text-center font-extrabold leading-none text-[#2b1f05] shadow-[0_0_1.2em_hsl(var(--hue)_90%_60%/0.6)]" style={{ background: `radial-gradient(circle at 30% 25%, #fff0b3, ${gold} 55%, #a87a1c)`, fontSize: "0.56em", ["--hue" as string]: hue }}>
      <span className="px-[0.3em] tracking-wide">{text.split("|").map((l, i) => <span key={i} className="block">{l}</span>)}</span>
    </span>
  );
}

function Strip({ text }: { text: string }) {
  return <p className="absolute inset-x-[0.9em] bottom-[0.9em] rounded-[0.3em] py-[0.45em] text-center text-[0.46em] font-extrabold tracking-[0.18em] text-[#2b1f05]" style={{ background: `linear-gradient(90deg, #a87a1c, ${gold}, #a87a1c)` }}>{text}</p>;
}

/** What goes on a product's front: brand, name, a window onto the real system, and what it covers. */
export function ProductCover({ id, size = "md" }: { id: ProductId; size?: BoxSize }) {
  const p = PRODUCTS[id];
  const hue = HUE[id];
  const w = boxWidth(size);
  const winW = w * 0.82;
  const shot = SHOT[id];
  return (
    <ProductBox hue={hue} size={size} spine={`STAYFLOW ${WORD[id]}`} label={`${p.name}: ${m.products[id].tagline}`}>
      <div className="absolute inset-0" style={coverBg(hue)}>
        <div className="absolute inset-[0.5em] rounded-[0.4em] border" style={{ borderColor: "hsl(42 60% 55% / 0.45)" }} />
        <header className="absolute left-[1em] top-[1em] flex items-center gap-[0.5em]">
          <BrandMark className="h-[1.5em] w-[1.5em] rounded-[0.4em]" />
          <span className="text-[0.55em] font-bold tracking-[0.3em] text-white/80">STAYFLOW</span>
        </header>
        <Seal hue={hue} text={p.status === "available" ? "YA|LISTO" : "PRE|VENTA"} />
        <div className="absolute inset-x-[1em] top-[3.6em] text-center">
          <p className="text-[0.5em] font-bold uppercase tracking-[0.3em] text-white/60">{m.products[id].tagline}</p>
          <h4 className="font-display mt-[0.15em] text-[2.9em] font-extrabold uppercase leading-[0.95] tracking-tight" style={{ color: `hsl(${hue} 95% 70%)`, textShadow: `0 0 0.6em hsl(${hue} 90% 55% / 0.55)` }}>{WORD[id]}</h4>
        </div>
        {/* A window onto the system itself. */}
        <div className="absolute left-1/2 top-[9.6em] w-[82%] -translate-x-1/2 overflow-hidden rounded-[0.5em] border border-white/15 bg-[#05070d] shadow-[0_0.6em_1.4em_rgb(0_0_0/0.6)]" style={{ height: "7.4em" }}>
          {shot ? (
            <Image src={shot} alt="" fill sizes={`${Math.round(winW)}px`} className="object-cover object-top" />
          ) : (
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: 360, height: 230, transform: `scale(${winW / 360})` }}>
              <ProductArt id={id} />
              <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">Vista previa</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        </div>
        <Strip text={KEYWORDS[id]} />
      </div>
    </ProductBox>
  );
}

/** A pack: the box set, with every product inside it as a small cover. */
export function PackCover({ id, size = "md" }: { id: PackId; size?: BoxSize }) {
  const apps = PACKS[id].apps;
  const hue = id === "mega" ? 215 : id === "pro" ? 268 : 150;
  const c = m.packs.list[id];
  const cols = apps.length > 6 ? 3 : apps.length > 3 ? 3 : 3;
  return (
    <ProductBox hue={hue} size={size} spine={c.name.toUpperCase()} label={`${c.name}: ${apps.length} apps`}>
      <div className="absolute inset-0" style={coverBg(hue)}>
        <div className="absolute inset-[0.5em] rounded-[0.4em] border" style={{ borderColor: "hsl(42 60% 55% / 0.45)" }} />
        <header className="absolute left-[1em] top-[1em] flex items-center gap-[0.5em]">
          <BrandMark className="h-[1.5em] w-[1.5em] rounded-[0.4em]" />
          <span className="text-[0.55em] font-bold tracking-[0.3em] text-white/80">STAYFLOW</span>
        </header>
        <Seal hue={hue} text="−30%" />
        <div className="absolute inset-x-[1em] top-[3.6em] text-center">
          <p className="text-[0.5em] font-bold uppercase tracking-[0.3em] text-white/60">{apps.length} apps en un pack</p>
          <h4 className={`font-display mt-[0.15em] ${id === "pro" ? "text-[1.45em]" : "text-[1.8em]"} font-extrabold uppercase leading-[0.98] tracking-tight`} style={{ color: `hsl(${hue} 95% 72%)`, textShadow: `0 0 0.6em hsl(${hue} 90% 55% / 0.55)` }}>{c.name.replace("Anfitrión Premium", "").trim()}</h4>
          {id === "mega" && <p className="text-[0.55em] font-bold uppercase tracking-[0.28em] text-white/80">Anfitrión Premium</p>}
        </div>
        <div className={`absolute left-1/2 ${apps.length > 3 ? "top-[8.7em]" : "top-[9.1em]"} grid w-[82%] -translate-x-1/2 gap-[0.4em]`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {apps.map((a) => (
            <span key={a} className={`flex ${apps.length > 3 ? "h-[2.15em] items-center" : "h-[5em] items-end"} justify-center rounded-[0.3em] p-[0.2em] text-center font-extrabold uppercase leading-tight tracking-wide text-white`} style={{ background: `linear-gradient(160deg, hsl(${HUE[a]} 80% 40%), hsl(${HUE[a]} 70% 14%))`, boxShadow: `0 0.3em 0.6em rgb(0 0 0 / 0.5), inset 0 0 0 1px hsl(${HUE[a]} 90% 70% / 0.35)` }}>
              <span className="text-[0.4em]">{WORD[a]}</span>
            </span>
          ))}
        </div>
        <Strip text="30% DE DESCUENTO · PAGO ÚNICO" />
      </div>
    </ProductBox>
  );
}
