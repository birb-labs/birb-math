import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { ContentTree } from './content-tree';
import type { ContentTree as ContentTreeData } from '@birb-math/content-schema';

const fixtureTree: ContentTreeData[] = [
  {
    id: 1,
    slug: 'calculo',
    name: 'Cálculo',
    topics: [
      {
        id: 1,
        slug: 'limites',
        name: 'Limites',
        sections: [
          {
            id: 1,
            slug: 'limites-laterais',
            name: 'Limites Laterais',
            lessons: [
              { slug: 'licao-1', title: 'Lição Um' },
              { slug: 'licao-2', title: 'Lição Dois' },
            ],
          },
        ],
      },
    ],
  },
];

describe('ContentTree', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // Not in the plan's exact test code: this project's vitest.config.ts does not
  // set `globals: true`, so React Testing Library's automatic afterEach(cleanup)
  // registration (which checks for a global `afterEach`) never fires. Without
  // this, the three renders below accumulate in the same jsdom document and
  // `getByText` sees duplicates. See task-5-report.md for details.
  afterEach(() => {
    cleanup();
  });

  it('renders every level of the hierarchy', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <ContentTree tree={fixtureTree} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Cálculo')).toBeInTheDocument();
    expect(screen.getByText('Limites')).toBeInTheDocument();
    expect(screen.getByText('Limites Laterais')).toBeInTheDocument();
    // Not in the plan's exact test code: apps/site/src/i18n/routing.ts sets
    // localePrefix: 'always' (a prior sub-project's deliberate choice, matched
    // by this task's own Step 11 build check expecting output under
    // apps/site/out/pt-BR/...), so next-intl's Link always prepends the
    // locale segment, even for the default locale. See task-5-report.md.
    expect(screen.getByRole('link', { name: 'Lição Um' })).toHaveAttribute(
      'href',
      '/pt-BR/content/licao-1',
    );
  });

  it('shows 0 of N completed when nothing is read yet', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <ContentTree tree={fixtureTree} />
      </NextIntlClientProvider>,
    );

    // With a single topic and a single section per subject in this fixture,
    // the "0 de 2" count appears at all three nesting levels (subject, topic,
    // section) — assert there are exactly three occurrences.
    expect(screen.getAllByText('0 de 2 lições concluídas')).toHaveLength(3);
  });

  it('reflects a previously completed lesson in the progress count at every nesting level', () => {
    window.localStorage.setItem('birb-math-reading-progress', JSON.stringify(['licao-1']));

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <ContentTree tree={fixtureTree} />
      </NextIntlClientProvider>,
    );

    // The section-level count, and — since this fixture has exactly one
    // topic and one section per subject — the topic- and subject-level
    // aggregated counts should all read the same "1 de 2" here.
    expect(screen.getAllByText('1 de 2 lições concluídas')).toHaveLength(3);
  });

  it('aggregates completed/total counts across multiple sections and topics', () => {
    const multiSectionTree: ContentTreeData[] = [
      {
        id: 1,
        slug: 'calculo',
        name: 'Cálculo',
        topics: [
          {
            id: 1,
            slug: 'limites',
            name: 'Limites',
            sections: [
              {
                id: 1,
                slug: 'limites-laterais',
                name: 'Limites Laterais',
                lessons: [
                  { slug: 'licao-1', title: 'Lição Um' },
                  { slug: 'licao-2', title: 'Lição Dois' },
                ],
              },
              {
                id: 2,
                slug: 'limites-infinitos',
                name: 'Limites Infinitos',
                lessons: [{ slug: 'licao-3', title: 'Lição Três' }],
              },
            ],
          },
        ],
      },
    ];

    window.localStorage.setItem('birb-math-reading-progress', JSON.stringify(['licao-1', 'licao-3']));

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <ContentTree tree={multiSectionTree} />
      </NextIntlClientProvider>,
    );

    // Section level: 1 of 2, and 1 of 1.
    expect(screen.getByText('1 de 2 lições concluídas')).toBeInTheDocument();
    expect(screen.getByText('1 de 1 lições concluídas')).toBeInTheDocument();
    // Topic and subject level both aggregate to 2 of 3 across both sections.
    expect(screen.getAllByText('2 de 3 lições concluídas')).toHaveLength(2);
  });
});
