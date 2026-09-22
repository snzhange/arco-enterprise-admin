// @env browser

const MOCK_SESSION_COOKIE = 'arco_mock_session'
const MOCK_ROLE_COOKIE = 'arco_mock_role'

export function clearMockSession(): void {
  document.cookie = `${MOCK_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  document.cookie = `${MOCK_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function setMockSession(role: 'admin' | 'operator' = 'admin'): void {
  document.cookie = `${MOCK_SESSION_COOKIE}=1; Path=/; SameSite=Lax`
  document.cookie = `${MOCK_ROLE_COOKIE}=${role}; Path=/; SameSite=Lax`
}
