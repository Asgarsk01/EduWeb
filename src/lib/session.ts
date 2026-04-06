export type UserRole = 'ADMIN' | 'OFFICER' | 'MANAGEMENT'

const ROLE_STORAGE_KEY = 'eduweb-user-role'
const SESSION_ROLE_STORAGE_KEY = 'eduweb-session-role'

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'ADMIN',
  administrator: 'ADMIN',
  officer: 'OFFICER',
  'admission officer': 'OFFICER',
  management: 'MANAGEMENT',
  mgmt: 'MANAGEMENT',
}

const normalizeRole = (value: string | null): UserRole | null => {
  if (!value) {
    return null
  }

  const raw = value.trim().toLowerCase()
  // Check direct match for canonical values (e.g. 'ADMIN')
  if (['admin', 'officer', 'management'].includes(raw)) return raw.toUpperCase() as UserRole
  
  return ROLE_ALIASES[raw] ?? null
}

const getPersistedRole = (): UserRole | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const sessionRole = normalizeRole(window.sessionStorage.getItem(SESSION_ROLE_STORAGE_KEY))
  if (sessionRole) {
    return sessionRole
  }

  const storedRole = normalizeRole(window.localStorage.getItem(ROLE_STORAGE_KEY))
  return storedRole
}

export const getCurrentUserRole = (): UserRole => getPersistedRole() ?? 'MANAGEMENT'

export const isAuthenticated = () => getPersistedRole() !== null

export const setCurrentUserRole = (role: UserRole, rememberMe = true) => {
  if (typeof window === 'undefined') {
    return
  }

  if (rememberMe) {
    window.localStorage.setItem(ROLE_STORAGE_KEY, role)
    window.sessionStorage.removeItem(SESSION_ROLE_STORAGE_KEY)
    return
  }

  window.sessionStorage.setItem(SESSION_ROLE_STORAGE_KEY, role)
  window.localStorage.removeItem(ROLE_STORAGE_KEY)
}

export const clearCurrentUserRole = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ROLE_STORAGE_KEY)
  window.sessionStorage.removeItem(SESSION_ROLE_STORAGE_KEY)
}

export const getDefaultRouteForRole = (role: UserRole) => {
  if (role === 'ADMIN') {
    return '/admin/institution'
  }

  if (role === 'OFFICER') {
    return '/'
  }

  return '/'
}

export const canAccessApplicants = (role: UserRole) => role === 'OFFICER'

export const canAccessSettings = (role: UserRole) => role === 'ADMIN'
