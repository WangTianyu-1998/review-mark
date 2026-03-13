
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    outDir: 'dist',
    shims: true,
  },
  {
    entry: ['src/cli/review.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    target: 'es2022',
    outDir: 'dist/cli',
    shims: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  }
]);
