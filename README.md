# dividi2

PWA para dividir gastos entre un grupo de personas. Sin cuentas, sin backend y
sin conexión: todo se calcula y se guarda en el propio teléfono.

Pensada para usarse instalada en un iPhone desde la pantalla de inicio.

## Cómo funciona

- **Grupos** → cada grupo tiene sus integrantes y sus gastos.
- **Gastos** → descripción, monto, quién pagó y entre quiénes se divide, siempre
  en partes iguales.
- **Balances** → cuánto pagó de más o de menos cada persona.
- **Deudas** → las transferencias necesarias para saldar, ya simplificadas.
- **Reporte** → texto listo para copiar y pegar en WhatsApp o Telegram.

## Stack

- Vite + React + TypeScript
- `vite-plugin-pwa` (Workbox) para el manifest y el Service Worker
- IndexedDB como única fuente de verdad
- Vitest para la lógica de cálculo

No hay dependencias de red en runtime: ni fuentes, ni CDNs, ni APIs.

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install     # instalar dependencias
npm run dev     # servidor local -> http://localhost:5173/dividi2/
npm test        # correr los tests
npm run build   # typecheck + build de producción en dist/
npm run preview # servir el build -> http://localhost:4173/dividi2/
npm run icons   # regenerar los íconos de public/
```

El dev server ya sirve la app bajo `/dividi2/`, igual que en producción, así que
cualquier problema de subpath aparece en desarrollo y no recién en el deploy.

## Deploy a GitHub Pages

El repo trae `.github/workflows/deploy.yml`, que buildea y publica en cada push a
`main`.

1. Creá el repositorio en GitHub y subí el código:

   ```bash
   git remote add origin git@github.com:<usuario>/dividi2.git
   git push -u origin main
   ```

2. En **Settings → Pages**, elegí **Source: GitHub Actions**.

3. Listo. Cada push a `main` corre los tests, buildea y publica en
   `https://<usuario>.github.io/dividi2/`.

El workflow toma el subpath del nombre del repositorio (`BASE_PATH`), así que si
lo renombrás no hay que tocar nada. Para publicar en otra ruta:

```bash
BASE_PATH=/otra-ruta/ npm run build
```

## Instalar la PWA en el iPhone

1. Abrí `https://<usuario>.github.io/dividi2/` **en Safari** (no funciona desde
   Chrome ni desde un webview de otra app).
2. Tocá el botón **Compartir** (el cuadrado con la flecha).
3. Elegí **Agregar a pantalla de inicio** y confirmá.
4. Abrila desde el ícono nuevo: se abre a pantalla completa, sin barra de
   direcciones.

Después de instalarla, entrá una vez con conexión para que se descargue todo.

## Comprobar que funciona offline

En el iPhone:

1. Abrí la app instalada al menos una vez con conexión.
2. Activá el **modo avión**.
3. Cerrá la app del todo (deslizá hacia arriba en el multitasking) y volvé a
   abrirla desde el ícono.
4. Tiene que abrir normalmente y mostrar los grupos y gastos que ya tenías.
   Crear, editar y borrar tiene que seguir funcionando igual.

En la computadora, con Chrome:

1. `npm run build && npm run preview`
2. Abrí `http://localhost:4173/dividi2/` y usá la app un poco.
3. En DevTools → **Application**:
   - **Manifest**: tiene que mostrar `dividi2`, `standalone` y los íconos.
   - **Service Workers**: tiene que figurar `sw.js` como *activated and running*.
   - **IndexedDB → dividi2 → groups**: ahí están los grupos guardados. Recargá y
     fijate que siguen.
4. Marcá **Offline** en la pestaña Service Workers y recargá: la app tiene que
   seguir andando.

## Decisiones que conviene tener presentes

**El redondeo se resuelve gasto por gasto.** Cada gasto reparte sus centavos
sobrantes entre los primeros participantes (según el orden en que se cargaron las
personas), de modo que las partes de cada gasto sumen exactamente su total. Como
consecuencia, un balance puede diferir en algunos centavos de la cuenta hecha
sobre el total del grupo: `$35.000` entre 3 no da exacto, y esa diferencia queda
en el balance de alguien. Es correcto y está cubierto por tests: la suma de todos
los balances siempre da exactamente cero.

**Los importes se guardan como centavos enteros.** Nunca se hace aritmética con
floating point, así que no hay errores acumulados del tipo `0.1 + 0.2`.

**Eliminar una persona borra sus gastos.** Todos los gastos que pagó y todos
aquellos en los que participaba. Como por defecto participan todos los
integrantes, en la práctica suele significar borrar casi todos los gastos del
grupo. La confirmación avisa cuántos se van a eliminar. No hay papelera ni
recuperación.

**Los datos viven sólo en este dispositivo.** No hay backend, ni sincronización,
ni backup: si borrás la app, borrás los datos de Safari o cambiás de teléfono,
los grupos se pierden. Además, iOS borra el almacenamiento de los sitios que no
se usan durante 7 días — **las PWA instaladas en la pantalla de inicio están
exentas de esa limpieza, las pestañas comunes de Safari no**. O sea: instalala,
no la uses como pestaña.

**El reporte no es un backup.** Es texto para pegar en un chat, nada más.

## Estructura

```
src/
  domain/     lógica pura y testeada: dinero, división, balances, deudas, reporte
  db/         IndexedDB (un documento por grupo)
  ui/         pantallas
scripts/      generador de íconos (PNG escritos a mano, sin dependencias)
```

La regla es que `src/domain` no sepa nada de React ni de IndexedDB: son funciones
puras que reciben un grupo y devuelven otro. Todo lo que importa que esté bien
calculado se testea ahí.
