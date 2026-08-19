import { ArrowLeft, Check, LoaderCircle, Palette, Shirt, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DEFAULT_MAKEUP, MAKEUP_COLORS, toneLabel } from '../data'
import type { MakeupChoice, MakeupState, Student } from '../types'
import { OpenMakeupMirror } from '../components/OpenMakeupMirror'
import { PhotoCanvas } from '../components/PhotoCanvas'
import { PaletteStrip } from '../components/PaletteStrip'
import { CATEGORY_LABELS, DEFAULT_LOOKS, findItem, itemsFor, selectedItems } from './catalog'
import type { LookSelection, WardrobeCategory } from './types'

type Stage = 'makeup' | 'wardrobe' | 'result'

const CATEGORIES: WardrobeCategory[] = ['top', 'bottom', 'outer', 'accessory']
const FACE_PLACEMENT = { x: 0.5, y: 0.36, scale: 0.29 }

function fileToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('이미지를 읽지 못했어요.'))
    reader.readAsDataURL(blob)
  })
}

async function resizePhoto(photoUrl: string) {
  const source = await fetch(photoUrl).then((response) => response.blob())
  const bitmap = await createImageBitmap(source)
  const maxWidth = 1280
  const maxHeight = 1800
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('사진을 준비하지 못했어요.')
  context.fillStyle = '#FAF9F7'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.88)
}

async function assetToDataUrl(path: string) {
  const response = await fetch(path)
  if (!response.ok) throw new Error('의상 이미지를 불러오지 못했어요.')
  return fileToDataUrl(await response.blob())
}

function MakeupRow({ label, value, onChange }: { label: string; value: MakeupChoice; onChange: (value: MakeupChoice) => void }) {
  return (
    <section className="makeup-control-card">
      <div className="makeup-control-title"><strong>{label}</strong><b>{value.intensity}%</b></div>
      <PaletteStrip
        colors={MAKEUP_COLORS.map((color) => color.value)}
        labels={MAKEUP_COLORS.map((color) => color.label)}
        selected={value.color}
        onSelect={(color) => onChange({ ...value, color, label: MAKEUP_COLORS.find((item) => item.value === color)?.label ?? '선택 색상' })}
      />
      <label className="makeup-range"><span>자연스럽게</span><input type="range" min="0" max="65" value={value.intensity} onChange={(event) => onChange({ ...value, intensity: Number(event.target.value) })} /><span>선명하게</span></label>
    </section>
  )
}

interface StyleStudioProps {
  student: Student
  photoUrl: string
  onBack: () => void
  onRetake: () => void
  onComplete: () => void
}

export function StyleStudio({ student, photoUrl, onBack, onRetake, onComplete }: StyleStudioProps) {
  const [stage, setStage] = useState<Stage>('makeup')
  const [makeup, setMakeup] = useState<MakeupState>(DEFAULT_MAKEUP)
  const [selection, setSelection] = useState<LookSelection>(() => DEFAULT_LOOKS[student.tone])
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory>('top')
  const [generatedImage, setGeneratedImage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const chosenItems = useMemo(() => selectedItems(selection), [selection])
  const recommendedCount = chosenItems.filter((item) => item.tone === student.tone || item.tone === 'neutral').length

  const choose = (category: WardrobeCategory, id: string) => {
    setSelection((current) => ({ ...current, [category]: id }))
    setError('')
  }

  const generateFinalStyle = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setError('')
    try {
      const personImage = await resizePhoto(photoUrl)
      const garments = await Promise.all(chosenItems.map(async (catalogItem) => ({
        id: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        dataUrl: await assetToDataUrl(catalogItem.image),
      })))
      const response = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage, garments, makeup, studentCode: student.code }),
      })
      const text = await response.text()
      let payload: { imageDataUrl?: string; error?: string }
      try {
        payload = JSON.parse(text) as { imageDataUrl?: string; error?: string }
      } catch {
        throw new Error('AI 이미지 연결을 확인해 주세요.')
      }
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error ?? '최종 스타일 생성에 실패했어요.')
      setGeneratedImage(payload.imageDataUrl)
      setStage('result')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '최종 스타일 생성에 실패했어요.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (stage === 'makeup') {
    const fallbackPreview = <PhotoCanvas imageUrl={photoUrl} makeup={makeup} placement={FACE_PLACEMENT} ariaLabel="메이크업 사진 미리보기" />
    return (
      <main className="wardrobe-studio">
        <header className="wardrobe-topbar">
          <button type="button" onClick={onBack} aria-label="뒤로"><ArrowLeft size={20} /></button>
          <div><small>{student.name}의 스타일링</small><strong>1. 메이크업 디자인</strong></div>
          <span className={`tone-pill ${student.tone}`}>{toneLabel(student.tone)}</span>
        </header>
        <div className="wardrobe-layout">
          <section className="tryon-stage">
            <div className="stage-heading"><div><small>MAKEUP DESIGN</small><h1>내 톤에 맞는<br />메이크업을 골라봐요</h1></div><span><Palette size={14} /> 무료 실시간 미러</span></div>
            <div className="student-photo-stage has-result">
              <OpenMakeupMirror makeup={makeup} fallback={fallbackPreview} />
              <span className="preview-label">OpenMakeupSDK · 무료</span>
            </div>
            <p className="input-help">카메라에서 립·블러셔·아이 색을 바로 바꿔보세요. 지원되지 않는 기기에서는 자동으로 사진 미리보기로 전환됩니다. 최종 AI 생성은 의상까지 고른 뒤 한 번만 실행합니다.</p>
          </section>
          <section className="wardrobe-editor">
            <div className="wardrobe-sheet">
              <div className="sheet-title"><div><small>STEP 1</small><h2>메이크업</h2></div></div>
              <MakeupRow label="립" value={makeup.lip} onChange={(lip) => setMakeup((current) => ({ ...current, lip }))} />
              <MakeupRow label="블러셔" value={makeup.blush} onChange={(blush) => setMakeup((current) => ({ ...current, blush }))} />
              <MakeupRow label="아이섀도" value={makeup.eye} onChange={(eye) => setMakeup((current) => ({ ...current, eye }))} />
              <button className="tryon-button" type="button" onClick={() => setStage('wardrobe')}><Shirt size={20} />이 메이크업으로 옷 고르기</button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (stage === 'wardrobe') {
    return (
      <main className="wardrobe-studio">
        <header className="wardrobe-topbar">
          <button type="button" onClick={() => setStage('makeup')} aria-label="메이크업으로 돌아가기"><ArrowLeft size={20} /></button>
          <div><small>{student.name}의 스타일링</small><strong>2. 의상 선택</strong></div>
          <span className="generation-credit"><Sparkles size={14} /><b>1</b>회 최종 생성</span>
        </header>
        <div className="wardrobe-layout">
          <section className="tryon-stage">
            <div className="stage-heading"><div><small>OUTFIT DESIGN</small><h1>내 톤에 맞는<br />옷을 골라봐요</h1></div><span><Check size={13} /> 추천 {recommendedCount}/4</span></div>
            <div className="student-photo-stage has-result">
              <PhotoCanvas imageUrl={photoUrl} makeup={makeup} placement={FACE_PLACEMENT} ariaLabel="선택한 메이크업 미리보기" />
              <span className="preview-label">선택한 메이크업</span>
            </div>
            <div className="look-ribbon">
              {chosenItems.map((item) => <button type="button" key={item.id} onClick={() => setActiveCategory(item.category)}><img src={item.image} alt="" /><span>{CATEGORY_LABELS[item.category]}</span></button>)}
            </div>
          </section>
          <section className="wardrobe-editor">
            <nav className="wardrobe-tabs" aria-label="의상 카테고리">
              {CATEGORIES.map((category) => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}><span><Shirt size={18} /></span>{CATEGORY_LABELS[category]}</button>)}
            </nav>
            <div className="wardrobe-sheet">
              <div className="sheet-title"><div><small>STEP 2</small><h2>{CATEGORY_LABELS[activeCategory]}</h2></div></div>
              <div className="catalog-grid">
                {itemsFor(activeCategory).map((item) => {
                  const selected = selection[activeCategory] === item.id
                  const recommended = item.tone === student.tone || item.tone === 'neutral'
                  return (
                    <button className={`catalog-card${selected ? ' selected' : ''}`} type="button" key={item.id} onClick={() => choose(activeCategory, item.id)} aria-pressed={selected}>
                      <span className="catalog-photo"><img src={item.image} alt="" loading="lazy" /></span>
                      <span className="catalog-copy"><b>{item.name}</b><small>{item.description}</small></span>
                      {recommended ? <span className="recommend-badge">추천</span> : null}
                      {selected ? <span className="catalog-check"><Check size={15} /></span> : null}
                    </button>
                  )
                })}
              </div>
              <button className="tryon-button" type="button" onClick={generateFinalStyle} disabled={isGenerating}>
                {isGenerating ? <LoaderCircle className="spin" size={20} /> : <Sparkles size={20} />}
                {isGenerating ? '메이크업과 의상을 자연스럽게 완성하는 중' : 'AI로 최종 스타일 완성하기'}
              </button>
              <p>이 버튼에서만 유료 AI 이미지 생성이 1회 실행돼요.</p>
              {error ? <p className="tryon-error" role="alert">{error}</p> : null}
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="wardrobe-studio">
      <header className="wardrobe-topbar"><button type="button" onClick={() => setStage('wardrobe')}><ArrowLeft size={20} /></button><div><small>{student.name}의 컬러 스튜디오</small><strong>3. 최종 스타일</strong></div><span className={`tone-pill ${student.tone}`}>{toneLabel(student.tone)}</span></header>
      <div className="wardrobe-layout">
        <section className="tryon-stage">
          <div className="stage-heading"><div><small>FINAL STYLE</small><h1>나의 선택으로<br />완성된 스타일</h1></div></div>
          <div className="student-photo-stage has-result">{generatedImage ? <img src={generatedImage} alt="AI가 완성한 메이크업과 의상 스타일" /> : null}<span className="preview-label">AI 최종 결과</span></div>
        </section>
        <section className="wardrobe-editor">
          <div className="wardrobe-sheet">
            <div className="sheet-title"><div><small>MY CHOICES</small><h2>{toneLabel(student.tone)} 스타일</h2></div></div>
            <div className="selection-summary">
              <div><span style={{ background: makeup.lip.color }} /><small>립</small><strong>{makeup.lip.label}</strong></div>
              <div><span style={{ background: makeup.blush.color }} /><small>블러셔</small><strong>{makeup.blush.label}</strong></div>
              <div><span style={{ background: makeup.eye.color }} /><small>아이</small><strong>{makeup.eye.label}</strong></div>
            </div>
            <div className="look-ribbon">{chosenItems.map((item) => <span key={item.id}><img src={item.image} alt="" /><small>{findItem(item.id)?.name}</small></span>)}</div>
            <button className="tryon-button" type="button" onClick={onComplete}><Check size={20} />활동 완료</button>
            <button className="secondary-button" type="button" onClick={onRetake}>사진 다시 찍기</button>
          </div>
        </section>
      </div>
    </main>
  )
}
