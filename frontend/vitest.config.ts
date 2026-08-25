import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    environmentOptions: {
      // Without an explicit URL, jsdom treats the origin as opaque and
      // localStorage/sessionStorage throw a SecurityError on access.
      jsdom: { url: 'http://localhost:5173' },
    },
    coverage: {
      // Vitest's v8 provider defaults to reporting only files actually
      // imported during the run -- untested files are silently omitted
      // rather than shown as 0%, which let the real number drift far below
      // what was being reported. `all: true` instruments everything
      // matching `include` so the percentage (and the threshold below)
      // reflect the whole source tree.
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx', 'src/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
