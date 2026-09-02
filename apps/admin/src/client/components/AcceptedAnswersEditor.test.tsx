import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AcceptedAnswersEditor } from './AcceptedAnswersEditor';

describe('AcceptedAnswersEditor', () => {
  it('renders one text input per accepted answer', () => {
    render(<AcceptedAnswersEditor answers={['Oxigênio', 'O2']} onChange={() => {}} />);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('adds a blank answer when "Adicionar resposta aceita" is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<AcceptedAnswersEditor answers={['Oxigênio']} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Adicionar resposta aceita' }));

    expect(onChange).toHaveBeenLastCalledWith(['Oxigênio', '']);
  });

  it('removes an answer when its "Remover" button is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<AcceptedAnswersEditor answers={['Oxigênio', 'O2']} onChange={onChange} />);

    await user.click(screen.getAllByRole('button', { name: 'Remover' })[0]);

    expect(onChange).toHaveBeenLastCalledWith(['O2']);
  });
});
