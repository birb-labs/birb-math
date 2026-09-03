import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { ShortTextAnswerInput } from './short-text-answer-input';

function renderWithIntl(ui: React.ReactElement) {
  return render(<NextIntlClientProvider locale="pt-BR" messages={ptBR}>{ui}</NextIntlClientProvider>);
}

describe('ShortTextAnswerInput', () => {
  it('renders a plain text input by default', () => {
    renderWithIntl(<ShortTextAnswerInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange as the user types, in text mode', () => {
    const onChange = vi.fn();
    renderWithIntl(<ShortTextAnswerInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    // React installs a tracked setter on controlled <input> elements' `value` property
    // to dedupe redundant change events; a plain `input.value = 'a'` assignment routes
    // through that same tracker, so React sees no change and never fires `onChange`.
    // Calling the native (untracked) setter directly, then dispatching the DOM event,
    // is the standard workaround for simulating a real typed change in jsdom.
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeInputValueSetter.call(input, 'a');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('renders a MathField instead of a plain input when answerFormat is "math"', async () => {
    const { container } = renderWithIntl(
      <ShortTextAnswerInput value="" onChange={() => {}} answerFormat="math" />,
    );

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('calls onChange with the LaTeX typed into the MathField, in math mode', async () => {
    const onChange = vi.fn();
    const { container } = renderWithIntl(
      <ShortTextAnswerInput value="" onChange={onChange} answerFormat="math" />,
    );

    await waitFor(() => expect(container.querySelector('math-field')).toBeTruthy());
    const field = container.querySelector('math-field') as HTMLElement & { value: string };
    field.value = 'x^2';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('x^2');
  });
});
