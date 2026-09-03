'use client';

import { useEffect, useRef } from 'react';
import styles from './MathField.module.css';

interface MathfieldLike extends HTMLElement {
  value: string;
}

export function MathField({
  value,
  onChange,
  placeholder,
  readOnly = false,
  ariaLabel,
}: {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathfieldLike | null>(null);
  const inputHandlerRef = useRef<(() => void) | null>(null);
  // Always call the *latest* onChange from the field's real event listener,
  // without re-attaching that listener (and losing no events) every time a
  // parent passes a fresh inline callback.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    // Rendered client-side only, deliberately: creating a real <math-field>
    // during a Next.js static-export build (which runs in Node) would be
    // pointless at best. Importing 'mathlive' registers the custom element
    // as a side effect; only after that resolves is `document.createElement
    // ('math-field')` guaranteed to produce a fully-behaving element.
    import('mathlive').then(() => {
      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;

      const field = document.createElement('math-field') as MathfieldLike;
      field.className = styles.field;
      field.value = value;
      if (ariaLabel) field.setAttribute('aria-label', ariaLabel);
      if (placeholder) field.setAttribute('placeholder', placeholder);
      if (readOnly) field.setAttribute('read-only', 'true');

      function handleInput() {
        onChangeRef.current(field.value);
      }
      field.addEventListener('input', handleInput);
      inputHandlerRef.current = handleInput;

      container.appendChild(field);
      fieldRef.current = field;
    });

    return () => {
      cancelled = true;
      const field = fieldRef.current;
      if (field && inputHandlerRef.current) {
        field.removeEventListener('input', inputHandlerRef.current);
      }
      inputHandlerRef.current = null;
      field?.remove();
      fieldRef.current = null;
    };
    // Mounts the field exactly once. `value` is synced by the effect below;
    // `ariaLabel`, `placeholder`, and `readOnly` are synced by the effect
    // below that as well. None of these props trigger a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (field && field.value !== value) {
      field.value = value;
    }
  }, [value]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    if (ariaLabel) {
      field.setAttribute('aria-label', ariaLabel);
    } else {
      field.removeAttribute('aria-label');
    }

    if (placeholder) {
      field.setAttribute('placeholder', placeholder);
    } else {
      field.removeAttribute('placeholder');
    }

    if (readOnly) {
      field.setAttribute('read-only', 'true');
    } else {
      field.removeAttribute('read-only');
    }
  }, [ariaLabel, placeholder, readOnly]);

  return <div ref={containerRef} className={styles.container} />;
}
