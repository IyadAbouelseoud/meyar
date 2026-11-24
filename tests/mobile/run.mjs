// Mobile regression test and screenshot matrix (REVIEW, Part B).
//
//   npm --prefix tests/mobile test                     # assert mode: 320/375/430, ar+en, elder off/on (Passport)
//   node tests/mobile/run.mjs --shots <dir> [--full]   # also save screenshots; --full = every review viewport
//
// Assert mode fails on: horizontal overflow, an element wider than the viewport (outside its own scroll
// container), a tap target under 48 CSS px (--m-target), an input under 16 px (iOS zoom), a missing
// viewport meta, a console error or page error, or an image that failed to load.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startAll, auditInPage } from './pages.mjs';

const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const full = args.includes('--full');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const TEST_VIEWPORTS = [[320, 568], [375, 667], [430, 932]];
const FULL_VIEWPORTS = [[320, 568], [360, 740], [375, 667], [390, 844], [412, 915], [430, 932], [844, 390], [768, 1024], [1024, 1366], [1440, 900]];
const viewports = full ? FULL_VIEWPORTS : TEST_VIEWPORTS;

const { pages, close } = await startAll();
// Use Playwright's own browser if installed; otherwise the newest Chromium already in the cache, or CHROMIUM_PATH.
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  try { if (fs.existsSync(chromium.executablePath())) return undefined; } catch { /* fall through */ }
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.LOCALAPPDATA || path.join(process.env.HOME || '', '.cache'), 'ms-playwright');
  if (!fs.existsSync(cache)) return undefined;
  for (const d of fs.readdirSync(cache).filter((n) => /^chromium-\d+$/.test(n)).sort().reverse()) {
    for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const p = path.join(cache, d, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}
const browser = await chromium.launch({ executablePath: findChromium() });
const failures = [];
const rows = [];

try {
  for (const page of pages.filter((p) => !only || p.name.includes(only))) {
    for (const lang of ['ar', 'en']) {
      for (const elder of page.elder ? [false, true] : [false]) {
        for (const [w, h] of viewports) {
          const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: shotsDir ? 2 : 1, hasTouch: w < 1024, isMobile: w < 768, locale: lang === 'ar' ? 'ar-SA' : 'en-US' });
          const tab = await ctx.newPage();
          const errors = [];
          tab.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
          tab.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
          await tab.goto(page.url(lang, elder), { waitUntil: 'networkidle' });
          await tab.waitForTimeout(300);
          // Scroll through so lazy images load, then back to the top.
          await tab.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo(0, 0); });
          await tab.waitForTimeout(250);
          const minTap = 48; // design token --m-target (AGENTS 11); the review prompt asks for 44 (48 elder), so this is stricter
          const a = await tab.evaluate(auditInPage, minTap);
          const state = elder ? 'elder' : 'std';
          const id = `${page.name} ${w}x${h} ${lang} ${state}`;
          const problems = [];
          if (a.scrollWidth > a.vw) problems.push(`horizontal scroll: scrollWidth ${a.scrollWidth} > ${a.vw}`);
          if (a.overflow.length) problems.push(`wider than viewport: ${a.overflow.slice(0, 4).join(' | ')}${a.overflow.length > 4 ? ` (+${a.overflow.length - 4})` : ''}`);
          if (w < 768 && a.smallTaps.length) problems.push(`tap < ${minTap}px: ${a.smallTaps.slice(0, 4).join(' | ')}${a.smallTaps.length > 4 ? ` (+${a.smallTaps.length - 4})` : ''}`);
          if (w < 768 && a.smallInputs.length) problems.push(`input < 16px: ${a.smallInputs.join(' | ')}`);
          if (!a.hasViewportMeta) problems.push('no <meta name="viewport">');
          if (errors.length) problems.push(`console: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
          if (a.brokenImages.length) problems.push(`broken images: ${a.brokenImages.join(' | ')}`);
          rows.push({ page: page.name, viewport: `${w}x${h}`, lang, state, pass: problems.length === 0, problems, smallText: a.smallText });
          if (problems.length) failures.push(`${id}\n    - ${problems.join('\n    - ')}`);
          if (shotsDir) {
            const dir = path.join(shotsDir, page.name);
            fs.mkdirSync(dir, { recursive: true });
            await tab.screenshot({ path: path.join(dir, `${w}x${h}-${lang}-${state}.png`), fullPage: true });
          }
          await ctx.close();
        }
      }
    }
  }
} finally {
  await browser.close();
  await close();
}

if (shotsDir) fs.writeFileSync(path.join(shotsDir, 'results.json'), JSON.stringify(rows, null, 2));
const passed = rows.filter((r) => r.pass).length;
console.log(`mobile: ${passed}/${rows.length} page states pass`);
if (failures.length) {
  console.log(failures.join('\n'));
  process.exitCode = 1;
}
