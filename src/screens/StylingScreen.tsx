import { Check, Footprints, LoaderCircle, Sparkles, Star } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { JourneyBar } from '../components/JourneyBar'
import { PhotoCanvas } from '../components/PhotoCanvas'
import { SwatchList } from '../components/Swatches'
import {
  WARDROBE_CATEGORIES,
  findItem,
  isRecommended,
  itemsFor,
  readableInk,
  selectedItems,
  type LookSelection,
  type WardrobeCategory,
} from '../data/catalog'
import { useFaceLandmarks } from '../face/useFaceLandmarks'
import type { MakeupState, PersonalColorProfile } from '../types'

interface StylingScreenProps {
  studentName: string
  profile: PersonalColorProfile
  photoUrl: string
  makeup: MakeupState
  selection: LookSelection
  onSelect: (category: WardrobeCategory, id: string) => void
  onGenerate: () => void
  isGenerating: boolean
  error: string
  onBack: () => void
}

export function StylingScreen({
  studentName,
  profile,
  photoUrl,
  makeup,
  selection,
  onSelect,
  onGenerate,
  isGenerating,
  error,
  onBack,
}: StylingScreenProps) {
  const [category, setCategory] = useState<WardrobeCategory>('top')
  const { landmarks } = useFaceLandmarks(photoUrl)
  const chosen = useMemo(() => selectedItems(selection), [selection])
  const recommendedCount = chosen.filter((item) => isRecommended(item, profile)).length

  return (
    <div className="page">
      <JourneyBar
        current="styling"
        title="패션 스타일링"
        subtitle="STEP 8 · 의상과 신발 고르기"
        onBack={onBack}
        right={
          <span className="badge badge--outline hide-desktop">
            추천 {recommendedCount}/{chosen.length}
          </span>
        }
      />
      <main className="page__body">
        <div className="shell">
          <div className="studio">
            <section className="studio__preview">
              <div className="photo-stage">
                <PhotoCanvas imageUrl={photoUrl} makeup={makeup} landmarks={landmarks} />
                <span className="photo-stage__label">메이크업 적용 사진</span>
              </div>

              <div className="stack stack--sm">
                <div className="panel">
                  <span className="eyebrow">MY LOOK</span>
                  <h2 style={{ marginTop: 4 }}>{studentName}님이 고른 스타일</h2>
                  <div className="look-strip" style={{ marginTop: 14 }}>
                    {chosen.map((item) => (
                      <button className="look-strip__item" type="button" key={item.id} onClick={() => setCategory(item.category)}>
                        <span style={{ '--swatch-color': item.swatch, '--swatch-ink': readableInk(item.swatch) } as CSSProperties}>
                          {item.image ? (
                            <img src={item.image} alt="" />
                          ) : (
                            <span className="catalog-card__swatch">
                              <Footprints size={22} aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <small>{WARDROBE_CATEGORIES.find((entry) => entry.key === item.category)?.label}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <span className="eyebrow">TYPE COLOR</span>
                  <h2 style={{ marginTop: 4 }}>{profile.korean} 추천 의상 색</h2>
                  <div style={{ marginTop: 14 }}>
                    <SwatchList colors={profile.outfit} ariaLabel="추천 의상 색" />
                  </div>
                </div>
              </div>
            </section>

            <section className="studio__side">
              <nav className="category-tabs" aria-label="의상 카테고리">
                {WARDROBE_CATEGORIES.map((entry) => (
                  <button
                    className={category === entry.key ? 'is-active' : ''}
                    type="button"
                    key={entry.key}
                    onClick={() => setCategory(entry.key)}
                  >
                    {entry.label}
                  </button>
                ))}
              </nav>

              <div className="panel">
                <div className="panel__head">
                  <div>
                    <span className="eyebrow">CHOOSE</span>
                    <h2 style={{ marginTop: 4 }}>{WARDROBE_CATEGORIES.find((entry) => entry.key === category)?.label}</h2>
                  </div>
                  <span className="badge badge--recommend">
                    <Star size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />내 타입 추천
                  </span>
                </div>
                <p className="muted" style={{ marginBottom: 16 }}>
                  추천 표시가 없는 색도 자유롭게 골라 비교해 볼 수 있어요.
                </p>

                <div className="catalog">
                  {itemsFor(category).map((item) => {
                    const selected = selection[category] === item.id
                    const recommended = isRecommended(item, profile)
                    return (
                      <button
                        className={`catalog-card${selected ? ' is-selected' : ''}`}
                        type="button"
                        key={item.id}
                        aria-pressed={selected}
                        onClick={() => onSelect(category, item.id)}
                      >
                        <span
                          className="catalog-card__media"
                          style={{ '--swatch-color': item.swatch, '--swatch-ink': readableInk(item.swatch) } as CSSProperties}
                        >
                          {item.image ? (
                            <img src={item.image} alt="" loading="lazy" />
                          ) : (
                            <span className="catalog-card__swatch">
                              <Footprints size={30} aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <span className="catalog-card__name">{item.name}</span>
                        <small>{item.description}</small>
                        {recommended ? (
                          <span className="badge badge--recommend catalog-card__badge">
                            <Star size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />추천
                          </span>
                        ) : null}
                        {selected ? (
                          <span className="catalog-card__check">
                            <Check size={16} aria-hidden="true" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="panel stack stack--sm">
                <span className="eyebrow">FINAL STEP</span>
                <h2>AI로 내 스타일 완성하기</h2>
                <p className="muted">
                  유료 AI 이미지 생성은 여기서 딱 <b>1회</b>만 실행돼요. 얼굴·헤어·피부톤은 그대로 두고, 고른 메이크업과 의상을
                  적용한 전신 스타일 이미지를 만듭니다.
                </p>
                <ul className="stack stack--sm" style={{ margin: '4px 0' }}>
                  {chosen.map((item) => (
                    <li className="muted" key={item.id}>
                      · {WARDROBE_CATEGORIES.find((entry) => entry.key === item.category)?.label} — {findItem(item.id)?.name}
                    </li>
                  ))}
                </ul>
                {error ? (
                  <p className="alert" role="alert">
                    {error}
                  </p>
                ) : null}
                <button className="btn btn--primary btn--lg btn--block" type="button" onClick={onGenerate} disabled={isGenerating}>
                  {isGenerating ? <LoaderCircle size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
                  {isGenerating ? '스타일을 완성하는 중…' : 'AI로 내 스타일 완성하기'}
                </button>
                <p className="muted">
                  사진에 없는 몸은 실제 키나 체형을 그대로 재현하는 것이 아니라, 학생 연령에 맞는 자연스러운 비율로 구성됩니다.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
