import { ArrowRight, Eye, Hand, ScanFace } from 'lucide-react'
import { JourneyBar } from '../components/JourneyBar'
import { PaletteBar } from '../components/Swatches'
import { profileOf } from '../data/personalColors'
import type { PersonalColorType } from '../types'

interface DrapingScreenProps {
  predictedType: PersonalColorType
  onNext: () => void
  onBack: () => void
}

const CHECKS = [
  { title: '피부가 맑아 보이나요?', copy: '색을 바꿨을 때 얼굴에 낀 노란기·붉은기가 정리되는지 봅니다.' },
  { title: '얼굴 그림자가 줄어드나요?', copy: '눈 밑과 입가 그림자가 옅어지는 색이 잘 맞는 색이에요.' },
  { title: '잡티가 덜 도드라지나요?', copy: '피부 결점보다 얼굴 전체가 먼저 보이는지 확인합니다.' },
  { title: '눈동자가 또렷해 보이나요?', copy: '눈동자와 흰자의 경계가 선명해지는지 봅니다.' },
  { title: '얼굴 윤곽이 살아나나요?', copy: '턱선과 얼굴 라인이 또렷하게 정리되는지 봅니다.' },
]

export function DrapingScreen({ predictedType, onNext, onBack }: DrapingScreenProps) {
  const profile = profileOf(predictedType)

  return (
    <div className="page">
      <JourneyBar current="draping" title="선생님과 실제 드레이핑" subtitle="STEP 4 · 오프라인 체험" onBack={onBack} />
      <main className="page__body">
        <div className="shell">
          <div className="stack stack--lg">
            <section className="panel">
              <span className="eyebrow">OFFLINE COLOR TEST</span>
              <h1 style={{ fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', marginTop: 8 }}>
                이제 선생님과 실제 컬러를 확인해 보세요
              </h1>
              <p className="lead" style={{ marginTop: 14, maxWidth: '58ch' }}>
                웹앱을 잠시 내려놓고, 선생님과 함께 컬러천을 얼굴에 대봅니다. 웹앱 예상은{' '}
                <b>{profile.korean}</b>이었어요. 같은 계절의 3가지 타입부터 대보고, 이웃한 계절 색까지 비교해 보세요.
              </p>
              <div style={{ marginTop: 18, maxWidth: 520 }}>
                <PaletteBar colors={profile.palette} ariaLabel="예상 타입 팔레트" />
              </div>
            </section>

            <section className="stack">
              <h2>이렇게 관찰해요</h2>
              <div className="draping__checks">
                {CHECKS.map((check, index) => (
                  <article className="check-card" key={check.title}>
                    <b>{index + 1}</b>
                    <strong>{check.title}</strong>
                    <small>{check.copy}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="draping__how">
              <div className="panel">
                <ScanFace size={22} aria-hidden="true" />
                <h3 style={{ marginTop: 10 }}>1. 자연광에서 보기</h3>
                <p className="muted" style={{ marginTop: 6 }}>창가처럼 밝은 곳에서, 화장을 지운 얼굴로 비교하면 차이가 더 잘 보여요.</p>
              </div>
              <div className="panel">
                <Hand size={22} aria-hidden="true" />
                <h3 style={{ marginTop: 10 }}>2. 두 색을 번갈아 대기</h3>
                <p className="muted" style={{ marginTop: 6 }}>한 색만 오래 보지 말고 두 색을 번갈아 대며 변화를 비교하세요.</p>
              </div>
              <div className="panel">
                <Eye size={22} aria-hidden="true" />
                <h3 style={{ marginTop: 10 }}>3. 친구에게 물어보기</h3>
                <p className="muted" style={{ marginTop: 6 }}>내가 보는 얼굴과 다른 사람이 보는 얼굴은 다를 수 있어요. 함께 확인해요.</p>
              </div>
            </section>

            <button className="btn btn--primary btn--lg" type="button" onClick={onNext} style={{ justifySelf: 'start', minWidth: 300 }}>
              드레이핑 완료 · 내 타입 확정하기
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
