import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { ContentTreePage } from './pages/ContentTreePage';
import { LessonEditorPage } from './pages/LessonEditorPage';

type View = { name: 'tree' } | { name: 'lesson'; lessonId: number };

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>({ name: 'tree' });

  if (!loggedIn) {
    return <LoginPage onLoggedIn={() => setLoggedIn(true)} />;
  }

  if (view.name === 'tree') {
    return <ContentTreePage onEditLesson={(lessonId) => setView({ name: 'lesson', lessonId })} />;
  }

  return <LessonEditorPage lessonId={view.lessonId} onDone={() => setView({ name: 'tree' })} />;
}
