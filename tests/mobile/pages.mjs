// Shared page list and servers for the mobile pass (REVIEW, Part B).
// Every page is served in-process from this checkout. Kit and CDS write their logs to a temp dir,
// so a test run never touches the repo's data files.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

/** Static file server rooted at `dir`. Resolves to { server, port }. */
export function serveStatic(dir) {
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    let p = path.normalize(path.join(dir, decodeURIComponent(u.pathname)));
    if (!p.startsWith(path.normalize(dir))) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

/** Start every server. Returns { pages, close }. */
export async function startAll() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'meyar-mobile-'));
  const closers = [];

  const passport = await serveStatic(path.join(ROOT, 'passport', 'dist'));
  const repo = await serveStatic(ROOT);
  closers.push(passport.server, repo.server);

  process.env.KIT_DATA_DIR = path.join(tmp, 'kit');
  fs.mkdirSync(process.env.KIT_DATA_DIR, { recursive: true });
  const { createKitServer } = await import(path.join(ROOT, 'kit', 'server.js').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'));
  const kit = await listen(createKitServer({ useFhir: false }));
  closers.push(kit.server);

  process.env.DESIGN_DIR = path.join(ROOT, 'design');
  const { createCdsServer } = await import(path.join(ROOT, 'cds', 'server.js').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'));
  const cds = await listen(createCdsServer({ alertsLogPath: path.join(tmp, 'alerts.jsonl') }));
  closers.push(cds.server);

  const P = `http://127.0.0.1:${passport.port}`;
  const K = `http://127.0.0.1:${kit.port}`;
  const C = `http://127.0.0.1:${cds.port}`;
  const R = `http://127.0.0.1:${repo.port}`;

  // name, url builder (lang, elder), whether the page has an elder mode
  const passportPage = (name, q) => ({
    name, elder: true,
    url: (lang, elder) => `${P}/index.html?${q}${q ? '&' : ''}lang=${lang}&elder=${elder ? 'on' : 'off'}`,
  });
  const pages = [
    passportPage('passport-genes-001', 'patient=demo-001&tab=genes'),
    passportPage('passport-genes-002', 'patient=demo-002&tab=genes'),
    passportPage('passport-meds-002', 'patient=demo-002&tab=meds'),
    passportPage('passport-otc-001', 'patient=demo-001&tab=otc&q=omeprazole'),
    passportPage('passport-doctor-001', 'patient=demo-001&tab=doctor'),
    passportPage('passport-pharmacist-002', 'patient=demo-002&view=pharmacist'),
    passportPage('passport-caregiver-001', 'patient=demo-001&mode=caregiver'),
    { name: 'passport-scan', elder: true, url: (lang, elder) => `${P}/scan.html?lang=${lang}&elder=${elder ? 'on' : 'off'}` },
    { name: 'kit-index', url: (lang) => `${K}/?lang=${lang}` },
    { name: 'kit-card', url: (lang) => `${K}/card?lang=${lang}` },
    { name: 'kit-tracker', url: (lang) => `${K}/tracker?lang=${lang}` },
    { name: 'kit-urgent', url: (lang) => `${K}/urgent?lang=${lang}` },
    { name: 'cds-preview', url: (lang) => `${C}/preview?lang=${lang}` },
    { name: 'cds-compare', url: (lang) => `${C}/compare?lang=${lang}` },
    { name: 'cds-dashboard', url: (lang) => `${C}/dashboard?lang=${lang}` },
    { name: 'design-showcase', url: (lang) => `${R}/design/showcase/index.html?lang=${lang}` },
    { name: 'demo-reader', url: (lang) => `${K}/reader/?lang=${lang}` },
  ];

  return {
    pages,
    async close() {
      await Promise.all(closers.map((s) => new Promise((r) => { s.closeAllConnections?.(); s.close(() => r()); })));
      fs.rmSync(tmp, { recursive: true, force: true });
    },
  };
}

/**
 * Runs inside the page. Returns layout defects for a mobile viewport.
 * minTap: 44 (48 in elder mode). Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
 */
export function auditInPage(minTap) {
  const vw = window.innerWidth;
  const out = { scrollWidth: document.documentElement.scrollWidth, vw, overflow: [], smallTaps: [], smallInputs: [], smallText: [], brokenImages: [], hasViewportMeta: !!document.querySelector('meta[name="viewport"]') };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && p.scrollWidth >= p.clientWidth) {
        const r = p.getBoundingClientRect();
        if (r.right <= vw + 1 && r.left >= -1) return true;
      }
    }
    return false;
  };
  const label = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${id}${cls} "${(el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`;
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (el.closest('[aria-hidden="true"]') || el.closest('.m-print-only, .m-sr-only, .sr-only')) continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !inScroller(el) && getComputedStyle(el).position !== 'fixed') {
      out.overflow.push(`${label(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
  }
  const taps = document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"])');
  for (const el of taps) {
    if (!visible(el) || el.closest('[aria-hidden="true"]')) continue;
    let target = el;
    // A visually hidden checkbox/radio is tapped through its label.
    if ((el.type === 'checkbox' || el.type === 'radio') && el.closest('label')) target = el.closest('label');
    const r = target.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) continue;
    const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && /^(P|LI|SPAN|SMALL|TD|DD|FIGCAPTION|LABEL)$/.test(el.parentElement.tagName);
    if (inlineLink) continue;
    if (r.width < minTap - 0.5 || r.height < minTap - 0.5) out.smallTaps.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  for (const el of document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea')) {
    if (!visible(el)) continue;
    if (parseFloat(getComputedStyle(el).fontSize) < 16) out.smallInputs.push(`${label(el)} ${getComputedStyle(el).fontSize}`);
  }
  const seen = new Set();
  for (const el of document.body.querySelectorAll('p, li, td, dd, span, a, button, label, small, div')) {
    if (!visible(el) || el.closest('svg')) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
    if (!own) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12 && !seen.has(fs)) { seen.add(fs); out.smallText.push(`${label(el)} ${fs}px`); }
  }
  for (const img of document.images) {
    if (img.loading === 'lazy' && !img.complete) continue;
    if (!img.complete || img.naturalWidth === 0) out.brokenImages.push(img.currentSrc || img.src);
  }
  return out;
}
