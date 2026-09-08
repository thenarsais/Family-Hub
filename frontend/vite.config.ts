import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
  },
  // Native tsconfig `paths` resolution (vite 8) — replaces the vite-tsconfig-paths
  // plugin, which the old config also duplicated as an explicit resolve.alias map.
  resolve: {
    tsconfigPaths: true,
  },
});
