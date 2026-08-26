import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoPageClient } from './simulado-page-client';
import type { TopicNode } from '@birb-math/content-schema';
import type { ExportedQuestion } from '@/lib/export-question';

const fixtureTagTree: TopicNode[] = [{ id: 1, slug: 'limites', name: 'Limites', subtopics: [] }];

const fixtureQuestions: ExportedQuestion[] = [
  {
    id: 1,
    type: 'multiple_choice',
    difficulty: 'easy',
    promptHtml: '<p>Quanto é 1+1?</p>',
    options: [
      { id: 10, textHtml: '<p>1</p>', isCorrect: false },
      { id: 11, textHtml: '<p>2</p>', isCorrect: true },
    ],
    correctAnswer: null,
    resolutionHtml: '<p>É 2.</p>',
    tagIds: [1],
  },
];

describe('SimuladoPageClient', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(fixtureQuestions) }),
    );
  });

  it('moves from setup to taking to results as the user progresses', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClient tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    // Setup screen first.
    expect(screen.getByRole('button', { name: 'Gerar simulado' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    // Taking screen: the fixture question's prompt is now visible.
    expect(await screen.findByText('Quanto é 1+1?')).toBeInTheDocument();

    await user.click(screen.getAllByRole('radio')[0]); // first radio (the "1" option)
    await user.click(screen.getByRole('button', { name: 'Finalizar simulado' }));

    // Results screen: the score and resolution are now visible.
    expect(await screen.findByText('Você acertou 0 de 1 questões')).toBeInTheDocument();
    expect(screen.getByText('É 2.')).toBeInTheDocument();
  });
});
