import { renderToStaticMarkup } from 'react-dom/server';
import type { QuestionExport } from '@birb-math/content-schema';
import { compileLessonMdx } from './compile-lesson-mdx';

export interface ExportedOption {
  id: number;
  textHtml: string;
  isCorrect: boolean;
}

export interface ExportedQuestion {
  id: number;
  type: 'multiple_choice' | 'numeric';
  difficulty: 'easy' | 'medium' | 'hard';
  promptHtml: string;
  options: ExportedOption[];
  correctAnswer: string | null;
  resolutionHtml: string;
  tagIds: number[];
}

async function compileToHtml(source: string): Promise<string> {
  const element = await compileLessonMdx(source);
  return renderToStaticMarkup(element);
}

export async function compileQuestionForExport(question: QuestionExport): Promise<ExportedQuestion> {
  const promptHtml = await compileToHtml(question.promptMdx);
  const resolutionHtml = await compileToHtml(question.resolutionMdx);

  const options: ExportedOption[] =
    question.type === 'multiple_choice'
      ? await Promise.all(
          question.options.map(async (option) => ({
            id: option.id,
            textHtml: await compileToHtml(option.textMdx),
            isCorrect: option.isCorrect,
          })),
        )
      : [];

  return {
    id: question.id,
    type: question.type,
    difficulty: question.difficulty,
    promptHtml,
    options,
    correctAnswer: question.correctAnswer,
    resolutionHtml,
    tagIds: question.tagIds,
  };
}
