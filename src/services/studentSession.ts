import type { StudentSession } from '../types'

const SESSION_KEY = 'color-mate.student-journey.v4'

const empty: StudentSession = { classCode: '', name: '', answers: [] }

export function loadStudentSession(): StudentSession {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as StudentSession
    return {
      classCode: parsed.classCode ?? '',
      name: parsed.name ?? '',
      answers: Array.isArray(parsed.answers) ? parsed.answers : [],
      predictedType: parsed.predictedType,
      confirmedType: parsed.confirmedType,
    }
  } catch {
    return empty
  }
}

export function saveStudentSession(session: StudentSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearStudentSession() {
  window.localStorage.removeItem(SESSION_KEY)
}
