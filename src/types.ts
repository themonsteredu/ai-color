export type Tone = 'warm' | 'cool'

export type PersonalColorType =
  | 'spring-light'
  | 'spring-bright'
  | 'spring-warm'
  | 'summer-light'
  | 'summer-muted'
  | 'summer-cool'
  | 'autumn-muted'
  | 'autumn-warm'
  | 'autumn-deep'
  | 'winter-bright'
  | 'winter-cool'
  | 'winter-deep'

export type ActivityKey = 'photo' | 'outfit' | 'makeup' | 'compare' | 'card'

export interface Student {
  id: string
  name: string
  code: string
  tone: Tone
  personalColorType?: PersonalColorType
  palette: string[]
  completed: ActivityKey[]
  createdAt: string
}

export interface MakeupChoice {
  color: string
  label: string
  intensity: number
}

export interface MakeupState {
  lip: MakeupChoice
  blush: MakeupChoice
  eye: MakeupChoice
}

export interface FacePlacement {
  x: number
  y: number
  scale: number
}

export type StudentScreen =
  | 'start'
  | 'result'
  | 'home'
  | 'photo'
  | 'studio'
  | 'outfit'
  | 'outfitCompare'
  | 'makeup'
  | 'beforeAfter'
  | 'card'
