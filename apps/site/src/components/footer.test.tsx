import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import ptBR from '@/messages/pt-BR.json';
import { Footer } from './footer';
import styles from './footer.module.css';

describe('Footer', () => {
  it('renders a discreet donate link alongside contact and source code links', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={ptBR}>
        <Footer />
      </NextIntlClientProvider>,
    );

    const donateLink = screen.getByRole('link', { name: ptBR.footer.donate });
    expect(donateLink).toHaveAttribute('href', 'https://ko-fi.com/p4tit0z');
    expect(donateLink.closest('footer')).toHaveClass(styles.footer);

    expect(screen.getByRole('link', { name: ptBR.footer.contact })).toHaveAttribute(
      'href',
      'mailto:contato@birblabs.com',
    );
    expect(screen.getByRole('link', { name: ptBR.footer.sourceCode })).toHaveAttribute(
      'href',
      'https://github.com/birb-labs/birb-math',
    );
  });
});
