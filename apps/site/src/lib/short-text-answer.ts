import { isEquivalentExpression } from './math-equivalence';

export function normalizeShortTextAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export async function isAcceptedShortTextAnswer(
  userAnswer: string | undefined,
  acceptedAnswers: string[],
  answerFormat: 'text' | 'math' = 'text',
): Promise<boolean> {
  if (!userAnswer) return false;

  if (answerFormat === 'math') {
    for (const accepted of acceptedAnswers) {
      if (await isEquivalentExpression(userAnswer, accepted)) return true;
    }
    return false;
  }

  const normalizedUser = normalizeShortTextAnswer(userAnswer);
  if (normalizedUser === '') return false;
  return acceptedAnswers.some((accepted) => normalizeShortTextAnswer(accepted) === normalizedUser);
}
