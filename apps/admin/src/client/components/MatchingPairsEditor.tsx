import styles from './MatchingPairsEditor.module.css';

export interface EditableMatchingPair {
  leftMdx: string;
  rightMdx: string;
}

export function MatchingPairsEditor({
  pairs,
  onChange,
}: {
  pairs: EditableMatchingPair[];
  onChange: (pairs: EditableMatchingPair[]) => void;
}) {
  function setLeft(index: number, leftMdx: string) {
    onChange(pairs.map((pair, i) => (i === index ? { ...pair, leftMdx } : pair)));
  }

  function setRight(index: number, rightMdx: string) {
    onChange(pairs.map((pair, i) => (i === index ? { ...pair, rightMdx } : pair)));
  }

  function removePair(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }

  function addPair() {
    onChange([...pairs, { leftMdx: '', rightMdx: '' }]);
  }

  return (
    <div>
      {pairs.map((pair, index) => (
        <div key={index} className={styles.row}>
          <input
            className={styles.textInput}
            placeholder="Esquerda"
            aria-label={`Esquerda ${index + 1}`}
            value={pair.leftMdx}
            onChange={(event) => setLeft(index, event.target.value)}
          />
          <input
            className={styles.textInput}
            placeholder="Direita"
            aria-label={`Direita ${index + 1}`}
            value={pair.rightMdx}
            onChange={(event) => setRight(index, event.target.value)}
          />
          <button type="button" className={styles.removeButton} onClick={() => removePair(index)}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={addPair}>
        Adicionar par
      </button>
    </div>
  );
}
