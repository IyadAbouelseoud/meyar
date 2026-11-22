import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
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
