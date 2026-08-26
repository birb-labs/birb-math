import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SymbolKeypad } from './symbol-keypad';

describe('SymbolKeypad', () => {
  it('renders a button for each default symbol', () => {
    render(<SymbolKeypad onInsert={() => {}} />);

    expect(screen.getByRole('button', { name: '∞' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'π' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '√' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'e' })).toBeInTheDocument();
  });

  it('calls onInsert with the clicked symbol', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<SymbolKeypad onInsert={onInsert} />);

    await user.click(screen.getByRole('button', { name: '∞' }));

    expect(onInsert).toHaveBeenCalledExactlyOnceWith('∞');
  });

  it('renders buttons with type="button" so they never submit a surrounding form', () => {
    render(<SymbolKeypad onInsert={() => {}} />);
    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('type', 'button');
    }
  });
});
