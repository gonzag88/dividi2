import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// La app se publica bajo un subpath en GitHub Pages (https://usuario.github.io/dividi2/).
// Se puede sobrescribir con la variable de entorno BASE_PATH para publicarla en otra ruta.
const base = process.env.BASE_PATH ?? '/dividi2/'

/**
 * Sello del momento del build, con formato AAAAMMDDHHMM.
 *
 * Se calcula una sola vez acá y se inyecta como constante en el bundle, así que
 * no es un reloj: queda congelado en el JS publicado y dice cuándo se buildeó
 * esa versión exacta. Como la app se sirve desde el Service Worker, en pantalla
 * termina indicando qué versión tiene cargada el dispositivo.
 *
 * Se fuerza el huso de Buenos Aires porque el build corre en GitHub Actions, que
 * trabaja en UTC: sin esto el número no coincidiría con el reloj de quien lo lee.
 */
function buildVersion(): string {
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    // h23 y no hour12:false: este último devuelve "24" a la medianoche.
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${value('year')}${value('month')}${value('day')}${value('hour')}${value('minute')}`
}

export default defineConfig({
  base,
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion()),
  },
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
        background_color: '#f4f5ef',
        theme_color: '#f4f5ef',
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
