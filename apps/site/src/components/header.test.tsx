import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@birb-math/theme';
import ptBR from '@/messages/pt-BR.json';
import { Header } from './header';

describe('Header', () => {
  it('renders localized nav links', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: ptBR.nav.content })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ptBR.nav.simulado })).toBeInTheDocument();
  });
});
