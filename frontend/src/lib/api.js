import { getToken, clearAuth } from './auth';

export async function api(path, { method = 'GET', body, headers } = {}) {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

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
