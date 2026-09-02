export function serializeMatchingAnswer(pairing: Record<number, number>): string {
  return Object.entries(pairing)
    .map(([leftId, rightId]) => `${leftId}:${rightId}`)
    .join(',');
}

export function parseMatchingAnswer(answer: string | undefined): Record<number, number> {
  if (!answer) return {};

  const result: Record<number, number> = {};
  for (const pair of answer.split(',')) {
    const [leftId, rightId] = pair.split(':').map(Number);
    result[leftId] = rightId;
  }
  return result;
}

export function isMatchingAnswerCorrect(userAnswer: string | undefined, matchingPairs: { id: number }[]): boolean {
  // A matching question with zero pairs is never "correctly answered" by
  // definition — without this guard, an empty `matchingPairs` and an empty
  // parsed answer would make `.every(...)` vacuously true below.
  if (matchingPairs.length === 0) return false;

  const parsed = parseMatchingAnswer(userAnswer);

  if (Object.keys(parsed).length !== matchingPairs.length) return false;
  return matchingPairs.every((pair) => parsed[pair.id] === pair.id);
}
