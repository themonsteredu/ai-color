export const JOURNEY_STEPS = [
  { key: 'entry', label: '수업 입장' },
  { key: 'quiz', label: '사전 예상' },
  { key: 'prediction', label: '예상 결과' },
  { key: 'draping', label: '실제 드레이핑' },
  { key: 'confirm', label: '타입 확정' },
  { key: 'photo', label: '내 사진' },
  { key: 'makeup', label: '메이크업' },
  { key: 'styling', label: '스타일링' },
  { key: 'result', label: 'AI 결과' },
] as const

export type JourneyKey = (typeof JOURNEY_STEPS)[number]['key']

export const journeyIndex = (key: JourneyKey) => JOURNEY_STEPS.findIndex((step) => step.key === key)
