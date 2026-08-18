import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  bundle: true,
  splitting: false,
  dts: false,
  clean: true,
  target: 'node24',
  sourcemap: false,
  outDir: 'dist',
})
