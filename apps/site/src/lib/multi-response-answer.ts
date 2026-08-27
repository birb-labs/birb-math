export function parseSelectedOptionIds(answer: string | undefined): number[] {
  if (!answer) return [];
  return answer
    .split(',')
    .map(Number)
    .sort((a, b) => a - b);
}

export function toggleOptionId(answer: string | undefined, optionId: number): string {
  const selected = new Set(parseSelectedOptionIds(answer));

  if (selected.has(optionId)) {
    selected.delete(optionId);
  } else {
    selected.add(optionId);
  }

  return [...selected].sort((a, b) => a - b).join(',');
}
