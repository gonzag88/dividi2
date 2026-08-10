import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// La app se publica bajo un subpath en GitHub Pages (https://usuario.github.io/dividi2/).
// Se puede sobrescribir con la variable de entorno BASE_PATH para publicarla en otra ruta.
const base = process.env.BASE_PATH ?? '/dividi2/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // El Service Worker se actualiza solo: al detectar una versión nueva la instala
      // y toma el control, sin mostrarle nada al usuario.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Los íconos ya entran por globPatterns; no hace falta includeAssets
      // (duplicaría entradas en el precache).
      manifest: {
        name: 'dividi2',
        short_name: 'dividi2',
        description: 'Gastos compartidos, offline.',
        lang: 'es-AR',
        dir: 'ltr',
        // start_url y scope son relativos para que la app funcione bajo cualquier subpath.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea todo lo necesario para arrancar sin conexión.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // La app no hace ningún request de red en runtime: no hay runtimeCaching.
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
