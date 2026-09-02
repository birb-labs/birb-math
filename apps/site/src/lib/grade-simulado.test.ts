import { describe, expect, it } from 'vitest';
import { gradeSimulado } from './grade-simulado';
import type { ExportedQuestion } from './simulado-selection';

const mcQuestion: ExportedQuestion = {
  id: 1,
  type: 'multiple_choice',
  difficulty: 'easy',
  promptHtml: '<p>P</p>',
  options: [
    { id: 10, textHtml: '<p>1</p>', isCorrect: false },
    { id: 11, textHtml: '<p>2</p>', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: null,
  resolutionHtml: '<p>R</p>',
  tagIds: [],
};

const multiResponseQuestion: ExportedQuestion = {
  id: 5,
  type: 'multiple_response',
  difficulty: 'hard',
  promptHtml: '<p>P</p>',
  options: [
    { id: 30, textHtml: '<p>A</p>', isCorrect: true },
    { id: 31, textHtml: '<p>B</p>', isCorrect: false },
    { id: 32, textHtml: '<p>C</p>', isCorrect: true },
  ],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: null,
  resolutionHtml: '<p>R</p>',
  tagIds: [],
};

const numericQuestion: ExportedQuestion = {
  id: 2,
  type: 'numeric',
  difficulty: 'medium',
  promptHtml: '<p>P</p>',
  options: [],
  acceptedAnswers: [],
  matchingPairs: [],
  correctAnswer: '1',
  resolutionHtml: '<p>R</p>',
  tagIds: [],
};

describe('gradeSimulado', () => {
  it('grades a correct multiple-choice answer', () => {
    const result = gradeSimulado([mcQuestion], { 1: '11' }, 'pt-BR');
    expect(result.correctCount).toBe(1);
    expect(result.total).toBe(1);
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades an incorrect multiple-choice answer', () => {
    const result = gradeSimulado([mcQuestion], { 1: '10' }, 'pt-BR');
    expect(result.correctCount).toBe(0);
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a numeric answer using locale-aware normalization', () => {
    const result = gradeSimulado([numericQuestion], { 2: '1,0' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades an unanswered question as incorrect, not a crash', () => {
    const result = gradeSimulado([mcQuestion, numericQuestion], {}, 'pt-BR');
    expect(result.correctCount).toBe(0);
    expect(result.perQuestion.every((q) => !q.isCorrect)).toBe(true);
  });

  it('computes an overall correctCount/total across mixed question types', () => {
    const result = gradeSimulado([mcQuestion, numericQuestion], { 1: '11', 2: '1' }, 'pt-BR');
    expect(result.correctCount).toBe(2);
    expect(result.total).toBe(2);
  });

  it('grades a blank numeric answer as incorrect even when the correct answer is zero', () => {
    const zeroQuestion: ExportedQuestion = { ...numericQuestion, id: 3, correctAnswer: '0' };
    const result = gradeSimulado([zeroQuestion], { 3: '' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a correct decimal numeric answer for the es locale', () => {
    const decimalQuestion: ExportedQuestion = { ...numericQuestion, id: 4, correctAnswer: '1.5' };
    const result = gradeSimulado([decimalQuestion], { 4: '1,5' }, 'es');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades a multiple-response answer correct only when the exact set of correct options is selected', () => {
    const result = gradeSimulado([multiResponseQuestion], { 5: '30,32' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it('grades a multiple-response answer missing a correct option as incorrect', () => {
    const result = gradeSimulado([multiResponseQuestion], { 5: '30' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a multiple-response answer with an extra incorrect option selected as incorrect', () => {
    const result = gradeSimulado([multiResponseQuestion], { 5: '30,31,32' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades an unanswered multiple-response question as incorrect, not a crash', () => {
    const result = gradeSimulado([multiResponseQuestion], {}, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a blank multiple-response answer as incorrect', () => {
    const result = gradeSimulado([multiResponseQuestion], { 5: '' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a true_false question by exact string match', () => {
    const question: ExportedQuestion = {
      id: 10,
      type: 'true_false',
      difficulty: 'easy',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [],
      matchingPairs: [],
      correctAnswer: 'true',
      resolutionHtml: '<p>R.</p>',
      tagIds: [],
    };

    const result = gradeSimulado([question], { 10: 'true' }, 'pt-BR');
    expect(result.perQuestion[0].isCorrect).toBe(true);

    const wrongResult = gradeSimulado([question], { 10: 'false' }, 'pt-BR');
    expect(wrongResult.perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a short_text question by normalized, accent-insensitive match', () => {
    const question: ExportedQuestion = {
      id: 11,
      type: 'short_text',
      difficulty: 'medium',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [
        { id: 1, text: 'Teorema do Valor Intermediário' },
        { id: 2, text: 'TVI' },
      ],
      matchingPairs: [],
      correctAnswer: null,
      resolutionHtml: '<p>R.</p>',
      tagIds: [],
    };

    expect(gradeSimulado([question], { 11: 'tvi' }, 'pt-BR').perQuestion[0].isCorrect).toBe(true);
    expect(
      gradeSimulado([question], { 11: 'teorema do valor intermediario' }, 'pt-BR').perQuestion[0].isCorrect,
    ).toBe(true);
    expect(gradeSimulado([question], { 11: 'algo errado' }, 'pt-BR').perQuestion[0].isCorrect).toBe(false);
  });

  it('grades an ordering question by exact sequence match', () => {
    const question: ExportedQuestion = {
      id: 12,
      type: 'ordering',
      difficulty: 'medium',
      promptHtml: '<p>P?</p>',
      options: [
        { id: 100, textHtml: '<p>Fatorar</p>', isCorrect: false },
        { id: 101, textHtml: '<p>Cancelar</p>', isCorrect: false },
        { id: 102, textHtml: '<p>Substituir</p>', isCorrect: false },
      ],
      acceptedAnswers: [],
      matchingPairs: [],
      correctAnswer: null,
      resolutionHtml: '<p>R.</p>',
      tagIds: [],
    };

    expect(gradeSimulado([question], { 12: '100,101,102' }, 'pt-BR').perQuestion[0].isCorrect).toBe(true);
    expect(gradeSimulado([question], { 12: '101,100,102' }, 'pt-BR').perQuestion[0].isCorrect).toBe(false);
  });

  it('grades a matching question by exact leftId=rightId pairing', () => {
    const question: ExportedQuestion = {
      id: 13,
      type: 'matching',
      difficulty: 'hard',
      promptHtml: '<p>P?</p>',
      options: [],
      acceptedAnswers: [],
      matchingPairs: [
        { id: 1, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
        { id: 2, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
      ],
      correctAnswer: null,
      resolutionHtml: '<p>R.</p>',
      tagIds: [],
    };

    expect(gradeSimulado([question], { 13: '1:1,2:2' }, 'pt-BR').perQuestion[0].isCorrect).toBe(true);
    expect(gradeSimulado([question], { 13: '1:2,2:1' }, 'pt-BR').perQuestion[0].isCorrect).toBe(false);
  });
});
