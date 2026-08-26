# Birb Math

Uma plataforma gratuita e open-source para aprender matemática, mantida
pela [Birb Labs](https://github.com/birb-labs).

🌐 [math.birblabs.com](https://math.birblabs.com) · 🇧🇷 pt-BR ·
[🇺🇸 English](./README.en-US.md) · [🇪🇸 Español](./README.es.md)

## O que é

Lições, exercícios resolvidos e simulados de matemática, começando por
Cálculo (Limites), com mais conteúdo a caminho.

## Stack técnica

- [Next.js](https://nextjs.org) (App Router, export estático)
- CSS Modules simples (sem framework de CSS)
- [next-intl](https://next-intl.dev) para internacionalização
- Hospedado no [Cloudflare Pages](https://pages.cloudflare.com)

## Rodando localmente

```bash
pnpm install
pnpm --filter site dev
```

O site fica disponível em `http://localhost:3000`.

## Testes

```bash
pnpm -r test
```

## Estrutura do repositório

```
apps/site/            # site público
packages/theme/        # sistema de temas
packages/content-schema/  # tipos de conteúdo (lições/questões)
```

## Conteúdo

O conteúdo (disciplinas, tópicos, seções e lições) vive em um banco
SQLite gerenciado por `packages/content-schema`, recriado do zero a
cada build a partir de migrations versionadas e um script de seed —
não há banco persistente até o painel administrativo (sub-projeto 4).

```bash
pnpm --filter @birb-math/content-schema run db:generate  # gera uma nova migration a partir do schema
pnpm --filter @birb-math/content-schema run db:reset     # aplica migrations + popula com dados de exemplo
```

O banco de questões (usado para gerar simulados) vive nas mesmas migrations e no mesmo banco SQLite do conteúdo de lições. Um passo adicional de build (`export-questions`) compila cada questão para HTML estático e gera `apps/site/public/data/questions.json`, consumido pelo simulado inteiramente no navegador — não há backend de simulado.

```bash
pnpm --filter site run export-questions  # gera public/data/questions.json a partir do banco atual
```

## Contribuindo

Issues e pull requests são bem-vindos. Comentários e nomes de
variáveis/funções/classes devem estar em inglês; a documentação pode
ser escrita em pt-BR, en-US ou es.

## Apoie o projeto

Se o Birb Math te ajudou, considere [apoiar no Ko-fi](https://ko-fi.com/p4tit0z) — qualquer valor ajuda a manter o projeto no ar.

## Licença

[MIT](./LICENSE)

## Contato

contato@birblabs.com
