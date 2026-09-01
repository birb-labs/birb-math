import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { MdxEditor } from '../components/MdxEditor';
import styles from './LessonEditorPage.module.css';

export function LessonEditorPage({ lessonId, onDone }: { lessonId: number; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [bodyMdx, setBodyMdx] = useState('');

  useEffect(() => {
    apiFetch(`/api/lessons/lessons/${lessonId}`)
      .then((response) => response.json())
      .then((lesson: { title: string; bodyMdx: string }) => {
        setTitle(lesson.title);
        setBodyMdx(lesson.bodyMdx);
      });
  }, [lessonId]);

  async function handleSave() {
    await apiFetch(`/api/lessons/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, bodyMdx }),
    });
    onDone();
  }

  return (
    <div className={styles.form}>
      <input className={styles.titleInput} value={title} onChange={(event) => setTitle(event.target.value)} />
      <MdxEditor value={bodyMdx} onChange={setBodyMdx} />
      <button type="button" className={styles.saveButton} onClick={handleSave}>
        Salvar
      </button>
    </div>
  );
}
