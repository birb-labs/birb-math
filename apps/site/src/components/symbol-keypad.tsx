'use client';

import styles from './symbol-keypad.module.css';

const DEFAULT_SYMBOLS = ['∞', 'π', '√', 'e'];

export function SymbolKeypad({ onInsert }: { onInsert: (symbol: string) => void }) {
  return (
    <div className={styles.keypad}>
      {DEFAULT_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          className={styles.key}
          onClick={() => onInsert(symbol)}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
