const API_BASE = 'https://contatore-production.up.railway.app';

export function apiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000,
): Promise<Response> {
  const ctrl = new AbortController();
  const id   = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}
