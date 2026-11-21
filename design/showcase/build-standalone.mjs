#!/usr/bin/env node
// Builds one self-contained HTML file of the showcase (CSS, JS and the sample QR inlined,
// fonts from Google Fonts) so it can be shared or opened without a server.
// Usage: node design/showcase/build-standalone.mjs [out.html]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const d = join(here, '..');
const out = process.argv[2] || join(here, 'meyar-showcase.standalone.html');
let html = readFileSync(join(here, 'index.html'), 'utf8');

const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Readex+Pro:wght@160..700&family=Alexandria:wght@100..900&display=swap">';
const css = readFileSync(join(d, 'tokens.css'), 'utf8') + '\n' + readFileSync(join(d, 'meyar.css'), 'utf8');
const strip = (f) => readFileSync(join(d, f), 'utf8').replace(/^export \{[^}]*\};?\s*$/gm, '').replace(/^export /gm, '');
const js = strip('meyar.js') + '\n' + strip('charts.js');
const qr = 'data:image/svg+xml;base64,' + readFileSync(join(here, 'sample-qr.svg')).toString('base64');

html = html
  .replace('<link rel="stylesheet" href="../fonts/fonts.css">', fonts)
  .replace('<link rel="stylesheet" href="../tokens.css">', '')
  .replace('<link rel="stylesheet" href="../meyar.css">', `<style>\n${css}\n</style>`)
  .replace(/import \{[^}]+\} from '\.\.\/meyar\.js';/, js).replace(/import \{[^}]+\} from '\.\.\/charts\.js';/, '')
  .replace('src="sample-qr.svg"', `src="${qr}"`)
  // Inline every photo that exists so the single file shows real images.
  .replace(/data-img="(img-\d+)"/g, (m, id) => { const f = join(d, 'imagery', id + '.webp'); return existsSync(f) ? `${m} data-src="data:image/webp;base64,${readFileSync(f).toString('base64')}"` : m; });

// Fragment form (no doctype/html/head/body) for hosts that add their own skeleton.
if (process.argv.includes('--fragment')) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>/g, '');
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)[1];
  const boot = '<script>document.documentElement.lang="en";document.documentElement.dir="ltr";document.documentElement.dataset.elder="off";document.body.classList.add("m-body");</script>';
  html = head + boot + body;
}
writeFileSync(out, html);
console.log('Wrote', out, (html.length / 1024).toFixed(0) + ' KB');
