import { Shirt, Star, Wand2 } from 'lucide-react'
import { JourneyBar } from '../components/JourneyBar'
import { PhotoCanvas } from '../components/PhotoCanvas'
import { SwatchList } from '../components/Swatches'
import {
  FREE_BLUSH_COLORS,
  FREE_EYE_COLORS,
  FREE_LIP_COLORS,
  MAKEUP_GROUPS,
  MAKEUP_PRESETS,
} from '../data/makeup'
import { useFaceLandmarks } from '../face/useFaceLandmarks'
import type { MakeupChoice, MakeupOptionKey, MakeupState, PersonalColorProfile, Swatch } from '../types'

interface MakeupScreenProps {
  studentName: string
  profile: PersonalColorProfile
  photoUrl: string
  makeup: MakeupState
  onChange: (makeup: MakeupState) => void
  onPreset: (presetKey: string) => void
  onNext: () => void
  onBack: () => void
}

type ColorSlot = 'lip' | 'blush' | 'eye'

const COLOR_SLOTS: Partial<Record<MakeupOptionKey, ColorSlot>> = {
  eyeStyle: 'eye',
  blushPlacement: 'blush',
  lipFinish: 'lip',
}

const FREE_COLORS: Record<ColorSlot, Swatch[]> = {
  lip: FREE_LIP_COLORS,
  blush: FREE_BLUSH_COLORS,
  eye: FREE_EYE_COLORS,
}

const SLOT_LABEL: Record<ColorSlot, string> = { lip: '립', blush: '블러셔', eye: '아이섀도' }

export function MakeupScreen({
  studentName,
  profile,
  photoUrl,
  makeup,
  onChange,
  onPreset,
  onNext,
  onBack,
}: MakeupScreenProps) {
  const { landmarks, status } = useFaceLandmarks(photoUrl)

  const setChoice = (slot: ColorSlot, patch: Partial<MakeupChoice>) =>
    onChange({ ...makeup, [slot]: { ...makeup[slot], ...patch } })

  const setOption = (key: MakeupOptionKey, value: string) =>
    onChange({ ...makeup, preset: 'custom', options: { ...makeup.options, [key]: value } })

  const recommendedFor = (slot: ColorSlot) => profile[slot]

  return (
    <div className="page">
      <JourneyBar
        current="makeup"
        title="메이크업 LAB"
        subtitle="STEP 7 · 내 사진 위 메이크업"
        onBack={onBack}
        right={
          <span className="badge badge--calm hide-desktop">
            <Wand2 size={14} aria-hidden="true" />
            무료
          </span>
        }
      />
      <main className="page__body">
        <div className="shell">
          <div className="studio">
            <section className="studio__preview">
              <div className="photo-stage">
                <PhotoCanvas imageUrl={photoUrl} makeup={makeup} landmarks={landmarks} />
                <span className="photo-stage__label">{studentName}님의 사진 미리보기</span>
              </div>

              <div className="stack stack--sm">
                <div className="panel">
                  <span className="eyebrow">MY 12 TYPE</span>
                  <h2 style={{ marginTop: 4 }}>
                    {profile.korean} · {profile.english}
                  </h2>
                  <p className="muted" style={{ marginTop: 8 }}>
                    {profile.temperature} / {profile.chroma} / {profile.value}
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <SwatchList colors={profile.palette} showNames={false} compact ariaLabel="내 타입 팔레트" />
                  </div>
                </div>
                <p className="muted">
                  {status === 'ready'
                    ? '얼굴 위치를 인식해 미리보기에 반영하고 있어요.'
                    : status === 'loading'
                      ? '얼굴 위치를 확인하는 중이에요. 잠시 후 더 정확해집니다.'
                      : '얼굴 인식 없이 기본 위치로 미리 보여주고 있어요. 색과 분위기를 비교하는 용도로 사용하세요.'}{' '}
                  세부 표현은 마지막 AI 결과에서 자연스럽게 완성됩니다. 이 단계에서는 AI를 사용하지 않아요.
                </p>
              </div>
            </section>

            <section className="studio__side">
              <div className="panel">
                <div className="panel__head">
                  <div>
                    <span className="eyebrow">STEP 1 · PRESET</span>
                    <h2 style={{ marginTop: 4 }}>빠르게 시작하기</h2>
                  </div>
                </div>
                <p className="muted" style={{ marginBottom: 14 }}>
                  프리셋을 고른 뒤에도 아래에서 항목별로 자유롭게 바꿀 수 있어요.
                </p>
                <div className="preset-grid">
                  {MAKEUP_PRESETS.map((preset) => (
                    <button
                      className={`preset${makeup.preset === preset.key ? ' is-selected' : ''}`}
                      type="button"
                      key={preset.key}
                      onClick={() => onPreset(preset.key)}
                    >
                      <em>{preset.english}</em>
                      <strong>{preset.label}</strong>
                      <small>{preset.copy}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel__head">
                  <div>
                    <span className="eyebrow">STEP 2 · MAKEUP LAB</span>
                    <h2 style={{ marginTop: 4 }}>항목별로 직접 만들기</h2>
                  </div>
                </div>

                <div className="control-grid">
                  {MAKEUP_GROUPS.map((group, index) => {
                  const slot = COLOR_SLOTS[group.key]
                  const choice = slot ? makeup[slot] : undefined
                  return (
                    <section className={`control-block${slot ? ' control-block--wide' : ''}`} key={group.key}>
                      <div className="control-block__head">
                        <strong>
                          {index + 1}. {group.label}
                        </strong>
                        {choice ? <b>{choice.intensity}%</b> : <span className="muted">{group.english}</span>}
                      </div>
                      <p className="control-block__help">{group.help}</p>

                      {slot && choice ? (
                        <div className="control-block__colors">
                          <p className="badge badge--recommend" style={{ justifySelf: 'start' }}>
                            <Star size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                            내 타입 추천 {SLOT_LABEL[slot]}
                          </p>
                          <SwatchList
                            colors={recommendedFor(slot)}
                            selected={choice.hex}
                            starred
                            ariaLabel={`${SLOT_LABEL[slot]} 추천색`}
                            onSelect={(swatch) => setChoice(slot, { hex: swatch.hex, name: swatch.name, recommended: true })}
                          />
                          <details className="free-colors">
                            <summary>다른 타입 색도 비교해 보기</summary>
                            <SwatchList
                              colors={FREE_COLORS[slot]}
                              selected={choice.hex}
                              ariaLabel={`${SLOT_LABEL[slot]} 전체 색상`}
                              onSelect={(swatch) => setChoice(slot, { hex: swatch.hex, name: swatch.name, recommended: false })}
                            />
                          </details>
                          <label className="range">
                            <span>연하게</span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={choice.intensity}
                              aria-label={`${SLOT_LABEL[slot]} 발색 강도`}
                              onChange={(event) => setChoice(slot, { intensity: Number(event.target.value) })}
                            />
                            <span>진하게</span>
                          </label>
                        </div>
                      ) : null}

                      <div className="options" role="radiogroup" aria-label={group.label}>
                        {group.options.map((option) => {
                          const isSelected = makeup.options[group.key] === option.value
                          return (
                            <button
                              className={`option${isSelected ? ' is-selected' : ''}`}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              key={option.value}
                              onClick={() => setOption(group.key, option.value)}
                            >
                              {option.value}
                              <em>{option.english}</em>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )
                  })}
                </div>

                <button className="btn btn--primary btn--lg btn--block" type="button" onClick={onNext} style={{ marginTop: 20 }}>
                  <Shirt size={20} aria-hidden="true" />이 메이크업으로 스타일링하기
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
