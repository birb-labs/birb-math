import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderingItemsEditor } from './OrderingItemsEditor';

describe('OrderingItemsEditor', () => {
  it('renders one text input per item, numbered by position', () => {
    render(
      <OrderingItemsEditor
        items={[
          { textMdx: 'Fatorar', isCorrect: false },
          { textMdx: 'Cancelar', isCorrect: false },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('adds a blank item when "Adicionar item" is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<OrderingItemsEditor items={[{ textMdx: 'Fatorar', isCorrect: false }]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Adicionar item' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { textMdx: 'Fatorar', isCorrect: false },
      { textMdx: '', isCorrect: false },
    ]);
  });
});
