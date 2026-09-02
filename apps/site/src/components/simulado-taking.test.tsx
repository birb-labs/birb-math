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
  {
    id: 4,
    type: 'true_false',
    difficulty: 'easy',
    promptHtml: '<p>O céu é azul?</p>',
    options: [],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: 'true',
    resolutionHtml: '<p>Sim.</p>',
    tagIds: [],
  },
  {
    id: 5,
    type: 'short_text',
    difficulty: 'medium',
    promptHtml: '<p>Como se chama o teorema que garante uma raiz entre dois pontos de sinais opostos?</p>',
    options: [],
    acceptedAnswers: [
      { id: 1, text: 'Teorema do Valor Intermediário' },
      { id: 2, text: 'TVI' },
    ],
    matchingPairs: [],
    correctAnswer: null,
    resolutionHtml: '<p>Teorema do Valor Intermediário.</p>',
    tagIds: [],
  },
  {
    id: 6,
    type: 'ordering',
    difficulty: 'medium',
    promptHtml: '<p>Ordene os passos para calcular o limite.</p>',
    options: [
      { id: 60, textHtml: '<p>Fatorar</p>', isCorrect: false },
      { id: 61, textHtml: '<p>Cancelar</p>', isCorrect: false },
      { id: 62, textHtml: '<p>Substituir</p>', isCorrect: false },
    ],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: null,
    resolutionHtml: '<p>Ver resolução.</p>',
    tagIds: [],
  },
  {
    id: 7,
    type: 'matching',
    difficulty: 'hard',
    promptHtml: '<p>Associe cada tipo de descontinuidade à sua descrição.</p>',
    options: [],
    acceptedAnswers: [],
    matchingPairs: [
      { id: 70, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
      { id: 71, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
    ],
    correctAnswer: null,
    resolutionHtml: '<p>Ver resolução.</p>',
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
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('renders a true_false question with Verdadeiro/Falso radios', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('O céu é azul?')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Verdadeiro' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Falso' })).toBeInTheDocument();
  });

  it('renders a short_text question with a text input', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText('Como se chama o teorema que garante uma raiz entre dois pontos de sinais opostos?'),
    ).toBeInTheDocument();
    // 2 textboxes now: the pre-existing numeric-answer textbox (id 2) plus this short_text one.
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
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

    // Not `toHaveBeenCalledExactlyOnceWith`: the page's ordering question
    // (id 6) also calls `onAnswerChange` once on mount to record its
    // initial shuffled order (see OrderingInput's mount effect), so the
    // shared callback receives more than this one call.
    expect(onAnswerChange).toHaveBeenCalledWith(1, '2');
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

    // Not `toHaveBeenCalledExactlyOnceWith`: the page's ordering question
    // (id 6) also calls `onAnswerChange` once on mount to record its
    // initial shuffled order (see OrderingInput's mount effect), so the
    // shared callback receives more than this one call.
    expect(onAnswerChange).toHaveBeenCalledWith(3, '30,32');
  });

  it('shows a "select all that apply" hint only for multiple-response questions', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Selecione todas as alternativas corretas')).toBeInTheDocument();
  });

  it('renders an ordering question with all of its items, in some order', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Ordene os passos para calcular o limite.')).toBeInTheDocument();
    expect(screen.getByText('Fatorar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Substituir')).toBeInTheDocument();
  });

  it('renders a matching question with all left and right items', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoTaking questions={fixtureQuestions} answers={{}} onAnswerChange={() => {}} onFinish={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Associe cada tipo de descontinuidade à sua descrição.')).toBeInTheDocument();
    expect(screen.getByText('Removível')).toBeInTheDocument();
    expect(screen.getByText('Salto')).toBeInTheDocument();
    expect(screen.getByText('Descrição A')).toBeInTheDocument();
    expect(screen.getByText('Descrição B')).toBeInTheDocument();
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
