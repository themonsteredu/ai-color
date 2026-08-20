export type Tone = 'warm' | 'cool'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type ValueAxis = 'light' | 'medium' | 'deep'
export type ChromaAxis = 'clear' | 'medium' | 'soft'

export type PersonalColorType =
  | 'spring-light'
  | 'spring-bright'
  | 'spring-warm'
  | 'summer-light'
  | 'summer-mute'
  | 'summer-cool'
  | 'autumn-mute'
  | 'autumn-warm'
  | 'autumn-deep'
  | 'winter-bright'
  | 'winter-cool'
  | 'winter-deep'

export interface Swatch {
  name: string
  hex: string
}

export interface PersonalColorProfile {
  type: PersonalColorType
  /** Spring Light 처럼 영문 타입명 */
  english: string
  /** 봄 라이트 처럼 한글 타입명 */
  korean: string
  season: Season
  tone: Tone
  /** 색의 온도 · 명도 · 채도 설명 문구 */
  temperature: string
  value: string
  chroma: string
  /** 추천 매칭 계산에 쓰는 축 값 */
  axis: { tone: Tone; value: ValueAxis; chroma: ChromaAxis }
  keywords: string[]
  summary: string
  palette: Swatch[]
  lip: Swatch[]
  blush: Swatch[]
  eye: Swatch[]
  outfit: Swatch[]
}

export interface MakeupChoice {
  /** 선택한 색 */
  hex: string
  /** 색 이름 */
  name: string
  /** 0~100 발색 강도 */
  intensity: number
  /** 내 타입 추천색인지 여부 */
  recommended: boolean
}

export type MakeupOptionKey =
  | 'base'
  | 'brow'
  | 'eyeStyle'
  | 'eyeliner'
  | 'lashes'
  | 'blushPlacement'
  | 'lipFinish'
  | 'highlighter'
  | 'shading'
  | 'point'

export type MakeupOptions = Record<MakeupOptionKey, string>

export interface MakeupState {
  lip: MakeupChoice
  blush: MakeupChoice
  eye: MakeupChoice
  options: MakeupOptions
  preset: string
}

export interface StudentSession {
  classCode: string
  name: string
  answers: number[]
  predictedType?: PersonalColorType
  confirmedType?: PersonalColorType
}
