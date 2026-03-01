import { getToken, clearAuth } from './auth';

export async function api(path, { method = 'GET', body, headers } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
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
