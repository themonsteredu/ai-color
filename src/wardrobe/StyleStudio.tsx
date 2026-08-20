import { ArrowLeft, Check, LoaderCircle, Palette, Shirt, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MAKEUP_COLORS, PERSONAL_COLOR_PROFILES, personalColorLabel, toneLabel } from '../data'
import type { MakeupChoice, MakeupState, Student } from '../types'
import { PhotoCanvas } from '../components/PhotoCanvas'
import { PaletteStrip } from '../components/PaletteStrip'
import { CATEGORY_LABELS, DEFAULT_LOOKS, findItem, itemsFor, selectedItems } from './catalog'
import type { LookSelection, WardrobeCategory } from './types'

type Stage = 'makeup' | 'wardrobe' | 'result'
type Preset = 'natural' | 'kpop' | 'photo' | 'party' | 'custom'
interface AdvancedMakeup {
  preset: Preset
  base: string
  brow: string
  eyeStyle: string
  eyeliner: string
  lashes: string
  blushPlacement: string
  lipFinish: string
  highlight: string
  shading: string
  glitter: string
}
interface Footwear { style: string; color: string }

const CATEGORIES: WardrobeCategory[] = ['top', 'bottom', 'outer', 'accessory']
const FACE_PLACEMENT = { x: 0.5, y: 0.36, scale: 0.29 }
const PRESETS: { key: Preset; label: string; copy: string }[] = [
  { key: 'natural', label: 'SCHOOL NATURAL', copy: '가볍고 자연스럽게' },
  { key: 'kpop', label: 'K-POP STAGE', copy: '선명한 눈매와 포인트' },
  { key: 'photo', label: 'PHOTO DAY', copy: '사진에서 또렷하게' },
  { key: 'party', label: 'PARTY GLITTER', copy: '반짝이는 포인트' },
  { key: 'custom', label: 'MY OWN', copy: '처음부터 직접' },
]
const CONTROL_GROUPS: { key: keyof Omit<AdvancedMakeup, 'preset'>; label: string; options: string[] }[] = [
  { key: 'base', label: '베이스', options: ['내추럴', '세미매트', '글로우'] },
  { key: 'brow', label: '눈썹', options: ['소프트 일자', '내추럴 아치', '또렷 아치'] },
  { key: 'eyeStyle', label: '아이섀도', options: ['원컬러', '2색 그라데이션', '포인트 음영'] },
  { key: 'eyeliner', label: '아이라인', options: ['없음', '내추럴', '꼬리 포인트', '또렷 라인'] },
  { key: 'lashes', label: '속눈썹', options: ['자연', '롱', '볼륨'] },
  { key: 'blushPlacement', label: '블러셔 위치', options: ['중앙', '사선', '광대 위'] },
  { key: 'lipFinish', label: '립 질감', options: ['틴트', '매트', '글로시', '그라데이션'] },
  { key: 'highlight', label: '하이라이터', options: ['없음', '광대', '콧대+광대'] },
  { key: 'shading', label: '쉐딩', options: ['없음', '자연', '또렷'] },
  { key: 'glitter', label: '포인트', options: ['없음', '미세 펄', '눈가 글리터'] },
]
const SHOES = ['화이트 스니커즈', '블랙 스니커즈', '로퍼', '메리제인', '앵클부츠']
const SHOE_COLORS = ['화이트', '블랙', '베이지', '브라운', '네이비']

function defaultAdvanced(): AdvancedMakeup { return { preset: 'natural', base: '내추럴', brow: '소프트 일자', eyeStyle: '원컬러', eyeliner: '내추럴', lashes: '자연', blushPlacement: '중앙', lipFinish: '틴트', highlight: '없음', shading: '없음', glitter: '없음' } }
function makeupForStudent(student: Student): MakeupState {
  const profile = student.personalColorType ? PERSONAL_COLOR_PROFILES[student.personalColorType] : undefined
  return {
    lip: { label: '타입 추천 립', color: profile?.makeup.lip[0] ?? '#EF6F61', intensity: 24 },
    blush: { label: '타입 추천 블러셔', color: profile?.makeup.blush[0] ?? '#F59B72', intensity: 18 },
    eye: { label: '타입 추천 아이', color: profile?.makeup.eye[0] ?? '#E979A5', intensity: 16 },
  }
}
function fileToDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('이미지를 읽지 못했어요.')); reader.readAsDataURL(blob) }) }
async function resizePhoto(photoUrl: string) {
  const source = await fetch(photoUrl).then((response) => response.blob()); const bitmap = await createImageBitmap(source)
  const ratio = Math.min(1280 / bitmap.width, 1600 / bitmap.height, 1); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
  const context = canvas.getContext('2d'); if (!context) throw new Error('사진을 준비하지 못했어요.'); context.fillStyle = '#FAF9F7'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close(); return canvas.toDataURL('image/jpeg', 0.88)
}
async function assetToDataUrl(path: string) { const response = await fetch(path); if (!response.ok) throw new Error('의상 이미지를 불러오지 못했어요.'); return fileToDataUrl(await response.blob()) }

function MakeupRow({ label, value, recommended, onChange }: { label: string; value: MakeupChoice; recommended: string[]; onChange: (value: MakeupChoice) => void }) {
  const choose = (color: string, source: string) => onChange({ ...value, color, label: source })
  return <section className="makeup-control-card"><div className="makeup-control-title"><strong>{label}</strong><b>{value.intensity}%</b></div><small className="makeup-subtitle">⭐ 내 12타입 추천</small><PaletteStrip colors={recommended} labels={recommended.map((_, i) => `추천 ${i + 1}`)} selected={value.color} onSelect={(color) => choose(color, `${label} 추천색`)} /><details className="all-color-details"><summary>다른 톤 색도 비교하기</summary><PaletteStrip colors={MAKEUP_COLORS.map((c) => c.value)} labels={MAKEUP_COLORS.map((c) => c.label)} selected={value.color} onSelect={(color) => choose(color, MAKEUP_COLORS.find((c) => c.value === color)?.label ?? '선택색')} /></details><label className="makeup-range"><span>자연스럽게</span><input type="range" min="0" max="65" value={value.intensity} onChange={(e) => onChange({ ...value, intensity: Number(e.target.value) })} /><span>선명하게</span></label></section>
}

export function StyleStudio({ student, photoUrl, onBack, onRetake, onComplete }: { student: Student; photoUrl: string; onBack: () => void; onRetake: () => void; onComplete: () => void }) {
  const profile = student.personalColorType ? PERSONAL_COLOR_PROFILES[student.personalColorType] : undefined
  const [stage, setStage] = useState<Stage>('makeup')
  const [makeup, setMakeup] = useState<MakeupState>(() => makeupForStudent(student))
  const [advanced, setAdvanced] = useState<AdvancedMakeup>(() => defaultAdvanced())
  const [selection, setSelection] = useState<LookSelection>(() => DEFAULT_LOOKS[student.tone])
  const [footwear, setFootwear] = useState<Footwear>({ style: '화이트 스니커즈', color: '화이트' })
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory>('top')
  const [generatedImage, setGeneratedImage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const chosenItems = useMemo(() => selectedItems(selection), [selection])
  const recommendedCount = chosenItems.filter((item) => item.tone === student.tone || item.tone === 'neutral').length

  const applyPreset = (preset: Preset) => {
    const presets: Record<Preset, Partial<AdvancedMakeup>> = {
      natural: { base: '내추럴', brow: '소프트 일자', eyeStyle: '원컬러', eyeliner: '내추럴', lashes: '자연', blushPlacement: '중앙', lipFinish: '틴트', highlight: '없음', shading: '없음', glitter: '없음' },
      kpop: { base: '세미매트', brow: '또렷 아치', eyeStyle: '포인트 음영', eyeliner: '꼬리 포인트', lashes: '볼륨', blushPlacement: '광대 위', lipFinish: '글로시', highlight: '콧대+광대', shading: '자연', glitter: '미세 펄' },
      photo: { base: '세미매트', brow: '내추럴 아치', eyeStyle: '2색 그라데이션', eyeliner: '내추럴', lashes: '롱', blushPlacement: '사선', lipFinish: '그라데이션', highlight: '광대', shading: '자연', glitter: '없음' },
      party: { base: '글로우', brow: '내추럴 아치', eyeStyle: '포인트 음영', eyeliner: '또렷 라인', lashes: '볼륨', blushPlacement: '광대 위', lipFinish: '글로시', highlight: '콧대+광대', shading: '또렷', glitter: '눈가 글리터' },
      custom: {},
    }
    setAdvanced((current) => ({ ...current, ...presets[preset], preset }))
    if (preset === 'natural') setMakeup((m) => ({ lip: { ...m.lip, intensity: 22 }, blush: { ...m.blush, intensity: 15 }, eye: { ...m.eye, intensity: 13 } }))
    if (preset === 'kpop' || preset === 'party') setMakeup((m) => ({ lip: { ...m.lip, intensity: 40 }, blush: { ...m.blush, intensity: 27 }, eye: { ...m.eye, intensity: 34 } }))
  }
  const updateAdvanced = (key: keyof Omit<AdvancedMakeup, 'preset'>, value: string) => setAdvanced((current) => ({ ...current, [key]: value, preset: 'custom' }))
  const choose = (category: WardrobeCategory, id: string) => { setSelection((current) => ({ ...current, [category]: id })); setError('') }

  const generateFinalStyle = async () => {
    if (isGenerating) return
    setIsGenerating(true); setError('')
    try {
      const personImage = await resizePhoto(photoUrl)
      const garments = await Promise.all(chosenItems.map(async (item) => ({ id: item.id, name: item.name, category: item.category, dataUrl: await assetToDataUrl(item.image) })))
      const response = await fetch('/api/style', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personImage, garments, makeup, advancedMakeup: advanced, footwear, personalColorType: student.personalColorType, studentCode: student.code }) })
      const text = await response.text(); let payload: { imageDataUrl?: string; error?: string }
      try { payload = JSON.parse(text) as { imageDataUrl?: string; error?: string } } catch { throw new Error('AI 이미지 연결을 확인해 주세요.') }
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error ?? '최종 스타일 생성에 실패했어요.')
      setGeneratedImage(payload.imageDataUrl); setStage('result')
    } catch (caught) { setError(caught instanceof Error ? caught.message : '최종 스타일 생성에 실패했어요.') } finally { setIsGenerating(false) }
  }

  if (stage === 'makeup') return <main className="wardrobe-studio"><header className="wardrobe-topbar"><button type="button" onClick={onBack}><ArrowLeft size={20} /></button><div><small>{student.name}의 메이크업 랩</small><strong>1. 내 사진에 메이크업</strong></div><span className={`tone-pill ${student.tone}`}>{student.personalColorType ? personalColorLabel(student.personalColorType) : toneLabel(student.tone)}</span></header><div className="wardrobe-layout makeup-lab-layout"><section className="tryon-stage sticky-preview"><div className="stage-heading"><div><small>MAKEUP LAB</small><h1>마음껏 바꿔보고<br />나만의 조합을 만들어요</h1></div><span><Palette size={14} /> API 비용 0원</span></div><div className="student-photo-stage has-result"><PhotoCanvas imageUrl={photoUrl} makeup={makeup} placement={FACE_PLACEMENT} ariaLabel="내 사진 메이크업 미리보기" /><span className="preview-label">내 사진 · 빠른 미리보기</span></div>{profile ? <div className="profile-mini"><strong>{profile.shortLabel}</strong><span>{profile.keywords.join(' · ')}</span><PaletteStrip colors={profile.palette} /></div> : null}<p className="input-help">미리보기는 빠른 비교용이에요. 베이스·눈썹·라인·속눈썹·질감·윤곽 같은 세부 선택은 마지막 AI 결과에서 자연스럽게 구현됩니다.</p></section><section className="wardrobe-editor"><div className="wardrobe-sheet makeup-lab-sheet"><div className="sheet-title"><div><small>STEP 1</small><h2>메이크업 아티스트 체험</h2></div></div><div className="preset-grid">{PRESETS.map((p) => <button key={p.key} type="button" className={advanced.preset === p.key ? 'selected' : ''} onClick={() => applyPreset(p.key)}><strong>{p.label}</strong><small>{p.copy}</small></button>)}</div><MakeupRow label="립" value={makeup.lip} recommended={profile?.makeup.lip ?? MAKEUP_COLORS.slice(0, 4).map((c) => c.value)} onChange={(lip) => setMakeup((m) => ({ ...m, lip }))} /><MakeupRow label="블러셔" value={makeup.blush} recommended={profile?.makeup.blush ?? MAKEUP_COLORS.slice(0, 4).map((c) => c.value)} onChange={(blush) => setMakeup((m) => ({ ...m, blush }))} /><MakeupRow label="아이섀도" value={makeup.eye} recommended={profile?.makeup.eye ?? MAKEUP_COLORS.slice(0, 4).map((c) => c.value)} onChange={(eye) => setMakeup((m) => ({ ...m, eye }))} /><div className="advanced-makeup-grid">{CONTROL_GROUPS.map((group) => <section key={group.key}><strong>{group.label}</strong><div>{group.options.map((option) => <button type="button" key={option} className={advanced[group.key] === option ? 'selected' : ''} onClick={() => updateAdvanced(group.key, option)}>{option}</button>)}</div></section>)}</div><button className="tryon-button" type="button" onClick={() => setStage('wardrobe')}><Shirt size={20} />이 메이크업으로 패션 스타일링</button></div></section></div></main>

  if (stage === 'wardrobe') return <main className="wardrobe-studio"><header className="wardrobe-topbar"><button type="button" onClick={() => setStage('makeup')}><ArrowLeft size={20} /></button><div><small>{student.name}의 스타일링</small><strong>2. 의상 · 신발 선택</strong></div><span className="generation-credit"><Sparkles size={14} /><b>1</b>회 최종 생성</span></header><div className="wardrobe-layout"><section className="tryon-stage sticky-preview"><div className="stage-heading"><div><small>OUTFIT DESIGN</small><h1>내 컬러에 맞는<br />스타일을 완성해요</h1></div><span><Check size={13} /> 추천 {recommendedCount}/4</span></div><div className="student-photo-stage has-result"><PhotoCanvas imageUrl={photoUrl} makeup={makeup} placement={FACE_PLACEMENT} ariaLabel="메이크업 미리보기" /><span className="preview-label">상반신 사진 그대로 사용</span></div><div className="look-ribbon">{chosenItems.map((item) => <button type="button" key={item.id} onClick={() => setActiveCategory(item.category)}><img src={item.image} alt="" /><span>{CATEGORY_LABELS[item.category]}</span></button>)}</div><div className="footwear-summary"><strong>신발</strong><span>{footwear.color} · {footwear.style}</span></div></section><section className="wardrobe-editor"><nav className="wardrobe-tabs">{CATEGORIES.map((category) => <button type="button" key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}><span><Shirt size={18} /></span>{CATEGORY_LABELS[category]}</button>)}</nav><div className="wardrobe-sheet"><div className="sheet-title"><div><small>STEP 2</small><h2>{CATEGORY_LABELS[activeCategory]}</h2></div></div><div className="catalog-grid">{itemsFor(activeCategory).map((item) => { const selected = selection[activeCategory] === item.id; const recommended = item.tone === student.tone || item.tone === 'neutral'; return <button className={`catalog-card${selected ? ' selected' : ''}`} type="button" key={item.id} onClick={() => choose(activeCategory, item.id)}><span className="catalog-photo"><img src={item.image} alt="" loading="lazy" /></span><span className="catalog-copy"><b>{item.name}</b><small>{item.description}</small></span>{recommended ? <span className="recommend-badge">추천</span> : null}{selected ? <span className="catalog-check"><Check size={15} /></span> : null}</button> })}</div><section className="shoe-picker"><h3>신발까지 고르기</h3><div className="option-pills">{SHOES.map((style) => <button type="button" key={style} className={footwear.style === style ? 'selected' : ''} onClick={() => setFootwear((f) => ({ ...f, style }))}>{style}</button>)}</div><div className="option-pills compact">{SHOE_COLORS.map((color) => <button type="button" key={color} className={footwear.color === color ? 'selected' : ''} onClick={() => setFootwear((f) => ({ ...f, color }))}>{color}</button>)}</div></section><button className="tryon-button" type="button" onClick={generateFinalStyle} disabled={isGenerating}>{isGenerating ? <LoaderCircle className="spin" size={20} /> : <Sparkles size={20} />}{isGenerating ? '전신 스타일을 자연스럽게 완성하는 중' : 'AI로 최종 전신 스타일 완성하기'}</button><p>유료 AI는 여기서 딱 1회만 실행돼요. 얼굴·헤어는 유지하고 사진에 없는 몸은 연령에 맞는 자연스러운 비율로 구성합니다.</p>{error ? <p className="tryon-error" role="alert">{error}</p> : null}</div></section></div></main>

  return <main className="wardrobe-studio"><header className="wardrobe-topbar"><button type="button" onClick={() => setStage('wardrobe')}><ArrowLeft size={20} /></button><div><small>{student.name}의 컬러 스튜디오</small><strong>3. 최종 스타일</strong></div><span className={`tone-pill ${student.tone}`}>{student.personalColorType ? personalColorLabel(student.personalColorType) : toneLabel(student.tone)}</span></header><div className="wardrobe-layout"><section className="tryon-stage"><div className="stage-heading"><div><small>FINAL STYLE</small><h1>내 선택으로 완성한<br />전신 컬러 스타일</h1></div></div><div className="student-photo-stage has-result">{generatedImage ? <img src={generatedImage} alt="AI가 완성한 메이크업과 전신 의상 스타일" /> : null}<span className="preview-label">AI 최종 결과</span></div></section><section className="wardrobe-editor"><div className="wardrobe-sheet"><div className="sheet-title"><div><small>MY CHOICES</small><h2>{student.personalColorType ? personalColorLabel(student.personalColorType) : toneLabel(student.tone)} 스타일</h2></div></div><div className="selection-summary"><div><span style={{ background: makeup.lip.color }} /><small>립</small><strong>{makeup.lip.label}</strong></div><div><span style={{ background: makeup.blush.color }} /><small>블러셔</small><strong>{makeup.blush.label}</strong></div><div><span style={{ background: makeup.eye.color }} /><small>아이</small><strong>{makeup.eye.label}</strong></div></div><div className="final-detail-list"><span>베이스 · {advanced.base}</span><span>눈매 · {advanced.eyeStyle} / {advanced.eyeliner}</span><span>립 · {advanced.lipFinish}</span><span>신발 · {footwear.color} {footwear.style}</span></div><div className="look-ribbon">{chosenItems.map((item) => <span key={item.id}><img src={item.image} alt="" /><small>{findItem(item.id)?.name}</small></span>)}</div><button className="tryon-button" type="button" onClick={onComplete}><Check size={20} />활동 완료</button><button className="secondary-button" type="button" onClick={onRetake}>사진 다시 선택하기</button></div></section></div></main>
}
