import {
  ArrowLeft,
  Check,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  Palette,
  RefreshCw,
  RotateCcw,
  Shirt,
  Sparkles,
  Star,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_MAKEUP, MAKEUP_COLORS, toneLabel } from '../data'
import type { MakeupChoice, MakeupState, Student } from '../types'
import { PhotoCanvas } from '../components/PhotoCanvas'
import { PaletteStrip } from '../components/PaletteStrip'
import { useFaceLandmarks } from '../face/useFaceLandmarks'
import { CATEGORY_LABELS, DEFAULT_LOOKS, LOOK_PRESETS, findItem, itemsFor, selectedItems } from './catalog'
import type { LookSelection, SavedLook, WardrobeCategory } from './types'

type StudioTab = 'looks' | WardrobeCategory | 'makeup' | 'card'
type PreviewMode = 'before' | 'after'

const MAX_GENERATIONS = Number(import.meta.env.VITE_TRYON_LIMIT ?? 2)
const FACE_PLACEMENT = { x: 0.5, y: 0.36, scale: 0.29 }

const TABS: { id: StudioTab; label: string }[] = [
  { id: 'looks', label: '추천 코디' },
  { id: 'top', label: '상의' },
  { id: 'bottom', label: '하의' },
  { id: 'outer', label: '아우터' },
  { id: 'accessory', label: '액세서리' },
  { id: 'makeup', label: '메이크업' },
  { id: 'card', label: '최종 카드' },
]

function readCount(studentId: string) {
  const value = Number(window.localStorage.getItem(`color-mate.tryon-count.${studentId}`) ?? 0)
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_GENERATIONS) : 0
}

function writeCount(studentId: string, count: number) {
  window.localStorage.setItem(`color-mate.tryon-count.${studentId}`, String(count))
}

function readSavedLooks(studentId: string): SavedLook[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(`color-mate.saved-looks.${studentId}`) ?? '[]') as SavedLook[]
    return Array.isArray(value) ? value.slice(0, 6) : []
  } catch {
    return []
  }
}

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

function CatalogCard({ id, selected, recommended, onSelect }: { id: string; selected: boolean; recommended: boolean; onSelect: () => void }) {
  const catalogItem = findItem(id)
  if (!catalogItem) return null
  return (
    <button className={`catalog-card${selected ? ' selected' : ''}`} type="button" onClick={onSelect} aria-pressed={selected}>
      <span className="catalog-photo"><img src={catalogItem.image} alt="" loading="lazy" /></span>
      <span className="catalog-copy"><b>{catalogItem.name}</b><small>{catalogItem.description}</small></span>
      {recommended ? <span className="recommend-badge"><Star size={11} fill="currentColor" /> 추천</span> : null}
      {selected ? <span className="catalog-check"><Check size={15} /></span> : null}
    </button>
  )
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

interface WardrobeStudioProps {
  student: Student
  photoUrl: string
  onBack: () => void
  onRetake: () => void
  onComplete: () => void
}

export function WardrobeStudio({ student, photoUrl, onBack, onRetake, onComplete }: WardrobeStudioProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('looks')
  const [selection, setSelection] = useState<LookSelection>(() => DEFAULT_LOOKS[student.tone])
  const [makeup, setMakeup] = useState<MakeupState>(DEFAULT_MAKEUP)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('before')
  const [generatedImage, setGeneratedImage] = useState('')
  const [generationCount, setGenerationCount] = useState(() => readCount(student.id))
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [styleName, setStyleName] = useState('나의 컬러 데일리룩')
  const [savedLooks, setSavedLooks] = useState(() => readSavedLooks(student.id))
  const [savingCard, setSavingCard] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const resultImage = generatedImage || photoUrl
  const { landmarks, status: landmarkStatus } = useFaceLandmarks(resultImage)

  const remaining = Math.max(0, MAX_GENERATIONS - generationCount)
  const chosenItems = useMemo(() => selectedItems(selection), [selection])
  const recommendedCount = chosenItems.filter((catalogItem) => catalogItem.tone === student.tone || catalogItem.tone === 'neutral').length

  useEffect(() => {
    setPreviewMode(generatedImage ? 'after' : 'before')
  }, [generatedImage])

  const choose = (category: WardrobeCategory, id: string) => {
    setSelection((current) => ({ ...current, [category]: id }))
    setError('')
  }

  const randomLook = () => {
    const presets = LOOK_PRESETS.filter((preset) => preset.tone === student.tone)
    const preset = presets[Math.floor(Math.random() * presets.length)]
    setSelection(preset.selection)
    setActiveTab('looks')
    setError('')
  }

  const generateTryOn = async () => {
    if (remaining <= 0 || isGenerating) return
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
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage, garments, studentCode: student.code, generationNumber: generationCount + 1 }),
      })
      const responseText = await response.text()
      let payload: { imageDataUrl?: string; error?: string }
      try {
        payload = JSON.parse(responseText) as { imageDataUrl?: string; error?: string }
      } catch {
        throw new Error('OpenAI API 연결이 아직 설정되지 않았어요. 배포 환경변수를 확인해 주세요.')
      }
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error ?? '가상착의 생성에 실패했어요.')
      setGeneratedImage(payload.imageDataUrl)
      const nextCount = generationCount + 1
      setGenerationCount(nextCount)
      writeCount(student.id, nextCount)
      setActiveTab('makeup')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '가상착의 생성에 실패했어요.')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveLook = () => {
    const saved: SavedLook = { id: crypto.randomUUID(), name: styleName.trim() || '나의 컬러 스타일', selection, createdAt: new Date().toISOString() }
    const next = [saved, ...savedLooks].slice(0, 6)
    setSavedLooks(next)
    window.localStorage.setItem(`color-mate.saved-looks.${student.id}`, JSON.stringify(next))
  }

  const downloadCard = async () => {
    if (!cardRef.current || !generatedImage) return
    setSavingCard(true)
    try {
      const { toPng } = await import('html-to-image')
      await document.fonts.ready
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#FAF9F7' })
      const link = document.createElement('a')
      link.download = `${student.name}-${styleName.trim() || '컬러스타일'}.png`
      link.href = dataUrl
      link.click()
      saveLook()
    } finally {
      setSavingCard(false)
    }
  }

  return (
    <main className="wardrobe-studio">
      <header className="wardrobe-topbar">
        <button type="button" onClick={onBack} aria-label="활동 홈으로 돌아가기"><ArrowLeft size={20} /></button>
        <div><small>{student.name}의 컬러 스튜디오</small><strong>{toneLabel(student.tone)}</strong></div>
        <span className="generation-credit"><Sparkles size={14} /><b>{remaining}</b>장 남음</span>
      </header>

      <div className="wardrobe-layout">
        <section className="tryon-stage" aria-label="가상착의 미리보기">
          <div className="stage-heading">
            <div><small>MY COLOR FITTING</small><h1>고른 옷을<br />내 사진에 입어봐요</h1></div>
            <span><Star size={13} fill="currentColor" /> 추천 {recommendedCount}/4</span>
          </div>

          <div className={`student-photo-stage ${generatedImage ? 'has-result' : ''}`}>
            {previewMode === 'after' && generatedImage ? (
              <PhotoCanvas imageUrl={generatedImage} makeup={makeup} landmarks={landmarks} placement={FACE_PLACEMENT} ariaLabel="가상착의와 메이크업이 적용된 사진" />
            ) : <img src={photoUrl} alt="학생이 업로드한 원본 사진" />}
            <span className="preview-label">{previewMode === 'after' && generatedImage ? '가상착의 결과' : '원본 사진'}</span>
            {isGenerating ? <div className="generating-cover"><LoaderCircle size={36} /><strong>옷을 자연스럽게 입히고 있어요</strong><span>얼굴과 자세는 그대로 유지합니다</span></div> : null}
          </div>

          {generatedImage ? (
            <div className="preview-toggle" role="group" aria-label="적용 전후 보기">
              <button className={previewMode === 'before' ? 'active' : ''} type="button" onClick={() => setPreviewMode('before')}>적용 전</button>
              <button className={previewMode === 'after' ? 'active' : ''} type="button" onClick={() => setPreviewMode('after')}>적용 후</button>
            </div>
          ) : null}

          <div className="look-ribbon" aria-label="선택한 코디">
            {chosenItems.map((catalogItem) => <button type="button" key={catalogItem.id} onClick={() => setActiveTab(catalogItem.category)}><img src={catalogItem.image} alt="" /><span>{CATEGORY_LABELS[catalogItem.category]}</span></button>)}
          </div>

          <div className="generate-area">
            <button className="tryon-button" type="button" onClick={generateTryOn} disabled={remaining <= 0 || isGenerating}>
              {isGenerating ? <LoaderCircle className="spin" size={20} /> : <Sparkles size={20} />}
              {generatedImage ? `다른 코디로 다시 입어보기 · ${remaining}장` : `이 코디 입어보기 · ${remaining}장`}
            </button>
            <p>옷을 고르는 동안은 무료예요. 이 버튼을 누를 때만 1장이 사용됩니다.</p>
            {error ? <p className="tryon-error" role="alert">{error}</p> : null}
          </div>
        </section>

        <section className="wardrobe-editor">
          <nav className="wardrobe-tabs" aria-label="코디 편집 메뉴">
            {TABS.map((tab) => <button type="button" key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}><span>{tab.id === 'makeup' ? <Palette size={18} /> : tab.id === 'card' ? <ImageIcon size={18} /> : <Shirt size={18} />}</span>{tab.label}</button>)}
          </nav>

          <div className="wardrobe-sheet">
            <div className="sheet-title">
              <div><small>SELECT</small><h2>{TABS.find((tab) => tab.id === activeTab)?.label}</h2></div>
              {activeTab !== 'makeup' && activeTab !== 'card' ? <button type="button" onClick={randomLook}><RefreshCw size={15} /> 랜덤 추천</button> : null}
            </div>

            {activeTab === 'looks' ? (
              <div className="preset-grid">
                {LOOK_PRESETS.filter((preset) => preset.tone === student.tone).map((preset) => (
                  <button type="button" key={preset.id} onClick={() => setSelection(preset.selection)}>
                    <span className="preset-images">{selectedItems(preset.selection).map((catalogItem) => <img key={catalogItem.id} src={catalogItem.image} alt="" />)}</span>
                    <span><b>{preset.name}</b><small><Star size={11} fill="currentColor" /> {toneLabel(preset.tone)} 추천</small></span>
                  </button>
                ))}
                {savedLooks.map((look) => <button type="button" key={look.id} onClick={() => setSelection(look.selection)}><span className="preset-images">{selectedItems(look.selection).map((catalogItem) => <img key={catalogItem.id} src={catalogItem.image} alt="" />)}</span><span><b>{look.name}</b><small>저장한 코디</small></span></button>)}
              </div>
            ) : null}

            {(['top', 'bottom', 'outer', 'accessory'] as WardrobeCategory[]).includes(activeTab as WardrobeCategory) ? (
              <div className="catalog-grid">
                {itemsFor(activeTab as WardrobeCategory).map((catalogItem) => <CatalogCard key={catalogItem.id} id={catalogItem.id} selected={selection[activeTab as WardrobeCategory] === catalogItem.id} recommended={catalogItem.tone === student.tone || catalogItem.tone === 'neutral'} onSelect={() => choose(activeTab as WardrobeCategory, catalogItem.id)} />)}
              </div>
            ) : null}

            {activeTab === 'makeup' ? (
              <div className="makeup-editor-v2">
                {!generatedImage ? <div className="makeup-wait"><Sparkles size={21} /><b>먼저 가상착의 사진을 만들어 주세요</b><span>완성된 사진에서 립·볼·눈 색상이 실시간으로 바뀝니다.</span></div> : null}
                <MakeupRow label="립" value={makeup.lip} onChange={(value) => setMakeup({ ...makeup, lip: value })} />
                <MakeupRow label="블러셔" value={makeup.blush} onChange={(value) => setMakeup({ ...makeup, blush: value })} />
                <MakeupRow label="아이섀도" value={makeup.eye} onChange={(value) => setMakeup({ ...makeup, eye: value })} />
                <button className="makeup-reset" type="button" onClick={() => setMakeup(DEFAULT_MAKEUP)}><RotateCcw size={16} /> 메이크업 모두 지우기</button>
                <p className="landmark-note">{landmarkStatus === 'ready' ? '얼굴 위치를 찾아 색조만 자연스럽게 적용하고 있어요.' : '얼굴 위치를 준비하는 중이거나 수동 기준 위치를 사용하고 있어요.'}</p>
              </div>
            ) : null}

            {activeTab === 'card' ? (
              <div className="final-card-editor">
                <label>스타일 이름<input value={styleName} maxLength={24} onChange={(event) => setStyleName(event.target.value)} /></label>
                <div className={`wardrobe-result-card ${student.tone}`} ref={cardRef}>
                  <header><span>COLOR MATE</span><b>{toneLabel(student.tone)}</b></header>
                  <div className="result-card-photo">{generatedImage ? <PhotoCanvas imageUrl={generatedImage} makeup={makeup} landmarks={landmarks} placement={FACE_PLACEMENT} /> : <div><ImageIcon size={28} /><span>가상착의 사진을 먼저 만들어 주세요</span></div>}</div>
                  <section><small>{student.name}의 컬러 스타일</small><h2>{styleName || '나의 컬러 스타일'}</h2><p>{chosenItems.map((catalogItem) => catalogItem.name).join(' · ')}</p></section>
                  <PaletteStrip colors={student.palette} ariaLabel="전문가 추천 팔레트" />
                </div>
                <button className="card-download" type="button" disabled={!generatedImage || savingCard} onClick={downloadCard}><Download size={18} />{savingCard ? '카드 만드는 중' : '스타일 카드 PNG 저장'}</button>
                <button className="save-look" type="button" onClick={saveLook}>사진 없이 코디 조합 저장</button>
                <button className="finish-look" type="button" onClick={onComplete}>활동 마치기</button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <button className="retake-photo" type="button" onClick={onRetake}>사진 다시 촬영</button>
      <span className="catalog-credit">의상 이미지 30종 · 앱 전용 AI 상품사진</span>
    </main>
  )
}
