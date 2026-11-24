// REVIEW (final pass): the committed dist is what Netlify serves, and both pages must open with no network.
// The service worker therefore has to precache every built file, not only the HTML and demo JSON.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, base) : ['/' + path.relative(base, p).split(path.sep).join('/')];
  });
}

test('dist/sw.js precaches every file the built pages need', () => {
  const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  const needed = walk(dist).filter((f) => f !== '/sw.js' && f !== '/_headers');
  const missing = needed.filter((f) => !sw.includes(`'${f}'`) && !sw.includes(`"${f}"`));
  assert.deepEqual(missing, [], `not precached: ${missing.join(', ')}`);
});

test('dist/sw.js cache name changes when the build changes', () => {
  const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  assert.match(sw, /meyar-passport-offline-[0-9a-f]{8}/, 'cache name carries a build hash so new deploys replace old caches');
});

test('dist/sw.js never precaches Netlify config (cache.addAll is atomic; one 404 would break offline)', () => {
  const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  assert.doesNotMatch(sw, /_headers/);
});

// REVIEW code review #3: run the real install handler against fake caches.
async function runInstall({ failUrl }) {
  const src = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  const handlers = {};
  let skipped = false;
  const stored = [];
  const cache = {
    addAll: async (urls) => { if (urls.includes(failUrl)) throw new Error('fetch failed'); stored.push(...urls); },
    add: async (url) => { if (url === failUrl) throw new Error('fetch failed'); stored.push(url); },
  };
  const self = { addEventListener: (t, h) => { handlers[t] = h; }, skipWaiting: () => { skipped = true; }, clients: { claim() {} }, location: { origin: 'http://x' } };
  const caches = { open: async () => cache, keys: async () => [], delete: async () => true, match: async () => undefined };
  new Function('self', 'caches', 'fetch', src)(self, caches, async () => { throw new Error('offline'); });
  let waited;
  handlers.install({ waitUntil: (p) => { waited = p; } });
  let ok = true;
  try { await waited; } catch { ok = false; }
  return { ok, skipped, stored };
}

test('a failed core file fails the install, so the previous offline cache survives', async () => {
  const r = await runInstall({ failUrl: '/scan.html' });
  assert.equal(r.ok, false, 'install must reject');
  assert.equal(r.skipped, false, 'must not skipWaiting into an empty cache');
});

test('a failed image does not fail the install; core files are cached', async () => {
  const r = await runInstall({ failUrl: '/imagery/img-15-1920.webp' });
  assert.equal(r.ok, true);
  assert.equal(r.skipped, true);
  assert.ok(r.stored.includes('/scan.html') && r.stored.includes('/index.html'));
});
