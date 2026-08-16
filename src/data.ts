import type { MakeupState, Student, Tone } from './types'

export const TONE_PALETTES: Record<Tone, string[]> = {
  warm: ['#FF8066', '#FFA071', '#FFC27A', '#D9A36C', '#9A5B38'],
  cool: ['#927BEB', '#B39EEB', '#F28BB9', '#75AEED', '#46577E'],
}

export const OUTFIT_COLORS = [
  { label: '코랄', value: '#FF6F5A' },
  { label: '살구', value: '#FFA56D' },
  { label: '카멜', value: '#C58B5A' },
  { label: '핑크', value: '#E87BA8' },
  { label: '블루', value: '#75AEED' },
]

export const MAKEUP_COLORS = [
  { label: '코랄', value: '#EF6F61' },
  { label: '살구', value: '#F59B72' },
  { label: '로즈', value: '#D95F78' },
  { label: '핑크', value: '#E979A5' },
  { label: '베리', value: '#B63B69' },
]

export const DEFAULT_MAKEUP: MakeupState = {
  lip: { label: MAKEUP_COLORS[0].label, color: MAKEUP_COLORS[0].value, intensity: 18 },
  blush: { label: MAKEUP_COLORS[1].label, color: MAKEUP_COLORS[1].value, intensity: 12 },
  eye: { label: MAKEUP_COLORS[3].label, color: MAKEUP_COLORS[3].value, intensity: 10 },
}

export const DEMO_STUDENTS: Student[] = [
  {
    id: 'demo-haneul',
    name: '김하늘',
    code: 'COLOR01',
    tone: 'warm',
    palette: TONE_PALETTES.warm,
    completed: [],
    createdAt: '2026-08-16T00:00:00.000Z',
  },
  {
    id: 'demo-bora',
    name: '윤보라',
    code: 'COOL02',
    tone: 'cool',
    palette: TONE_PALETTES.cool,
    completed: ['photo'],
    createdAt: '2026-08-16T00:00:00.000Z',
  },
]

export const toneLabel = (tone: Tone) => (tone === 'warm' ? '웜톤' : '쿨톤')
