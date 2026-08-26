import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { SimuladoResults } from './simulado-results';
import type { GradedResult } from '@/lib/grade-simulado';

const fixtureResult: GradedResult = {
  correctCount: 1,
  total: 2,
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
        correctAnswer: null,
        resolutionHtml: '<p>Resolution 1</p>',
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
        correctAnswer: '1000000',
        resolutionHtml: '<p>Resolution 2</p>',
        tagIds: [],
      },
      userAnswer: '2',
      isCorrect: false,
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

    expect(screen.getByText('Você acertou 1 de 2 questões')).toBeInTheDocument();
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
    expect(screen.getAllByText('Errado')).toHaveLength(1);
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
});
