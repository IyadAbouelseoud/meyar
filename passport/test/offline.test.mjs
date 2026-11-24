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
