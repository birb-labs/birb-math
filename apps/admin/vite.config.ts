import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  // `configPath` is set explicitly because Vite's `root` below is
  // `src/client`, and @cloudflare/vite-plugin resolves its default
  // `wrangler.jsonc` lookup relative to that root, not the project root
  // where the file actually lives. Without this, the plugin silently
  // falls back to an assets-only worker (no Hono routes registered).
  plugins: [react(), cloudflare({ configPath: '../../wrangler.jsonc' })],
  root: 'src/client',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
