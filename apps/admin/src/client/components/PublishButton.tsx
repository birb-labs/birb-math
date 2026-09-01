import { useState } from 'react';
import { apiFetch } from '../api';
import styles from './PublishButton.module.css';

export function PublishButton() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handlePublish() {
    setStatus('idle');
    const response = await apiFetch('/api/publish', { method: 'POST' });
    setStatus(response.ok ? 'success' : 'error');
  }

  return (
    <span>
      <button type="button" className={styles.button} onClick={handlePublish}>
        Publicar
      </button>
      {status === 'success' && <span className={styles.status}>Publicação disparada — acompanhe no GitHub Actions.</span>}
      {status === 'error' && <span className={styles.status}>Falha ao publicar. Tente novamente.</span>}
    </span>
  );
}
