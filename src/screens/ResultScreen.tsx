import { Download, RotateCcw, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'
import { JourneyBar } from '../components/JourneyBar'
import { SwatchList } from '../components/Swatches'
import { OPTION_ENGLISH } from '../data/makeup'
import { WARDROBE_CATEGORIES, selectedItems, type LookSelection } from '../data/catalog'
import type { MakeupState, PersonalColorProfile } from '../types'

interface ResultScreenProps {
  studentName: string
  classCode: string
  profile: PersonalColorProfile
  beforePhotoUrl: string
  resultImage: string
  makeup: MakeupState
  selection: LookSelection
  onRestart: () => void
  onBack: () => void
}

export function ResultScreen({
  studentName,
  classCode,
  profile,
  beforePhotoUrl,
  resultImage,
  makeup,
  selection,
  onRestart,
  onBack,
}: ResultScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const items = selectedItems(selection)

  const saveCard = async () => {
    if (!cardRef.current || saving) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#FFFDF9' })
      const link = document.createElement('a')
      link.download = `color-mate-${studentName}.png`
      link.href = dataUrl
      link.click()
    } catch {
      // 저장에 실패해도 활동은 계속할 수 있습니다.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <JourneyBar current="result" title="나의 컬러 프로필" subtitle="STEP 9 · 최종 결과" onBack={onBack} />
      <main className="page__body">
        <div className="shell">
          <div className="stack stack--lg">
            <section>
              <span className="eyebrow">BEFORE / AFTER</span>
              <h1 style={{ fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', marginTop: 8 }}>
                {studentName}님의 스타일이 완성됐어요
              </h1>
              <p className="lead" style={{ marginTop: 12, maxWidth: '58ch' }}>
                내가 고른 퍼스널컬러 · 메이크업 · 의상이 하나의 스타일로 이어졌어요. 두 사진을 비교하며 무엇이 달라졌는지 이야기해
                보세요.
              </p>
            </section>

            <div className="result-layout">
              <section className="stack">
                <div className="compare">
                  <figure>
                    <div className="photo-stage">
                      <img src={beforePhotoUrl} alt="스타일링 전 사진" />
                      <span className="photo-stage__label">BEFORE</span>
                    </div>
                    <figcaption>처음 준비한 사진</figcaption>
                  </figure>
                  <figure>
                    <div className="photo-stage">
                      {resultImage ? <img src={resultImage} alt="AI가 완성한 최종 스타일" /> : null}
                      <span className="photo-stage__label">AFTER</span>
                    </div>
                    <figcaption>AI로 완성한 스타일</figcaption>
                  </figure>
                </div>
                <p className="note note--neutral">
                  <span>
                    사진에 없던 몸은 학생 연령에 맞는 자연스러운 비율로 새로 그린 것이며, 실제 키나 체형을 그대로 나타내지
                    않습니다.
                  </span>
                </p>
              </section>

              <section className="stack">
                <div className="profile-card" ref={cardRef}>
                  <div>
                    <span className="eyebrow">MY COLOR PROFILE</span>
                    <h2 style={{ marginTop: 6, fontSize: 'var(--fs-title)' }}>
                      {profile.korean} · {profile.english}
                    </h2>
                    <p className="muted" style={{ marginTop: 6 }}>
                      {studentName} · {classCode}
                    </p>
                  </div>

                  <SwatchList colors={profile.palette} ariaLabel="내 타입 대표 팔레트" />

                  <div className="summary-grid">
                    <div className="summary-item" style={{ '--swatch-color': makeup.lip.hex } as CSSProperties}>
                      <i aria-hidden="true" />
                      <small>립 · {OPTION_ENGLISH('lipFinish', makeup.options.lipFinish)}</small>
                      <strong>{makeup.lip.name}</strong>
                    </div>
                    <div className="summary-item" style={{ '--swatch-color': makeup.blush.hex } as CSSProperties}>
                      <i aria-hidden="true" />
                      <small>블러셔 · {makeup.options.blushPlacement}</small>
                      <strong>{makeup.blush.name}</strong>
                    </div>
                    <div className="summary-item" style={{ '--swatch-color': makeup.eye.hex } as CSSProperties}>
                      <i aria-hidden="true" />
                      <small>아이섀도 · {makeup.options.eyeStyle}</small>
                      <strong>{makeup.eye.name}</strong>
                    </div>
                  </div>

                  <div className="summary-grid">
                    {items.map((item) => (
                      <div className="summary-item" key={item.id}>
                        <small>{WARDROBE_CATEGORIES.find((entry) => entry.key === item.category)?.label}</small>
                        <strong>{item.name}</strong>
                      </div>
                    ))}
                  </div>

                  <div>
                    <small className="muted">
                      베이스 {makeup.options.base} · 눈썹 {makeup.options.brow} · 아이라인 {makeup.options.eyeliner} · 속눈썹{' '}
                      {makeup.options.lashes} · 하이라이터 {makeup.options.highlighter} · 쉐딩 {makeup.options.shading} · 포인트{' '}
                      {makeup.options.point}
                    </small>
                  </div>
                </div>

                <div className="btn-row">
                  <button className="btn btn--secondary btn--lg" type="button" onClick={saveCard} disabled={saving}>
                    <Download size={19} aria-hidden="true" />
                    {saving ? '이미지 만드는 중…' : '컬러 프로필 저장'}
                  </button>
                  <button className="btn btn--neutral btn--lg" type="button" onClick={onRestart}>
                    <RotateCcw size={18} aria-hidden="true" />새 활동 시작
                  </button>
                </div>
                <p className="note">
                  <Sparkles size={18} aria-hidden="true" />
                  <span>
                    <strong>오늘 체험한 직업</strong>
                    퍼스널컬러 컨설턴트 · 메이크업 아티스트 · 패션 스타일리스트
                  </span>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
