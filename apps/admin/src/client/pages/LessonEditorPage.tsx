import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { MdxEditor } from '../components/MdxEditor';
import styles from './LessonEditorPage.module.css';

type Locale = 'pt-BR' | 'en-US' | 'es';
const LOCALES: Locale[] = ['pt-BR', 'en-US', 'es'];
type Translation = { title: string; bodyMdx: string };

export function LessonEditorPage({ lessonId, onDone }: { lessonId: number; onDone: () => void }) {
  const [activeLocale, setActiveLocale] = useState<Locale>('pt-BR');
  const [translations, setTranslations] = useState<Partial<Record<Locale, Translation>>>({});

  useEffect(() => {
    apiFetch(`/api/lessons/lessons/${lessonId}`)
      .then((response) => response.json<{ translations: Partial<Record<Locale, Translation>> }>())
      .then((lesson) => setTranslations(lesson.translations));
  }, [lessonId]);

  const current: Translation = translations[activeLocale] ?? { title: '', bodyMdx: '' };

  function updateCurrent(patch: Partial<Translation>) {
    setTranslations((prev) => ({ ...prev, [activeLocale]: { ...current, ...patch } }));
  }

  async function handleSave() {
    await apiFetch(`/api/lessons/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translations: { [activeLocale]: current } }),
    });
    onDone();
  }

  return (
    <div className={styles.form}>
      <div className={styles.localeTabs}>
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            className={locale === activeLocale ? styles.localeTabActive : styles.localeTab}
            onClick={() => setActiveLocale(locale)}
          >
            {locale}
          </button>
        ))}
      </div>
      <input
        className={styles.titleInput}
        value={current.title}
        onChange={(event) => updateCurrent({ title: event.target.value })}
      />
      <MdxEditor value={current.bodyMdx} onChange={(bodyMdx) => updateCurrent({ bodyMdx })} />
      <button type="button" className={styles.saveButton} onClick={handleSave}>
        Salvar
      </button>
    </div>
  );
}
