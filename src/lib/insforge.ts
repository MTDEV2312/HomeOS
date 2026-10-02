import { createClient } from '@insforge/sdk';

const rawBaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';

const SESSION_STORAGE_KEY = 'homeos_has_session';
const CSRF_COOKIE_NAME = 'insforge_csrf_token';

/**
 * Checks whether an active session could exist before triggering network requests.
 * Avoids firing /api/auth/refresh for unauthenticated visitors or diagnostic audits.
 */
export function hasPotentialSession(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. OAuth code in query params indicating pending OAuth callback
  if (window.location.search.includes('insforge_code')) {
    return true;
  }

  // 2. InsForge CSRF cookie present in document.cookie
  const hasCookie = document.cookie.split(';').some((item) => {
    const trimmed = item.trim();
    return trimmed.startsWith(`${CSRF_COOKIE_NAME}=`) && trimmed.length > `${CSRF_COOKIE_NAME}=`.length;
  });
  if (hasCookie) {
    return true;
  }

  // 3. Local storage marker indicating an active session
  try {
    if (localStorage.getItem(SESSION_STORAGE_KEY) === 'true') {
      return true;
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }

  return false;
}

export function markSessionActive(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

export function clearSessionMarkers(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  // Clear CSRF cookie
  document.cookie = `${CSRF_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

// Custom fetch wrapper to intercept unnecessary /api/auth/refresh calls when unauthenticated
const customFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (url.includes('/api/auth/refresh') && typeof window !== 'undefined' && !hasPotentialSession()) {
    return new Response(
      JSON.stringify({
        user: null,
        accessToken: null,
      }),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return fetch(input, init);
};

export const insforge = createClient({
  baseUrl,
  anonKey,
  fetch: customFetch,
});

export { baseUrl, anonKey };