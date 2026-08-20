import type { MakeupOptionKey, MakeupOptions } from '../types'

export interface MakeupOptionGroup {
  key: MakeupOptionKey
  label: string
  english: string
  help: string
  options: { value: string; english: string }[]
}

/** 메이크업 LAB 컨트롤. 학생이 실제 화장대를 만지듯 단계별로 고를 수 있게 구성합니다. */
export const MAKEUP_GROUPS: MakeupOptionGroup[] = [
  {
    key: 'base',
    label: '베이스',
    english: 'BASE',
    help: '피부 표현의 마무리 느낌을 골라요.',
    options: [
      { value: '내추럴', english: 'Natural' },
      { value: '매트', english: 'Matte' },
      { value: '글로우', english: 'Glow' },
    ],
  },
  {
    key: 'brow',
    label: '눈썹',
    english: 'BROW',
    help: '눈썹 모양에 따라 인상이 크게 달라져요.',
    options: [
      { value: '일자', english: 'Straight' },
      { value: '소프트 아치', english: 'Soft arch' },
      { value: '또렷한 아치', english: 'Defined arch' },
    ],
  },
  {
    key: 'eyeStyle',
    label: '아이섀도',
    english: 'EYESHADOW',
    help: '한 가지 색부터 포인트 배색까지 선택할 수 있어요.',
    options: [
      { value: '원컬러', english: 'Single' },
      { value: '그라데이션', english: 'Gradient' },
      { value: '포인트 컬러', english: 'Point color' },
      { value: '쉬머', english: 'Shimmer' },
    ],
  },
  {
    key: 'eyeliner',
    label: '아이라인',
    english: 'EYELINER',
    help: '눈매를 얼마나 또렷하게 만들지 정해요.',
    options: [
      { value: '없음', english: 'None' },
      { value: '내추럴', english: 'Natural' },
      { value: '윙', english: 'Wing' },
      { value: '또렷하게', english: 'Defined' },
    ],
  },
  {
    key: 'lashes',
    label: '속눈썹',
    english: 'LASHES',
    help: '속눈썹 길이와 볼륨을 골라요.',
    options: [
      { value: '내추럴', english: 'Natural' },
      { value: '롱', english: 'Long' },
      { value: '볼륨', english: 'Volume' },
    ],
  },
  {
    key: 'blushPlacement',
    label: '블러셔 위치',
    english: 'BLUSH PLACEMENT',
    help: '같은 색도 위치에 따라 분위기가 달라져요.',
    options: [
      { value: '중앙', english: 'Center' },
      { value: '사선', english: 'Diagonal' },
      { value: '광대 위', english: 'High cheek' },
    ],
  },
  {
    key: 'lipFinish',
    label: '립 질감',
    english: 'LIP FINISH',
    help: '입술 표현 방식을 골라요.',
    options: [
      { value: '틴트', english: 'Tint' },
      { value: '매트', english: 'Matte' },
      { value: '글로시', english: 'Glossy' },
      { value: '그라데이션', english: 'Gradient' },
    ],
  },
  {
    key: 'highlighter',
    label: '하이라이터',
    english: 'HIGHLIGHTER',
    help: '빛이 닿는 부분을 얼마나 살릴지 정해요.',
    options: [
      { value: '없음', english: 'None' },
      { value: '내추럴', english: 'Natural' },
      { value: '글로우', english: 'Glow' },
    ],
  },
  {
    key: 'shading',
    label: '쉐딩',
    english: 'SHADING',
    help: '얼굴 윤곽 음영의 강도를 정해요.',
    options: [
      { value: '없음', english: 'None' },
      { value: '내추럴', english: 'Natural' },
      { value: '또렷하게', english: 'Defined' },
    ],
  },
  {
    key: 'point',
    label: '포인트',
    english: 'POINT',
    help: '마지막 개성 포인트를 더해요.',
    options: [
      { value: '없음', english: 'None' },
      { value: '글리터', english: 'Glitter' },
      { value: '주근깨', english: 'Freckles' },
    ],
  },
]

export interface MakeupPreset {
  key: string
  label: string
  english: string
  copy: string
  options?: Partial<MakeupOptions>
  intensity?: { lip: number; blush: number; eye: number }
}

export const MAKEUP_PRESETS: MakeupPreset[] = [
  {
    key: 'school',
    label: '스쿨 내추럴',
    english: 'SCHOOL NATURAL',
    copy: '자연스럽고 단정한 메이크업',
    options: { base: '내추럴', brow: '소프트 아치', eyeStyle: '원컬러', eyeliner: '내추럴', lashes: '내추럴', blushPlacement: '중앙', lipFinish: '틴트', highlighter: '없음', shading: '없음', point: '없음' },
    intensity: { lip: 30, blush: 22, eye: 20 },
  },
  {
    key: 'kpop',
    label: '케이팝 스테이지',
    english: 'K-POP STAGE',
    copy: '또렷한 눈매 + 포인트 색 + 글로시 립',
    options: { base: '매트', brow: '또렷한 아치', eyeStyle: '포인트 컬러', eyeliner: '윙', lashes: '볼륨', blushPlacement: '광대 위', lipFinish: '글로시', highlighter: '글로우', shading: '내추럴', point: '글리터' },
    intensity: { lip: 62, blush: 40, eye: 55 },
  },
  {
    key: 'photo',
    label: '포토 데이',
    english: 'PHOTO DAY',
    copy: '사진에서 얼굴이 또렷하게 보이는 스타일',
    options: { base: '매트', brow: '소프트 아치', eyeStyle: '그라데이션', eyeliner: '내추럴', lashes: '롱', blushPlacement: '사선', lipFinish: '그라데이션', highlighter: '내추럴', shading: '내추럴', point: '없음' },
    intensity: { lip: 46, blush: 32, eye: 36 },
  },
  {
    key: 'party',
    label: '파티 글리터',
    english: 'PARTY GLITTER',
    copy: '글리터 + 포인트 아이 메이크업',
    options: { base: '글로우', brow: '소프트 아치', eyeStyle: '쉬머', eyeliner: '또렷하게', lashes: '볼륨', blushPlacement: '광대 위', lipFinish: '글로시', highlighter: '글로우', shading: '또렷하게', point: '글리터' },
    intensity: { lip: 58, blush: 44, eye: 62 },
  },
  {
    key: 'custom',
    label: '마이 오운',
    english: 'MY OWN',
    copy: '처음부터 직접 만들기',
  },
]

export const DEFAULT_MAKEUP_OPTIONS: MakeupOptions = {
  base: '내추럴',
  brow: '소프트 아치',
  eyeStyle: '원컬러',
  eyeliner: '내추럴',
  lashes: '내추럴',
  blushPlacement: '중앙',
  lipFinish: '틴트',
  highlighter: '없음',
  shading: '없음',
  point: '없음',
}

/** 추천색 외에 다른 타입 색도 자유롭게 비교할 수 있도록 제공하는 공용 팔레트 */
export const FREE_LIP_COLORS = [
  { name: '코랄', hex: '#EF6F55' },
  { name: '살구', hex: '#F0916B' },
  { name: '로즈', hex: '#D25F7E' },
  { name: '핑크', hex: '#E6739F' },
  { name: '베리', hex: '#B33A67' },
  { name: '모브', hex: '#A2607F' },
  { name: '브릭', hex: '#A9503C' },
  { name: '버건디', hex: '#722438' },
]

export const FREE_BLUSH_COLORS = [
  { name: '피치', hex: '#F5AE92' },
  { name: '코랄', hex: '#F0876F' },
  { name: '로즈', hex: '#DE8FA5' },
  { name: '핑크', hex: '#EBA2BE' },
  { name: '모브', hex: '#BD8299' },
  { name: '테라코타', hex: '#BE7A62' },
  { name: '베리', hex: '#B4557C' },
  { name: '누드', hex: '#D6AC9A' },
]

export const FREE_EYE_COLORS = [
  { name: '베이지', hex: '#DCC0A2' },
  { name: '브라운', hex: '#A77953' },
  { name: '골드', hex: '#C9A055' },
  { name: '코랄', hex: '#DE8E77' },
  { name: '라벤더', hex: '#A08FC0' },
  { name: '그레이', hex: '#8B8B96' },
  { name: '올리브', hex: '#7E8259' },
  { name: '버건디', hex: '#8A4A55' },
]

export const OPTION_ENGLISH = (key: MakeupOptionKey, value: string) =>
  MAKEUP_GROUPS.find((group) => group.key === key)?.options.find((option) => option.value === value)?.english ?? value
