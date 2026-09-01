import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { ContentTreePage } from './pages/ContentTreePage';

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

  return <p>Editor de lição (tarefa seguinte). ID: {view.lessonId}</p>;
}
