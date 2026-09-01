import { useState } from 'react';
import { ThemeSwitcher } from '@birb-math/theme';
import { LoginPage } from './pages/LoginPage';
import { ContentTreePage } from './pages/ContentTreePage';
import { LessonEditorPage } from './pages/LessonEditorPage';
import { QuestionListPage } from './pages/QuestionListPage';
import { QuestionEditorPage } from './pages/QuestionEditorPage';
import { PublishButton } from './components/PublishButton';

type View =
  | { name: 'tree' }
  | { name: 'lesson'; lessonId: number }
  | { name: 'questions' }
  | { name: 'question'; questionId: number | null };

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>({ name: 'tree' });

  if (!loggedIn) {
    return <LoginPage onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <div>
      <nav>
        <button type="button" onClick={() => setView({ name: 'tree' })}>
          Conteúdo
        </button>
        <button type="button" onClick={() => setView({ name: 'questions' })}>
          Questões
        </button>
        <ThemeSwitcher
          labels={{
            themeLabel: 'Tema',
            appearanceLabel: 'Aparência',
            themeNames: { default: 'Padrão', solarized: 'Solarized', monokai: 'Monokai', mocha: 'Mocha' },
            modeNames: { light: 'Claro', dark: 'Escuro', system: 'Sistema' },
          }}
        />
        <PublishButton />
      </nav>
      {view.name === 'tree' && (
        <ContentTreePage onEditLesson={(lessonId) => setView({ name: 'lesson', lessonId })} />
      )}
      {view.name === 'lesson' && (
        <LessonEditorPage lessonId={view.lessonId} onDone={() => setView({ name: 'tree' })} />
      )}
      {view.name === 'questions' && (
        <QuestionListPage
          onEditQuestion={(questionId) => setView({ name: 'question', questionId })}
          onNewQuestion={() => setView({ name: 'question', questionId: null })}
        />
      )}
      {view.name === 'question' && (
        <QuestionEditorPage questionId={view.questionId} onDone={() => setView({ name: 'questions' })} />
      )}
    </div>
  );
}
