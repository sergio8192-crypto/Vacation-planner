const TOKEN_KEY = 'vacation_auth_token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export interface AuthUser {
  id: string
  email: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(path, { ...options, headers })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(data.error ?? 'Request failed', response.status)
  }

  return data as T
}

export function register(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchCurrentUser() {
  return apiFetch<{ user: AuthUser }>('/api/auth/me')
}

export function fetchVacations<T>() {
  return apiFetch<T>('/api/vacations')
}

export function saveVacations(store: unknown) {
  return apiFetch<{ ok: boolean }>('/api/vacations', {
    method: 'PUT',
    body: JSON.stringify(store),
  })
}
