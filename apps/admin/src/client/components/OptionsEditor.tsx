import styles from './OptionsEditor.module.css';

export interface EditableOption {
  textMdx: string;
  isCorrect: boolean;
}

export function OptionsEditor({
  type,
  options,
  onChange,
}: {
  type: 'multiple_choice' | 'multiple_response';
  options: EditableOption[];
  onChange: (options: EditableOption[]) => void;
}) {
  function setCorrect(index: number) {
    if (type === 'multiple_choice') {
      onChange(options.map((option, i) => ({ ...option, isCorrect: i === index })));
    } else {
      onChange(options.map((option, i) => (i === index ? { ...option, isCorrect: !option.isCorrect } : option)));
    }
  }

  function setText(index: number, textMdx: string) {
    onChange(options.map((option, i) => (i === index ? { ...option, textMdx } : option)));
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function addOption() {
    onChange([...options, { textMdx: '', isCorrect: false }]);
  }

  return (
    <div>
      {options.map((option, index) => (
        <div key={index} className={styles.row}>
          <input
            type={type === 'multiple_choice' ? 'radio' : 'checkbox'}
            name="correct-option"
            checked={option.isCorrect}
            onChange={() => setCorrect(index)}
          />
          <input
            className={styles.textInput}
            value={option.textMdx}
            onChange={(event) => setText(index, event.target.value)}
          />
          <button type="button" className={styles.removeButton} onClick={() => removeOption(index)}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={addOption}>
        Adicionar alternativa
      </button>
    </div>
  );
}
