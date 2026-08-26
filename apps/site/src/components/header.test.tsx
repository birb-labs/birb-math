import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@birb-math/theme';
import ptBR from '@/messages/pt-BR.json';
import { Header } from './header';

// next-intl's `useRouter` wraps `next/navigation`'s, which throws outside of
// an actual Next.js app router tree. Scope a router mock to this test file
// rather than mocking `next/navigation` globally.
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});

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
