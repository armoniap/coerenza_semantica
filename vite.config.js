import { defineConfig } from 'vite'

export default defineConfig({
  base: '/content-coherence-analyzer-main/',
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
