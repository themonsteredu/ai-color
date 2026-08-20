import { ArrowRight, Sparkles } from 'lucide-react'
import { JourneyBar } from '../components/JourneyBar'
import { SwatchList } from '../components/Swatches'
import { profileOf } from '../data/personalColors'
import type { AxisResult } from '../data/quiz'
import type { PersonalColorType } from '../types'

interface PredictionScreenProps {
  type: PersonalColorType
  axes: AxisResult[]
  onNext: () => void
  onRetry: () => void
}

export function PredictionScreen({ type, axes, onNext, onRetry }: PredictionScreenProps) {
  const profile = profileOf(type)

  return (
    <div className="page">
      <JourneyBar current="prediction" title="나의 예상 퍼스널컬러" subtitle="STEP 3 · 웹앱 사전 예상" onBack={onRetry} />
      <main className="page__body">
        <div className="shell">
          <div className="predict">
            <section className="panel stack">
              <div>
                <span className="eyebrow">MY COLOR PREDICTION</span>
                <p className="type-headline" style={{ marginTop: 6 }}>
                  <span className="type-headline__en">{profile.english.toUpperCase()}</span>
                  {profile.korean}
                </p>
                <p className="lead" style={{ marginTop: 12 }}>
                  {profile.summary}
                </p>
              </div>

              <div className="tag-row">
                {profile.keywords.map((keyword) => (
                  <span className="tag" key={keyword}>
                    #{keyword}
                  </span>
                ))}
              </div>

              <div className="stack--sm stack">
                <strong>대표 팔레트</strong>
                <SwatchList colors={profile.palette} ariaLabel="예상 타입 대표 팔레트" />
              </div>
            </section>

            <section className="stack">
              <div className="panel">
                <h2>내 색의 방향</h2>
                <p className="muted" style={{ margin: '6px 0 18px' }}>
                  질문 10개의 선택을 온도 · 명도 · 채도 세 가지 축으로 계산한 결과예요.
                </p>
                <div className="axis-list">
                  {axes.map((axis) => (
                    <div className="meter" key={axis.key}>
                      <div className="meter__top">
                        <strong>{axis.label}</strong>
                        <b>{axis.score}</b>
                      </div>
                      <div className="meter__track">
                        <span style={{ width: `${axis.score}%` }} />
                      </div>
                      <small>{axis.description}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="note">
                <Sparkles size={18} aria-hidden="true" />
                <span>
                  <strong>이 결과는 사전 예상입니다.</strong>
                  선생님과 직접 컬러천을 대보고 확인해 보세요. 실제 드레이핑 결과가 예상과 다를 수 있어요.
                </span>
              </div>

              <button className="btn btn--primary btn--lg btn--block" type="button" onClick={onNext}>
                선생님과 실제 컬러 확인하러 가기
                <ArrowRight size={20} aria-hidden="true" />
              </button>
              <button className="btn btn--quiet" type="button" onClick={onRetry}>
                질문 다시 하기
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
