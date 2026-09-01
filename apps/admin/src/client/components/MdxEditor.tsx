import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import styles from './MdxEditor.module.css';

const PREVIEW_DEBOUNCE_MS = 300;

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      apiFetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdx: value }),
      })
        .then((response) => response.json())
        .then((data: { html: string }) => setHtml(data.html));
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <>
      {label && <label>{label}</label>}
      <div className={styles.layout}>
        <textarea
          className={styles.textarea}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {/* eslint-disable-next-line react/no-danger -- rendered by our own /api/preview endpoint, not third-party input */}
        <div className={styles.preview} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}
