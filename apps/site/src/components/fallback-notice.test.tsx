import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { FallbackNotice } from './fallback-notice';

describe('FallbackNotice', () => {
  it('renders the translated notice text', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <FallbackNotice />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(ptBR.content.notTranslatedYet)).toBeInTheDocument();
  });
});
