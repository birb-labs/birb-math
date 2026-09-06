# Birb Math

Una plataforma gratuita y de código abierto para aprender matemáticas,
mantenida por [Birb Labs](https://github.com/birb-labs).

🌐 [math.birblabs.com](https://math.birblabs.com) · [🇧🇷 pt-BR](./README.md) ·
[🇺🇸 English](./README.en-US.md) · 🇪🇸 Español

## Qué es

Lecciones, ejercicios resueltos y simulacros de matemáticas, empezando
por Cálculo (Límites), con más contenido en camino.

## Stack técnico

- [Next.js](https://nextjs.org) (App Router, exportación estática)
- CSS Modules simples (sin framework de CSS)
- [next-intl](https://next-intl.dev) para internacionalización
- Alojado en [Cloudflare Pages](https://pages.cloudflare.com)

## Cómo ejecutarlo localmente

```bash
pnpm install
pnpm --filter site dev
```

El sitio queda disponible en `http://localhost:3000`.

## Pruebas

```bash
pnpm -r test
```

## Estructura del repositorio

```
apps/site/            # sitio público
packages/theme/        # sistema de temas
packages/content-schema/  # tipos de contenido (lecciones/preguntas)
```

## Contenido

El contenido (disciplinas, tópicos, secciones y lecciones) vive en una
base de datos SQLite administrada por `packages/content-schema`, recreada
desde cero en cada compilación a partir de migraciones versionadas y un
script de seed — no hay base de datos persistente hasta el panel de
administración (sub-proyecto 4).

```bash
pnpm --filter @birb-math/content-schema run db:generate  # genera una nueva migración del esquema
pnpm --filter @birb-math/content-schema run db:reset     # aplica migraciones + completa con datos de ejemplo
```

El banco de preguntas (utilizado para generar simulacros) vive en las mismas
migraciones y en la misma base de datos SQLite que el contenido de lecciones.
Un paso adicional de compilación (`export-questions`) compila cada pregunta a HTML
estático y genera un archivo por idioma en `apps/site/public/data/`
(`questions.pt-BR.json`, `questions.en-US.json`, `questions.es.json`), consumidos
por el simulacro completamente en el navegador — no hay backend de simulacro.

```bash
pnpm --filter site run export-questions  # genera questions.<locale>.json (uno por idioma) a partir de la base de datos actual
```

El contenido y el banco de preguntas se gestionan mediante un panel de
administración interno (`apps/admin`), alojado por separado en
Cloudflare (Workers + D1) y protegido por Cloudflare Access además de
su propio inicio de sesión — no forma parte del sitio público ni de su
build estático. Publicar un cambio desde el panel dispara el mismo
pipeline de despliegue de GitHub Actions que ya existía.

## Contribuir

Los issues y pull requests son bienvenidos. Los comentarios y los
nombres de identificadores (clases, variables, funciones) deben estar
en inglés; la documentación puede escribirse en pt-BR, en-US o es.

## Apoya el proyecto

Si Birb Math te ayudó, considera [apoyarlo en Ko-fi](https://ko-fi.com/p4tit0z) — cualquier cantidad ayuda a mantener el proyecto.

## Licencia

[MIT](./LICENSE)

## Contacto

contato@birblabs.com
