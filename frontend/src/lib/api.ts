export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tonopiramba_token') : null;
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  let res: Response;
  try {
    res = await fetch(API_URL + endpoint, { ...options, headers, signal: options.signal || AbortSignal.timeout(20000), cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new ApiError(res.status, message || 'Não foi possível concluir a operação.');
  }
  return data as T;
}
export async function uploadImage(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const result = await apiRequest<{ url: string }>('/media', { method: 'POST', body: JSON.stringify({ dataUrl }) });
  return result.url;
}
