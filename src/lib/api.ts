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
    let errorMsg = 'Request failed';
    if (typeof data.error === 'string') {
      errorMsg = data.error;
    } else if (data.error && typeof data.error === 'object') {
      const messages = Object.values(data.error).flat();
      errorMsg = messages.length > 0 ? messages.join(', ') : JSON.stringify(data.error);
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const apiGet = (path: string) => apiFetch(path, { method: 'GET' });
export const apiPost = (path: string, body: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (path: string, body: unknown) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (path: string, body?: unknown) => apiFetch(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
