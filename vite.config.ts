import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/sugar/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Сахар — дневник глюкозы',
        short_name: 'Сахар',
        description: 'Локальный дневник глюкозы с историей, графиками и Excel-отчётами.',
        lang: 'ru',
        start_url: '/sugar/',
        scope: '/sugar/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f4f6f2',
        theme_color: '#f4f6f2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/sugar/index.html',
        navigateFallbackDenylist: [/\.xlsx$/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    // ExcelJS изолирован в lazy chunk и не загружается до экспорта.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'node',
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
  },
});
