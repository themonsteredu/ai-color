import { ArrowRight, RefreshCcw } from 'lucide-react'
import { JourneyBar } from '../components/JourneyBar'
import { SwatchList } from '../components/Swatches'
import { profileOf } from '../data/personalColors'
import type { PersonalColorType } from '../types'

interface ConfirmedScreenProps {
  predictedType?: PersonalColorType
  confirmedType: PersonalColorType
  onNext: () => void
  onChange: () => void
}

export function ConfirmedScreen({ predictedType, confirmedType, onNext, onChange }: ConfirmedScreenProps) {
  const confirmed = profileOf(confirmedType)
  const predicted = predictedType ? profileOf(predictedType) : undefined
  const changed = Boolean(predicted && predicted.type !== confirmed.type)

  return (
    <div className="page">
      <JourneyBar current="confirm" title="내 타입이 확정되었어요" subtitle="STEP 5 · 확정 결과" onBack={onChange} />
      <main className="page__body">
        <div className="shell">
          <div className="stack stack--lg">
            <section>
              <span className="eyebrow">MY PERSONAL COLOR</span>
              <h1 style={{ fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', marginTop: 8 }}>
                {confirmed.korean} · {confirmed.english}
              </h1>
              <p className="lead" style={{ marginTop: 12, maxWidth: '58ch' }}>
                {confirmed.summary}
              </p>
            </section>

            {predicted ? (
              <section className="compare-types">
                <article className="compare-types__item">
                  <span className="eyebrow">웹앱 사전 예상</span>
                  <strong style={{ fontSize: 'var(--fs-section)' }}>{predicted.korean}</strong>
                  <SwatchList colors={predicted.palette} showNames={false} compact ariaLabel="예상 타입 팔레트" />
                </article>
                <article className="compare-types__item is-final">
                  <span className="eyebrow">실제 드레이핑 결과</span>
                  <strong style={{ fontSize: 'var(--fs-section)' }}>{confirmed.korean}</strong>
                  <SwatchList colors={confirmed.palette} showNames={false} compact ariaLabel="확정 타입 팔레트" />
                </article>
              </section>
            ) : null}

            <p className="note note--calm">
              <span>
                <strong>{changed ? '직접 색을 대어보니 예상과 결과가 달랐어요.' : '예상과 실제 결과가 같았어요.'}</strong>
                {changed
                  ? '눈으로 직접 비교했을 때 더 잘 어울리는 색을 찾은 거예요. 이것도 훌륭한 컨설팅 결과입니다.'
                  : '화면 위 선택과 실제 드레이핑 결과가 일치했어요. 이유까지 설명할 수 있으면 더 좋아요.'}
              </span>
            </p>

            <section className="panel stack">
              <h2>{confirmed.korean} 컬러 가이드</h2>
              <div className="stack stack--sm">
                <strong>대표 팔레트</strong>
                <SwatchList colors={confirmed.palette} ariaLabel="대표 팔레트" />
              </div>
              <div className="stack stack--sm">
                <strong>추천 립</strong>
                <SwatchList colors={confirmed.lip} ariaLabel="추천 립" />
              </div>
              <div className="stack stack--sm">
                <strong>추천 블러셔</strong>
                <SwatchList colors={confirmed.blush} ariaLabel="추천 블러셔" />
              </div>
              <div className="stack stack--sm">
                <strong>추천 아이섀도</strong>
                <SwatchList colors={confirmed.eye} ariaLabel="추천 아이섀도" />
              </div>
              <div className="stack stack--sm">
                <strong>추천 의상 색</strong>
                <SwatchList colors={confirmed.outfit} ariaLabel="추천 의상 색" />
              </div>
            </section>

            <div className="btn-row">
              <button className="btn btn--primary btn--lg" type="button" onClick={onNext}>
                내 사진 준비하러 가기
                <ArrowRight size={20} aria-hidden="true" />
              </button>
              <button className="btn btn--neutral btn--lg" type="button" onClick={onChange}>
                <RefreshCcw size={18} aria-hidden="true" />
                타입 다시 고르기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
