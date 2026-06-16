import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension'

  return {
    base: isExtension ? './' : '/',
    build: {
      outDir: isExtension ? 'extension/app' : 'dist',
      emptyOutDir: true,
    },
    plugins: [
      react(),
      ...(isExtension
        ? []
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['favicon.png', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'og-image.png'],
              devOptions: {
                enabled: true,
              },
              manifest: {
                name: 'Timelapse Recorder',
                short_name: 'Timelapse',
                description:
                  'Record timelapses from any camera and export MP4 videos entirely in your browser. No upload. 100% private.',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                scope: '/',
                categories: ['utilities', 'productivity', 'photo'],
                icons: [
                  {
                    src: '/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: '/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: '/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: 'index.html',
              },
            }),
          ]),
    ],
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  }
})
