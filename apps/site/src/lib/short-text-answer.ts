export function normalizeShortTextAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function isAcceptedShortTextAnswer(userAnswer: string | undefined, acceptedAnswers: string[]): boolean {
  if (!userAnswer) return false;
  const normalizedUser = normalizeShortTextAnswer(userAnswer);
  if (normalizedUser === '') return false;
  return acceptedAnswers.some((accepted) => normalizeShortTextAnswer(accepted) === normalizedUser);
}
