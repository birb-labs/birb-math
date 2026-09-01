import { describe, expect, it, vi, afterEach } from 'vitest';
import { apiFetch } from './api';

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('always includes credentials so the session cookie is sent', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await apiFetch('/api/health');

    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith('/api/health', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('reloads the page on a 401 from a route other than login (expired session)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload: reloadSpy });

    await apiFetch('/api/lessons/tree');

    expect(reloadSpy).toHaveBeenCalledOnce();
  });

  it('does not reload on a 401 from the login route itself (wrong password)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload: reloadSpy });

    await apiFetch('/api/auth/login', { method: 'POST' });

    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('does not reload on a non-401 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const reloadSpy = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload: reloadSpy });

    await apiFetch('/api/lessons/tree');

    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
