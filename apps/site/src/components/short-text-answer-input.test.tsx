import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import ptBR from '@/messages/pt-BR.json';
import { ShortTextAnswerInput } from './short-text-answer-input';

function Wrapper() {
  const [value, setValue] = useState('');
  return (
    <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
      <ShortTextAnswerInput value={value} onChange={setValue} />
      <span data-testid="current-value">{value}</span>
    </NextIntlClientProvider>
  );
}

describe('ShortTextAnswerInput', () => {
  it('renders a text input', () => {
    render(<Wrapper />);
    expect(screen.getByRole('textbox', { name: 'Sua resposta' })).toBeInTheDocument();
  });

  it('typing updates the value', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    await user.type(screen.getByRole('textbox', { name: 'Sua resposta' }), 'TVI');

    expect(screen.getByTestId('current-value')).toHaveTextContent('TVI');
  });
});
