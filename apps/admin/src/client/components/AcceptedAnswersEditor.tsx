import styles from './AcceptedAnswersEditor.module.css';

export function AcceptedAnswersEditor({
  answers,
  onChange,
}: {
  answers: string[];
  onChange: (answers: string[]) => void;
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
          <input
            className={styles.textInput}
            value={answer}
            onChange={(event) => setAnswer(index, event.target.value)}
          />
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
