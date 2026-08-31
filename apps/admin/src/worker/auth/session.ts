interface SessionPayload {
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const payloadPart = base64UrlEncode(payloadBytes);
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, payloadBytes);
  const signaturePart = base64UrlEncode(new Uint8Array(signature));
  return `${payloadPart}.${signaturePart}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  const payloadBytes = base64UrlDecode(payloadPart);
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, base64UrlDecode(signaturePart), payloadBytes);
  if (!valid) return null;

  const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as SessionPayload;
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;

  return payload;
}
