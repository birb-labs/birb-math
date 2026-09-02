export function serializeOrderingAnswer(orderedOptionIds: number[]): string {
  return orderedOptionIds.join(',');
}

export function parseOrderingAnswer(answer: string | undefined): number[] {
  if (!answer) return [];
  return answer.split(',').map(Number);
}

export function isOrderingAnswerCorrect(userAnswer: string | undefined, options: { id: number }[]): boolean {
  const userSequence = parseOrderingAnswer(userAnswer);
  const correctSequence = options.map((option) => option.id);

  if (userSequence.length !== correctSequence.length) return false;
  return userSequence.every((id, index) => id === correctSequence[index]);
}
