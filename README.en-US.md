# Birb Math

A free, open-source platform for learning mathematics, maintained by
[Birb Labs](https://github.com/birb-labs).

🌐 [math.birblabs.com](https://math.birblabs.com) · [🇧🇷 pt-BR](./README.md) ·
🇺🇸 English · [🇪🇸 Español](./README.es.md)

## What this is

Lessons, worked examples and practice tests, starting with Calculus
(Limits), with more content on the way.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, static export)
- Plain CSS Modules (no CSS framework)
- [next-intl](https://next-intl.dev) for internationalization
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com)

## Running locally

```bash
pnpm install
pnpm --filter site dev
```

The site is available at `http://localhost:3000`.

## Tests

```bash
pnpm -r test
```

## Repository layout

```
apps/site/            # public site
packages/theme/        # theming system
packages/content-schema/  # content types (lessons/questions)
```

## Content

Content (subjects, topics, sections and lessons) lives in a SQLite
database managed by `packages/content-schema`, recreated from scratch
on each build from versioned migrations and a seed script — there is no
persistent database until the admin panel (sub-project 4).

```bash
pnpm --filter @birb-math/content-schema run db:generate  # generates a new migration from the schema
pnpm --filter @birb-math/content-schema run db:reset     # applies migrations + populates with sample data
```

The question bank (used to generate practice tests) lives in the same migrations
and SQLite database as lesson content. An additional build step (`export-questions`)
compiles each question to static HTML and generates `apps/site/public/data/questions.json`,
consumed by the practice test entirely in the browser — there is no practice test backend.

```bash
pnpm --filter site run export-questions  # generates public/data/questions.json from the current database
```

## Contributing

Issues and pull requests are welcome. Code comments and identifier
names (classes, variables, functions) must be in English; documentation
may be written in pt-BR, en-US, or es.

## Support the project

If Birb Math helped you, consider [supporting it on Ko-fi](https://ko-fi.com/p4tit0z) — any amount helps keep the project running.

## License

[MIT](./LICENSE)

## Contact

contato@birblabs.com
