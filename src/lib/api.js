/**
 * Thin fetch wrapper for the Spring Boot API.
 * - Base URL comes from VITE_API_URL (defaults to "/api", proxied by Vite in dev).
 * - Attaches the JWT, normalises errors into ApiError, and announces expired sessions.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'shikshasetu.token';

export class ApiError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors ?? null;
  }

  /** True when the request never reached the server (offline, DNS, server down). */
  get isNetwork() {
    return this.code === 'NETWORK';
  }
}

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

export const SESSION_EXPIRED_EVENT = 'shikshasetu:session-expired';

// Lesson and quiz content is served in the UI language (English when a translation is missing).
let contentLanguage = 'en';
export const setContentLanguage = (language) => { contentLanguage = language || 'en'; };

export async function request(path, { method = 'GET', body, signal, blob = false } = {}) {
  const headers = { Accept: blob ? '*/*' : 'application/json', 'Accept-Language': contentLanguage };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK', 'You appear to be offline. Check your connection and try again.');
  }

  if (res.status === 204) return null;
  if (blob && res.ok) return res.blob();
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    // A 502/503/504 from the dev proxy means the backend itself is unreachable.
    if (!data && res.status >= 502) {
      throw new ApiError(0, 'NETWORK', 'The server is unreachable right now. Please try again shortly.');
    }
    throw new ApiError(
      res.status,
      data?.code ?? 'HTTP_ERROR',
      data?.message ?? 'Something went wrong. Please try again.',
      data?.fieldErrors,
    );
  }
  return data;
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  /** Authenticated file download (the JWT cannot ride on a plain link). */
  download: async (path, filename) => {
    const file = await request(path, { method: 'GET', blob: true });
    const url = URL.createObjectURL(file);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
