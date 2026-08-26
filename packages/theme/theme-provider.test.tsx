import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './theme-provider';

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
});
