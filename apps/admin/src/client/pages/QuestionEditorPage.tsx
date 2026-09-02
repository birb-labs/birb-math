import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { MdxEditor } from '../components/MdxEditor';
import { OptionsEditor, type EditableOption } from '../components/OptionsEditor';
import { OrderingItemsEditor } from '../components/OrderingItemsEditor';
import { AcceptedAnswersEditor } from '../components/AcceptedAnswersEditor';
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

export function QuestionEditorPage({ questionId, onDone }: { questionId: number | null; onDone: () => void }) {
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [promptMdx, setPromptMdx] = useState('');
  const [resolutionMdx, setResolutionMdx] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [options, setOptions] = useState<EditableOption[]>([
    { textMdx: '', isCorrect: false },
    { textMdx: '', isCorrect: false },
  ]);
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(['']);
  const [matchingPairs, setMatchingPairs] = useState<{ leftMdx: string; rightMdx: string }[]>([
    { leftMdx: '', rightMdx: '' },
    { leftMdx: '', rightMdx: '' },
  ]);
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
          promptMdx: string;
          resolutionMdx: string;
          correctAnswer: string | null;
          options: EditableOption[];
          acceptedAnswers: { text: string }[];
          matchingPairs: { leftMdx: string; rightMdx: string }[];
          tagIds: number[];
        }>(),
      )
      .then(
        (question) => {
          setType(question.type);
          setDifficulty(question.difficulty);
          setPromptMdx(question.promptMdx);
          setResolutionMdx(question.resolutionMdx);
          setCorrectAnswer(question.correctAnswer ?? '');
          setOptions(question.options);
          setAcceptedAnswers(question.acceptedAnswers.map((a) => a.text));
          setMatchingPairs(question.matchingPairs);
          setSelectedTagIds(question.tagIds);
        },
      );
  }, [questionId]);

  async function handleSave() {
    setError(null);
    const body = {
      type,
      difficulty,
      promptMdx,
      resolutionMdx,
      correctAnswer: type === 'numeric' || type === 'true_false' ? correctAnswer : null,
      options: type === 'multiple_choice' || type === 'multiple_response' || type === 'ordering' ? options : [],
      acceptedAnswers: type === 'short_text' ? acceptedAnswers : [],
      matchingPairs: type === 'matching' ? matchingPairs : [],
      tagIds: selectedTagIds,
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

      <MdxEditor label="Enunciado" value={promptMdx} onChange={setPromptMdx} />

      {(type === 'multiple_choice' || type === 'multiple_response') && (
        <OptionsEditor type={type} options={options} onChange={setOptions} />
      )}

      {type === 'ordering' && <OrderingItemsEditor items={options} onChange={setOptions} />}

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

      {type === 'short_text' && <AcceptedAnswersEditor answers={acceptedAnswers} onChange={setAcceptedAnswers} />}

      <TagPicker tagTree={tagTree} selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

      <MdxEditor label="Resolução" value={resolutionMdx} onChange={setResolutionMdx} />

      {error && <p className={styles.error}>{error}</p>}

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        Salvar
      </button>
    </div>
  );
}
