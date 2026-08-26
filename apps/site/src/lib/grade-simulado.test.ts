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
});
