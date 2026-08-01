import { useAppStore } from '@/store/use-app-store';

function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const storedId = localStorage.getItem('userId');
  if (storedId) return storedId;
  const storeUser = useAppStore.getState().user;
  return storeUser?.id || null;
}

export async function apiFetch(path: string, options: RequestInit = {}, isRetry = false): Promise<any> {
  let userId = getUserId();

  // If userId is missing, wait 250ms once for useSessionSync to populate localStorage/Zustand
  if (!userId && !isRetry && typeof window !== 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 250));
    userId = getUserId();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    // On 401 Unauthorized, attempt a single retry if session is hydrating
    if (res.status === 401 && !isRetry && typeof window !== 'undefined') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const retryId = getUserId();
      if (retryId) {
        return apiFetch(path, options, true);
      }
    }

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
