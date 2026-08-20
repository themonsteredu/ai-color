import { PERSONAL_COLOR_PROFILES } from './personalColors'
import { findItem } from './catalog'
import { LESSON_TRACKS } from './lesson'
import type { LessonSlide } from './lessonTypes'
import type { HwpxBlock, HwpxDocument } from '../lib/hwpx'
import type { PersonalColorType } from '../types'

const DOC_TITLE = '컬러메이트 진로체험 수업 자료'
const DOC_SUBTITLE = '퍼스널컬러 컨설턴트 · 메이크업 아티스트 · 패션 스타일리스트'

function paletteLine(type: PersonalColorType) {
  const profile = PERSONAL_COLOR_PROFILES[type]
  if (!profile) return null
  const colors = profile.palette.map((color) => color.name).join(', ')
  return `${profile.korean} (${profile.english}) — ${profile.temperature} / ${profile.value} / ${profile.chroma} · ${colors}`
}

function slideBlocks(slide: LessonSlide, order: number): HwpxBlock[] {
  const blocks: HwpxBlock[] = []
  blocks.push({ style: 'subheading', text: `${order}. ${slide.title}` })
  if (slide.lead) blocks.push({ style: 'body', text: slide.lead })

  slide.bullets?.forEach((bullet) => {
    blocks.push({ style: 'bullet', text: `${bullet.strong} — ${bullet.text}` })
  })

  slide.steps?.forEach((step, index) => {
    blocks.push({ style: 'bullet', text: `${index + 1}) ${step.title} — ${step.text}` })
  })

  if (slide.compare) {
    blocks.push({ style: 'bullet', text: `${slide.compare.left.title} — ${slide.compare.left.text}` })
    blocks.push({ style: 'bullet', text: `${slide.compare.right.title} — ${slide.compare.right.text}` })
  }

  const paletteTypes = [
    ...(slide.paletteType ? [slide.paletteType] : []),
    ...(slide.paletteTypes ?? []),
  ]
  paletteTypes.forEach((type) => {
    const line = paletteLine(type)
    if (line) blocks.push({ style: 'bullet', text: line })
  })

  if (slide.galleryItems?.length) {
    const names = slide.galleryItems
      .map((id) => findItem(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => `${item.name}(${item.colorName})`)
      .join(', ')
    if (names) blocks.push({ style: 'bullet', text: `함께 보는 옷 — ${names}` })
  }

  if (slide.quiz) {
    blocks.push({ style: 'body', text: `[문제] ${slide.quiz.question}` })
    if (slide.quiz.hint) blocks.push({ style: 'bullet', text: `힌트 — ${slide.quiz.hint}` })
    slide.quiz.options.forEach((option, index) => {
      blocks.push({ style: 'bullet', text: `${'①②③④'[index] ?? `${index + 1}`} ${option.label}` })
    })
    const correct = slide.quiz.options.findIndex((option) => option.correct)
    if (correct >= 0) {
      const option = slide.quiz.options[correct]
      blocks.push({ style: 'answer', text: `정답 ${'①②③④'[correct] ?? correct + 1} ${option.label} — ${option.why}` })
      slide.quiz.options.forEach((other, index) => {
        if (index === correct) return
        blocks.push({ style: 'note', text: `${'①②③④'[index] ?? index + 1} ${other.label}: ${other.why}` })
      })
    }
  }

  if (slide.teacherNote) blocks.push({ style: 'note', text: `교사 발문 — ${slide.teacherNote}` })
  blocks.push({ style: 'blank' })
  return blocks
}

/** 수업 자료 슬라이드 전체를 한글 문서용 문단 목록으로 바꿉니다. */
export function buildLessonDocument(): HwpxDocument {
  const blocks: HwpxBlock[] = [
    { style: 'title', text: DOC_TITLE },
    { style: 'subtitle', text: DOC_SUBTITLE },
    { style: 'blank' },
    {
      style: 'body',
      text: '이 문서는 웹앱의 수업 자료 슬라이드를 그대로 옮긴 것입니다. 슬라이드 순서대로 정리되어 있어 인쇄해서 수업 계획을 세우거나, 필요한 부분만 골라 학습지로 바꿔 쓸 수 있습니다.',
    },
    {
      style: 'body',
      text: '문제의 정답과 해설, 교사 발문까지 모두 담겨 있으므로 학생에게 그대로 나눠 줄 때는 해당 문단을 지우고 인쇄해 주세요.',
    },
    { style: 'blank' },
  ]

  LESSON_TRACKS.forEach((track) => {
    blocks.push({ style: 'heading', text: `${track.label} (${track.slides.length}장)` })
    track.slides.forEach((slide, index) => {
      blocks.push(...slideBlocks(slide, index + 1))
    })
  })

  return { title: DOC_TITLE, creator: '컬러메이트', blocks }
}

export const LESSON_DOCUMENT_FILE = '컬러메이트-수업자료.hwpx'
