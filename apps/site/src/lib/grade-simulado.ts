import { normalizeNumericAnswer } from './numeric-answer';
import type { ExportedQuestion } from './simulado-selection';

export interface GradedQuestionResult {
  question: ExportedQuestion;
  userAnswer: string | undefined;
  isCorrect: boolean;
}

export interface GradedResult {
  correctCount: number;
  total: number;
  perQuestion: GradedQuestionResult[];
}

function isAnswerCorrect(question: ExportedQuestion, userAnswer: string | undefined, locale: string): boolean {
  if (userAnswer === undefined) return false;

  if (question.type === 'multiple_choice') {
    const selected = question.options.find((option) => String(option.id) === userAnswer);
    return selected?.isCorrect ?? false;
  }

  if (question.correctAnswer === null) return false;

  // `question.correctAnswer` is already stored in canonical form (dot-decimal, no
  // thousands separators) — it is authored data, not locale-formatted user input. It must
  // NOT be run back through `normalizeNumericAnswer(_, locale)`: for a locale whose group
  // separator is "." (e.g. pt-BR), doing so would misinterpret the canonical decimal dot
  // as a thousands separator and strip it (turning "1.5" into "15"). Only the user's own
  // typed answer needs locale-aware normalization to convert it into canonical form.
  const normalizedUser = normalizeNumericAnswer(userAnswer, locale);
  if (normalizedUser === '') return false;

  const canonicalCorrect = question.correctAnswer.trim().toLowerCase();
  if (normalizedUser === canonicalCorrect) return true;

  // Normalization converts locale formatting (decimal/group separators) but does not
  // canonicalize numeric value (e.g. "1.0" vs "1" stay distinct strings). Fall back to
  // exact numeric equality (no tolerance/epsilon) so equivalent values still match; this
  // only applies when both sides actually parse as numbers, so symbolic answers (e.g.
  // "não existe", "∞") still rely purely on the string comparison above. Note: a blank
  // answer is rejected above, since Number('') is 0, not NaN, and would otherwise match
  // a correctAnswer of "0".
  const userValue = Number(normalizedUser);
  const correctValue = Number(canonicalCorrect);
  if (Number.isNaN(userValue) || Number.isNaN(correctValue)) return false;
  return userValue === correctValue;
}

export function gradeSimulado(
  questions: ExportedQuestion[],
  answers: Record<number, string>,
  locale: string,
): GradedResult {
  const perQuestion = questions.map((question) => {
    const userAnswer = answers[question.id];
    return {
      question,
      userAnswer,
      isCorrect: isAnswerCorrect(question, userAnswer, locale),
    };
  });

  return {
    correctCount: perQuestion.filter((result) => result.isCorrect).length,
    total: questions.length,
    perQuestion,
  };
}
