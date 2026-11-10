import Image from "next/image";
import { BrandMark } from "@stayflow/ui";
import { PACKS, PRODUCTS, type PackId, type ProductId } from "@/lib/catalog";
import { getMessages } from "@/i18n";
import { ProductBox } from "./box";
import { boxWidth, type BoxSize } from "./box-dims";
import { ProductArt } from "./visuals";

const m = getMessages();

/** One colour per product, so a shelf of boxes reads as a family. */
export const HUE: Record<ProductId, number> = { host: 203, guest: 276, ai: 312, profit: 142, operations: 26, listing: 185, academy: 54, experiences: 342, website: 160 };
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

function Seal({ text, hue }: { text: string; hue: number }) {
  return (
    <span className="absolute right-[0.7em] top-[0.7em] z-10 flex h-[3.1em] w-[3.1em] -rotate-12 flex-col items-center justify-center rounded-full text-center font-extrabold leading-none text-[#2b1f05] shadow-[0_0_1.2em_hsl(var(--hue)_90%_60%/0.6)]" style={{ background: `radial-gradient(circle at 30% 25%, #fff0b3, ${gold} 55%, #a87a1c)`, fontSize: "0.56em", ["--hue" as string]: hue }}>
      <span className="px-[0.3em] tracking-wide">{text.split("|").map((l, i) => <span key={i} className="block">{l}</span>)}</span>
    </span>
  );
}

function Strip({ text }: { text: string }) {
  return <p className="absolute inset-x-[0.8em] bottom-[0.8em] z-10 rounded-[0.3em] py-[0.4em] text-center text-[0.46em] font-extrabold tracking-[0.18em] text-[#2b1f05]" style={{ background: `linear-gradient(90deg, #a87a1c, ${gold}, #a87a1c)` }}>{text}</p>;
}

function Brand() {
  return (
    <header className="absolute left-[0.9em] top-[0.8em] z-10 flex items-center gap-[0.45em]">
      <BrandMark className="h-[1.5em] w-[1.5em] rounded-[0.4em]" />
      <span className="text-[0.55em] font-bold tracking-[0.3em] text-white/90">STAYFLOW</span>
    </header>
  );
}

/** Full-bleed photo with the product colour washed over it, dark at the bottom so the name always reads. */
function PhotoBg({ src, hue, dim = 0 }: { src: string; hue: number; dim?: number }) {
  return (
    <>
      <Image src={src} alt="" fill sizes="320px" className="object-cover" />
      <div className="absolute inset-0 mix-blend-color" style={{ background: `hsl(${hue} 100% 50% / ${0.55 + dim})` }} />
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, hsl(${hue} 100% 55% / ${0.18 + dim}) 0%, hsl(${hue} 100% 18% / ${0.4 + dim}) 52%, hsl(${hue} 95% 5% / 0.95) 100%)` }} />
      {/* Neon frame */}
      <div className="absolute inset-[0.4em] rounded-[0.35em]" style={{ border: `0.1em solid hsl(${hue} 100% 68%)`, boxShadow: `0 0 0.7em hsl(${hue} 100% 58% / 0.85), inset 0 0 0.9em hsl(${hue} 100% 58% / 0.55)` }} />
    </>
  );
}

/**
 * A product pack: a square box whose front is a photo of what the product is for, with the real system in a window on top.
 * Swap a photo by replacing /public/packs/<product>.jpg (square, at least 800px).
 */
export function ProductCover({ id, size = "md" }: { id: ProductId; size?: BoxSize }) {
  const p = PRODUCTS[id];
  const hue = HUE[id];
  const w = boxWidth(size);
  const winW = w * 0.5;
  const shot = SHOT[id];
  return (
    <ProductBox hue={hue} size={size} spine={`${WORD[id]}`} label={`${p.name}: ${m.products[id].tagline}`}>
      <div className="absolute inset-0 bg-[#05070d]">
        <PhotoBg src={`/packs/${id}.jpg`} hue={hue} />
        <Brand />
        <Seal hue={hue} text={p.status === "available" ? "YA|LISTO" : "PRE|VENTA"} />
        {/* A window onto the system itself. */}
        <div className="absolute right-[0.9em] top-[3.9em] z-10 overflow-hidden rounded-[0.5em] border border-white/25 bg-[#05070d] shadow-[0_0.7em_1.6em_rgb(0_0_0/0.65)]" style={{ width: "6.9em", height: "4.4em", transform: "rotate(2.5deg)" }}>
          {shot ? (
            <Image src={shot} alt="" fill sizes={`${Math.round(winW)}px`} className="object-cover object-top" />
          ) : (
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: 360, height: 230, transform: `scale(${(winW * 0.96) / 360})` }}>
              <ProductArt id={id} />
              <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">Vista previa</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
        </div>
        <div className="absolute inset-x-[0.9em] bottom-[2.7em] z-10">
          <h4 className="font-display font-extrabold uppercase leading-[0.95] tracking-tight" style={{ fontSize: WORD[id].length <= 5 ? "3.1em" : WORD[id].length <= 7 ? "2.45em" : WORD[id].length <= 9 ? "2em" : "1.62em", color: `hsl(${hue} 100% 72%)`, textShadow: `0 0 0.25em hsl(${hue} 100% 62%), 0 0 0.7em hsl(${hue} 100% 55% / 0.9), 0 0.05em 0.2em rgb(0 0 0 / 0.6)` }}>{WORD[id]}</h4>
        </div>
        <Strip text={KEYWORDS[id]} />
      </div>
    </ProductBox>
  );
}

/** A pack of products: the same square box, with every product inside it as a small square. */
export function PackCover({ id, size = "md" }: { id: PackId; size?: BoxSize }) {
  const apps = PACKS[id].apps;
  const hue = id === "mega" ? 196 : id === "pro" ? 292 : 142;
  const c = m.packs.list[id];
  const many = apps.length > 3;
  return (
    <ProductBox hue={hue} size={size} spine={c.name.replace("Anfitrión Premium", "").trim()} label={`${c.name}: ${apps.length} apps`}>
      <div className="absolute inset-0 bg-[#05070d]">
        <PhotoBg src={`/packs/${id === "essential" ? "essential" : id}.jpg`} hue={hue} dim={0.2} />
        <Brand />
        <Seal hue={hue} text="−30%" />
        <div className="absolute left-[0.9em] top-[2.8em] z-10 max-w-[8.4em]">
          <h4 className={`font-display ${many ? (id === "pro" ? "text-[1.2em]" : "text-[1.4em]") : "text-[1.9em]"} font-extrabold uppercase leading-[0.98] tracking-tight`} style={{ color: `hsl(${hue} 100% 74%)`, textShadow: `0 0 0.25em hsl(${hue} 100% 62%), 0 0 0.7em hsl(${hue} 100% 55% / 0.9)` }}>{c.name.replace("Anfitrión Premium", "").trim()}</h4>
        </div>
        <div className="absolute bottom-[2.4em] left-1/2 z-10 grid w-[88%] -translate-x-1/2 grid-cols-3 gap-[0.35em]">
          {apps.map((a) => (
            <span key={a} className={`flex ${many ? "h-[1.4em]" : "h-[3.4em]"} items-center justify-center rounded-[0.3em] text-center font-extrabold uppercase tracking-wide text-white`} style={{ background: `linear-gradient(160deg, hsl(${HUE[a]} 100% 58%), hsl(${HUE[a]} 100% 28%))`, boxShadow: `0 0 0.7em hsl(${HUE[a]} 100% 55% / 0.8), inset 0 0 0 1px hsl(${HUE[a]} 100% 82% / 0.7)` }}>
              <span className="text-[0.36em]">{WORD[a]}</span>
            </span>
          ))}
        </div>
        <Strip text="30% DE DESCUENTO · PAGO ÚNICO" />
      </div>
    </ProductBox>
  );
}
