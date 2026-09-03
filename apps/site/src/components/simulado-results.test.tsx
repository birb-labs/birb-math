import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoResults } from './simulado-results';
import type { GradedResult } from '@/lib/grade-simulado';

const fixtureResult: GradedResult = {
  correctCount: 1,
  total: 3,
  perQuestion: [
    {
      question: {
        id: 1,
        type: 'multiple_choice',
        difficulty: 'easy',
        promptHtml: '<p>Q1</p>',
        options: [
          { id: 10, textHtml: '<p>A</p>', isCorrect: false },
          { id: 11, textHtml: '<p>B</p>', isCorrect: true },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 1</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: '11',
      isCorrect: true,
    },
    {
      question: {
        id: 2,
        type: 'numeric',
        difficulty: 'medium',
        promptHtml: '<p>Q2</p>',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: '1000000',
        resolutionHtml: '<p>Resolution 2</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: '2',
      isCorrect: false,
    },
    {
      question: {
        id: 3,
        type: 'multiple_response',
        difficulty: 'hard',
        promptHtml: '<p>Q3</p>',
        options: [
          { id: 30, textHtml: '<p>Afirmação A</p>', isCorrect: true },
          { id: 31, textHtml: '<p>Afirmação B</p>', isCorrect: false },
          { id: 32, textHtml: '<p>Afirmação C</p>', isCorrect: true },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 3</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: '30,31',
      isCorrect: false,
    },
  ],
};

const newTypesResult: GradedResult = {
  correctCount: 0,
  total: 4,
  perQuestion: [
    {
      question: {
        id: 4,
        type: 'true_false',
        difficulty: 'easy',
        promptHtml: '<p>Q4</p>',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: 'true',
        resolutionHtml: '<p>Resolution 4</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: 'false',
      isCorrect: false,
    },
    {
      question: {
        id: 5,
        type: 'short_text',
        difficulty: 'medium',
        promptHtml: '<p>Q5</p>',
        options: [],
        acceptedAnswers: [
          { id: 1, text: 'Teorema do Valor Intermediário' },
          { id: 2, text: 'TVI' },
        ],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 5</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: '<b>hacked</b>',
      isCorrect: false,
    },
    {
      question: {
        id: 6,
        type: 'ordering',
        difficulty: 'medium',
        promptHtml: '<p>Q6</p>',
        options: [
          { id: 60, textHtml: '<p>Fatorar</p>', isCorrect: false },
          { id: 61, textHtml: '<p>Cancelar</p>', isCorrect: false },
          { id: 62, textHtml: '<p>Substituir</p>', isCorrect: false },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 6</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: '61,60,62',
      isCorrect: false,
    },
    {
      question: {
        id: 7,
        type: 'matching',
        difficulty: 'hard',
        promptHtml: '<p>Q7</p>',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [
          { id: 70, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
          { id: 71, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
        ],
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 7</p>',
        answerFormat: 'text',
        tagIds: [],
      },
      userAnswer: '70:71,71:70',
      isCorrect: false,
    },
  ],
};

const mathShortTextResult: GradedResult = {
  correctCount: 1,
  total: 1,
  perQuestion: [
    {
      question: {
        id: 8,
        type: 'short_text',
        difficulty: 'hard',
        promptHtml: '<p>Q8</p>',
        options: [],
        acceptedAnswers: [{ id: 1, text: '\\frac{1}{2}' }],
        matchingPairs: [],
        correctAnswer: null,
        answerFormat: 'math',
        resolutionHtml: '<p>Resolution 8</p>',
        tagIds: [],
      },
      userAnswer: '\\frac{1}{2}',
      isCorrect: true,
    },
  ],
};

describe('SimuladoResults', () => {
  it('shows the overall score', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Você acertou 1 de 3 questões')).toBeInTheDocument();
  });

  it('shows each question with its resolution and correct/incorrect status', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Resolution 1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
    expect(screen.getByText('Resolution 2')).toBeInTheDocument();
    expect(screen.getAllByText('Certo')).toHaveLength(1);
    expect(screen.getAllByText('Errado')).toHaveLength(2);
  });

  it('shows the user\'s selected option text for a multiple-choice question', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    // The correctly-answered MC question's "your answer" is option 11's text ("B").
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('reformats a numeric correct answer for the active locale, regardless of stored format', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    // Canonical "1000000" reformatted for pt-BR is "1.000.000", not the raw canonical string.
    expect(screen.getByText('1.000.000')).toBeInTheDocument();
    // The user's own raw input is shown as they typed it, not reformatted.
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows every selected and every correct option for a multiple-response question', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={fixtureResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    // User selected A and B (B is wrong); the correct set is A and C.
    const answersSection = screen.getByText('Q3').closest('div')!.parentElement!;
    expect(answersSection.textContent).toContain('Afirmação A');
    expect(answersSection.textContent).toContain('Afirmação B');
    expect(answersSection.textContent).toContain('Afirmação C');
  });

  it('translates true_false answers to Verdadeiro/Falso instead of showing the raw literals', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q4').closest('div')!.parentElement!;
    expect(answersSection.textContent).toContain('Falso');
    expect(answersSection.textContent).toContain('Verdadeiro');
    expect(answersSection.textContent).not.toContain('true');
    expect(answersSection.textContent).not.toContain('false');
  });

  it('shows the accepted answers and the user\'s typed text for a short_text question, as plain text', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q5').closest('div')!.parentElement!;
    expect(answersSection.textContent).toContain('Teorema do Valor Intermediário / TVI');
    // The raw, unescaped user-typed text must render as plain text, not HTML
    // — this is the self-XSS regression guard: no actual <b> element should
    // exist in the DOM, only its literal source text.
    expect(answersSection.textContent).toContain('<b>hacked</b>');
    expect(answersSection.querySelector('b')).toBeNull();
  });

  it('shows the chosen and correct sequences for an ordering question using option labels, not raw ids', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q6').closest('div')!.parentElement!;
    expect(answersSection.textContent).not.toContain('61,60,62');
    expect(answersSection.textContent).toContain('Cancelar');
    expect(answersSection.textContent).toContain('Fatorar');
    expect(answersSection.textContent).toContain('Substituir');
  });

  it('shows the chosen and correct pairings for a matching question using pair labels, not raw ids', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={newTypesResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q7').closest('div')!.parentElement!;
    expect(answersSection.textContent).not.toContain('70:71,71:70');
    expect(answersSection.textContent).toContain('Removível');
    expect(answersSection.textContent).toContain('Salto');
    expect(answersSection.textContent).toContain('Descrição A');
    expect(answersSection.textContent).toContain('Descrição B');
  });

  it('renders a math-mode short_text answer as a rendered formula, not raw LaTeX text', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <SimuladoResults result={mathShortTextResult} locale="pt-BR" onBackToSetup={() => {}} />
      </NextIntlClientProvider>,
    );

    const answersSection = screen.getByText('Q8').closest('div')!.parentElement!;
    expect(answersSection.textContent).not.toContain('\\frac');
    expect(answersSection.querySelector('.katex')).toBeInTheDocument();
  });
});
