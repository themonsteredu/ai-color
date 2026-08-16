import type { ComponentType } from 'react'
import type { MakeupState, Tone } from '../types'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type AvatarPose = 'left' | 'front' | 'right'
export type AvatarCategory = 'face' | 'hair' | 'makeup' | 'top' | 'bottom' | 'outer' | 'accessory' | 'background' | 'card'

export interface FacePoint {
  x: number
  y: number
  z?: number
}

export interface AvatarFaceState {
  scale: number
  x: number
  y: number
  neck: number
  mask: number
  fitMode: 'auto' | 'manual'
}

export interface AvatarState {
  season: Season
  detailType: string
  face: AvatarFaceState
  hair: { styleId: string; color: string }
  makeup: MakeupState
  top: { itemId: string; color: string }
  bottom: { itemId: string; color: string }
  outer: { itemId: string; color: string }
  accessories: string[]
  backgroundId: string
  pose: AvatarPose
  flipped: boolean
  zoom: number
  favoriteColors: string[]
  recentColors: string[]
  styleName: string
}

export interface AvatarItem {
  id: string
  label: string
  kind: string
  color?: string
}

export interface AvatarRendererProps {
  state: AvatarState
  photoUrl: string
  landmarks?: FacePoint[] | null
  compact?: boolean
}

export type AvatarRenderer = ComponentType<AvatarRendererProps>

export const seasonForTone = (tone: Tone): Season => tone === 'warm' ? 'spring' : 'summer'

