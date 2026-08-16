import type { Tone } from '../types'

export type WardrobeCategory = 'top' | 'bottom' | 'outer' | 'accessory'

export interface CatalogItem {
  id: string
  category: WardrobeCategory
  name: string
  colorName: string
  image: string
  tone: Tone | 'neutral'
  description: string
}

export interface LookSelection {
  top: string
  bottom: string
  outer: string
  accessory: string
}

export interface SavedLook {
  id: string
  name: string
  selection: LookSelection
  createdAt: string
}
