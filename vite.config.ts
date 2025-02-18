// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://pay.prosecurelsp.com',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '.prosecurelsp.com',
        configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request:', req.method, req.url, req.headers);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Response Headers:', proxyRes.headers);
            });
        }
      },
      '/api/checkout': {
        target: 'https://mfa.prosecurelsp.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/checkout/, '/api/checkout')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015',
    assetsInlineLimit: 4096,
  }
})