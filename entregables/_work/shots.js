// Captures the real screens of the four apps (local copies) for the customer guides. Test account only.
const { chromium } = require('playwright');
const OUT = __dirname + '/shots';
const TOKEN = process.env.STAFF_TOKEN, SLUG = process.env.GUIDE_SLUG, PROP = process.env.PROP_ID;
const proxy = { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' };
(async () => {
  const browser = await chromium.launch({ proxy });
  const ctxD = () => browser.newContext({ locale: 'es-ES', viewport: { width: 1360, height: 1020 }, deviceScaleFactor: 1.5, proxy });
  const login = async (page, base) => {
    await page.goto(base);
    await page.getByLabel('Correo electrónico').fill(process.env.E2E_USER);
    await page.getByLabel('Contraseña').fill(process.env.E2E_PASS);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.locator('aside nav').first().waitFor({ timeout: 40000 });
    await page.waitForTimeout(1500);
  };
  // Customer-facing images: no test e-mail, no localhost, no real private links.
  const clean = () => {
    const hosts = { 3001: 'https://stayflow-profit.vercel.app', 3002: 'https://stayflow-guest.vercel.app', 3003: 'https://stayflow-host.vercel.app', 3004: 'https://stayflow-operations.vercel.app' };
    const fix = (t) => t
      .replace(/http:\/\/localhost:(\d{4})/g, (m, p) => hosts[p] || m)
      .replace(/e2e-vis@test\.invalid/g, 'lucia@ejemplo.com')
      .replace(/Lucía Prueba/g, 'Lucía Ramos').replace(/Rosa Prueba/g, 'Rosa Méndez').replace(/Limpieza profunda E2E/g, 'Limpieza profunda').replace(/Lista E2E/g, 'Limpieza estándar')
      .replace(/^\s*Paso uno\s*$/, 'Ventilar y abrir ventanas').replace(/^\s*Paso dos\s*$/, 'Cambiar sábanas y toallas').replace(/^\s*LP\s*$/, 'LR').replace(/^\s*RP\s*$/, 'RM')
      .replace(/Hola, Rosa\b(?! Méndez)/g, 'Hola, Rosa')
      .replace(/\/t\/[0-9a-f-]{36}/g, '/t/9f3c21ab-4d7e-48c1-b2a6-0d5e8f31c7a9')
      .replace(/\/api\/ical\/[0-9a-f-]{36}/g, '/api/ical/4ac3d1e8-7b52-49f0-a1c6-3e9d20b7f518');
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    document.querySelectorAll('input,textarea').forEach((el) => { const v = fix(el.value || ''); if (v !== el.value) el.value = v; });
  };
  const shot = async (page, base, path, name, wait = 2200) => {
    await page.goto(base + path);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(wait);
    await page.evaluate(clean);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log('ok', name);
  };
  const apps = [
    ['host', 'http://localhost:3003', [['/', 'panel'], ['/calendar', 'calendario'], ['/bookings', 'reservas'], ['/messages', 'mensajes'], ['/reports', 'reportes'], ['/sync', 'importar'], ['/tasks', 'tareas']]],
    ['profit', 'http://localhost:3001', [['/', 'resumen'], ['/entries', 'movimientos'], ['/fixed', 'fijos'], ['/calculator', 'calculadora']]],
    ['operations', 'http://localhost:3004', [['/', 'hoy'], ['/jobs', 'trabajos'], ['/checklists', 'checklists'], ['/team', 'equipo'], ['/maintenance', 'mantenimiento']]],
    ['guest', 'http://localhost:3002', [['/', 'inicio'], ['/guide/' + PROP, 'editor']]],
  ];
  for (const [app, base, routes] of apps) {
    const page = await (await ctxD()).newPage();
    await login(page, base);
    for (const [path, name] of routes) await shot(page, base, path, `${app}-${name}`);
    await page.context().close();
  }
  const mob = () => browser.newContext({ locale: 'es-ES', viewport: { width: 390, height: 820 }, deviceScaleFactor: 2, isMobile: true, proxy });
  let p = await (await mob()).newPage();
  await shot(p, 'http://localhost:3004', `/t/${TOKEN}`, 'operations-equipo-celular');
  await p.context().close();
  p = await (await mob()).newPage();
  await shot(p, 'http://localhost:3002', `/g/${SLUG}?lang=es`, 'guest-guia-es');
  await shot(p, 'http://localhost:3002', `/g/${SLUG}?lang=en`, 'guest-guia-en');
  await browser.close();
})().catch((e) => { console.error('FAIL', e.message.split('\n')[0]); process.exit(1); });
