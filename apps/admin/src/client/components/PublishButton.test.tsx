import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishButton } from './PublishButton';

describe('PublishButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a success message after a successful publish', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const user = userEvent.setup();

    render(<PublishButton />);
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByText('Publicação disparada — acompanhe no GitHub Actions.')).toBeInTheDocument();
  });

  it('shows an error message when the publish call fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Failed to trigger the deploy workflow' }), { status: 502 }),
    );
    const user = userEvent.setup();

    render(<PublishButton />);
    await user.click(screen.getByRole('button', { name: 'Publicar' }));

    expect(await screen.findByText('Falha ao publicar. Tente novamente.')).toBeInTheDocument();
  });
});
