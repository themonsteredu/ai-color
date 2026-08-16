export type Tone = 'warm' | 'cool'

export type ActivityKey = 'photo' | 'outfit' | 'makeup' | 'compare' | 'card'

export interface Student {
  id: string
  name: string
  code: string
  tone: Tone
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
  | 'outfit'
  | 'outfitCompare'
  | 'makeup'
  | 'beforeAfter'
  | 'card'

