import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <LoginPage onLoggedIn={() => setLoggedIn(true)} />;
  }

  return <p>Autenticado. (Páginas reais chegam nas próximas tarefas.)</p>;
}
