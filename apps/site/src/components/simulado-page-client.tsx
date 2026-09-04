'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TopicNode } from '@birb-math/content-schema';
import { SimuladoSetup, type SimuladoConfig } from './simulado-setup';
import { SimuladoTaking } from './simulado-taking';
import { SimuladoResults } from './simulado-results';
import { SimuladoHistory } from './simulado-history';
import { selectQuestions, type ExportedQuestion } from '@/lib/simulado-selection';
import { gradeSimulado, type GradedResult } from '@/lib/grade-simulado';
import { useSimuladoHistory, type SimuladoAttempt } from '@/hooks/use-simulado-history';
import styles from './simulado-page-client.module.css';

type ViewState =
  | { view: 'setup' }
  | { view: 'taking'; questions: ExportedQuestion[] }
  | { view: 'results'; result: GradedResult };

export function SimuladoPageClient({ tagTree, locale }: { tagTree: TopicNode[]; locale: string }) {
  const t = useTranslations('simulado.setup');
  const tTaking = useTranslations('simulado.taking');
  const [state, setState] = useState<ViewState>({ view: 'setup' });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { history, addAttempt } = useSimuladoHistory();

  async function handleStart(config: SimuladoConfig) {
    setLoadError(null);
    setNotice(null);

    let allQuestions: ExportedQuestion[];
    try {
      const response = await fetch('/data/questions.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch questions.json: ${response.status}`);
      }
      allQuestions = await response.json();
    } catch {
      setLoadError(t('loadError'));
      return;
    }

    const selected = selectQuestions(allQuestions, config);

    if (selected.length < config.questionCount) {
      setNotice(t('notEnoughQuestions', { available: selected.length, requested: config.questionCount }));
    }

    if (selected.length === 0) {
      return;
    }

    setAnswers({});
    setState({ view: 'taking', questions: selected });
  }

  function handleAnswerChange(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleFinish() {
    if (state.view !== 'taking') return;
    setLoadError(null);
    try {
      const result = await gradeSimulado(state.questions, answers, locale);
      addAttempt(result);
      setState({ view: 'results', result });
    } catch {
      setLoadError(tTaking('gradingError'));
    }
  }

  function handleViewAttempt(attempt: SimuladoAttempt) {
    setState({ view: 'results', result: attempt.result });
  }

  if (state.view === 'taking') {
    return (
      <>
        {notice && <p className={styles.notice}>{notice}</p>}
        {loadError && <p className={styles.notice}>{loadError}</p>}
        <SimuladoTaking
          questions={state.questions}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onFinish={handleFinish}
        />
      </>
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
      {loadError && <p className={styles.notice}>{loadError}</p>}
      {notice && <p className={styles.notice}>{notice}</p>}
      <SimuladoSetup tagTree={tagTree} onStart={handleStart} />
    </>
  );
}
