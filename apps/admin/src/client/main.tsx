import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@birb-math/theme';
import { App } from './App';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
