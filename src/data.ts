import type { MakeupState, PersonalColorType, Student, Tone } from './types'

export const TONE_PALETTES: Record<Tone, string[]> = {
  warm: ['#FF8066', '#FFA071', '#FFC27A', '#D9A36C', '#9A5B38'],
  cool: ['#927BEB', '#B39EEB', '#F28BB9', '#75AEED', '#46577E'],
}

export interface PersonalColorProfile {
  type: PersonalColorType
  label: string
  shortLabel: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  tone: Tone
  keywords: string[]
  palette: string[]
  makeup: {
    lip: string[]
    blush: string[]
    eye: string[]
  }
}

export const PERSONAL_COLOR_PROFILES: Record<PersonalColorType, PersonalColorProfile> = {
  'spring-light': { type: 'spring-light', label: 'Spring Light · 봄 라이트', shortLabel: '봄 라이트', season: 'spring', tone: 'warm', keywords: ['밝음', '맑음', '가벼움'], palette: ['#FFD0BC','#FFB7A5','#FFE09D','#C8DCA4','#91C9C1'], makeup: { lip: ['#EF7D73','#F29A87','#E97F79','#F4A08D'], blush: ['#F3A287','#F7B19C','#EE947E','#F5C0AA'], eye: ['#D7A582','#E9C2A4','#B9A97F','#E8BCA8'] } },
  'spring-bright': { type: 'spring-bright', label: 'Spring Bright · 봄 브라이트', shortLabel: '봄 브라이트', season: 'spring', tone: 'warm', keywords: ['선명', '생기', '맑음'], palette: ['#FF6F61','#FF9F45','#FFD447','#75C66A','#27B6B1'], makeup: { lip: ['#F04F42','#FF654C','#E94D59','#F2674E'], blush: ['#F47F69','#FF987B','#F06D62','#F59677'], eye: ['#C98A52','#D9A24B','#B97855','#D88E67'] } },
  'spring-warm': { type: 'spring-warm', label: 'Spring Warm · 봄 웜', shortLabel: '봄 웜', season: 'spring', tone: 'warm', keywords: ['따뜻함', '골드', '코랄'], palette: ['#FF8A65','#F2A65A','#EFCB68','#A9B86E','#C58B5A'], makeup: { lip: ['#E96D57','#E77B5C','#D9614D','#F08A69'], blush: ['#ED9270','#ECA17C','#E6876A','#F1A37F'], eye: ['#B88155','#C7935C','#9E704A','#D3A06E'] } },
  'summer-light': { type: 'summer-light', label: 'Summer Light · 여름 라이트', shortLabel: '여름 라이트', season: 'summer', tone: 'cool', keywords: ['밝음', '부드러움', '파스텔'], palette: ['#D6D2F5','#BFDDF4','#F3C6D9','#C9E3DD','#DCC9EA'], makeup: { lip: ['#D985A6','#E29AB5','#C9799E','#DC8FB1'], blush: ['#E7A8C1','#E9B7CB','#DFA1BF','#EDBED1'], eye: ['#B9A8CE','#C3B7D9','#A9ABC6','#D1BFD9'] } },
  'summer-muted': { type: 'summer-muted', label: 'Summer Mute · 여름 뮤트', shortLabel: '여름 뮤트', season: 'summer', tone: 'cool', keywords: ['차분', '소프트', '더스티'], palette: ['#B49AA8','#A6A9BA','#9AB4B0','#C0A9B5','#8D859B'], makeup: { lip: ['#A85F78','#B66D82','#98596E','#AD6F82'], blush: ['#C58C9B','#B98291','#C497A2','#AA788A'], eye: ['#8F7D88','#958894','#7D7E8D','#A18F99'] } },
  'summer-cool': { type: 'summer-cool', label: 'Summer Cool · 여름 쿨', shortLabel: '여름 쿨', season: 'summer', tone: 'cool', keywords: ['시원함', '로즈', '라벤더'], palette: ['#A994E4','#87B6E3','#E08EBA','#7DA8C7','#8A79B8'], makeup: { lip: ['#C75882','#D06B91','#B94D79','#C66B93'], blush: ['#D584A7','#CB779B','#D992B2','#C781A6'], eye: ['#8D78A8','#9C8AB7','#7D7F9D','#A38FB4'] } },
  'autumn-muted': { type: 'autumn-muted', label: 'Autumn Mute · 가을 뮤트', shortLabel: '가을 뮤트', season: 'autumn', tone: 'warm', keywords: ['차분', '내추럴', '소프트'], palette: ['#A98F73','#B59A7E','#8B9270','#B07D6D','#8D796B'], makeup: { lip: ['#A85E4E','#B16B58','#965548','#A76858'], blush: ['#B77C67','#B88670','#A96F60','#C09078'], eye: ['#8B735E','#94816A','#786B58','#A08A72'] } },
  'autumn-warm': { type: 'autumn-warm', label: 'Autumn Warm · 가을 웜', shortLabel: '가을 웜', season: 'autumn', tone: 'warm', keywords: ['브릭', '골드', '테라코타'], palette: ['#C96E45','#A96F3F','#B58A45','#7A7D48','#8D5038'], makeup: { lip: ['#B64F3D','#A94736','#C25F45','#9E4638'], blush: ['#C37559','#B96A50','#CB8466','#A95F4B'], eye: ['#8A5B3E','#9A6C48','#735039','#A2734F'] } },
  'autumn-deep': { type: 'autumn-deep', label: 'Autumn Deep · 가을 딥', shortLabel: '가을 딥', season: 'autumn', tone: 'warm', keywords: ['깊음', '다크', '풍부함'], palette: ['#6F4433','#8B4A3A','#6F6B3D','#4F5B47','#5A3D35'], makeup: { lip: ['#7F3E36','#8C403A','#6D3532','#93483C'], blush: ['#9D5D4D','#8D5146','#A66B56','#7D4C42'], eye: ['#5D463A','#6C5140','#4A4038','#765846'] } },
  'winter-bright': { type: 'winter-bright', label: 'Winter Bright · 겨울 브라이트', shortLabel: '겨울 브라이트', season: 'winter', tone: 'cool', keywords: ['고대비', '비비드', '선명'], palette: ['#E91E63','#D81B60','#3949AB','#00ACC1','#7B1FA2'], makeup: { lip: ['#D61F5C','#E02967','#C81756','#D72B63'], blush: ['#D96A91','#E27AA0','#C95D88','#DB779A'], eye: ['#61508A','#4E567F','#71518F','#485A75'] } },
  'winter-cool': { type: 'winter-cool', label: 'Winter Cool · 겨울 쿨', shortLabel: '겨울 쿨', season: 'winter', tone: 'cool', keywords: ['차가움', '블루레드', '플럼'], palette: ['#B52A6A','#6C5BA7','#345995','#2F6F8F','#7A315B'], makeup: { lip: ['#A52B5C','#B52D67','#932651','#AC3A68'], blush: ['#B85D83','#A94F78','#C16B91','#9E5275'], eye: ['#61506F','#5C5D78','#704F72','#4D5A70'] } },
  'winter-deep': { type: 'winter-deep', label: 'Winter Deep · 겨울 딥', shortLabel: '겨울 딥', season: 'winter', tone: 'cool', keywords: ['깊음', '버건디', '강한 대비'], palette: ['#5B203B','#3D335F','#243B5A','#3F2A46','#71264B'], makeup: { lip: ['#71243E','#812848','#642037','#7A2D49'], blush: ['#8D4C68','#7B405B','#995873','#704055'], eye: ['#403747','#353A50','#4C354B','#303C4E'] } },
}

export const PERSONAL_COLOR_TYPES = Object.keys(PERSONAL_COLOR_PROFILES) as PersonalColorType[]
export const personalColorLabel = (type?: PersonalColorType) => type ? PERSONAL_COLOR_PROFILES[type].shortLabel : ''

export const OUTFIT_COLORS = [
  { label: '코랄', value: '#FF6F5A' }, { label: '살구', value: '#FFA56D' }, { label: '카멜', value: '#C58B5A' }, { label: '핑크', value: '#E87BA8' }, { label: '블루', value: '#75AEED' },
]

export const MAKEUP_COLORS = [
  { label: '코랄', value: '#EF6F61' }, { label: '살구', value: '#F59B72' }, { label: '로즈', value: '#D95F78' }, { label: '핑크', value: '#E979A5' }, { label: '베리', value: '#B63B69' }, { label: '모브', value: '#A85F83' }, { label: '브릭', value: '#A84F3D' }, { label: '플럼', value: '#7A315B' },
]

export const DEFAULT_MAKEUP: MakeupState = {
  lip: { label: '코랄', color: '#EF6F61', intensity: 24 }, blush: { label: '살구', color: '#F59B72', intensity: 18 }, eye: { label: '핑크', color: '#E979A5', intensity: 16 },
}

export const DEMO_STUDENTS: Student[] = [
  { id: 'demo-haneul', name: '김하늘', code: 'COLOR01', tone: 'warm', personalColorType: 'spring-light', palette: PERSONAL_COLOR_PROFILES['spring-light'].palette, completed: [], createdAt: '2026-08-16T00:00:00.000Z' },
  { id: 'demo-bora', name: '윤보라', code: 'COOL02', tone: 'cool', personalColorType: 'summer-muted', palette: PERSONAL_COLOR_PROFILES['summer-muted'].palette, completed: ['photo'], createdAt: '2026-08-16T00:00:00.000Z' },
]

export const toneLabel = (tone: Tone) => (tone === 'warm' ? '웜톤' : '쿨톤')
