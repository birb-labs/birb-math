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
  const parsed = parseMatchingAnswer(userAnswer);

  if (Object.keys(parsed).length !== matchingPairs.length) return false;
  return matchingPairs.every((pair) => parsed[pair.id] === pair.id);
}
