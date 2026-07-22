const TOKEN_KEY = 'vacation_auth_token'
const REQUEST_TIMEOUT_MS = 12_000

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

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    const isHtml = text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')
    if (!response.ok || isHtml) {
      throw new ApiError(
        isHtml
          ? 'API returned HTML instead of JSON. The /api routes may not be deployed on Vercel.'
          : response.status === 404
            ? 'API not found. Check that /api routes are deployed on Vercel.'
            : `Server returned an invalid response (${response.status})`,
        response.status,
      )
    }
    return {}
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(path, { ...options, headers, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. The API may be unavailable.', 408)
    }
    throw new ApiError('Unable to reach the server.', 0)
  } finally {
    window.clearTimeout(timeout)
  }

  const data = await parseResponse(response)

  if (!response.ok) {
    const fallback =
      response.status === 401 && !data.error
        ? 'Unauthorized. If this is a Vercel deployment, check Deployment Protection is off for Production.'
        : 'Request failed'
    throw new ApiError(String(data.error ?? fallback), response.status)
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
