export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, { ...init, credentials: 'include' });

  // A 401 from any route other than the login attempt itself means the
  // session cookie is missing or expired -- reload so the SPA remounts at
  // the login gate, instead of leaving a page stuck holding state for data
  // that never arrived. `/api/auth/login` returning 401 is a normal wrong
  // username/password response, not an expired session, so it must NOT
  // trigger a reload -- that would wipe the error message before the user
  // ever sees it.
  if (response.status === 401 && path !== '/api/auth/login') {
    window.location.reload();
  }

  return response;
}
