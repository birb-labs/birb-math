import { describe, expect, it } from 'vitest';
import { signSession, verifySession } from './session';

describe('signSession / verifySession', () => {
  it('verifies a session it just signed', async () => {
    const token = await signSession({ exp: Date.now() + 60_000 }, 'test-secret');
    const payload = await verifySession(token, 'test-secret');
    expect(payload).not.toBeNull();
    expect(payload!.exp).toBeGreaterThan(Date.now());
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signSession({ exp: Date.now() + 60_000 }, 'test-secret');
    expect(await verifySession(token, 'wrong-secret')).toBeNull();
  });

  it('rejects a tampered payload', async () => {
    const token = await signSession({ exp: Date.now() + 60_000 }, 'test-secret');
    const [payloadPart, signaturePart] = token.split('.');
    const tamperedPayload = btoa(JSON.stringify({ exp: Date.now() + 999_999_999 }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(await verifySession(`${tamperedPayload}.${signaturePart}`, 'test-secret')).toBeNull();
    void payloadPart;
  });

  it('rejects an expired session', async () => {
    const token = await signSession({ exp: Date.now() - 1000 }, 'test-secret');
    expect(await verifySession(token, 'test-secret')).toBeNull();
  });
});
