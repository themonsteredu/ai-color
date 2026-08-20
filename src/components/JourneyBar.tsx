import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { JOURNEY_STEPS, journeyIndex, type JourneyKey } from '../data/journey'

interface JourneyBarProps {
  current: JourneyKey
  title: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
}

export function JourneyBar({ current, title, subtitle, onBack, right }: JourneyBarProps) {
  const index = Math.max(0, journeyIndex(current))
  const total = JOURNEY_STEPS.length
  const percent = Math.round(((index + 1) / total) * 100)

  return (
    <header className="app-bar">
      <div className="shell">
        <div className="app-bar__inner">
          {onBack ? (
            <button className="icon-btn" type="button" onClick={onBack} aria-label="이전 단계로">
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          ) : null}
          <div className="app-bar__text">
            {subtitle ? <small>{subtitle}</small> : null}
            <strong>{title}</strong>
          </div>
          {right}
        </div>
        <div className="journey">
          <span className="journey__meta">
            단계 {index + 1}/{total}
          </span>
          <span className="journey__track">
            <span style={{ width: `${percent}%` }} />
          </span>
          <span className="journey__label">{JOURNEY_STEPS[index].label}</span>
        </div>
      </div>
    </header>
  )
}

/** 노트북 화면에서 전체 활동 흐름을 보여주는 세로 목록 */
export function JourneyOutline({ current }: { current?: JourneyKey }) {
  const currentIndex = current ? journeyIndex(current) : -1
  return (
    <ul className="journey-steps">
      {JOURNEY_STEPS.map((step, index) => {
        const state = currentIndex < 0 ? '' : index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : ''
        return (
          <li className={state} key={step.key}>
            <b>{index + 1}</b>
            <span>{step.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
