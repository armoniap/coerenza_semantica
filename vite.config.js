import { defineConfig } from 'vite'

export default defineConfig({
  base: '/coerenza_semantica/',
  server: {
    port: 3002,
    open: true,
    proxy: {
      '/api': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
})
