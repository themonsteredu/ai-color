import type { PersonalColorType } from '../types'

export type AxisKey = 'temp' | 'value' | 'chroma'

export interface QuizOption {
  label: string
  caption: string
  swatches: string[]
  scores: Partial<Record<AxisKey, number>>
}

export interface QuizQuestion {
  id: string
  title: string
  hint: string
  axis: AxisKey
  options: [QuizOption, QuizOption]
}

/**
 * 사전 예상 질문. 정답이 없는 시각 선택형이며 AI API를 사용하지 않고
 * 웹앱 내부 점수 계산만으로 결과를 만듭니다. (API 비용 0원)
 *
 * 점수 부호 규칙
 * temp   : - 웜 / + 쿨
 * value  : - 라이트 / + 딥
 * chroma : - 클리어 / + 소프트
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'white',
    title: '얼굴 가까이 대봤을 때 더 편안해 보이는 흰색은?',
    hint: '두 흰색을 번갈아 얼굴 옆에 둔다고 생각해 보세요.',
    axis: 'temp',
    options: [
      { label: '아이보리', caption: '크림빛이 도는 부드러운 흰색', swatches: ['#FBF1DF', '#F6E7CE', '#EFDBBD'], scores: { temp: -3 } },
      { label: '스노 화이트', caption: '푸른기가 도는 깨끗한 흰색', swatches: ['#FBFCFF', '#EFF3F8', '#E1E8F1'], scores: { temp: 3 } },
    ],
  },
  {
    id: 'metal',
    title: '더 자연스럽게 어울린다고 느끼는 금속 색은?',
    hint: '손목이나 목에 올렸을 때 피부가 더 화사해지는 쪽이에요.',
    axis: 'temp',
    options: [
      { label: '골드', caption: '따뜻한 금빛', swatches: ['#E7BE74', '#D8A552', '#B8863A'], scores: { temp: -3 } },
      { label: '실버', caption: '차가운 은빛', swatches: ['#DDE1E6', '#C3C9D2', '#A3ABB7'], scores: { temp: 3 } },
    ],
  },
  {
    id: 'lip',
    title: '얼굴이 더 생기 있어 보이는 립 색은?',
    hint: '입술에 올렸을 때 얼굴이 밝아지는 쪽을 골라 주세요.',
    axis: 'temp',
    options: [
      { label: '코랄', caption: '따뜻한 과일빛 주황 핑크', swatches: ['#F58A78', '#EE6D55', '#D95B45'], scores: { temp: -3 } },
      { label: '로즈', caption: '푸른기가 느껴지는 장미 핑크', swatches: ['#DE8FAE', '#CC6389', '#B34A72'], scores: { temp: 3 } },
    ],
  },
  {
    id: 'base',
    title: '더 잘 맞는다고 느끼는 기본 옷 색은?',
    hint: '자주 입는 무채색 계열을 떠올려 보세요.',
    axis: 'temp',
    options: [
      { label: '크림 베이지', caption: '노란기가 도는 뉴트럴', swatches: ['#EFE0C6', '#D9C3A0', '#B39878'], scores: { temp: -2 } },
      { label: '쿨 그레이', caption: '푸른기가 도는 뉴트럴', swatches: ['#E2E3E5', '#BFC3C8', '#8E939B'], scores: { temp: 2 } },
    ],
  },
  {
    id: 'brightness',
    title: '내 얼굴을 더 가볍고 환하게 보이게 하는 쪽은?',
    hint: '색의 밝기(명도)를 비교하는 질문이에요.',
    axis: 'value',
    options: [
      { label: '밝은 파스텔', caption: '연하고 빛이 많은 색', swatches: ['#FBE3E8', '#DDE7F7', '#E4EEDC'], scores: { value: -3 } },
      { label: '깊고 진한 색', caption: '무게감 있고 어두운 색', swatches: ['#5E1F3A', '#274263', '#3F4A2E'], scores: { value: 3 } },
    ],
  },
  {
    id: 'brown',
    title: '브라운 계열 중 하나를 고른다면?',
    hint: '같은 계열 안에서 밝기를 비교해 보세요.',
    axis: 'value',
    options: [
      { label: '라이트 카멜', caption: '밝고 가벼운 브라운', swatches: ['#E0BE92', '#C99C68', '#B58553'], scores: { value: -2, temp: -1 } },
      { label: '딥 초콜릿', caption: '짙고 무거운 브라운', swatches: ['#6B4630', '#523425', '#3C261A'], scores: { value: 2, temp: -1 } },
    ],
  },
  {
    id: 'chroma',
    title: '얼굴과 색이 서로 잘 어울려 보이는 쪽은?',
    hint: '색의 맑기(채도)를 비교하는 질문이에요.',
    axis: 'chroma',
    options: [
      { label: '맑고 선명한 색', caption: '비비드하고 깨끗한 색', swatches: ['#E51E63', '#2F49B4', '#FFD447'], scores: { chroma: -3 } },
      { label: '부드럽고 차분한 색', caption: '회색기가 섞인 소프트 컬러', swatches: ['#C49AA6', '#A08FAE', '#94A183'], scores: { chroma: 3 } },
    ],
  },
  {
    id: 'pink',
    title: '핑크 중에서 더 잘 받는다고 느껴지는 쪽은?',
    hint: '같은 핑크라도 맑기에 따라 인상이 달라져요.',
    axis: 'chroma',
    options: [
      { label: '생생한 핑크', caption: '또렷하고 맑은 핑크', swatches: ['#FF4F8B', '#F0356F', '#D62760'], scores: { chroma: -2 } },
      { label: '더스티 핑크', caption: '차분하게 가라앉은 핑크', swatches: ['#E0BFC6', '#C49AA6', '#A97F8D'], scores: { chroma: 2 } },
    ],
  },
  {
    id: 'blue',
    title: '블루 계열 중 하나를 고른다면?',
    hint: '밝기와 맑기를 함께 비교해 보세요.',
    axis: 'chroma',
    options: [
      { label: '소프트 스카이', caption: '밝고 부드러운 블루', swatches: ['#CFE2F3', '#A9C7E3', '#8FB0CD'], scores: { chroma: 1, value: -1 } },
      { label: '선명한 로열블루', caption: '강하고 또렷한 블루', swatches: ['#2F49B4', '#23368C', '#182869'], scores: { chroma: -2, value: 1 } },
    ],
  },
  {
    id: 'mood',
    title: '전체적으로 내가 더 편안한 색 분위기는?',
    hint: '사진을 찍었을 때 마음에 드는 느낌을 떠올려 보세요.',
    axis: 'chroma',
    options: [
      { label: '은은하고 자연스럽게', caption: '색보다 내가 먼저 보이는 느낌', swatches: ['#E8DFD2', '#C9B6A4', '#A8968A'], scores: { chroma: 2, value: -1 } },
      { label: '선명하고 존재감 있게', caption: '색과 얼굴 대비가 또렷한 느낌', swatches: ['#1B1B1F', '#E51E63', '#FBFCFF'], scores: { chroma: -2, value: 1 } },
    ],
  },
]

/** 12타입 좌표 (temp, value, chroma) — 각 축은 -1 ~ +1 */
const TYPE_VECTORS: Record<PersonalColorType, [number, number, number]> = {
  'spring-light': [-0.8, -0.8, -0.1],
  'spring-bright': [-0.5, -0.15, -0.95],
  'spring-warm': [-0.95, -0.25, -0.2],
  'summer-light': [0.7, -0.75, 0.1],
  'summer-mute': [0.65, -0.25, 0.9],
  'summer-cool': [0.95, -0.2, 0],
  'autumn-mute': [-0.65, 0.3, 0.85],
  'autumn-warm': [-0.95, 0.4, -0.15],
  'autumn-deep': [-0.7, 0.9, 0.3],
  'winter-bright': [0.5, 0.05, -0.95],
  'winter-cool': [0.98, 0.4, 0],
  'winter-deep': [0.7, 0.95, -0.4],
}

const AXIS_KEYS: AxisKey[] = ['temp', 'value', 'chroma']

function maxWeight(axis: AxisKey) {
  return QUIZ_QUESTIONS.reduce((total, question) => {
    const left = Math.abs(question.options[0].scores[axis] ?? 0)
    const right = Math.abs(question.options[1].scores[axis] ?? 0)
    return total + Math.max(left, right)
  }, 0)
}

export interface AxisResult {
  key: AxisKey
  /** -1 ~ +1 정규화 값 */
  ratio: number
  /** 화면에 보여줄 축 이름 (예: COOL) */
  label: string
  /** 50 ~ 100 사이 강도 */
  score: number
  /** 한글 설명 */
  description: string
}

const AXIS_LABELS: Record<AxisKey, { negative: string; positive: string; negativeKo: string; positiveKo: string }> = {
  temp: { negative: 'WARM', positive: 'COOL', negativeKo: '따뜻한 색이 잘 어울려요', positiveKo: '시원한 색이 잘 어울려요' },
  value: { negative: 'LIGHT', positive: 'DEEP', negativeKo: '밝은 색에서 얼굴이 살아나요', positiveKo: '깊은 색에서 얼굴이 또렷해져요' },
  chroma: { negative: 'CLEAR', positive: 'SOFT', negativeKo: '맑고 선명한 색이 어울려요', positiveKo: '부드럽고 차분한 색이 어울려요' },
}

export function scoreAnswers(answers: number[]): AxisResult[] {
  const totals: Record<AxisKey, number> = { temp: 0, value: 0, chroma: 0 }
  answers.forEach((choice, index) => {
    const question = QUIZ_QUESTIONS[index]
    if (!question) return
    const option = question.options[choice === 1 ? 1 : 0]
    AXIS_KEYS.forEach((axis) => {
      totals[axis] += option.scores[axis] ?? 0
    })
  })

  return AXIS_KEYS.map((axis) => {
    const max = maxWeight(axis) || 1
    const ratio = Math.max(-1, Math.min(1, totals[axis] / max))
    const labels = AXIS_LABELS[axis]
    const positive = ratio >= 0
    return {
      key: axis,
      ratio,
      label: positive ? labels.positive : labels.negative,
      score: Math.round(50 + Math.abs(ratio) * 50),
      description: positive ? labels.positiveKo : labels.negativeKo,
    }
  })
}

export function predictType(answers: number[]): PersonalColorType {
  const [temp, value, chroma] = scoreAnswers(answers).map((axis) => axis.ratio)
  let best: PersonalColorType = 'summer-mute'
  let bestDistance = Number.POSITIVE_INFINITY
  ;(Object.keys(TYPE_VECTORS) as PersonalColorType[]).forEach((type) => {
    const [t, v, c] = TYPE_VECTORS[type]
    // 온도 축은 퍼스널컬러 판단에서 가장 큰 비중을 가집니다.
    const distance = 2.2 * (temp - t) ** 2 + (value - v) ** 2 + (chroma - c) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = type
    }
  })
  return best
}
