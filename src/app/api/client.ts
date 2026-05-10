const ACCESS_TOKEN_KEY = 'go_path_access_token';
const REFRESH_TOKEN_KEY = 'go_path_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const token = getRefreshToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(path, { ...options, headers });

  if (res.status === 401 && token) {
    const ok = await refreshTokens();
    if (ok) {
      headers.set('Authorization', `Bearer ${getAccessToken()}`);
      res = await fetch(path, { ...options, headers });
    } else {
      throw new ApiError(401, 'Session expired');
    }
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    const seconds = retryAfter ? parseInt(retryAfter, 10) : null;
    const wait = seconds && seconds > 0 ? ` Подождите ${seconds} сек.` : ' Попробуйте через минуту.';

    let message: string;
    if (path.includes('/submit')) {
      message = `Слишком много запросов на проверку — не более 5 в минуту.${wait}`;
    } else if (path.includes('/analyze')) {
      message = `Лимит AI-запросов исчерпан — не более 10 в минуту.${wait}`;
    } else if (path.includes('/format')) {
      message = `Слишком частое форматирование — не более 30 в минуту.${wait}`;
    } else if (path.includes('/auth') || path.includes('/refresh') || path.includes('/google')) {
      message = `Слишком много попыток авторизации.${wait}`;
    } else {
      message = `Слишком много запросов.${wait}`;
    }
    throw new ApiError(429, message);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ApiError(res.status, body.error || `HTTP ${res.status}`);
  }

  return res.json();
}
