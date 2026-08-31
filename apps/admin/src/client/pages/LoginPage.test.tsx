import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onLoggedIn after a successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();

    render(<LoginPage onLoggedIn={onLoggedIn} />);

    await user.type(screen.getByLabelText('Usuário'), 'admin');
    await user.type(screen.getByLabelText('Senha'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onLoggedIn).toHaveBeenCalledOnce();
  });

  it('shows an error message on a failed login without calling onLoggedIn', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"Invalid credentials"}', { status: 401 }));
    const onLoggedIn = vi.fn();
    const user = userEvent.setup();

    render(<LoginPage onLoggedIn={onLoggedIn} />);

    await user.type(screen.getByLabelText('Usuário'), 'admin');
    await user.type(screen.getByLabelText('Senha'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Usuário ou senha incorretos.')).toBeInTheDocument();
    expect(onLoggedIn).not.toHaveBeenCalled();
  });
});
