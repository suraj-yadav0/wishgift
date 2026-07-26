export async function apiFetch(path: string, options: RequestInit = {}) {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Request failed');
  }
  return res.json();
}

export const apiGet = (path: string) => apiFetch(path, { method: 'GET' });
export const apiPost = (path: string, body: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (path: string, body: unknown) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (path: string, body?: unknown) => apiFetch(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
