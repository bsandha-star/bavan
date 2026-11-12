// Browser smoke test for the Huddle marketing site (Playwright + Chromium, no network).
//
//   cd tests && npm ci && npx playwright install chromium && node smoke.mjs
//   Cloud sessions (browser download blocked): PW_CHROMIUM=/opt/pw-browsers/chromium node smoke.mjs
//
// Serves site/ from a local server, then for every page at desktop (1366x900, light theme) and
// phone (412x915, dark theme): no console errors, no uncaught exceptions, no broken local files,
// no sideways scrolling on the phone. Requests to other hosts (Google Fonts) are answered with an
// empty response, so the test never touches the internet.
// On index.html it also checks the mobile menu, the "Work this queue" demo and that the demo form
// never sends anything anywhere (it only shows its thank-you state until an endpoint is wired up).
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain', '.woff2': 'font/woff2' };
const VIEWS = [
  { name: 'desktop', viewport: { width: 1366, height: 900 }, colorScheme: 'light' },
  { name: 'phone', viewport: { width: 412, height: 915 }, colorScheme: 'dark', isMobile: true, hasTouch: true },
];

async function fileFor(urlPath) {
  let p = normalize(join(SITE, decodeURIComponent(urlPath.split('?')[0])));
  if (!p.startsWith(SITE)) return null;
  for (const c of [p, join(p, 'index.html'), p + '.html']) {
    try { if ((await stat(c)).isFile()) return c; } catch {}
  }
  return null;
}

const server = createServer(async (req, res) => {
  const f = await fileFor(req.url);
  if (!f) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(await readFile(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const pages = (await readdir(SITE)).filter((f) => f.endsWith('.html')).sort();
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: process.env.PW_CHROMIUM ? ['--no-sandbox'] : [],
});

const failures = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) failures.push(msg); };

async function openPage(view, file) {
  const context = await browser.newContext({ viewport: view.viewport, colorScheme: view.colorScheme, isMobile: !!view.isMobile, hasTouch: !!view.hasTouch, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const log = { errors: [], external: [], posts: [], all: [] };
  await context.route((url) => !url.href.startsWith(BASE), (route) => {
    log.external.push(route.request().url());
    const type = route.request().resourceType() === 'stylesheet' ? 'text/css' : 'text/plain';
    return route.fulfill({ status: 200, contentType: type, body: '' });
  });
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => log.errors.push(`exception: ${e.message}`));
  page.on('request', (r) => { log.all.push(`${r.method()} ${r.url()}`); if (r.method() !== 'GET') log.posts.push(`${r.method()} ${r.url()}`); });
  page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) log.errors.push(`HTTP ${r.status()} ${r.url().slice(BASE.length)}`); });
  page.on('requestfailed', (r) => log.errors.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
  await page.goto(`${BASE}/${file}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  return { context, page, log };
}

try {
  for (const view of VIEWS) {
    for (const file of pages) {
      const where = `${file} @ ${view.name}`;
      const { context, page, log } = await openPage(view, file);
      check((await page.title()).trim().length > 0, `${where}: empty <title>`);
      if (view.name === 'phone') {
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(over <= 1, `${where}: page is ${over}px wider than the phone screen (sideways scrolling)`);
      }

      if (file === 'index.html') {
        // Mobile menu (phone) — opens, says so to screen readers, closes when a link is used.
        if (view.name === 'phone') {
          const btn = page.locator('#menuBtn');
          check(await btn.isVisible(), `${where}: menu button not visible`);
          await btn.click();
          check((await btn.getAttribute('aria-expanded')) === 'true', `${where}: menu button aria-expanded not true after opening`);
          check(await page.locator('#mobileMenu a').first().isVisible(), `${where}: mobile menu links not visible after opening`);
          await page.locator('#mobileMenu a').first().click();
          check((await page.locator('#mobileMenu').getAttribute('data-open')) === 'false', `${where}: mobile menu stays open after a link is used`);
        }

        // "Work this queue" demo runs without errors.
        const run = page.locator('#runQueue');
        await run.scrollIntoViewIfNeeded();
        await run.click();
        await page.waitForTimeout(500);

        // Demo form: empty submit is refused; filled submit shows the thank-you state and sends nothing.
        const form = page.locator('#demoForm');
        await form.scrollIntoViewIfNeeded();
        await form.locator('button[type="submit"]').click();
        check((await form.getAttribute('data-sent')) === 'false', `${where}: empty demo form was accepted`);
        check(await page.evaluate(() => document.activeElement && document.activeElement.id === 'f-first'), `${where}: empty submit does not move focus to the first missing field`);
        await form.locator('#f-first').fill('Test');
        await form.locator('#f-last').fill('Visitor 01');
        await form.locator('#f-email').fill('test@example.com');
        await form.locator('#f-org').fill('Sample Dental Group');
        const before = log.all.length;
        await form.locator('button[type="submit"]').click();
        await page.waitForTimeout(300);
        check((await form.getAttribute('data-sent')) === 'true', `${where}: filled demo form did not show its thank-you state`);
        check(await form.locator('.ok').isVisible(), `${where}: thank-you message not visible`);
        check(log.all.length === before, `${where}: demo form sent a request: ${log.all.slice(before).join(', ')}`);
        check(new URL(page.url()).pathname === '/index.html', `${where}: demo form navigated away to ${page.url()}`);
      }

      check(log.errors.length === 0, `${where}: ${log.errors.join(' | ')}`);
      check(log.posts.length === 0, `${where}: unexpected non-GET requests: ${log.posts.join(', ')}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.log(`FAIL: ${failures.length} of ${checks} checks failed:`);
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log(`OK: ${checks} checks passed on ${pages.length} pages x ${VIEWS.length} views (${pages.join(', ')})`);
