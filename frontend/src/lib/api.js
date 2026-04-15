import { getToken, clearAuth } from './auth';

export async function api(path, { method = 'GET', body, headers } = {}) {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL || '';

  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (fetchErr) {
    // Network-level failure: no internet, DNS error, server cold-start,
    // CORS preflight blocked, etc. — tag it so pages can show a loader.
    const err = new Error('Network unavailable. Please check your connection.');
    err.isNetworkError = true;
    throw err;
  }

  const data = await res.json().catch(() => null);

  if (res.status === 401) {
    clearAuth();
  }
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/** Returns true when an error from api() was a pure network/connectivity issue. */
export function isNetworkError(err) {
  return err?.isNetworkError === true;
}
