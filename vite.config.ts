/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// VITE_BASE lets GitHub Pages serve the app from /<repo>/ without a code change.
const base = process.env.VITE_BASE ?? '/';

/**
 * ADR-007: only the default skin's faces are precached. The other twelve
 * families (about 340 KB) are fetched when a skin is first selected and kept by
 * the runtime rule below, so switching skins costs one download and then works
 * offline. Puffin is Bricolage Grotesque and Atkinson Hyperlegible; IBM Plex
 * Mono is shared by every skin for numbers.
 */
const DEFAULT_SKIN_FONTS = [
  'fonts/bricolage-grotesque-variable.woff2',
  'fonts/atkinson-hyperlegible-400.woff2',
  'fonts/atkinson-hyperlegible-700.woff2',
  'fonts/ibm-plex-mono-400.woff2',
  'fonts/ibm-plex-mono-500.woff2',
];

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', ...DEFAULT_SKIN_FONTS],
      manifest: {
        name: 'Nestling',
        short_name: 'Nestling',
        description: "Your baby's size, week by week, as a seed, an egg, then a bird.",
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6F4EF',
        theme_color: '#F6F4EF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell only. ADR-003: never cache cross-origin frames.
        // ADR-006: never cache URLs carrying query strings, so a shared
        // ?m=&d= link cannot leak between users of a shared machine.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', ...DEFAULT_SKIN_FONTS],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\?/],
        ignoreURLParametersMatching: [/.*/],
        runtimeCaching: [
          {
            // The skins that are not precached. Same-origin, immutable, and
            // carrying no query string, so caching one leaks nothing (ADR-006);
            // the entry is what makes a chosen skin survive going offline.
            urlPattern: /\/fonts\/[^/]+\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nestling-fonts',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
});
