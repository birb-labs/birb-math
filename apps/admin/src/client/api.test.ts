import { describe, expect, it, vi, afterEach } from 'vitest';
import { apiFetch } from './api';

describe('apiFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('always includes credentials so the session cookie is sent', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await apiFetch('/api/health');

    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith('/api/health', expect.objectContaining({
      credentials: 'include',
    }));
  });
});
