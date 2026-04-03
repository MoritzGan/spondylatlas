import { auth } from './firebase'

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  requireAuth?: boolean
  optionalAuth?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, requireAuth = false, optionalAuth = false } = options
  const headers = new Headers()

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (requireAuth || optionalAuth) {
    const user = auth.currentUser
    if (!user && requireAuth) {
      throw new Error('Authentication required')
    }

    if (user) {
      headers.set('Authorization', `Bearer ${await user.getIdToken(true)}`)
    }
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data as T
}
