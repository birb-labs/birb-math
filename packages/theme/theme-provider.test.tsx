import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './theme-provider';
import { MODE_STORAGE_KEY, THEME_STORAGE_KEY } from './theme-types';

function Consumer() {
  const { theme, mode, setTheme, setMode } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="mode">{mode}</span>
      <button onClick={() => setTheme('monokai')}>set-theme</button>
      <button onClick={() => setMode('dark')}>set-mode</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('applies data-theme/data-mode to <html> and updates them when changed', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('default');
    });

    await user.click(screen.getByText('set-theme'));
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('monokai');
      expect(screen.getByTestId('theme').textContent).toBe('monokai');
    });

    await user.click(screen.getByText('set-mode'));
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    });
  });

  it('reflects a previously stored theme/mode immediately, before any interaction', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'monokai');
    window.localStorage.setItem(MODE_STORAGE_KEY, 'dark');

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('monokai');
      expect(screen.getByTestId('mode').textContent).toBe('dark');
    });
  });
});
