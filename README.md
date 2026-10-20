# Cinemark Perú Clone

Este es un clon del sitio web de **Cinemark Perú**, desarrollado con Next.js 14, React, Tailwind CSS y TypeScript. La aplicación incluye funcionalidades como cartelera actual, próximos estrenos, promociones, visualización por cines, filtros por formato e idioma, y ahora se ha integrado la API de Cinemark para obtener la **cartelera de películas**, **cines disponibles** y **sesiones** en tiempo real.

## Tecnologías Utilizadas

* [Next.js](https://nextjs.org/)
* [React 19](https://reactjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [TypeScript](https://www.typescriptlang.org/)
* [Shadcn/ui](https://ui.shadcn.com/)
* [Lucide Icons](https://lucide.dev/)
* [API Cinemark](https://api.cinemark-peru.com)

## Actualización 12/06/2024

Hoy se integraron los siguientes componentes de la **API de Cinemark**:

* **Películas**: Se cargan las películas actualmente en cartelera desde la API.
* **Cines**: Obtención de la lista de cines disponibles y su información (dirección, servicios, horarios, etc.).
* **Cartelera**: Visualización dinámica de la cartelera de películas y horarios por cine.

Con estas actualizaciones, ahora es posible visualizar los cines y las películas de manera dinámica, con filtros por formato, idioma y fechas disponibles.

## Instalación y ejecución

1. Clona el repositorio:

```bash
git clone https://github.com/UltimateCosmic/cinemark-peru.git
cd cinemark-peru
```

2. Instala las dependencias:

```bash
pnpm install
# o
npm install
```

3. Ejecuta el servidor de desarrollo:

```bash
pnpm dev
# o
npm run dev
```

4. Abre el navegador en `http://localhost:3000`

---

## Estructura del Proyecto

* `components/` – Componentes reutilizables y UI.
* `hooks/` – Hooks personalizados como `usePeliculas` y `useCines`.
* `public/data/` – Archivos `.json` para cines, cartelera y promociones.
* `app/` o `pages/` – Rutas de la aplicación (dependiendo de si usas App Router).
* `styles/` – Archivos CSS globales y de Tailwind.

## Funcionalidades

* Filtro por cine, formato e idioma.
* Horarios dinámicos por película y cine.
* Visualización de promociones y próximos estrenos.
* UI moderna, responsiva y accesible.
* **Integración de la API de Cinemark**: Ahora se cargan los datos de la cartelera y cines de manera dinámica desde la API de Cinemark.
* **Cartelera interactiva**: Los usuarios pueden ver las películas en cartelera con filtros de formato e idioma, y acceder a los horarios disponibles de cada cine.

## Datos locales de demostración

La aplicación funciona sin la API externa de Cinemark. Las tres rutas en `app/api/`
leen `public/data/cinemark-snapshot.json`, una selección obtenida de las páginas
públicas de [Cinemark Perú](https://www.cinemark-peru.com/) el 19 de octubre de 2026:
12 películas en cartelera, 6 preventas, 8 próximos estrenos y 15 cines.
Cada película conserva su URL de origen y la del afiche. Los afiches y las imágenes
de cines se sirven desde `public/`; los tráileres de YouTube requieren conexión.
Las sinopsis son resúmenes breves redactados para esta demo.

Los horarios, asientos y asignaciones de películas por cine son ficticios. Se
generan para siete días desde la fecha actual de Lima, de modo que la cartelera
no quede vacía al volver a abrir el proyecto. La clasificación de cartelera,
preventa y próximos estrenos corresponde a la captura, sin convertirse en una
cartelera oficial actualizada. No se implementan compras ni reservas reales.
El hero utiliza un fondo fijo y un logo de Avengers: Doomsday desde `public/doomsday/`.

Verificación: `npm run typecheck`, `npm test` y `npm run build`.
No se necesita configurar variables de entorno ni servicios externos.

La captura se puede actualizar manualmente con `npm run scrape:cinemark`.
El script lee HTML público sin ejecutar JavaScript descargado y no se ejecuta
al arrancar ni al compilar. Si aparecen nuevas películas, primero revisa
`node scripts/scrape-cinemark.mjs --refresh --inspect` y agrega un resumen propio
en `scripts/movie-summaries.json`. Las páginas consultadas se guardan en una
caché temporal fuera del repositorio; `--refresh` vuelve a consultarlas.
Los JSON anteriores de `peliculas.json` y `cines.json` se conservan como recursos
históricos y no alimentan estas rutas.

---

## Licencia

MIT © 2025 Johan Carlo Amador Egoavil
