import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@design': fileURLToPath(new URL('../design', import.meta.url)),
      '@tables': fileURLToPath(new URL('../tables', import.meta.url)),
    },
  },
});
