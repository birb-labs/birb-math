import { MathField } from '@birb-math/math-input';
import styles from './AcceptedAnswersEditor.module.css';

export function AcceptedAnswersEditor({
  answers,
  onChange,
  answerFormat = 'text',
}: {
  answers: string[];
  onChange: (answers: string[]) => void;
  answerFormat?: 'text' | 'math';
}) {
  function setAnswer(index: number, text: string) {
    onChange(answers.map((answer, i) => (i === index ? text : answer)));
  }

  function removeAnswer(index: number) {
    onChange(answers.filter((_, i) => i !== index));
  }

  function addAnswer() {
    onChange([...answers, '']);
  }

  return (
    <div>
      {answers.map((answer, index) => (
        <div key={index} className={styles.row}>
          {answerFormat === 'math' ? (
            <MathField
              value={answer}
              onChange={(text) => setAnswer(index, text)}
              ariaLabel={`Resposta aceita ${index + 1}`}
            />
          ) : (
            <input
              className={styles.textInput}
              value={answer}
              onChange={(event) => setAnswer(index, event.target.value)}
            />
          )}
          <button type="button" className={styles.removeButton} onClick={() => removeAnswer(index)}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={addAnswer}>
        Adicionar resposta aceita
      </button>
    </div>
  );
}
