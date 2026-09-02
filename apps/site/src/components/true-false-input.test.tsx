import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { TrueFalseInput } from './true-false-input';

describe('TrueFalseInput', () => {
  it('renders two radio options labeled Verdadeiro/Falso', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <TrueFalseInput questionId={1} value={undefined} onChange={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('radio', { name: 'Verdadeiro' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Falso' })).toBeInTheDocument();
  });

  it('calls onChange with "true" or "false" when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <TrueFalseInput questionId={1} value={undefined} onChange={onChange} />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('radio', { name: 'Falso' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('false');
  });

  it('reflects the currently selected value', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <TrueFalseInput questionId={1} value="true" onChange={() => {}} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('radio', { name: 'Verdadeiro' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Falso' })).not.toBeChecked();
  });
});
