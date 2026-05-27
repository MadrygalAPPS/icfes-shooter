import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, port: 3001 },
  build:  { outDir: 'dist', assetsDir: 'assets' },
});
