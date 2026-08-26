'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { SymbolKeypad } from './symbol-keypad';
import styles from './numeric-answer-input.module.css';

export function NumericAnswerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('simulado.results');
  const inputRef = useRef<HTMLInputElement>(null);

  function insertSymbol(symbol: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + symbol + value.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      input?.setSelectionRange(start + symbol.length, start + symbol.length);
      input?.focus();
    });
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t('yourAnswer')}
      />
      <SymbolKeypad onInsert={insertSymbol} />
    </div>
  );
}
