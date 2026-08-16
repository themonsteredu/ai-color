import { DEMO_STUDENTS } from './data'
import type { Student } from './types'

const STORAGE_KEY = 'color-mate.students.v1'

export function loadStudents(): Student[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_STUDENTS))
      return DEMO_STUDENTS
    }
    const parsed = JSON.parse(stored) as Student[]
    return Array.isArray(parsed) ? parsed : DEMO_STUDENTS
  } catch {
    return DEMO_STUDENTS
  }
}

export function saveStudents(students: Student[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
}

export function createActivityCode(students: Student[]) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
    const suffix = Math.floor(100 + Math.random() * 900)
    const code = `${prefix}${suffix}`
    if (!students.some((student) => student.code === code)) return code
  }
  return `CLR${Date.now().toString().slice(-4)}`
}

