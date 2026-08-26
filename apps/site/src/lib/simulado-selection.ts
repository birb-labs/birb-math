export type { ExportedOption, ExportedQuestion } from './export-question';

import type { SimuladoConfig } from '@/components/simulado-setup';
import type { ExportedQuestion } from './export-question';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectQuestions(all: ExportedQuestion[], config: SimuladoConfig): ExportedQuestion[] {
  const filtered = all.filter((question) => {
    const matchesTags = config.tagIds.length === 0 || question.tagIds.some((id) => config.tagIds.includes(id));
    const matchesDifficulty = config.difficulties.includes(question.difficulty);
    return matchesTags && matchesDifficulty;
  });

  return shuffle(filtered).slice(0, config.questionCount);
}
