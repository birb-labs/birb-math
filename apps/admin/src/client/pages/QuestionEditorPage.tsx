import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { MdxEditor } from '../components/MdxEditor';
import { OptionsEditor, type EditableOption } from '../components/OptionsEditor';
import { OrderingItemsEditor } from '../components/OrderingItemsEditor';
import { AcceptedAnswersEditor } from '../components/AcceptedAnswersEditor';
import { MatchingPairsEditor, type EditableMatchingPair } from '../components/MatchingPairsEditor';
import { TagPicker, type TopicNode } from '../components/TagPicker';
import styles from './QuestionEditorPage.module.css';

type QuestionType =
  | 'multiple_choice'
  | 'multiple_response'
  | 'numeric'
  | 'true_false'
  | 'short_text'
  | 'ordering'
  | 'matching';
type Difficulty = 'easy' | 'medium' | 'hard';

type Locale = 'pt-BR' | 'en-US' | 'es';
const LOCALES: Locale[] = ['pt-BR', 'en-US', 'es'];

interface QuestionTranslation {
  promptMdx: string;
  resolutionMdx: string;
  options: EditableOption[];
  matchingPairs: EditableMatchingPair[];
}

const DEFAULT_TRANSLATION: QuestionTranslation = {
  promptMdx: '',
  resolutionMdx: '',
  options: [
    { textMdx: '', isCorrect: false },
    { textMdx: '', isCorrect: false },
  ],
  matchingPairs: [
    { leftMdx: '', rightMdx: '' },
    { leftMdx: '', rightMdx: '' },
  ],
};

export function QuestionEditorPage({ questionId, onDone }: { questionId: number | null; onDone: () => void }) {
  const [activeLocale, setActiveLocale] = useState<Locale>('pt-BR');
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [answerFormat, setAnswerFormat] = useState<'text' | 'math'>('text');
  const [translations, setTranslations] = useState<Partial<Record<Locale, QuestionTranslation>>>({});
  const [acceptedAnswersShared, setAcceptedAnswersShared] = useState<string[]>(['']);
  const [acceptedAnswersByLocale, setAcceptedAnswersByLocale] = useState<Partial<Record<Locale, string[]>>>({});
  const [tagTree, setTagTree] = useState<TopicNode[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/tags')
      .then((response) => response.json<TopicNode[]>())
      .then(setTagTree);
  }, []);

  useEffect(() => {
    if (questionId === null) return;
    apiFetch(`/api/questions/${questionId}`)
      .then((response) =>
        response.json<{
          type: QuestionType;
          difficulty: Difficulty;
          correctAnswer: string | null;
          answerFormat: 'text' | 'math';
          tagIds: number[];
          translations: Partial<Record<Locale, QuestionTranslation>>;
          acceptedAnswersShared: string[];
          acceptedAnswersByLocale: Partial<Record<Locale, string[]>>;
        }>(),
      )
      .then((question) => {
        setType(question.type);
        setDifficulty(question.difficulty);
        setCorrectAnswer(question.correctAnswer ?? '');
        setAnswerFormat(question.answerFormat);
        setSelectedTagIds(question.tagIds);
        setTranslations(question.translations);
        setAcceptedAnswersShared(question.acceptedAnswersShared.length > 0 ? question.acceptedAnswersShared : ['']);
        setAcceptedAnswersByLocale(question.acceptedAnswersByLocale);
      });
  }, [questionId]);

  const current: QuestionTranslation = translations[activeLocale] ?? DEFAULT_TRANSLATION;

  function updateCurrent(patch: Partial<QuestionTranslation>) {
    setTranslations((prev) => ({ ...prev, [activeLocale]: { ...current, ...patch } }));
  }

  const currentAcceptedAnswers = answerFormat === 'math' ? acceptedAnswersShared : (acceptedAnswersByLocale[activeLocale] ?? ['']);

  function setCurrentAcceptedAnswers(answers: string[]) {
    if (answerFormat === 'math') {
      setAcceptedAnswersShared(answers);
    } else {
      setAcceptedAnswersByLocale((prev) => ({ ...prev, [activeLocale]: answers }));
    }
  }

  async function handleSave() {
    setError(null);

    // Merge the active locale's in-progress accepted-answers draft back into the full
    // per-locale map before sending: the backend's writeAcceptedAnswers deletes ALL
    // questionAcceptedAnswers rows for the question before reinserting only what it's
    // given, so sending just `{ [activeLocale]: ... }` here would silently wipe out
    // every other locale's accepted answers on save.
    const fullAcceptedAnswersByLocale: Partial<Record<Locale, string[]>> = {
      ...acceptedAnswersByLocale,
      ...(type === 'short_text' && answerFormat === 'text'
        ? { [activeLocale]: acceptedAnswersByLocale[activeLocale] ?? [''] }
        : {}),
    };

    const body = {
      type,
      difficulty,
      correctAnswer: type === 'numeric' || type === 'true_false' ? correctAnswer : null,
      answerFormat: type === 'short_text' ? answerFormat : 'text',
      tagIds: selectedTagIds,
      translations: {
        [activeLocale]: {
          promptMdx: current.promptMdx,
          resolutionMdx: current.resolutionMdx,
          options: type === 'multiple_choice' || type === 'multiple_response' || type === 'ordering' ? current.options : [],
          matchingPairs: type === 'matching' ? current.matchingPairs : [],
        },
      },
      acceptedAnswersShared: type === 'short_text' && answerFormat === 'math' ? acceptedAnswersShared : [],
      acceptedAnswersByLocale: type === 'short_text' && answerFormat === 'text' ? fullAcceptedAnswersByLocale : {},
    };

    const response =
      questionId === null
        ? await apiFetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await apiFetch(`/api/questions/${questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }

    onDone();
  }

  return (
    <div className={styles.form}>
      <div className={styles.localeTabs}>
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            className={locale === activeLocale ? styles.localeTabActive : styles.localeTab}
            onClick={() => setActiveLocale(locale)}
          >
            {locale}
          </button>
        ))}
      </div>

      <label htmlFor="type">Tipo</label>
      <select
        id="type"
        className={styles.select}
        value={type}
        onChange={(event) => setType(event.target.value as QuestionType)}
      >
        <option value="multiple_choice">Múltipla escolha (uma correta)</option>
        <option value="multiple_response">Múltipla resposta (várias corretas)</option>
        <option value="numeric">Numérica</option>
        <option value="true_false">Verdadeiro ou falso</option>
        <option value="short_text">Texto curto</option>
        <option value="ordering">Ordenação</option>
        <option value="matching">Associação</option>
      </select>

      <label htmlFor="difficulty">Dificuldade</label>
      <select
        id="difficulty"
        className={styles.select}
        value={difficulty}
        onChange={(event) => setDifficulty(event.target.value as Difficulty)}
      >
        <option value="easy">Fácil</option>
        <option value="medium">Médio</option>
        <option value="hard">Difícil</option>
      </select>

      <MdxEditor label="Enunciado" value={current.promptMdx} onChange={(promptMdx) => updateCurrent({ promptMdx })} />

      {(type === 'multiple_choice' || type === 'multiple_response') && (
        <OptionsEditor type={type} options={current.options} onChange={(options) => updateCurrent({ options })} />
      )}

      {type === 'ordering' && (
        <OrderingItemsEditor items={current.options} onChange={(options) => updateCurrent({ options })} />
      )}

      {(type === 'numeric' || type === 'true_false') && (
        <>
          <label htmlFor="correct-answer">Resposta correta</label>
          {type === 'true_false' ? (
            <select
              id="correct-answer"
              className={styles.select}
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="true">Verdadeiro</option>
              <option value="false">Falso</option>
            </select>
          ) : (
            <input
              id="correct-answer"
              className={styles.textInput}
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
            />
          )}
        </>
      )}

      {type === 'short_text' && (
        <>
          <label htmlFor="answer-format">Modo de resposta</label>
          <select
            id="answer-format"
            className={styles.select}
            value={answerFormat}
            onChange={(event) => setAnswerFormat(event.target.value as 'text' | 'math')}
          >
            <option value="text">Texto</option>
            <option value="math">Matemática</option>
          </select>
          <AcceptedAnswersEditor
            answers={currentAcceptedAnswers}
            onChange={setCurrentAcceptedAnswers}
            answerFormat={answerFormat}
          />
        </>
      )}

      {type === 'matching' && (
        <MatchingPairsEditor pairs={current.matchingPairs} onChange={(matchingPairs) => updateCurrent({ matchingPairs })} />
      )}

      <TagPicker tagTree={tagTree} selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

      <MdxEditor
        label="Resolução"
        value={current.resolutionMdx}
        onChange={(resolutionMdx) => updateCurrent({ resolutionMdx })}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        Salvar
      </button>
    </div>
  );
}
