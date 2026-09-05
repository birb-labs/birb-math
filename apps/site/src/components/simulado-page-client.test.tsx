import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: null,
    resolutionHtml: '<p>É 2.</p>',
    answerFormat: 'text',
    isFallback: false,
    tagIds: [1],
  },
];

// Used only by the CAS-regression test below: a math-mode short_text
// question alongside the ordinary multiple-choice fixture question, so we
// can confirm a pathological math answer to ONE question never prevents
// the OTHER question from being graded.
const mathModeFixtureQuestions: ExportedQuestion[] = [
  fixtureQuestions[0],
  {
    id: 2,
    type: 'short_text',
    difficulty: 'easy',
    promptHtml: '<p>Resolva para x: x + 1 = 2</p>',
    options: [],
    acceptedAnswers: [{ id: 20, text: 'x' }],
    matchingPairs: [],
    correctAnswer: null,
    resolutionHtml: '<p>x = 1</p>',
    answerFormat: 'math',
    isFallback: false,
    tagIds: [1],
  },
];

describe('SimuladoPageClient', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(fixtureQuestions) }),
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

  it('stays on the setup screen and shows a message when the selection is empty', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClient tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    // Stays on setup: the "Gerar simulado" button (and thus the setup form) is still there.
    expect(await screen.findByText(/Só há 0 questão\(ões\) disponível\(eis\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar simulado' })).toBeInTheDocument();
  });

  it('proceeds to the taking screen with a notice when fewer questions than requested are available', async () => {
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClient tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    await user.clear(screen.getByLabelText('Número de questões'));
    await user.type(screen.getByLabelText('Número de questões'), '5');
    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    expect(await screen.findByText('Quanto é 1+1?')).toBeInTheDocument();
    expect(screen.getByText(/Só há 1 questão\(ões\) disponível\(eis\)/)).toBeInTheDocument();
  });

  it('shows an error message and stays usable when the question bank fails to load', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClient tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    expect(
      await screen.findByText('Não foi possível carregar o banco de questões. Tente novamente.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gerar simulado' })).toBeInTheDocument();
  });

  it('shows an error message when the fetch response is not ok', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClient tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));

    expect(
      await screen.findByText('Não foi possível carregar o banco de questões. Tente novamente.'),
    ).toBeInTheDocument();
  });

  it('completes grading (marking the question incorrect) when a math-mode answer is pathologically long, instead of losing the whole result', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mathModeFixtureQuestions) }),
    );

    const { container } = render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClient tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));
    expect(await screen.findByText('Quanto é 1+1?')).toBeInTheDocument();

    // Correctly answer the multiple-choice question (the "2" option).
    await user.click(screen.getAllByRole('radio')[1]);

    // Feed the math-mode question a pathologically long/deeply-nested LaTeX
    // answer — the exact class of input that, before the Critical fix,
    // could throw a RangeError out of isEquivalentExpression and reject
    // gradeSimulado's Promise.all, discarding every question's result, not
    // just this one.
    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    const field = container.querySelector('math-field') as HTMLElement & { value: string };
    field.value = '\\frac{1}{'.repeat(300) + '1' + '}'.repeat(300);
    field.dispatchEvent(new Event('input', { bubbles: true }));

    await user.click(screen.getByRole('button', { name: 'Finalizar simulado' }));

    // Grading completed for BOTH questions instead of the whole batch being
    // destroyed: the multiple-choice question is marked correct, and the
    // pathological math-mode answer is marked incorrect rather than
    // crashing the batch.
    expect(await screen.findByText('Você acertou 1 de 2 questões')).toBeInTheDocument();
  }, 20000); // Mounting a real <math-field> (mathlive) plus a real compute-engine grading pass is slower than this file's other, purely-synthetic fixtures — give it more headroom than the default 5s.

  it('shows an error and stays usable if grading fails unexpectedly', async () => {
    vi.doMock('@/lib/grade-simulado', () => ({
      gradeSimulado: vi.fn().mockRejectedValue(new Error('simulated grading failure')),
    }));
    vi.resetModules();

    const { SimuladoPageClient: SimuladoPageClientWithFailingGrader } = await import('./simulado-page-client');

    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoPageClientWithFailingGrader tagTree={fixtureTagTree} locale="pt-BR" />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar simulado' }));
    expect(await screen.findByText('Quanto é 1+1?')).toBeInTheDocument();

    await user.click(screen.getAllByRole('radio')[0]);
    await user.click(screen.getByRole('button', { name: 'Finalizar simulado' }));

    expect(
      await screen.findByText('Não foi possível corrigir o simulado. Tente novamente.'),
    ).toBeInTheDocument();
    // Still usable: the finish button is back to normal, not stuck disabled.
    expect(await screen.findByRole('button', { name: 'Finalizar simulado' })).not.toBeDisabled();

    vi.doUnmock('@/lib/grade-simulado');
    vi.resetModules();
  });
});
