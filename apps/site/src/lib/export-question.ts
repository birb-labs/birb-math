import { renderToStaticMarkup } from 'react-dom/server';
import type { QuestionExport } from '@birb-math/content-schema';
import { compileLessonMdx } from './compile-lesson-mdx';

export interface ExportedOption {
  id: number;
  textHtml: string;
  isCorrect: boolean;
}

export interface ExportedQuestion {
  id: number;
  type: 'multiple_choice' | 'multiple_response' | 'numeric';
  difficulty: 'easy' | 'medium' | 'hard';
  promptHtml: string;
  options: ExportedOption[];
  correctAnswer: string | null;
  resolutionHtml: string;
  tagIds: number[];
}

async function compileToHtml(source: string): Promise<string> {
  const element = await compileLessonMdx(source);
  return renderToStaticMarkup(element);
}

// Canonical numeric form: optional sign, digits, optional single decimal dot
// (e.g. "1", "-3.2", "+0.5"). Locale-formatted separators (comma decimals,
// grouping dots) are normalized elsewhere at grading time, not stored here.
const CANONICAL_NUMERIC_PATTERN = /^[+-]?\d+(\.\d+)?$/;

/**
 * Validates that a numeric question's `correctAnswer` is either a
 * well-formed canonical numeric string or a plausible symbolic answer
 * (e.g. "não existe", "∞").
 *
 * A string is only rejected when it contains a digit but doesn't match the
 * canonical numeric pattern -- that heuristic catches an accidental
 * locale-formatted number (e.g. "1,5" or "1.000") that was clearly meant to
 * be numeric but has a stray separator, without requiring a strict
 * symbolic-answer allowlist.
 */
export function isValidNumericCorrectAnswer(correctAnswer: string | null): boolean {
  if (correctAnswer === null) return true;
  if (CANONICAL_NUMERIC_PATTERN.test(correctAnswer)) return true;
  return !/\d/.test(correctAnswer);
}

/**
 * Throws a descriptive error if a numeric question's `correctAnswer` isn't
 * well-formed, so a build fails loudly instead of shipping an ungradeable
 * question.
 */
export function assertValidNumericCorrectAnswer(question: { id: number; correctAnswer: string | null }): void {
  if (!isValidNumericCorrectAnswer(question.correctAnswer)) {
    throw new Error(
      `Question ${question.id}: correctAnswer "${question.correctAnswer}" is not a valid numeric answer. ` +
        `Numeric answers must match ${CANONICAL_NUMERIC_PATTERN} (e.g. "1", "-3.2") or be a symbolic answer ` +
        `containing no digits (e.g. "não existe", "∞"). Did you mean to use "." instead of "," as the decimal separator?`,
    );
  }
}

export async function compileQuestionForExport(question: QuestionExport): Promise<ExportedQuestion> {
  const promptHtml = await compileToHtml(question.promptMdx);
  const resolutionHtml = await compileToHtml(question.resolutionMdx);

  const options: ExportedOption[] =
    question.type !== 'numeric'
      ? await Promise.all(
          question.options.map(async (option) => ({
            id: option.id,
            textHtml: await compileToHtml(option.textMdx),
            isCorrect: option.isCorrect,
          })),
        )
      : [];

  return {
    id: question.id,
    type: question.type,
    difficulty: question.difficulty,
    promptHtml,
    options,
    correctAnswer: question.correctAnswer,
    resolutionHtml,
    tagIds: question.tagIds,
  };
}
