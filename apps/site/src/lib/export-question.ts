import { renderToStaticMarkup } from 'react-dom/server';
import type { QuestionExport } from '@birb-math/content-schema';
import { compileLessonMdx } from './compile-lesson-mdx';

export interface ExportedOption {
  id: number;
  textHtml: string;
  isCorrect: boolean;
}

export interface ExportedAcceptedAnswer {
  id: number;
  text: string;
}

export interface ExportedMatchingPair {
  id: number;
  leftHtml: string;
  rightHtml: string;
}

export interface ExportedQuestion {
  id: number;
  type:
    | 'multiple_choice'
    | 'multiple_response'
    | 'numeric'
    | 'true_false'
    | 'short_text'
    | 'ordering'
    | 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
  promptHtml: string;
  options: ExportedOption[];
  acceptedAnswers: ExportedAcceptedAnswer[];
  matchingPairs: ExportedMatchingPair[];
  correctAnswer: string | null;
  resolutionHtml: string;
  tagIds: number[];
}

async function compileToHtml(source: string): Promise<string> {
  const element = await compileLessonMdx(source);
  return renderToStaticMarkup(element);
}

export { isValidNumericCorrectAnswer, assertValidNumericCorrectAnswer } from '@birb-math/content-schema';

export async function compileQuestionForExport(question: QuestionExport): Promise<ExportedQuestion> {
  const promptHtml = await compileToHtml(question.promptMdx);
  const resolutionHtml = await compileToHtml(question.resolutionMdx);

  // Only multiple_choice/multiple_response/ordering questions ever have
  // option rows (enforced by the admin route's validation) — checking
  // length directly, rather than listing those three type names again
  // here, means this guard never needs updating when a future type is
  // added unless it too stores its content in `options`.
  const options: ExportedOption[] =
    question.options.length > 0
      ? await Promise.all(
          question.options.map(async (option) => ({
            id: option.id,
            textHtml: await compileToHtml(option.textMdx),
            isCorrect: option.isCorrect,
          })),
        )
      : [];

  const acceptedAnswers: ExportedAcceptedAnswer[] = question.acceptedAnswers.map((answer) => ({
    id: answer.id,
    text: answer.text,
  }));

  const matchingPairs: ExportedMatchingPair[] = await Promise.all(
    question.matchingPairs.map(async (pair) => ({
      id: pair.id,
      leftHtml: await compileToHtml(pair.leftMdx),
      rightHtml: await compileToHtml(pair.rightMdx),
    })),
  );

  return {
    id: question.id,
    type: question.type,
    difficulty: question.difficulty,
    promptHtml,
    options,
    acceptedAnswers,
    matchingPairs,
    correctAnswer: question.correctAnswer,
    resolutionHtml,
    tagIds: question.tagIds,
  };
}
