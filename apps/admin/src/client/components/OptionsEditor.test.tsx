import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionsEditor } from './OptionsEditor';

describe('OptionsEditor', () => {
  it('uses radios for multiple_choice so only one option can be marked correct', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <OptionsEditor
        type="multiple_choice"
        options={[
          { textMdx: 'A', isCorrect: true },
          { textMdx: 'B', isCorrect: false },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    await user.click(screen.getAllByRole('radio')[1]);

    expect(onChange).toHaveBeenLastCalledWith([
      { textMdx: 'A', isCorrect: false },
      { textMdx: 'B', isCorrect: true },
    ]);
  });

  it('uses checkboxes for multiple_response so more than one option can be marked correct', () => {
    render(
      <OptionsEditor
        type="multiple_response"
        options={[
          { textMdx: 'A', isCorrect: true },
          { textMdx: 'B', isCorrect: false },
        ]}
        onChange={() => {}}
      />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('adds a blank option when "Adicionar alternativa" is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <OptionsEditor type="multiple_choice" options={[{ textMdx: 'A', isCorrect: true }]} onChange={onChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar alternativa' }));

    expect(onChange).toHaveBeenLastCalledWith([
      { textMdx: 'A', isCorrect: true },
      { textMdx: '', isCorrect: false },
    ]);
  });
});
