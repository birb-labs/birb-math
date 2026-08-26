import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import ptBR from '@/messages/pt-BR.json';
import { NumericAnswerInput } from './numeric-answer-input';

function Wrapper({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <NumericAnswerInput value={value} onChange={setValue} />
      <span data-testid="current-value">{value}</span>
    </NextIntlClientProvider>
  );
}

describe('NumericAnswerInput', () => {
  it('renders a text input and a symbol keypad', () => {
    render(<Wrapper />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '∞' })).toBeInTheDocument();
  });

  it('typing updates the value', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.type(screen.getByRole('textbox'), '42');

    expect(screen.getByTestId('current-value')).toHaveTextContent('42');
  });

  it('clicking a symbol appends it to the current value', async () => {
    const user = userEvent.setup();
    render(<Wrapper initial="1" />);

    await user.click(screen.getByRole('button', { name: '∞' }));

    expect(screen.getByTestId('current-value')).toHaveTextContent('1∞');
  });
});
