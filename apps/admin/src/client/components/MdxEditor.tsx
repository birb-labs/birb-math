import { useEffect, useRef, useState } from 'react';
import { MathField } from '@birb-math/math-input';
import { apiFetch } from '../api';
import { insertAtCursor } from '../insert-at-cursor';
import styles from './MdxEditor.module.css';

const PREVIEW_DEBOUNCE_MS = 300;

// jsdom (this project's pinned test-environment version, 30.0.1) does not
// implement HTMLDialogElement.prototype.showModal/.close — only the `open`
// IDL attribute works there. Real browsers always take the showModal()/
// close() branch, with full native modal semantics (focus trap,
// Escape-to-close, top-layer rendering); the `open`-attribute fallback exists
// purely so this dialog's content stays queryable under the test suite.
function openDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

function closeDialogElement(dialog: HTMLDialogElement) {
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
  }
}

export function MdxEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [html, setHtml] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef({ start: 0, end: 0 });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formulaLatex, setFormulaLatex] = useState('');
  const [formulaIsBlock, setFormulaIsBlock] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      apiFetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdx: value }),
      })
        .then((response) => response.json<{ html: string }>())
        .then((data) => setHtml(data.html));
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (dialogOpen) {
      const dialog = dialogRef.current;
      if (dialog) openDialog(dialog);
    }
  }, [dialogOpen]);

  function captureCursor() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    cursorRef.current = { start: textarea.selectionStart, end: textarea.selectionEnd };
  }

  function openFormulaDialog() {
    setFormulaLatex('');
    setFormulaIsBlock(false);
    setDialogOpen(true);
  }

  function closeFormulaDialog() {
    setDialogOpen(false);
    const dialog = dialogRef.current;
    if (dialog) closeDialogElement(dialog);
    textareaRef.current?.focus();
  }

  function confirmInsertFormula() {
    const { start, end } = cursorRef.current;
    const snippet = formulaIsBlock ? `$$${formulaLatex}$$` : `$${formulaLatex}$`;
    onChange(insertAtCursor(value, start, end, snippet));
    closeFormulaDialog();
  }

  return (
    <>
      {label && <label>{label}</label>}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarButton}
          onMouseDown={captureCursor}
          onClick={openFormulaDialog}
        >
          Inserir fórmula
        </button>
      </div>
      <div className={styles.layout}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {/* eslint-disable-next-line react/no-danger -- rendered by our own /api/preview endpoint, not third-party input */}
        <div className={styles.preview} dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <dialog ref={dialogRef} className={styles.dialog} onClose={() => setDialogOpen(false)}>
        {dialogOpen && (
          <>
            <MathField value={formulaLatex} onChange={setFormulaLatex} ariaLabel="Fórmula" />
            <label className={styles.blockToggle}>
              <input
                type="checkbox"
                checked={formulaIsBlock}
                onChange={(event) => setFormulaIsBlock(event.target.checked)}
              />
              Bloco (linha própria)
            </label>
            <div className={styles.dialogActions}>
              <button type="button" onClick={closeFormulaDialog}>
                Cancelar
              </button>
              <button type="button" disabled={formulaLatex.trim() === ''} onClick={confirmInsertFormula}>
                Inserir
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
