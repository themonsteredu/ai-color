import { Check } from 'lucide-react'
import type { CSSProperties } from 'react'
import { JourneyBar } from '../components/JourneyBar'
import { PaletteBar } from '../components/Swatches'
import { PERSONAL_COLOR_PROFILES, SEASON_GROUPS } from '../data/personalColors'
import type { PersonalColorType, Season } from '../types'

interface TypePickerScreenProps {
  predictedType?: PersonalColorType
  onSelect: (type: PersonalColorType) => void
  onBack: () => void
}

const SEASON_COLORS: Record<Season, string> = {
  spring: 'var(--spring)',
  summer: 'var(--summer)',
  autumn: 'var(--autumn)',
  winter: 'var(--winter)',
}

export function TypePickerScreen({ predictedType, onSelect, onBack }: TypePickerScreenProps) {
  return (
    <div className="page">
      <JourneyBar current="confirm" title="나의 최종 퍼스널컬러" subtitle="STEP 5 · 12타입 확정" onBack={onBack} />
      <main className="page__body">
        <div className="shell">
          <div className="stack stack--lg">
            <section>
              <span className="eyebrow">FINAL 12 TYPE</span>
              <h1 style={{ fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', marginTop: 8 }}>
                선생님과 확인한 타입을 선택하세요
              </h1>
              <p className="lead" style={{ marginTop: 12, maxWidth: '56ch' }}>
                {predictedType
                  ? `웹앱 예상은 ${PERSONAL_COLOR_PROFILES[predictedType].korean}이었어요. 실제로 대보고 다른 타입을 골라도 괜찮아요.`
                  : '실제로 컬러천을 대보고 가장 잘 어울렸던 타입을 골라 주세요.'}
              </p>
            </section>

            <div className="type-grid">
              {SEASON_GROUPS.map((group) => (
                <section className="season" key={group.season} style={{ '--season-color': SEASON_COLORS[group.season] } as CSSProperties}>
                  <div className="season__title">
                    <strong>{group.label}</strong>
                    <small>{group.english}</small>
                  </div>
                  {group.types.map((type) => {
                    const profile = PERSONAL_COLOR_PROFILES[type]
                    const isPredicted = type === predictedType
                    return (
                      <button
                        className={`type-card${isPredicted ? ' is-predicted' : ''}`}
                        type="button"
                        key={type}
                        onClick={() => onSelect(type)}
                      >
                        {isPredicted ? <span className="badge badge--recommend type-card__mark">웹앱 예상</span> : null}
                        <PaletteBar colors={profile.palette} ariaLabel={`${profile.korean} 팔레트`} />
                        <span className="type-card__name">
                          {profile.korean}
                          <span className="type-card__en">{profile.english}</span>
                        </span>
                        <span className="type-card__axis">
                          <span>{profile.temperature}</span>
                          <span>{profile.value}</span>
                          <span>{profile.chroma}</span>
                        </span>
                        <small className="muted">{profile.keywords.join(' · ')}</small>
                        <span className="badge badge--outline" style={{ justifySelf: 'start' }}>
                          <Check size={14} aria-hidden="true" />이 타입으로 확정
                        </span>
                      </button>
                    )
                  })}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
