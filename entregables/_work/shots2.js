// Captures + measured annotation anchors for the customer guides. Test account only; customer-facing text is sanitized.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/shots2';
fs.mkdirSync(OUT, { recursive: true });
const env = process.env;
const proxy = { server: env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' };
const VW = 1360, VH = 1020;
const A = { host: 'http://localhost:3003', profit: 'http://localhost:3001', guest: 'http://localhost:3002', operations: 'http://localhost:3004' };
const annotations = {};

const clean = () => {
  const hosts = { 3001: 'https://stayflow-profit.vercel.app', 3002: 'https://stayflow-guest.vercel.app', 3003: 'https://stayflow-host.vercel.app', 3004: 'https://stayflow-operations.vercel.app' };
  const fix = (t) => t
    .replace(/http:\/\/localhost:(\d{4})/g, (m, p) => hosts[p] || m)
    .replace(/e2e-[a-z]+(-\d+)?@test\.invalid/g, 'lucia@ejemplo.com')
    .replace(/Lucía Prueba/g, 'Lucía Ramos').replace(/Rosa Prueba/g, 'Rosa Méndez').replace(/Marta Prueba/g, 'Lucía Ramos')
    .replace(/Limpieza profunda E2E/g, 'Limpieza profunda').replace(/Lista E2E/g, 'Limpieza estándar')
    .replace(/^\s*Paso uno\s*$/, 'Ventilar y abrir ventanas').replace(/^\s*Paso dos\s*$/, 'Cambiar sábanas y toallas')
    .replace(/^\s*(LP|MP)\s*$/, 'LR').replace(/^\s*RP\s*$/, 'RM')
    .replace(/\/t\/[0-9a-f-]{36}/g, '/t/9f3c21ab-4d7e-48c1-b2a6-0d5e8f31c7a9')
    .replace(/\/api\/ical\/[0-9a-f-]{36}/g, '/api/ical/4ac3d1e8-7b52-49f0-a1c6-3e9d20b7f518');
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
  document.querySelectorAll('input,textarea').forEach((el) => { const v = fix(el.value || ''); if (v !== el.value) el.value = v; });
};

const SPECS = {
  'host-panel': [(p) => p.getByText('Tu día', { exact: true }).first(), (p) => p.getByText('Ocupación del mes').first(), (p) => p.getByText(/Por cobrar en total/).first(), (p) => p.getByText('Agenda', { exact: true }).first(), (p) => p.locator('aside nav a', { hasText: 'Cronograma' }).first()],
  'host-calendario': [(p) => p.getByText('Ocupación del mes').first(), (p) => p.getByText(/de 2026/).first(), (p) => p.getByRole('button', { name: 'Bloquear fechas' }).first(), (p) => p.getByText(/Cambio de huéspedes/).first(), (p) => p.locator('[aria-label*=": libre"]').nth(40)],
  'host-reservas': [(p) => p.getByText('Nueva reserva', { exact: true }).first(), (p) => p.getByRole('button', { name: 'Próximas' }).first(), (p) => p.getByRole('button', { name: 'Registrar llegada' }).first(), (p) => p.getByRole('button', { name: 'Registrar cobro' }).first(), (p) => p.getByText('Sin cobrar').first()],
  'host-mensajes': [(p) => p.getByText('Reserva', { exact: true }).first(), (p) => p.getByRole('button', { name: 'Bienvenida' }).first(), (p) => p.getByText('Así lo recibe').first(), (p) => p.getByRole('button', { name: 'Copiar' }).first(), (p) => p.getByRole('button', { name: 'Editar plantilla' }).first()],
  'host-reportes': [(p) => p.getByText('Reporte mensual').first(), (p) => p.getByRole('button', { name: /Imprimir/ }).first(), (p) => p.getByText('Ocupación', { exact: true }).first(), (p) => p.getByText('Por cobrar', { exact: true }).first(), (p) => p.getByText('Total', { exact: true }).first()],
  'host-importar': [(p) => p.getByText('Elegir archivo CSV').first(), (p) => p.getByText('Traer reservas desde').first(), (p) => p.getByText('Sincronizar ahora').first(), (p) => p.getByText('Tu enlace para otras plataformas').first(), (p) => p.getByText('Copiar enlace').first()],
  'host-tareas': [(p) => p.getByText('Nueva tarea', { exact: true }).first(), (p) => p.getByText(/Pendientes/).first(), (p) => p.locator('input[type=checkbox]').first(), (p) => p.getByText(/Vencida/).first(), (p) => p.getByRole('button', { name: 'Agregar tarea' }).first()],
  'profit-resumen': [(p) => p.getByRole('button', { name: 'Este año' }).first(), (p) => p.getByText('Ganancia neta').first(), (p) => p.getByText(/vs\. anterior/).first(), (p) => p.getByText('Rendimiento por propiedad').first(), (p) => p.getByText(/de margen/).first()],
  'profit-movimientos': [(p) => p.getByRole('button', { name: 'Ingreso' }).first(), (p) => p.getByText(/Importe/).first(), (p) => p.getByRole('button', { name: 'Agregar ingreso' }).first(), (p) => p.getByText('Movimientos recientes').first(), (p) => p.getByRole('button', { name: /Descargar para Excel/ }).first()],
  'profit-fijos': [(p) => p.getByText('Gastos fijos', { exact: true }).first(), (p) => p.getByText('Propiedad', { exact: true }).first(), (p) => p.getByText('Día del mes').first(), (p) => p.getByRole('button', { name: 'Agregar gasto fijo' }).first(), (p) => p.getByText('Tus gastos fijos').first()],
  'profit-calculadora': [(p) => p.getByText('Costos fijos al mes').first(), (p) => p.getByText(/Comisión plataforma/).first(), (p) => p.getByText('Ganancia deseada al mes').first(), (p) => p.getByText('Precio mínimo por noche').first(), (p) => p.getByText('Noches para no perder').first()],
  'operations-hoy': [(p) => p.getByText('Atrasados').first(), (p) => p.getByText('Entrada el mismo día').first(), (p) => p.getByText(/Limpieza tras/).first(), (p) => p.getByText('Sin asignar').first(), (p) => p.getByRole('button', { name: /Nuevo trabajo/ }).first()],
  'operations-trabajos': [(p) => p.getByText('Nuevo trabajo', { exact: true }).first(), (p) => p.getByText('Lista de pasos (uno por línea)').first(), (p) => p.getByRole('button', { name: 'Abiertos' }).first(), (p) => p.getByText(/Limpieza tras/).first(), (p) => p.getByText('Asignar a').first()],
  'operations-checklists': [(p) => p.getByText('Nueva lista').first(), (p) => p.getByText('Lista de pasos (uno por línea)').first(), (p) => p.getByRole('button', { name: 'Guardar lista' }).first(), (p) => p.getByText('Limpieza estándar').first(), (p) => p.getByText('Se usa en').first()],
  'operations-equipo': [(p) => p.getByText('Sumar a alguien al equipo').first(), (p) => p.getByText('Teléfono (con código de país)').first(), (p) => p.getByRole('button', { name: 'Agregar persona' }).first(), (p) => p.getByRole('button', { name: 'Copiar enlace' }).first(), (p) => p.getByRole('button', { name: 'Desactivar' }).first()],
  'operations-mantenimiento': [(p) => p.getByText('Mantenimiento que se repite').first(), (p) => p.getByText('Cada (días)').first(), (p) => p.getByText('Primera vez').first(), (p) => p.getByRole('button', { name: 'Agregar', exact: true }).first(), (p) => p.getByText('Nada programado').first()],
  'guest-inicio': [(p) => p.getByText('Guías digitales').first(), (p) => p.getByRole('button', { name: 'Crear guía' }).first(), (p) => p.getByText('Publicada').first(), (p) => p.getByRole('button', { name: 'Editar' }).first()],
  'guest-editor': [(p) => p.getByText(/100% completa/).first(), (p) => p.getByText('Publicación', { exact: true }).first(), (p) => p.getByText('Enlace y código QR').first(), (p) => p.getByRole('button', { name: 'Copiar enlace' }).first(), (p) => p.getByText('Descargar QR (PNG)').first()],
};

async function measure(page, name) {
  const specs = SPECS[name]; if (!specs) return;
  const out = [];
  for (let i = 0; i < specs.length; i++) {
    try {
      const loc = specs[i](page);
      const box = await loc.boundingBox({ timeout: 2500 });
      if (box && box.y >= 0 && box.y < VH - 8 && box.x >= 0 && box.x < VW) out.push({ n: i + 1, x: box.x / VW, y: box.y / VH, w: box.width / VW, h: box.height / VH });
      else console.log('  (fuera de vista)', name, i + 1);
    } catch { console.log('  (no encontrado)', name, i + 1); }
  }
  annotations[name] = out;
}

(async () => {
  const browser = await chromium.launch({ proxy });
  const desk = () => browser.newContext({ locale: 'es-ES', viewport: { width: VW, height: VH }, deviceScaleFactor: 1.5, proxy });
  const mob = () => browser.newContext({ locale: 'es-ES', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, proxy });
  const login = async (page, base, email, pass) => {
    await page.goto(base);
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(pass);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  };
  const shoot = async (page, base, path, name, { measureIt = true, wait = 2300 } = {}) => {
    await page.goto(base + path);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(wait);
    await page.evaluate(clean);
    if (measureIt) await measure(page, name);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log('ok', name);
  };

  // ---- desktop, account with every license
  const routes = {
    host: [['/', 'panel'], ['/calendar', 'calendario'], ['/bookings', 'reservas'], ['/messages', 'mensajes'], ['/reports', 'reportes'], ['/sync', 'importar'], ['/tasks', 'tareas']],
    profit: [['/', 'resumen'], ['/entries', 'movimientos'], ['/fixed', 'fijos'], ['/calculator', 'calculadora']],
    operations: [['/', 'hoy'], ['/jobs', 'trabajos'], ['/checklists', 'checklists'], ['/team', 'equipo'], ['/maintenance', 'mantenimiento']],
    guest: [['/', 'inicio'], ['/guide/' + env.PROP_ID, 'editor']],
  };
  for (const app of Object.keys(routes)) {
    const page = await (await desk()).newPage();
    await login(page, A[app], env.E2E_USER, env.E2E_PASS);
    await page.locator('aside nav').first().waitFor({ timeout: 40000 });
    await page.waitForTimeout(1200);
    for (const [path, n] of routes[app]) {
      if (app === 'profit' && n === 'resumen') {
        await page.goto(A[app] + path); await page.waitForLoadState('networkidle').catch(() => {});
        await page.getByRole('button', { name: 'Este año' }).click(); await page.waitForTimeout(2200);
        await page.evaluate(clean); await measure(page, 'profit-resumen'); await page.screenshot({ path: `${OUT}/profit-resumen.png` }); console.log('ok profit-resumen');
      } else await shoot(page, A[app], path, `${app}-${n}`);
    }
    await page.context().close();
  }

  // ---- guest editor, scrolled sections
  {
    const page = await (await desk()).newPage();
    await login(page, A.guest, env.E2E_USER, env.E2E_PASS);
    await page.locator('aside nav').first().waitFor({ timeout: 40000 });
    await page.goto(A.guest + '/guide/' + env.PROP_ID); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2200);
    await page.evaluate(clean);
    await page.evaluate(() => window.scrollTo(0, 780)); await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/guest-contenido.png` }); console.log('ok guest-contenido');
    const h = page.getByText('Tu guía en otros idiomas').first();
    await h.scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -60)); await page.waitForTimeout(700);
    const specs = [(q) => q.getByRole('tab', { name: /English/ }).first(), (q) => q.getByRole('tab', { name: /Portugu/ }).first(), (q) => q.locator('textarea').first(), (q) => q.getByRole('button', { name: 'Guardar', exact: true }).last()];
    const out = [];
    for (let i = 0; i < specs.length; i++) { try { const b = await specs[i](page).boundingBox({ timeout: 2500 }); if (b && b.y > 0 && b.y < VH - 8) out.push({ n: i + 1, x: b.x / VW, y: b.y / VH, w: b.width / VW, h: b.height / VH }); } catch {} }
    annotations['guest-idiomas'] = out;
    await page.screenshot({ path: `${OUT}/guest-idiomas.png` }); console.log('ok guest-idiomas');
    await page.getByText('Qué hacer y dónde comer').first().scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/guest-lugares.png` }); console.log('ok guest-lugares');
    await page.context().close();
  }

  // ---- phones (cover + mobile views)
  const mobRoutes = {
    host: [['/', 'panel'], ['/bookings', 'reservas'], ['/messages', 'mensajes'], ['/calendar', 'calendario']],
    profit: [['/', 'resumen'], ['/entries', 'movimientos'], ['/calculator', 'calculadora']],
    operations: [['/', 'hoy'], ['/jobs', 'trabajos']],
    guest: [['/', 'inicio'], ['/guide/' + env.PROP_ID, 'editor']],
  };
  for (const app of Object.keys(mobRoutes)) {
    const page = await (await mob()).newPage();
    await login(page, A[app], env.E2E_USER, env.E2E_PASS);
    await page.waitForTimeout(3500);
    for (const [path, n] of mobRoutes[app]) await shoot(page, A[app], path, `m-${app}-${n}`, { measureIt: false });
    await page.context().close();
  }
  let p = await (await mob()).newPage();
  await shoot(p, A.operations, `/t/${env.STAFF_TOKEN}`, 'm-operations-equipo', { measureIt: false });
  await shoot(p, A.guest, `/g/${env.GUIDE_SLUG}?lang=es`, 'm-guest-guia-es', { measureIt: false });
  await shoot(p, A.guest, `/g/${env.GUIDE_SLUG}?lang=en`, 'm-guest-guia-en', { measureIt: false });
  await p.context().close();

  // ---- activation screens: a brand new account with no license
  const email = `e2e-shot-${Date.now()}@test.invalid`;
  const page = await (await desk()).newPage();
  await page.goto(A.host);
  await page.getByRole('button', { name: /Crea tu cuenta/ }).click();
  await page.getByLabel('Nombre').fill('Lucía Ramos');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Repite tu correo').fill(email);
  await page.getByLabel('Contraseña').fill(env.E2E_PASS);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByText('Configuremos tu negocio.').waitFor({ timeout: 30000 });
  await page.getByRole('textbox').first().fill('Alojamientos Lucía');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText(/Activa Stayflow/).waitFor({ timeout: 30000 });
  for (const app of Object.keys(A)) {
    const pg = await (await browser.newContext({ locale: 'es-ES', viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2, proxy })).newPage();
    await login(pg, A[app], email, env.E2E_PASS);
    await pg.getByText(/Activa Stayflow/).waitFor({ timeout: 40000 });
    await pg.waitForTimeout(2600);
    await pg.evaluate(clean);
    const specs = [(q) => q.getByLabel('Código de licencia'), (q) => q.getByRole('button', { name: 'Activar', exact: true }), (q) => q.getByText(/Consigue/).first()];
    const out = [];
    for (let i = 0; i < specs.length; i++) { try { const b = await specs[i](pg).boundingBox({ timeout: 2500 }); if (b) out.push({ n: i + 1, x: b.x / 1000, y: b.y / 900, w: b.width / 1000, h: b.height / 900 }); } catch {} }
    annotations[`activar-${app}`] = out;
    await pg.screenshot({ path: `${OUT}/activar-${app}.png` });
    console.log('ok activar-' + app);
    await pg.context().close();
  }
  fs.writeFileSync(`${OUT}/annotations.json`, JSON.stringify(annotations, null, 1));
  await browser.close();
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); process.exit(1); });
