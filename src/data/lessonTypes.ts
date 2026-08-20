import type { PersonalColorType } from '../types'

export type SlideKind = 'title' | 'content' | 'palette' | 'compare' | 'quiz' | 'gallery' | 'steps'

export interface SlideBullet {
  strong: string
  text: string
}

export interface SlideQuizOption {
  label: string
  color?: string
  correct: boolean
  why: string
}

export interface SlideQuiz {
  question: string
  hint?: string
  options: SlideQuizOption[]
}

export interface SlideCompareSide {
  title: string
  text: string
  colors?: string[]
}

export interface SlideStep {
  title: string
  text: string
}

export interface LessonSlide {
  id: string
  kind: SlideKind
  eyebrow?: string
  title: string
  lead?: string
  bullets?: SlideBullet[]
  paletteType?: PersonalColorType
  paletteTypes?: PersonalColorType[]
  compare?: { left: SlideCompareSide; right: SlideCompareSide }
  quiz?: SlideQuiz
  galleryItems?: string[]
  steps?: SlideStep[]
  /** 실제 앱 화면 이미지 (public/lesson) */
  image?: { src: string; alt: string }
  /** 교사가 던질 발문 · 진행 팁 */
  teacherNote?: string
}

export interface LessonTrack {
  key: string
  label: string
  short: string
  accent: string
  slides: LessonSlide[]
}
