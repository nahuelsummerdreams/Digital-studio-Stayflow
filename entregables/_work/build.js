// Genera un PDF de cliente por app: portada, bienvenida, instalación, primeros pasos, pantallas, rutinas, FAQ y cierre.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { guides } = require("./content");

const ROOT = __dirname;
const SHOTS = path.join(ROOT, "shots");
const OUT = path.join(ROOT, "pdf");
fs.mkdirSync(OUT, { recursive: true });
const DS_PATH = fs.readFileSync(path.join(ROOT, "ds-logo-path.txt"), "utf8");
const DS = (cls = "") => `<svg class="ds ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2160 816" role="img" aria-label="Digital Studio"><path fill="currentColor" fill-rule="evenodd" d="${DS_PATH}"/></svg>`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const img = (name) => "file://" + path.join(SHOTS, name + ".png");
const VERSION = "Noviembre 2026";

const mark = (a, size = 64) => `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="g${size}${a[0].slice(1)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a[0]}"/><stop offset="1" stop-color="${a[1]}"/></linearGradient></defs>
  <rect width="64" height="64" rx="17" fill="url(#g${size}${a[0].slice(1)})"/>
  <path d="M10 41c7 0 7-16 16-16s9 16 16 16 7-16 12-16" transform="translate(-1 -1)" fill="none" stroke="#fff" stroke-width="6.4" stroke-linecap="round"/>
</svg>`;

const CSS = (a) => `
@page { size: A4; margin: 0; }
:root { --a1:${a[0]}; --a2:${a[1]}; --ink:#0B1020; --muted:#5A6479; --line:#E4E8F1; --soft:#F5F7FB; --dark:#060A13; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: var(--ink); font-size: 10.2pt; line-height: 1.55; font-feature-settings: "cv11","ss03"; }
h1,h2,h3,.disp { font-family: "Inter Display", "Inter", sans-serif; letter-spacing: -0.02em; }
.page { position: relative; width: 210mm; height: 297mm; overflow: hidden; page-break-after: always; background: #fff; }
.page:last-child { page-break-after: auto; }
.pad { position: absolute; inset: 0; padding: 22mm 18mm 20mm; display: flex; flex-direction: column; }
.hdr { position: absolute; top: 9mm; left: 18mm; right: 18mm; display: flex; align-items: center; justify-content: space-between; font-size: 7.4pt; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; }
.hdr .l { display: flex; align-items: center; gap: 2.4mm; }
.ftr { position: absolute; bottom: 8mm; left: 18mm; right: 18mm; display: flex; align-items: center; justify-content: space-between; font-size: 7.4pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 3mm; }
.ftr .ds { height: 4.6mm; width: auto; color: var(--ink); opacity: .75; }
.ds { display: inline-block; }
.kick { font-size: 7.8pt; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: var(--a1); }
h2 { font-size: 25pt; line-height: 1.1; margin-top: 2.2mm; }
.lead { font-size: 12pt; color: var(--muted); line-height: 1.6; margin-top: 5mm; }
.chip { display: inline-block; padding: .6mm 2.6mm; border-radius: 99px; font-size: 7.4pt; font-weight: 600; background: color-mix(in srgb, var(--a1) 12%, #fff); color: var(--a1); }

/* cover */
.cover { background: var(--dark); color: #fff; }
.cover .bg { position: absolute; inset: 0; background:
  radial-gradient(60% 42% at 50% 30%, color-mix(in srgb, var(--a1) 55%, transparent), transparent 70%),
  radial-gradient(45% 35% at 85% 92%, color-mix(in srgb, var(--a2) 30%, transparent), transparent 70%),
  radial-gradient(40% 30% at 8% 80%, color-mix(in srgb, var(--a1) 22%, transparent), transparent 70%); }
.cover .grain { position: absolute; inset: 0; opacity: .06; background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 3px 3px; }
.cover .by { position: absolute; top: 16mm; left: 0; right: 0; display: flex; justify-content: center; }
.cover .by span { display: inline-flex; align-items: center; gap: 4mm; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.05); padding: 2.4mm 6mm; border-radius: 99px; font-size: 7pt; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.7); }
.cover .by .ds { height: 6.4mm; color: #fff; }
.cover .logo { position: absolute; top: 62mm; left: 0; right: 0; display: flex; justify-content: center; }
.cover .rings { position: absolute; top: 40mm; left: 50%; width: 110mm; height: 110mm; margin-left: -55mm; }
.cover .tag { position: absolute; top: 165mm; left: 0; right: 0; text-align: center; }
.cover .tag .word { font-size: 46pt; font-weight: 700; line-height: 1; letter-spacing: -.03em; }
.cover .tag .prod { display: inline-block; margin-top: 7mm; padding: 1.6mm 6mm; border-radius: 99px; font-size: 11pt; font-weight: 700; letter-spacing: .42em; text-transform: uppercase; color: var(--a2); border: 1px solid color-mix(in srgb, var(--a2) 50%, transparent); background: color-mix(in srgb, var(--a2) 12%, transparent); }
.cover .sub { margin: 10mm auto 0; max-width: 120mm; font-size: 13pt; line-height: 1.45; color: rgba(255,255,255,.72); }
.cover .guide { position: absolute; bottom: 20mm; left: 0; right: 0; text-align: center; font-size: 8pt; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.55); }
.cover .guide b { display: block; margin-bottom: 2mm; color: #fff; font-size: 12pt; letter-spacing: .24em; }

/* welcome */
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; margin-top: 12mm; }
.card { border: 1px solid var(--line); background: var(--soft); border-radius: 4mm; padding: 6.5mm 6mm; }
.card .n { width: 8mm; height: 8mm; border-radius: 2.4mm; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 9pt; background: linear-gradient(135deg, var(--a1), var(--a2)); }
.card h3 { font-size: 12.4pt; margin-top: 4mm; line-height: 1.2; }
.card p { margin-top: 2mm; color: var(--muted); font-size: 9.8pt; }
.box { margin-top: 11mm; border-radius: 4mm; padding: 8mm; background: var(--dark); color: #fff; position: relative; overflow: hidden; }
.box:before { content:""; position:absolute; inset:0; background: radial-gradient(60% 120% at 100% 0%, color-mix(in srgb, var(--a1) 40%, transparent), transparent 70%); }
.box > * { position: relative; }
.box h3 { font-size: 13.4pt; }
.box p, .box li { color: rgba(255,255,255,.8); font-size: 10pt; margin-top: 1.4mm; }
.box ul { margin-top: 2mm; padding-left: 4.5mm; }
.toc { margin-top: 12mm; columns: 2; column-gap: 10mm; font-size: 10.4pt; }
.toc div { display: flex; justify-content: space-between; border-bottom: 1px dotted #C9D0DF; padding: 2.4mm 0; break-inside: avoid; }
.toc span:last-child { color: var(--muted); }

/* install */
.cols3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; margin-top: 10mm; }
.os { border: 1px solid var(--line); border-radius: 4mm; padding: 6.5mm 6mm; background: #fff; }
.os h3 { font-size: 12pt; color: var(--a1); line-height: 1.25; }
.os ol { margin-top: 3mm; padding-left: 4.6mm; color: var(--ink); font-size: 9.8pt; }
.os li { margin-top: 2.4mm; }
.note { margin-top: 8mm; padding: 5.4mm 6mm; border-left: 1.2mm solid var(--a1); background: var(--soft); border-radius: 0 3mm 3mm 0; color: var(--muted); font-size: 10pt; }
.note b { color: var(--ink); }
.linkbox { margin-top: 9mm; display: flex; align-items: center; gap: 5mm; padding: 6mm 7mm; border-radius: 3mm; background: var(--dark); color: #fff; }
.linkbox .u { font-family: "DejaVu Sans Mono", monospace; font-size: 11pt; color: var(--a2); }

/* steps */
.steps { margin-top: 10mm; position: relative; }
.step { display: grid; grid-template-columns: 13mm 1fr auto; gap: 5mm; align-items: start; padding: 6mm 0; border-bottom: 1px solid var(--line); }
.step:last-child { border-bottom: 0; }
.step .num { width: 13mm; height: 13mm; border-radius: 99px; display: grid; place-items: center; font-weight: 700; color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); font-size: 12.4pt; }
.step h3 { font-size: 12.6pt; line-height: 1.25; }
.step p { color: var(--muted); font-size: 10pt; margin-top: 1.4mm; }
.step .t { font-size: 9pt; color: var(--muted); padding-top: 1mm; white-space: nowrap; }

/* screens */
.shot { margin-top: 6mm; border-radius: 3.4mm; overflow: hidden; border: 1px solid #1B2438; box-shadow: 0 10mm 20mm -8mm rgba(10,16,32,.35); background: #060A13; }
.shot img { display: block; width: 100%; }
.two { display: grid; grid-template-columns: 1.15fr 1fr; gap: 6mm; margin-top: 6mm; }
.two h4, .box h4 { font-size: 7.8pt; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--a1); margin-bottom: 2mm; }
.two ul { padding-left: 4.6mm; font-size: 10pt; }
.two li { margin-top: 2mm; }
.tip { border-radius: 3.4mm; padding: 5.4mm 6mm; background: color-mix(in srgb, var(--a1) 9%, #fff); border: 1px solid color-mix(in srgb, var(--a1) 28%, #fff); font-size: 10pt; }
.tip h4 { color: var(--a1); }
.phones { display: flex; justify-content: center; gap: 9mm; margin-top: 5mm; }
.phone { width: 66mm; border-radius: 8mm; padding: 2mm; background: #0B1020; box-shadow: 0 8mm 16mm -6mm rgba(10,16,32,.45); border: 1px solid #263150; }
.phone img { display: block; width: 100%; border-radius: 6.4mm; }
.phone.big { width: 74mm; }
.side { display: grid; grid-template-columns: 78mm 1fr; gap: 8mm; margin-top: 5mm; align-items: start; }

/* routines */
.rt { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 10mm; }
.rt .card h3 { margin-top: 0; font-size: 12pt; color: var(--a1); }
.rt ul { margin-top: 3mm; padding-left: 4.4mm; font-size: 10pt; }
.rt li { margin-top: 2mm; }
.rt .card { background: #fff; }

/* faq */
.faq { margin-top: 8mm; }
.faq div { padding: 4.6mm 0; border-bottom: 1px solid var(--line); break-inside: avoid; }
.faq h3 { font-size: 11.6pt; }
.faq p { color: var(--muted); font-size: 10pt; margin-top: 1.4mm; }

/* back */
.back { background: var(--dark); color: #fff; }
.back .bg { position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 0%, color-mix(in srgb, var(--a1) 45%, transparent), transparent 70%), radial-gradient(50% 35% at 90% 100%, color-mix(in srgb, var(--a2) 28%, transparent), transparent 70%); }
.back .in { position: absolute; inset: 0; padding: 26mm 20mm 18mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.back h2 { font-size: 24pt; margin-top: 8mm; }
.back .lead { color: rgba(255,255,255,.72); max-width: 128mm; }
.back .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 10mm; width: 100%; text-align: left; }
.back .g { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.05); border-radius: 4mm; padding: 5mm; }
.back .g h3 { font-size: 10.4pt; color: var(--a2); }
.back .g p { margin-top: 1.6mm; font-size: 8.8pt; color: rgba(255,255,255,.75); }
.back .more { margin-top: 8mm; font-size: 8.8pt; color: rgba(255,255,255,.7); max-width: 150mm; }
.back .more b { color: #fff; }
.back .foot { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 3mm; font-size: 7pt; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.55); }
.back .foot .ds { height: 9mm; color: #fff; }
`;

function page(g, n, inner, cls = "") {
  const total = "";
  return `<section class="page ${cls}">
    <div class="hdr"><span class="l">${mark(g.accent, 18)}<span>Stayflow ${esc(g.name)} · Guía de inicio</span></span><span>${esc(VERSION)}</span></div>
    <div class="pad">${inner}</div>
    <div class="ftr"><span>${DS()} </span><span>${n}</span></div>
  </section>`;
}

function cover(g) {
  const a = g.accent;
  return `<section class="page cover">
    <div class="bg"></div><div class="grain"></div>
    <div class="by"><span>Un producto de ${DS()}</span></div>
    <svg class="rings" viewBox="0 0 440 440" aria-hidden="true">
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a[0]}"/><stop offset=".5" stop-color="transparent"/><stop offset="1" stop-color="${a[1]}"/></linearGradient></defs>
      <circle cx="220" cy="180" r="120" fill="none" stroke="url(#rg)" stroke-width="2.4" opacity=".9"/>
      <circle cx="220" cy="180" r="168" fill="none" stroke="url(#rg)" stroke-width="1.6" opacity=".5" transform="rotate(70 220 180)"/>
      <circle cx="220" cy="180" r="205" fill="none" stroke="${a[0]}" stroke-width=".8" opacity=".25" stroke-dasharray="3 9"/>
    </svg>
    <div class="logo">${mark(a, 108)}</div>
    <div class="tag">
      <div class="word disp">Stayflow</div>
      <div class="prod">${esc(g.name)}</div>
      <p class="sub">${esc(g.tagline)}</p>
    </div>
    <div class="guide"><b>Guía de inicio</b>${esc(VERSION)}</div>
  </section>`;
}

function welcome(g, n) {
  const toc = [["Instálalo como app", 3], ["Tus primeros 10 minutos", 4], ...g.screens.map((s, i) => [s.kicker, 5 + i]), ["Rutinas que ahorran tiempo", 5 + g.screens.length], ["Preguntas frecuentes", 6 + g.screens.length]];
  return page(g, n, `
    <div class="kick">Bienvenida</div>
    <h2 class="disp">Gracias por confiar en nosotros</h2>
    <p class="lead">${esc(g.welcome)}</p>
    <div class="cards">${g.benefits.map((b, i) => `<div class="card"><div class="n">${i + 1}</div><h3>${esc(b[0])}</h3><p>${esc(b[1])}</p></div>`).join("")}</div>
    <div class="box"><h3>Cómo usar esta guía</h3>
      <ul><li>Léela en orden la primera vez: en 10 minutos tendrás todo funcionando.</li><li>Después, úsala como consulta: cada pantalla tiene su página.</li><li>Las cajas “Consejo” son trucos que te ahorran tiempo desde el primer día.</li></ul></div>
    <div class="toc">${toc.map((t) => `<div><span>${esc(t[0])}</span><span>${t[1]}</span></div>`).join("")}</div>
  `);
}

function install(g, n) {
  return page(g, n, `
    <div class="kick">Antes de empezar</div>
    <h2 class="disp">Instálalo como app en tu computadora y en tu celular</h2>
    <p class="lead">Stayflow ${esc(g.name)} funciona en el navegador, y puedes instalarlo para abrirlo como cualquier programa: con su ícono, en su propia ventana y sin barras del navegador.</p>
    <div class="linkbox">${mark(g.accent, 30)}<div><div style="font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.6)">Tu dirección</div><div class="u">${esc(g.url)}</div></div></div>
    <div class="cols3">
      <div class="os"><h3>Windows o Mac · Chrome o Edge</h3><ol><li>Abre la dirección de arriba e inicia sesión.</li><li>Mira el extremo derecho de la barra de direcciones: aparece un ícono para <b>instalar</b>.</li><li>Pulsa <b>Instalar</b>.</li><li>Se abre en su propia ventana y queda en tu escritorio o menú de inicio.</li></ol></div>
      <div class="os"><h3>Mac · Safari</h3><ol><li>Abre la dirección e inicia sesión.</li><li>En el menú <b>Archivo</b>, elige <b>Añadir al Dock</b>.</li><li>Confirma el nombre y pulsa <b>Añadir</b>.</li><li>Se abre desde el Dock como una app.</li></ol></div>
      <div class="os"><h3>Celular</h3><ol><li><b>Android (Chrome):</b> menú ⋮ → <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.</li><li><b>iPhone (Safari):</b> botón compartir → <b>Añadir a pantalla de inicio</b>.</li><li>Ábrela desde el ícono nuevo.</li></ol></div>
    </div>
    <div class="note"><b>¿Prefieres no instalar nada?</b> También puedes guardar la dirección en favoritos y entrar desde el navegador. Es la misma app, con los mismos datos, y tu cuenta funciona en todos tus dispositivos.</div>
    <div class="note"><b>Una sola cuenta para todo Stayflow.</b> Si más adelante sumas otra app Stayflow, entras con el mismo correo y contraseña.</div>
  `);
}

function steps(g, n) {
  return page(g, n, `
    <div class="kick">Manos a la obra</div>
    <h2 class="disp">Tus primeros 10 minutos</h2>
    <p class="lead">Seis pasos cortos. Al terminar, ${esc(g.name)} ya está trabajando para ti.</p>
    <div class="steps">${g.steps.map((s, i) => `<div class="step"><div class="num">${i + 1}</div><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div><div class="t">${esc(s[2])}</div></div>`).join("")}</div>
    <div class="note"><b>Tip.</b> ${esc(g.stepsNote)}</div>
  `);
}

function screen(g, s, n) {
  const how = `<div><h4>Cómo se usa</h4><ul>${s.how.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></div>`;
  const tip = `<div class="tip"><h4>Consejo de experto</h4>${esc(s.tip)}</div>`;
  const head = `<div class="kick">${esc(s.kicker)}</div><h2 class="disp" style="font-size:21pt">${esc(s.title)}</h2><p class="lead" style="font-size:10.8pt;margin-top:3.4mm">${esc(s.what)}</p>`;
  if (s.layout === "phones") {
    return page(g, n, `${head}<div class="phones">${s.imgs.map((i) => `<div class="phone"><img src="${img(i)}"/></div>`).join("")}</div><div class="two">${how}${tip}</div>`);
  }
  if (s.layout === "phone") {
    return page(g, n, `${head}<div class="side"><div class="phone big"><img src="${img(s.imgs[0])}"/></div><div>${how}<div style="height:6mm"></div>${tip}</div></div>`);
  }
  return page(g, n, `${head}<div class="shot"><img src="${img(s.img)}"/></div><div class="two">${how}${tip}</div>`);
}

function routines(g, n) {
  return page(g, n, `
    <div class="kick">Hábitos</div>
    <h2 class="disp">Rutinas que ahorran tiempo</h2>
    <p class="lead">No hace falta usar todo todos los días. Estas son las rutinas cortas que más valor dan.</p>
    <div class="rt">${g.routines.map((r) => `<div class="card"><h3>${esc(r[0])}</h3><ul>${r[1].map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>
    <div class="box"><h3>La regla de oro</h3><p>La herramienta solo funciona si los datos están al día. Dos minutos hoy valen más que una hora de arreglos el mes que viene.</p></div>
  `);
}

function faq(g, n) {
  return page(g, n, `
    <div class="kick">Ayuda</div>
    <h2 class="disp">Preguntas frecuentes</h2>
    <div class="faq">${g.faq.map((f) => `<div><h3>${esc(f[0])}</h3><p>${esc(f[1])}</p></div>`).join("")}</div>
  `);
}

function back(g) {
  return `<section class="page back"><div class="bg"></div><div class="in">
    ${mark(g.accent, 52)}
    <h2 class="disp">Estamos contigo, más allá de la compra</h2>
    <p class="lead">Si algo no te queda claro o quieres ayuda para configurarlo, escríbenos: respondiendo al correo con el que recibiste esta guía llegas directo a una persona.</p>
    <div class="grid">
      <div class="g"><h3>Tu compra incluye</h3><p>Acceso a Stayflow ${esc(g.name)}, 12 meses de actualizaciones y garantía de reembolso de 14 días.</p></div>
      <div class="g"><h3>Sin ataduras</h3><p>Es un pago único. Después de los 12 meses la app sigue funcionando; renovar las mejoras es opcional.</p></div>
      <div class="g"><h3>Tus datos son tuyos</h3><p>Cada negocio ve solo lo suyo y puedes eliminar tu cuenta cuando quieras desde “Tu cuenta”.</p></div>
      <div class="g"><h3>Tu dirección</h3><p style="color:${g.accent[1]};font-family:'DejaVu Sans Mono',monospace;font-size:8.6pt">${esc(g.url)}</p></div>
    </div>
    <p class="more"><b>Cuando quieras ir más lejos:</b> ${esc(g.crossSell)}. Todas usan la misma cuenta y se conectan entre sí.</p>
    <div class="foot">Un producto de ${DS()}<span>Stayflow ${esc(g.name)} · ${esc(VERSION)}</span></div>
  </div></section>`;
}

function html(g) {
  let n = 1;
  const pages = [cover(g)];
  n++;
  pages.push(welcome(g, n++));
  pages.push(install(g, n++));
  pages.push(steps(g, n++));
  for (const s of g.screens) pages.push(screen(g, s, n++));
  pages.push(routines(g, n++));
  pages.push(faq(g, n++));
  pages.push(back(g));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Stayflow ${g.name} · Guía de inicio</title><style>${CSS(g.accent)}</style></head><body>${pages.join("")}</body></html>`;
}

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch();
  for (const g of guides) {
    if (only && only !== g.id) continue;
    const file = path.join(OUT, `Guia-Stayflow-${g.name}.html`);
    fs.writeFileSync(file, html(g));
    const page = await browser.newPage();
    await page.goto("file://" + file, { waitUntil: "load" });
    await page.waitForTimeout(500);
    await page.pdf({ path: path.join(OUT, `Guia-Stayflow-${g.name}.pdf`), format: "A4", printBackground: true, preferCSSPageSize: true });
    await page.close();
    console.log("ok", g.name);
  }
  await browser.close();
})();
