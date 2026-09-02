import type { EditableOption } from './OptionsEditor';
import styles from './OrderingItemsEditor.module.css';

export function OrderingItemsEditor({
  items,
  onChange,
}: {
  items: EditableOption[];
  onChange: (items: EditableOption[]) => void;
}) {
  function setText(index: number, textMdx: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, textMdx } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { textMdx: '', isCorrect: false }]);
  }

  return (
    <div>
      <p className={styles.hint}>A ordem digitada aqui é a ordem correta.</p>
      {items.map((item, index) => (
        <div key={index} className={styles.row}>
          <span className={styles.position}>{index + 1}.</span>
          <input
            className={styles.textInput}
            value={item.textMdx}
            onChange={(event) => setText(index, event.target.value)}
          />
          <button type="button" className={styles.removeButton} onClick={() => removeItem(index)}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={addItem}>
        Adicionar item
      </button>
    </div>
  );
}
