export type { ExportedAcceptedAnswer, ExportedOption, ExportedMatchingPair, ExportedQuestion } from './export-question';

import type { SimuladoConfig } from '@/components/simulado-setup';
import type { ExportedQuestion } from './export-question';
import { shuffle } from './shuffle';

export function selectQuestions(all: ExportedQuestion[], config: SimuladoConfig): ExportedQuestion[] {
  const filtered = all.filter((question) => {
    const matchesTags = config.tagIds.length === 0 || question.tagIds.some((id) => config.tagIds.includes(id));
    const matchesDifficulty = config.difficulties.includes(question.difficulty);
    return matchesTags && matchesDifficulty;
  });

  return shuffle(filtered).slice(0, config.questionCount);
}
