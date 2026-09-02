import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoTaking } from './simulado-taking';
import type { ExportedQuestion } from '@/lib/simulado-selection';

const fixtureQuestions: ExportedQuestion[] = [
  {
    id: 1,
    type: 'multiple_choice',
    difficulty: 'easy',
    promptHtml: '<p>Quanto é 1+1?</p>',
    options: [
      { id: 1, textHtml: '<p>1</p>', isCorrect: false },
      { id: 2, textHtml: '<p>2</p>', isCorrect: true },
    ],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: null,
    resolutionHtml: '<p>É 2.</p>',
    tagIds: [],
  },
  {
    id: 2,
    type: 'numeric',
    difficulty: 'medium',
    promptHtml: '<p>Calcule o limite.</p>',
    options: [],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: '1',
    resolutionHtml: '<p>Vale 1.</p>',
    tagIds: [],
  },
  {
    id: 3,
    type: 'multiple_response',
    difficulty: 'hard',
    promptHtml: '<p>Quais são verdadeiras?</p>',
    options: [
      { id: 30, textHtml: '<p>A</p>', isCorrect: true },
      { id: 31, textHtml: '<p>B</p>', isCorrect: false },
      { id: 32, textHtml: '<p>C</p>', isCorrect: true },
    ],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: null,
    resolutionHtml: '<p>A e C.</p>',
    tagIds: [],
  },
];

describe('SimuladoTaking', () => {
  it('renders every question at once, both types', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Quanto é 1+1?')).toBeInTheDocument();
    expect(screen.getByText('Calcule o limite.')).toBeInTheDocument();
    expect(screen.getByText('Quais são verdadeiras?')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onAnswerChange with the question id and selected option when a radio is picked', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking
          questions={fixtureQuestions}
          answers={{}}
          onAnswerChange={onAnswerChange}
          onFinish={() => {}}
        />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getAllByRole('radio')[1]);

    expect(onAnswerChange).toHaveBeenCalledExactlyOnceWith(1, '2');
  });

  it('calls onAnswerChange with the toggled comma-joined option ids when a checkbox is picked', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking
          questions={fixtureQuestions}
          answers={{ 3: '30' }}
          onAnswerChange={onAnswerChange}
          onFinish={() => {}}
        />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getAllByRole('checkbox')[2]);

    expect(onAnswerChange).toHaveBeenCalledExactlyOnceWith(3, '30,32');
  });

  it('shows a "select all that apply" hint only for multiple-response questions', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Selecione todas as alternativas corretas')).toBeInTheDocument();
  });

  it('calls onFinish when the finish button is clicked', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={onFinish} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Finalizar simulado' }));

    expect(onFinish).toHaveBeenCalledOnce();
  });
});
