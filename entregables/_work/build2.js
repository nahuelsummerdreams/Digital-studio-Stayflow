// Guías de cliente con la estructura "Digital Studio": portada con celulares, así funciona, antes de empezar,
// pasos con capturas numeradas, rutina diaria, así empezamos y licencia. Un PDF por app.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { guides } = require("./content2");

const ROOT = __dirname;
const SH = path.join(ROOT, "shots2");
const OUT = path.join(ROOT, "pdf2");
fs.mkdirSync(OUT, { recursive: true });
const ANN = JSON.parse(fs.readFileSync(path.join(SH, "annotations.json"), "utf8"));
const DS_PATH = fs.readFileSync(path.join(ROOT, "ds-logo-path.txt"), "utf8");
const FONT = (w) => "file://" + path.join(ROOT, "fonts", `barlow-condensed-latin-${w}-normal.woff2`);
const MAIN = { host: "#38BDF8", guest: "#2DD4BF", business: "#A78BFA", operations: "#FBBF24" };
const CONTACT = "Responde al correo con el que recibiste esta guía";
const VERSION = "Noviembre 2026";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const img = (n) => "file://" + path.join(SH, n + ".png");
const DS = (cls = "") => `<svg class="ds ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2160 816" role="img" aria-label="Digital Studio"><path fill="currentColor" fill-rule="evenodd" d="${DS_PATH}"/></svg>`;

const ICONS = {
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16v4M17 18h4"/>',
  wallet: '<path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><path d="M16 14h.01"/>',
  chart: '<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M16 7l3 3M14 9l2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  sync: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
};
const ico = (n, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ICONS.check}</svg>`;
const tick = `<svg class="tk" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const mark = (g, size) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="gm${g.id}${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.accent[0]}"/><stop offset="1" stop-color="${g.accent[1]}"/></linearGradient></defs><rect width="64" height="64" rx="17" fill="url(#gm${g.id}${size})"/><path d="M10 41c7 0 7-16 16-16s9 16 16 16 7-16 12-16" transform="translate(-1 -1)" fill="none" stroke="#fff" stroke-width="6.4" stroke-linecap="round"/></svg>`;
const ring = (g, size = 17) => `<span class="ring" style="width:${size}mm;height:${size}mm">${mark(g, Math.round(size * 2.4))}</span>`;

const CSS = (c) => `
@font-face { font-family: "BC"; font-weight: 600; src: url("${FONT(600)}") format("woff2"); }
@font-face { font-family: "BC"; font-weight: 700; src: url("${FONT(700)}") format("woff2"); }
@font-face { font-family: "BC"; font-weight: 800; src: url("${FONT(800)}") format("woff2"); }
@page { size: A4; margin: 0; }
:root { --c: ${c}; --bg: #000; --card: #0A0E13; --line: #1B232C; --muted: #8B95A3; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #000; color: #fff; font-family: "Inter", Arial, sans-serif; font-size: 10pt; line-height: 1.45; }
.bc, h1, h2, h3, h4 { font-family: "BC", "Barlow Condensed", sans-serif; text-transform: uppercase; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; background: #000; }
.page:last-child { page-break-after: auto; }
.page:before { content: ""; position: absolute; inset: 0; background: radial-gradient(70% 28% at 88% 0%, color-mix(in srgb, var(--c) 34%, transparent), transparent 70%), radial-gradient(50% 20% at 8% 0%, color-mix(in srgb, var(--c) 12%, transparent), transparent 70%); }
.in { position: absolute; inset: 0; padding: 12mm 16mm 20mm; }
.ds { display: inline-block; color: #fff; }
.ring { display: inline-grid; place-items: center; border-radius: 50%; border: 1.1mm solid var(--c); background: #05080c; overflow: hidden; flex: none; }
.ring svg { width: 56%; height: 56%; }
.hdr { display: flex; align-items: center; justify-content: space-between; }
.hdr .l { display: flex; align-items: center; gap: 4mm; }
.hdr .t { font-family: "BC"; font-weight: 800; font-size: 15pt; letter-spacing: .02em; text-transform: uppercase; }
.hdr .t b { color: var(--c); font-weight: 800; }
.hdr .ds { height: 11mm; }
.dash { height: 1.5mm; margin: 4mm 0 5mm; background: repeating-linear-gradient(90deg, var(--c) 0 8mm, transparent 8mm 12.6mm); }
.ftr { position: absolute; left: 16mm; right: 16mm; bottom: 9mm; display: flex; justify-content: space-between; font-size: 9pt; color: var(--muted); }
.ftr b { color: #fff; font-size: 12pt; }
.kick { font-family: "BC"; font-weight: 800; font-size: 14pt; color: var(--c); text-transform: uppercase; letter-spacing: .01em; }
h1.pt { font-weight: 800; font-size: 43pt; line-height: .98; margin-top: 1mm; letter-spacing: .005em; }
.lead { color: var(--muted); font-size: 11.2pt; margin-top: 3mm; max-width: 165mm; }

/* cards */
.card { background: var(--card); border: 1px solid var(--line); border-radius: 5mm; padding: 5mm; }
.mom { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 7mm; }
.mom .card h3 { font-weight: 800; font-size: 19pt; margin-top: 3mm; line-height: 1; }
.mom .card p { color: var(--muted); font-size: 9.4pt; margin-top: 2mm; line-height: 1.4; }
.ic { width: 13mm; height: 13mm; border-radius: 50%; background: var(--c); color: #04101a; display: grid; place-items: center; }
.imgs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 4mm; }
.imgs .card { padding: 0; overflow: hidden; }
.imgs .ph { height: 40mm; overflow: hidden; background: #05080c; border-bottom: 1px solid var(--line); }
.imgs .ph img { width: 100%; display: block; object-fit: cover; object-position: top left; height: 100%; }
.imgs .tx { padding: 4mm 5mm 5mm; }
.imgs h3 { font-weight: 800; font-size: 19pt; color: var(--c); line-height: 1; }
.imgs p { color: var(--muted); font-size: 9.2pt; margin-top: 1.6mm; line-height: 1.38; }
.note { margin-top: 5mm; border: 1px dashed color-mix(in srgb, var(--c) 70%, transparent); border-radius: 4mm; padding: 4mm 5mm; font-size: 10pt; }
.note b { color: var(--c); }

/* browser + badges */
.win { border-radius: 3.4mm; overflow: hidden; border: 1px solid #263039; background: #05080c; box-shadow: 0 6mm 14mm -6mm rgba(0,0,0,.8); }
.win .bar { height: 8mm; display: flex; align-items: center; gap: 1.8mm; padding: 0 3.4mm; background: #0B1015; border-bottom: 1px solid #1B232C; }
.win .bar i { width: 2.6mm; height: 2.6mm; border-radius: 50%; display: block; }
.win .bar .u { margin-left: 3mm; padding: .7mm 3.6mm; border-radius: 99px; background: #151C24; color: #B8C2CF; font-size: 8pt; }
.win .view { position: relative; }
.win .view img { display: block; width: 100%; }
.bd { position: absolute; width: 6.4mm; height: 6.4mm; margin: -3.2mm 0 0 -2.2mm; border-radius: 50%; background: var(--c); color: #04101a; font-family: "BC"; font-weight: 800; font-size: 12pt; display: grid; place-items: center; box-shadow: 0 0 0 1.1mm rgba(0,0,0,.65); }
.leg { display: grid; grid-template-columns: 1fr 1fr; gap: 3.6mm 7mm; margin-top: 5mm; }
.leg.one { grid-template-columns: 1fr; }
.leg .it { display: grid; grid-template-columns: 8mm 1fr; gap: 3mm; align-items: start; }
.leg .n { width: 7.4mm; height: 7.4mm; border-radius: 50%; background: var(--c); color: #04101a; font-family: "BC"; font-weight: 800; font-size: 13pt; display: grid; place-items: center; }
.leg h4 { font-weight: 800; font-size: 14.5pt; line-height: 1; margin-top: .6mm; }
.leg p { color: var(--muted); font-size: 9.2pt; line-height: 1.35; margin-top: .6mm; }
.box { border: 1px solid var(--line); background: var(--card); border-radius: 5mm; padding: 5mm 6mm; margin-top: 5mm; }
.box h3 { font-weight: 800; font-size: 17pt; color: var(--c); }
.box ul { list-style: none; margin-top: 2.4mm; display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 6mm; }
.box li { display: grid; grid-template-columns: 5mm 1fr; gap: 2mm; font-size: 9.6pt; color: #D7DDE5; line-height: 1.35; }
.box li .tk { color: var(--c); margin-top: .6mm; }
.box.col1 ul { grid-template-columns: 1fr; }

/* phones */
.phone { border-radius: 8mm; padding: 1.8mm; background: #0F151C; border: 1px solid #2A3540; box-shadow: 0 8mm 16mm -6mm rgba(0,0,0,.85); }
.phone img { display: block; width: 100%; border-radius: 6.4mm; }
.ph3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; margin-top: 6mm; padding: 0 5mm; }
.ph3 .cap { margin-top: 4mm; }
.ph3 .cap h4 { font-weight: 800; font-size: 14.5pt; line-height: 1; }
.ph3 .cap p { color: var(--muted); font-size: 9.2pt; margin-top: 1mm; line-height: 1.35; }

/* cover */
.cover:before { background: radial-gradient(80% 36% at 80% 0%, color-mix(in srgb, var(--c) 42%, transparent), transparent 72%), radial-gradient(40% 20% at 0% 30%, color-mix(in srgb, var(--c) 10%, transparent), transparent 70%); }
.cover .top { position: absolute; top: 14mm; left: 16mm; right: 16mm; display: flex; justify-content: space-between; align-items: center; }
.cover .top .ds { height: 16mm; }
.cover .txt { position: absolute; top: 56mm; left: 16mm; right: 16mm; }
.cover .k { font-family: "BC"; font-weight: 800; font-size: 17pt; color: var(--c); }
.cover h1 { font-weight: 800; line-height: .94; margin-top: 3mm; }
.cover .brand { font-family: "BC"; font-weight: 800; font-size: 46pt; color: var(--c); line-height: 1; margin-top: 6mm; text-transform: uppercase; }
.cover .sub { color: #A9B3C1; font-size: 13pt; max-width: 140mm; margin-top: 6mm; line-height: 1.4; }
.cover .row { position: absolute; left: 0; right: 0; bottom: -50mm; display: flex; justify-content: center; align-items: flex-end; gap: 3mm; }
.cover .row:before { content: ""; position: absolute; left: 10%; right: 10%; top: 8mm; bottom: 30mm; background: radial-gradient(closest-side, color-mix(in srgb, var(--c) 38%, transparent), transparent 75%); filter: blur(8mm); }
.cover .row .phone { width: 58mm; position: relative; border-color: color-mix(in srgb, var(--c) 60%, #2A3540); box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 35%, transparent), 0 0 12mm color-mix(in srgb, var(--c) 30%, transparent); }
.cover .row .phone:nth-child(1) { transform: rotate(-7deg) translateY(6mm); }
.cover .row .phone:nth-child(2) { transform: translateY(-12mm); width: 66mm; }
.cover .row .phone:nth-child(3) { transform: rotate(7deg) translateY(6mm); }
.cover .art { position: absolute; left: 0; bottom: 0; width: 210mm; height: 122.5mm; display: block; }
.cover .stripe { position: absolute; left: 0; right: 0; bottom: 0; height: 7mm; background: repeating-linear-gradient(90deg, var(--c) 0 9mm, #000 9mm 18mm); }

/* process / license */
.proc { margin-top: 6mm; position: relative; }
.proc:before { content: ""; position: absolute; left: 14.5mm; top: 12mm; bottom: 12mm; width: 0; border-left: 1px solid color-mix(in srgb, var(--c) 40%, transparent); }
.st { position: relative; display: grid; grid-template-columns: 22mm 1fr auto; gap: 4mm; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 5mm; padding: 5mm 6mm 5mm 5mm; margin-top: 4mm; }
.st .nn { width: 20mm; height: 20mm; border-radius: 50%; background: var(--c); color: #04101a; font-family: "BC"; font-weight: 800; font-size: 30pt; display: grid; place-items: center; box-shadow: 0 0 0 2mm color-mix(in srgb, var(--c) 22%, transparent); }
.st h3 { font-weight: 800; font-size: 22pt; line-height: 1; }
.st p { color: var(--muted); font-size: 9.6pt; margin-top: 1.4mm; max-width: 98mm; line-height: 1.38; }
.st .tg { text-align: right; }
.st .tg b { display: block; font-family: "BC"; font-weight: 800; font-size: 24pt; color: var(--c); line-height: 1; text-transform: uppercase; }
.st .tg span { color: var(--muted); font-size: 8.6pt; }
.big { border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); background: linear-gradient(180deg, color-mix(in srgb, var(--c) 10%, #05080c), #05080c); border-radius: 6mm; padding: 7mm 8mm; margin-top: 5mm; }
.big h3 { font-weight: 800; font-size: 18pt; color: var(--c); }
.big .v { font-family: "BC"; font-weight: 800; font-size: 52pt; line-height: 1; margin-top: 1mm; }
.big .s { color: var(--muted); font-size: 10pt; margin-top: 1mm; }
.cta { margin-top: 5mm; border: 1px solid color-mix(in srgb, var(--c) 55%, transparent); border-radius: 6mm; padding: 7mm; text-align: center; background: #05080c; }
.cta .lg { display: flex; justify-content: center; align-items: center; gap: 6mm; }
.cta .lg .ds { height: 16mm; }
.cta h3 { font-weight: 800; font-size: 28pt; margin-top: 4mm; }
.cta p { color: var(--muted); margin-top: 1mm; }
.cta .pill { display: inline-block; margin-top: 4mm; padding: 2.4mm 8mm; border-radius: 99px; background: var(--c); color: #04101a; font-family: "BC"; font-weight: 800; font-size: 15pt; text-transform: uppercase; }
`;

// -------------------------------------------------------------- helpers
function head(g, n, kick, title, lead) {
  return `<div class="hdr"><div class="l">${ring(g, 15)}<span class="t">Sistema Stayflow <b>${esc(g.name)}</b></span></div>${DS()}</div><div class="dash"></div>`
    + (kick ? `<div class="kick">${esc(kick)}</div>` : "") + (title ? `<h1 class="pt">${esc(title)}</h1>` : "") + (lead ? `<p class="lead">${esc(lead)}</p>` : "");
}
const shell = (g, n, inner, cls = "") => `<section class="page ${cls}"><div class="in">${inner}</div><div class="ftr"><span>Capturas con datos de ejemplo · Stayflow ${esc(g.name)}</span><b>${n}</b></div></section>`;

function marksFor(imgName, step) {
  const found = (ANN[imgName] || []).filter((a) => step.marks && step.marks[a.n - 1]);
  const badges = found.map((a, i) => `<span class="bd" style="left:${(a.x * 100).toFixed(2)}%;top:${((a.y + a.h / 2) * 100).toFixed(2)}%">${i + 1}</span>`).join("");
  const legend = found.map((a, i) => [i + 1, ...step.marks[a.n - 1]]);
  return { badges, legend };
}
const legendHtml = (items, one = false) => `<div class="leg${one ? " one" : ""}">${items.map(([n, t, d]) => `<div class="it"><div class="n">${n}</div><div><h4>${esc(t)}</h4><p>${esc(d)}</p></div></div>`).join("")}</div>`;
const win = (g, name, url, badges = "") => `<div class="win"><div class="bar"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i><span class="u">${esc(url)}</span></div><div class="view"><img src="${img(name)}"/>${badges}</div></div>`;
const phone = (name) => `<div class="phone"><img src="${img(name)}"/></div>`;
function boxHtml(b) {
  if (!b) return "";
  if (b.type === "note") return `<div class="note"><b>${esc(b.title)}</b> ${esc(b.text)}</div>`;
  return `<div class="box"><h3>${esc(b.title)}</h3><ul>${b.items.map((i) => `<li>${tick}<span>${esc(i)}</span></li>`).join("")}</ul></div>`;
}

// -------------------------------------------------------------- pages
function cover(g, art) {
  const longest = Math.max(...g.cover.lines.map((l) => l.length));
  const pt = Math.min(74, Math.floor(1130 / longest));
  return `<section class="page cover"><div class="top">${ring(g, 22)}${DS()}</div>
    <div class="txt"><div class="k">GUÍA DE USO PASO A PASO</div>
      <h1 style="font-size:${pt}pt">${g.cover.lines.map(esc).join("<br>")}</h1>
      <div class="brand">STAYFLOW ${esc(g.name.toUpperCase())}</div>
      <p class="sub">${esc(g.cover.sub)}</p></div>
    <img class="art" src="${art}"/><div class="stripe"></div></section>`;
}

function flow(g, n) {
  return shell(g, n, `${head(g, n, null, "ASÍ FUNCIONA TODO", g.flow.lead)}
    <div class="mom">${g.flow.moments.map((m) => `<div class="card"><div class="ic">${ico(m[0], 24)}</div><h3>${esc(m[1])}</h3><p>${esc(m[2])}</p></div>`).join("")}</div>
    <div class="imgs">${g.flow.cards.map((c) => `<div class="card"><div class="ph"><img src="${img(c[0])}"/></div><div class="tx"><h3>${esc(c[1])}</h3><p>${esc(c[2])}</p></div></div>`).join("")}</div>
    <div class="note"><b>Importante:</b> ${esc(g.flow.important)}</div>`);
}

function before(g, n) {
  const name = `activar-${g.app}`;
  const a = (ANN[name] || []);
  const texts = [["TU CÓDIGO", "Está en el correo de tu compra y empieza con SF-."], ["ACTIVAR", "Se activa al instante y no vence."], ["¿NO TIENES CÓDIGO?", "Este enlace te lleva a la página del producto."]];
  const badges = a.map((m, i) => `<span class="bd" style="left:${(m.x * 100).toFixed(2)}%;top:${((m.y + m.h / 2) * 100).toFixed(2)}%">${i + 1}</span>`).join("");
  const steps = ["Abre el enlace de tu app (te lo enviamos con tu compra).", "Crea tu cuenta: nombre, correo (dos veces) y contraseña.", "Escribe el nombre de tu alojamiento y elige tu moneda.", "Pega tu código de licencia y pulsa “Activar”.", "Agrega tu primera propiedad con nombre, ciudad y foto.", "Instálala como app (mira el recuadro de la derecha)."];
  return shell(g, n, `${head(g, n, "ANTES DE EMPEZAR", "ENTRA Y ACTIVA TU CÓDIGO", `Un código de licencia por compra. Se pega una sola vez y no vence.`)}
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:6mm;margin-top:5mm;align-items:start">
      <div>${win(g, name, g.url.replace("https://", ""), badges)}</div>
      <div>${legendHtml(texts.map((t, i) => [i + 1, ...t]), true)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:5mm;margin-top:2mm">
      <div class="box"><h3>CÓMO ENTRAR</h3><div style="margin-top:2.6mm;display:grid;gap:2mm">${steps.map((t, i) => `<div style="display:grid;grid-template-columns:6.4mm 1fr;gap:2.6mm;align-items:start;font-size:9.6pt;color:#D7DDE5;line-height:1.35"><span class="n" style="width:6mm;height:6mm;border-radius:50%;background:var(--c);color:#04101a;font-family:BC;font-weight:800;font-size:11pt;display:grid;place-items:center">${i + 1}</span><span>${esc(t)}</span></div>`).join("")}</div></div>
      <div class="box"><h3>INSTÁLALA COMO APP</h3><div style="margin-top:2.4mm;font-size:9.4pt;color:#D7DDE5;display:grid;gap:2.2mm;line-height:1.35">
        <div><b style="color:var(--c)">Chrome o Edge:</b> pulsa el ícono de instalar, al final de la barra de direcciones.</div>
        <div><b style="color:var(--c)">Mac · Safari:</b> menú Archivo → “Añadir al Dock”.</div>
        <div><b style="color:var(--c)">Android:</b> menú ⋮ → “Instalar app”.</div>
        <div><b style="color:var(--c)">iPhone:</b> compartir → “Añadir a pantalla de inicio”.</div>
        <div style="color:var(--muted)">Es la misma app y los mismos datos: una cuenta para todo Stayflow.</div></div></div>
    </div>`);
}

function step(g, s, n) {
  const m = marksFor(s.img, s);
  const legend = s.legend ? s.legend.map((l, i) => [i + 1, ...l]) : m.legend;
  const phoneShot = s.img.startsWith("m-");
  const view = phoneShot ? `<div style="width:62mm;margin:5mm auto 0">${phone(s.img)}</div>` : `<div style="width:148mm;margin:0 auto">${win(g, s.img, g.url.replace("https://", ""), m.badges)}</div>`;
  return shell(g, n, `${head(g, n, s.kicker, s.title, s.lead)}<div style="margin-top:5mm">${view}</div>${legendHtml(legend)}${boxHtml(s.box)}`);
}

function phones(g, n) {
  const p = g.phones;
  return shell(g, n, `${head(g, n, p.kicker, p.title, p.lead)}
    <div class="ph3">${p.imgs.map((im, i) => `<div>${phone(im)}<div class="cap"><h4>${esc(p.captions[i][0])}</h4><p>${esc(p.captions[i][1])}</p></div></div>`).join("")}</div>
    <div class="note" style="margin-top:7mm"><b>Cómo instalarla:</b> abre tu enlace en el celular y elige “Instalar app” o “Añadir a pantalla de inicio”. Se abre como cualquier aplicación.</div>`);
}

function phoneBig(g, n) {
  const p = g.phoneBig;
  return shell(g, n, `${head(g, n, p.kicker, p.title, p.lead)}
    <div style="display:grid;grid-template-columns:78mm 1fr;gap:9mm;margin-top:6mm;align-items:start">
      <div>${phone(p.img)}</div>
      <div>${legendHtml(p.legend.map((l, i) => [i + 1, ...l]), true)}${boxHtml(p.box)}</div>
    </div>`);
}

function routine(g, n) {
  const r = g.routine;
  return shell(g, n, `${head(g, n, null, "TU RUTINA DIARIA", "Cuatro hábitos y el sistema trabaja por ti.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:6mm">${r.cards.map((c) => `<div class="box col1" style="margin-top:0"><h3>${esc(c[0])}</h3><ul>${c[1].map((i) => `<li>${tick}<span>${esc(i)}</span></li>`).join("")}</ul></div>`).join("")}</div>
    <div style="display:grid;grid-template-columns:50mm 1fr;gap:6mm;margin-top:3mm;align-items:start">
      ${phone(r.phone)}
      <div><div class="box" style="margin-top:0"><h3>${esc(r.phoneTitle)}</h3><p style="color:var(--muted);font-size:9.8pt;margin-top:1.4mm">${esc(r.phoneText)}</p></div>
      <div class="box"><h3>TODO INCLUIDO</h3><ul style="grid-template-columns:1fr">${r.included.map((i) => `<li>${tick}<span>${esc(i)}</span></li>`).join("")}</ul></div></div>
    </div>`);
}

function procPage(g, n) {
  const rows = [
    ["COMPRAS", "Eliges tu app (o un pack) y recibes tu código de licencia por correo.", "TU CÓDIGO", "por correo"],
    ["CREAS TU CUENTA", "Con tu correo y una contraseña. Entras directo, sin esperar confirmaciones.", "2 MIN", "una sola vez"],
    ["ACTIVAS", `Pegas tu código en Stayflow ${g.name}: se activa al instante y no vence.`, "AL INSTANTE", "sin vencimiento"],
    ["CARGAS TU PRIMERA PROPIEDAD", "Con esta guía en la mano. Puedes explorar primero con datos de ejemplo.", "10 MIN", "con esta guía"],
    ["ÉL TRABAJA PARA TI", "Desde ese día, tu alquiler más ordenado y menos cosas en la cabeza.", "A DIARIO", "sin esfuerzo"],
  ];
  rows[4][0] = "STAYFLOW TRABAJA PARA TI";
  return shell(g, n, `${head(g, n, "EL PROCEDIMIENTO", "ASÍ EMPEZAMOS", "Cinco pasos, sin sorpresas.")}
    <div class="proc">${rows.map((r, i) => `<div class="st"><div class="nn">${i + 1}</div><div><h3>${esc(r[0])}</h3><p>${esc(r[1])}</p></div><div class="tg"><b>${esc(r[2])}</b><span>${esc(r[3])}</span></div></div>`).join("")}</div>
    <div class="note" style="margin-top:6mm"><b>En resumen:</b> compras una vez, activas con tu código y empiezas hoy. Sin mensualidades obligatorias.</div>`);
}

function license(g, n) {
  return shell(g, n, `${head(g, n, "TU LICENCIA", "TU SISTEMA, TUS REGLAS", "Un pago único. Esto es lo que incluye.")}
    <div class="big"><h3>STAYFLOW ${esc(g.name.toUpperCase())} · PAGO ÚNICO</h3>
      <ul style="list-style:none;margin-top:3mm;display:grid;grid-template-columns:1fr 1fr;gap:2.2mm 6mm">
        ${["Licencia sin vencimiento", "12 meses de actualizaciones incluidas", "Garantía de reembolso de 14 días", "Una cuenta para todo Stayflow", "Tus datos, solo tuyos", "Instalable en celular y computadora"].map((i) => `<li style="display:grid;grid-template-columns:5mm 1fr;gap:2mm;font-size:10.6pt">${tick.replace("tk", "tk")}<span>${esc(i)}</span></li>`).join("")}
      </ul></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm">
      <div class="box"><h3>ACTUALIZACIONES</h3><p style="color:var(--muted);font-size:9.8pt;margin-top:1.4mm">Incluyes 12 meses de mejoras. Pasado ese tiempo la app sigue funcionando igual; renovar las mejoras es opcional, cuando tú quieras, por USD 10 al año.</p></div>
      <div class="box"><h3>SUMA OTRAS APPS</h3><p style="color:var(--muted);font-size:9.8pt;margin-top:1.4mm">Desde la segunda app, 30% de descuento. Host, Guest, Business y Operations usan la misma cuenta y se conectan entre sí.</p></div>
    </div>
    <div class="cta"><div class="lg">${ring(g, 20)}<span style="font-size:20pt;color:var(--muted)">×</span>${DS()}</div>
      <h3>¿NECESITAS AYUDA PARA EMPEZAR?</h3><p>Estamos contigo más allá de la compra.</p><span class="pill">${esc(CONTACT)}</span></div>`);
}

function html(g, art) {
  const c = MAIN[g.id];
  let n = 1;
  const pages = [cover(g, art)];
  pages.push(flow(g, ++n));
  pages.push(before(g, ++n));
  for (const s of g.steps) pages.push(step(g, s, ++n));
  if (g.phoneBig) pages.push(phoneBig(g, ++n));
  if (g.phones) pages.push(phones(g, ++n));
  pages.push(routine(g, ++n));
  pages.push(procPage(g, ++n));
  pages.push(license(g, ++n));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Stayflow ${g.name} · Guía de uso paso a paso</title><style>${CSS(c)}</style></head><body>${pages.join("")}</body></html>`;
}

async function makeArt(browser, g) {
  const c = MAIN[g.id];
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS(c)} html,body{background:transparent} .page:before{display:none} .page{background:transparent}</style></head><body><section class="page cover"><div class="row">${g.cover.phones.map(phone).join("")}</div></section></body></html>`;
  const f = path.join(OUT, `art-${g.id}.html`);
  fs.writeFileSync(f, doc);
  const pg = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await pg.goto("file://" + f, { waitUntil: "load" });
  await pg.waitForTimeout(500);
  const out = path.join(OUT, `art-${g.id}.png`);
  await pg.screenshot({ path: out, clip: { x: 0, y: 660, width: 794, height: 463 }, omitBackground: true });
  await pg.close();
  return "file://" + out;
}

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch();
  for (const g of guides) {
    if (only && only !== g.id) continue;
    const file = path.join(OUT, `Guia-Stayflow-${g.name}.html`);
    const art = await makeArt(browser, g);
    fs.writeFileSync(file, html(g, art));
    const page = await browser.newPage();
    await page.goto("file://" + file, { waitUntil: "load" });
    await page.waitForTimeout(700);
    const bad = await page.evaluate(() => [...document.querySelectorAll(".page")].map((pg, i) => {
      const top = pg.getBoundingClientRect().top;
      const last = [...pg.querySelectorAll(".in > *")].pop();
      const bottom = last ? last.getBoundingClientRect().bottom - top : 0;
      return pg.classList.contains("cover") ? null : (bottom > 1123 - 52 ? `p${i + 1}:+${Math.round((bottom - (1123 - 52)) / 3.78)}mm` : null);
    }).filter(Boolean));
    if (bad.length) console.log("  DESBORDE", g.name, bad.join(" "));
    await page.pdf({ path: path.join(OUT, `Guia-Stayflow-${g.name}.pdf`), format: "A4", printBackground: true, preferCSSPageSize: true });
    await page.close();
    console.log("ok", g.name);
  }
  await browser.close();
})();
