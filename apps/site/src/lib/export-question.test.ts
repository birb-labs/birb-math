import { describe, expect, it } from 'vitest';
import {
  compileQuestionForExport,
  isValidNumericCorrectAnswer,
  assertValidNumericCorrectAnswer,
} from './export-question';
import type { QuestionExport } from '@birb-math/content-schema';

const mcQuestion: QuestionExport = {
  id: 1,
  type: 'multiple_choice',
  difficulty: 'easy',
  promptMdx: 'Qual é o valor de $1 + 1$?',
  resolutionMdx: 'A soma vale $2$.',
  correctAnswer: null,
  options: [
    { id: 10, textMdx: '1', isCorrect: false },
    { id: 11, textMdx: '2', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  tagIds: [5],
};

const numericQuestion: QuestionExport = {
  id: 2,
  type: 'numeric',
  difficulty: 'medium',
  promptMdx: 'Quanto é $3 \\div 2$?',
  resolutionMdx: 'A divisão de $3$ por $2$ é igual a $1.5$.',
  correctAnswer: '1.5',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  tagIds: [5, 6],
};

const multiResponseQuestion: QuestionExport = {
  id: 3,
  type: 'multiple_response',
  difficulty: 'hard',
  promptMdx: 'Quais afirmações são verdadeiras?',
  resolutionMdx: 'A primeira e a terceira são verdadeiras.',
  correctAnswer: null,
  options: [
    { id: 20, textMdx: 'Afirmação 1', isCorrect: true },
    { id: 21, textMdx: 'Afirmação 2', isCorrect: false },
    { id: 22, textMdx: 'Afirmação 3', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  tagIds: [7],
};

const trueFalseQuestion: QuestionExport = {
  id: 3,
  type: 'true_false',
  difficulty: 'easy',
  promptMdx: 'O céu é azul?',
  resolutionMdx: 'Sim.',
  correctAnswer: 'true',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  tagIds: [],
};

const shortTextQuestion: QuestionExport = {
  id: 4,
  type: 'short_text',
  difficulty: 'medium',
  promptMdx: 'Qual gás as plantas liberam na fotossíntese?',
  resolutionMdx: 'Oxigênio.',
  correctAnswer: null,
  options: [],
  acceptedAnswers: [
    { id: 1, text: 'Oxigênio' },
    { id: 2, text: 'O2' },
  ],
  matchingPairs: [],
  tagIds: [],
};

const orderingQuestion: QuestionExport = {
  id: 5,
  type: 'ordering',
  difficulty: 'medium',
  promptMdx: 'Ordene os passos.',
  resolutionMdx: 'Ver resolução.',
  correctAnswer: null,
  options: [
    { id: 50, textMdx: 'Primeiro', isCorrect: false },
    { id: 51, textMdx: 'Segundo', isCorrect: false },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  tagIds: [],
};

const matchingQuestion: QuestionExport = {
  id: 6,
  type: 'matching',
  difficulty: 'hard',
  promptMdx: 'Associe.',
  resolutionMdx: 'Ver resolução.',
  correctAnswer: null,
  options: [],
  acceptedAnswers: [],
  matchingPairs: [
    { id: 60, leftMdx: 'Cão', rightMdx: 'Late' },
    { id: 61, leftMdx: 'Gato', rightMdx: 'Mia' },
  ],
  tagIds: [],
};

describe('compileQuestionForExport', () => {
  it('compiles a multiple-choice question, including all of its options, to HTML', async () => {
    const exported = await compileQuestionForExport(mcQuestion);

    expect(exported.id).toBe(1);
    expect(exported.type).toBe('multiple_choice');
    expect(exported.promptHtml).toContain('class="katex"');
    expect(exported.resolutionHtml).toContain('class="katex"');
    expect(exported.options).toHaveLength(2);
    expect(exported.options[1].isCorrect).toBe(true);
    expect(exported.options[0].textHtml).toContain('<p>');
    expect(exported.correctAnswer).toBeNull();
    expect(exported.tagIds).toEqual([5]);
  });

  it('compiles a numeric question with no options', async () => {
    const exported = await compileQuestionForExport(numericQuestion);

    expect(exported.type).toBe('numeric');
    expect(exported.options).toHaveLength(0);
    expect(exported.correctAnswer).toBe('1.5');
    expect(exported.promptHtml).toContain('class="katex"');
  });

  it('compiles a multiple-response question, including all of its options, to HTML', async () => {
    const exported = await compileQuestionForExport(multiResponseQuestion);

    expect(exported.type).toBe('multiple_response');
    expect(exported.options).toHaveLength(3);
    expect(exported.options.filter((option) => option.isCorrect)).toHaveLength(2);
    expect(exported.options[0].textHtml).toContain('<p>');
    expect(exported.correctAnswer).toBeNull();
  });

  it('compiles a true_false question with no options', async () => {
    const exported = await compileQuestionForExport(trueFalseQuestion);

    expect(exported.type).toBe('true_false');
    expect(exported.options).toHaveLength(0);
    expect(exported.correctAnswer).toBe('true');
  });

  it('passes short_text accepted answers through as plain text, uncompiled', async () => {
    const exported = await compileQuestionForExport(shortTextQuestion);

    expect(exported.type).toBe('short_text');
    expect(exported.acceptedAnswers).toEqual([
      { id: 1, text: 'Oxigênio' },
      { id: 2, text: 'O2' },
    ]);
  });

  it('compiles an ordering question’s options, preserving their order', async () => {
    const exported = await compileQuestionForExport(orderingQuestion);

    expect(exported.type).toBe('ordering');
    expect(exported.options).toHaveLength(2);
    expect(exported.options[0].textHtml).toContain('Primeiro');
    expect(exported.options[1].textHtml).toContain('Segundo');
  });

  it('compiles a matching question’s pairs, both sides, to HTML', async () => {
    const exported = await compileQuestionForExport(matchingQuestion);

    expect(exported.type).toBe('matching');
    expect(exported.matchingPairs).toHaveLength(2);
    expect(exported.matchingPairs[0].leftHtml).toContain('Cão');
    expect(exported.matchingPairs[0].rightHtml).toContain('Late');
  });
});

describe('isValidNumericCorrectAnswer', () => {
  it('rejects a comma-formatted decimal like "1,5"', () => {
    expect(isValidNumericCorrectAnswer('1,5')).toBe(false);
  });

  it('accepts a plain integer', () => {
    expect(isValidNumericCorrectAnswer('1')).toBe(true);
  });

  it('accepts a canonical decimal like "1.5"', () => {
    expect(isValidNumericCorrectAnswer('1.5')).toBe(true);
  });

  it('accepts a negative decimal like "-3.2"', () => {
    expect(isValidNumericCorrectAnswer('-3.2')).toBe(true);
  });

  it('accepts a symbolic answer like "não existe"', () => {
    expect(isValidNumericCorrectAnswer('não existe')).toBe(true);
  });

  it('accepts null (no correctAnswer set)', () => {
    expect(isValidNumericCorrectAnswer(null)).toBe(true);
  });
});

describe('assertValidNumericCorrectAnswer', () => {
  it('throws an error identifying the question id and the bad value', () => {
    expect(() => assertValidNumericCorrectAnswer({ id: 42, correctAnswer: '1,5' })).toThrow(/42/);
    expect(() => assertValidNumericCorrectAnswer({ id: 42, correctAnswer: '1,5' })).toThrow(/1,5/);
  });

  it('does not throw for a valid numeric answer', () => {
    expect(() => assertValidNumericCorrectAnswer({ id: 1, correctAnswer: '1.5' })).not.toThrow();
  });
});
