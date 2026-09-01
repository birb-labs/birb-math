import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import styles from './QuestionListPage.module.css';

interface AdminQuestionSummary {
  id: number;
  type: 'multiple_choice' | 'multiple_response' | 'numeric';
  difficulty: 'easy' | 'medium' | 'hard';
  promptMdx: string;
}

export function QuestionListPage({
  onEditQuestion,
  onNewQuestion,
}: {
  onEditQuestion: (id: number) => void;
  onNewQuestion: () => void;
}) {
  const [questionList, setQuestionList] = useState<AdminQuestionSummary[]>([]);

  useEffect(() => {
    apiFetch('/api/questions')
      .then((response) => response.json<AdminQuestionSummary[]>())
      .then(setQuestionList);
  }, []);

  return (
    <div>
      <button type="button" className={styles.newButton} onClick={onNewQuestion}>
        Nova questão
      </button>
      <div className={styles.list}>
        {questionList.map((question) => (
          <button
            key={question.id}
            type="button"
            className={styles.row}
            onClick={() => onEditQuestion(question.id)}
          >
            [{question.type} / {question.difficulty}] <span>{question.promptMdx}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
