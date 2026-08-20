export interface ClassSession {
  id: string
  code: string
  school: string
  label: string
  createdAt: string
}

/**
 * 수업코드 저장소 인터페이스.
 * 지금은 브라우저 localStorage 구현만 사용하지만, 같은 인터페이스로
 * 서버(API) 구현을 추가하면 화면 코드를 바꾸지 않고 교체할 수 있습니다.
 */
export interface ClassSessionStore {
  readonly kind: 'local' | 'server'
  list(): ClassSession[]
  create(input: { school: string; label: string }): ClassSession
  remove(id: string): ClassSession[]
}

const STORAGE_KEY = 'color-mate.class-sessions.v2'
const LEGACY_KEY = 'color-mate.class-sessions.v1'
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

function read(): ClassSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClassSession[]
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.code === 'string') : []
  } catch {
    return []
  }
}

function write(sessions: ClassSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function makeClassCode(existing: ClassSession[]) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const prefix = Array.from({ length: 3 }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join('')
    const number = Math.floor(100 + Math.random() * 900)
    const code = `${prefix}${number}`
    if (!existing.some((item) => item.code === code)) return code
  }
  return `CLR${Date.now().toString().slice(-4)}`
}

export const localClassSessionStore: ClassSessionStore = {
  kind: 'local',
  list: read,
  create({ school, label }) {
    const sessions = read()
    const session: ClassSession = {
      id: `cs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      code: makeClassCode(sessions),
      school: school.trim(),
      label: label.trim() || '퍼스널컬러 진로체험',
      createdAt: new Date().toISOString(),
    }
    write([session, ...sessions])
    return session
  },
  remove(id) {
    const next = read().filter((item) => item.id !== id)
    write(next)
    return next
  },
}

export const classSessionStore = localClassSessionStore
