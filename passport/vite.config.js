import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve, relative, sep, join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Offline (C1/C3): after the build, write every emitted file into dist/sw.js's precache list and stamp the
// cache name with a hash of the build, so both pages open with no network and a new deploy replaces old caches.
function precacheServiceWorker() {
  let outDir;
  return {
    name: 'meyar-precache-sw',
    apply: 'build',
    configResolved(cfg) { outDir = resolve(cfg.root, cfg.build.outDir); },
    closeBundle() {
      const walk = (d) => readdirSync(d, { withFileTypes: true })
        .flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
      // _headers is Netlify config, never served: precaching it would 404 and fail cache.addAll.
      const files = walk(outDir).filter((f) => !['sw.js', '_headers'].includes(relative(outDir, f))).sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(relative(outDir, f)).update(readFileSync(f));
      const urls = ['/', ...files.map((f) => '/' + relative(outDir, f).split(sep).join('/'))];
      const swPath = join(outDir, 'sw.js');
      const sw = readFileSync(swPath, 'utf8')
        .replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = 'meyar-passport-offline-${hash.digest('hex').slice(0, 8)}';`)
        .replace(/const CORE_URLS = \[[\s\S]*?\];/, `const CORE_URLS = ${JSON.stringify(urls, null, 2).replace(/"/g, "'")};`);
      writeFileSync(swPath, sw);
    },
  };
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [precacheServiceWorker()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        scan: resolve(__dirname, 'scan.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@design': fileURLToPath(new URL('../design', import.meta.url)),
      '@tables': fileURLToPath(new URL('../tables', import.meta.url)),
    },
  },
});
