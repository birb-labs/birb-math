'use client';

import { useState } from 'react';
import type { TopicNode } from '@birb-math/content-schema';
import { SimuladoSetup, type SimuladoConfig } from './simulado-setup';
import { SimuladoTaking } from './simulado-taking';
import { SimuladoResults } from './simulado-results';
import { SimuladoHistory } from './simulado-history';
import { selectQuestions, type ExportedQuestion } from '@/lib/simulado-selection';
import { gradeSimulado, type GradedResult } from '@/lib/grade-simulado';
import { useSimuladoHistory, type SimuladoAttempt } from '@/hooks/use-simulado-history';

type ViewState =
  | { view: 'setup' }
  | { view: 'taking'; questions: ExportedQuestion[] }
  | { view: 'results'; result: GradedResult };

export function SimuladoPageClient({ tagTree, locale }: { tagTree: TopicNode[]; locale: string }) {
  const [state, setState] = useState<ViewState>({ view: 'setup' });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const { history, addAttempt } = useSimuladoHistory();

  async function handleStart(config: SimuladoConfig) {
    const response = await fetch('/data/questions.json');
    const allQuestions: ExportedQuestion[] = await response.json();
    const selected = selectQuestions(allQuestions, config);
    setAnswers({});
    setState({ view: 'taking', questions: selected });
  }

  function handleAnswerChange(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleFinish() {
    if (state.view !== 'taking') return;
    const result = gradeSimulado(state.questions, answers, locale);
    addAttempt(result);
    setState({ view: 'results', result });
  }

  function handleViewAttempt(attempt: SimuladoAttempt) {
    setState({ view: 'results', result: attempt.result });
  }

  if (state.view === 'taking') {
    return (
      <SimuladoTaking
        questions={state.questions}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onFinish={handleFinish}
      />
    );
  }

  if (state.view === 'results') {
    return (
      <SimuladoResults result={state.result} locale={locale} onBackToSetup={() => setState({ view: 'setup' })} />
    );
  }

  return (
    <>
      <SimuladoHistory history={history} onViewAttempt={handleViewAttempt} />
      <SimuladoSetup tagTree={tagTree} onStart={handleStart} />
    </>
  );
}
