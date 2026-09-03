import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('renders a MathField instead of a text input per answer when answerFormat is "math"', async () => {
    const { container } = render(
      <AcceptedAnswersEditor answers={['x^2']} onChange={() => {}} answerFormat="math" />,
    );

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls onChange with the LaTeX typed into a math-mode accepted answer', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <AcceptedAnswersEditor answers={['']} onChange={onChange} answerFormat="math" />,
    );

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    const field = container.querySelector('math-field') as HTMLElement & { value: string };
    field.value = '2x';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith(['2x']);
  });
});
