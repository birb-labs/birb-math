export function normalizeShortTextAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// LaTeX is case-sensitive (\Delta and \delta are different commands), so
// math-mode answers are only whitespace-normalized, never lowercased or
// stripped of diacritics the way plain-text answers are. This is a
// provisional, syntactic comparison — sub-project B2 replaces it with real
// symbolic equivalence checking (e.g. accepting "3x+1" and "1+3x" as the
// same answer) without needing to touch this function's callers.
export function normalizeMathAnswer(input: string): string {
  return input.trim().replace(/\s+/g, '');
}

export function isAcceptedShortTextAnswer(
  userAnswer: string | undefined,
  acceptedAnswers: string[],
  answerFormat: 'text' | 'math' = 'text',
): boolean {
  if (!userAnswer) return false;

  const normalize = answerFormat === 'math' ? normalizeMathAnswer : normalizeShortTextAnswer;
  const normalizedUser = normalize(userAnswer);
  if (normalizedUser === '') return false;
  return acceptedAnswers.some((accepted) => normalize(accepted) === normalizedUser);
}
