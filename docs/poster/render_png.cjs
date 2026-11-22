// Renders the F4 SVGs to PNG with the pre-installed Playwright Chromium.
// Run from the repo root: node docs/poster/render_png.cjs
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const dir = path.resolve('docs/poster');
const jobs = [['f4-tier-panel-poster', 1600, 2000, 2], ['f4-tier-panel-slide', 1920, 1080, 1], ['f4-tier-panel-poster-ar', 1600, 2000, 2], ['f4-tier-panel-slide-ar', 1920, 1080, 1]];
(async () => {
const browser = await chromium.launch();
for (const [name, w, h, scale] of jobs) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(path.join(dir, `${name}.svg`)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  console.log('rendered', name, `${w * scale}x${h * scale}`);
}
await browser.close();
})();
