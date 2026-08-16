import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  FlipHorizontal,
  Glasses,
  IdCard,
  Image,
  Layers3,
  Redo2,
  RotateCcw,
  Rows3,
  Save,
  Scissors,
  Shirt,
  Shuffle,
  Sparkles,
  Star,
  Undo2,
  UserRound,
  WandSparkles,
  ZoomIn,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { MAKEUP_COLORS } from '../data'
import type { MakeupState, Student } from '../types'
import { PaletteStrip } from '../components/PaletteStrip'
import { PhotoCanvas } from '../components/PhotoCanvas'
import {
  ACCESSORY_ITEMS,
  ALL_COLORS,
  AVATAR_MENUS,
  BACKGROUND_ITEMS,
  BOTTOM_ITEMS,
  createDefaultAvatar,
  HAIR_COLORS,
  HAIR_ITEMS,
  OUTER_ITEMS,
  SEASON_INFO,
  TOP_ITEMS,
} from './data'
import { LayeredAvatarRenderer } from './AvatarRenderer'
import type { AvatarCategory, AvatarItem, AvatarState, Season } from './types'
import { seasonForTone } from './types'
import { useAvatarHistory } from './useAvatarHistory'
import { useFaceLandmarks } from './useFaceLandmarks'

const MENU_ICONS = {
  face: UserRound,
  hair: Scissors,
  makeup: Sparkles,
  top: Shirt,
  bottom: Rows3,
  outer: Layers3,
  accessory: Glasses,
  background: Image,
  card: IdCard,
}

const STYLE_STORAGE_KEY = 'color-mate.avatar-styles.v1'

function loadSavedStyles(studentId: string): AvatarState[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STYLE_STORAGE_KEY) ?? '{}') as Record<string, AvatarState[]>
    return parsed[studentId] ?? []
  } catch {
    return []
  }
}

function persistStyle(studentId: string, style: AvatarState) {
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem(STYLE_STORAGE_KEY) ?? '{}') as Record<string, AvatarState[]> } catch { return {} }
  })()
  stored[studentId] = [style, ...(stored[studentId] ?? [])].slice(0, 5)
  localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(stored))
}

function ItemGrid({ items, selected, onSelect, recommended }: { items: AvatarItem[]; selected: string; onSelect: (id: string) => void; recommended?: string[] }) {
  return (
    <div className="studio-item-grid">
      {items.map((item) => {
        const isSelected = selected === item.id
        return (
          <button type="button" className={isSelected ? 'selected' : ''} key={item.id} onClick={() => onSelect(item.id)}>
            <span className={`item-preview ${item.kind} preview-${item.id}`}><i /><i /></span>
            <b>{item.label}</b>
            {recommended?.includes(item.id) ? <em><Star size={9} fill="currentColor" />추천</em> : null}
            {isSelected ? <i className="selected-check"><Check size={13} /></i> : null}
          </button>
        )
      })}
    </div>
  )
}

function ColorChooser({ state, onColor, onFavorite }: { state: AvatarState; onColor: (color: string) => void; onFavorite: (color: string) => void }) {
  const [season, setSeason] = useState<Season>(state.season)
  const info = SEASON_INFO[season]
  return (
    <div className="studio-color-section">
      <div className="season-tabs" role="tablist" aria-label="계절 팔레트">
        {(Object.keys(SEASON_INFO) as Season[]).map((key) => <button type="button" role="tab" aria-selected={season === key} className={season === key ? 'active' : ''} key={key} onClick={() => setSeason(key)}>{SEASON_INFO[key].label.replace('톤', '')}</button>)}
      </div>
      <div className="color-option-row">
        {info.colors.map((color) => {
          const favorite = state.favoriteColors.includes(color)
          return <div className="color-option" key={color}><button type="button" onClick={() => onColor(color)} style={{ background: color }} aria-label={`${info.label} 추천 색상 ${color}`}><Star size={12} fill="white" /></button><button type="button" className={favorite ? 'favorite active' : 'favorite'} onClick={() => onFavorite(color)} aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기'}><Star size={11} fill={favorite ? 'currentColor' : 'none'} /></button></div>
        })}
      </div>
      {state.recentColors.length ? <div className="recent-colors"><span>최근 사용</span>{state.recentColors.slice(0, 6).map((color) => <button type="button" key={color} style={{ background: color }} onClick={() => onColor(color)} aria-label={`최근 사용 색상 ${color}`} />)}</div> : null}
    </div>
  )
}

function FacePanel({ state, onChange, onRetake, landmarkStatus }: { state: AvatarState; onChange: (state: AvatarState) => void; onRetake: () => void; landmarkStatus: string }) {
  const update = (changes: Partial<AvatarState['face']>) => onChange({ ...state, face: { ...state.face, ...changes } })
  const statusText = landmarkStatus === 'ready' ? '얼굴 랜드마크 자동 맞춤 완료' : landmarkStatus === 'loading' ? '얼굴 위치를 찾는 중…' : '직접 맞춤을 사용할 수 있어요'
  return (
    <div className="studio-panel-content face-editor">
      <div className={`landmark-status ${landmarkStatus}`}><WandSparkles size={16} /><span>{statusText}</span></div>
      <div className="panel-actions three"><button type="button" onClick={onRetake}><Camera size={17} />다시 촬영</button><button type="button" className={state.face.fitMode === 'auto' ? 'active' : ''} onClick={() => update({ scale: 1, x: 0, y: 0, neck: 0, fitMode: 'auto' })}><WandSparkles size={17} />자동 맞춤</button><button type="button" className={state.face.fitMode === 'manual' ? 'active' : ''} onClick={() => update({ fitMode: 'manual' })}><UserRound size={17} />직접 맞춤</button></div>
      <label>얼굴 크기 <b>{Math.round(state.face.scale * 100)}%</b><input type="range" min="75" max="145" value={state.face.scale * 100} onChange={(event) => update({ scale: Number(event.target.value) / 100, fitMode: 'manual' })} /></label>
      <label>얼굴 좌우 위치 <b>{state.face.x}</b><input type="range" min="-35" max="35" value={state.face.x} onChange={(event) => update({ x: Number(event.target.value), fitMode: 'manual' })} /></label>
      <label>얼굴 위아래 위치 <b>{state.face.y}</b><input type="range" min="-35" max="35" value={state.face.y} onChange={(event) => update({ y: Number(event.target.value), fitMode: 'manual' })} /></label>
      <label>목 연결 위치 <b>{state.face.neck}</b><input type="range" min="-18" max="22" value={state.face.neck} onChange={(event) => update({ neck: Number(event.target.value), fitMode: 'manual' })} /></label>
      <label>배경 제거 강도 <b>{state.face.mask}%</b><input type="range" min="45" max="92" value={state.face.mask} onChange={(event) => update({ mask: Number(event.target.value) })} /></label>
    </div>
  )
}

function HairPanel({ state, onChange }: { state: AvatarState; onChange: (state: AvatarState) => void }) {
  return (
    <div className="studio-panel-content">
      <ItemGrid items={HAIR_ITEMS} selected={state.hair.styleId} onSelect={(styleId) => onChange({ ...state, hair: { ...state.hair, styleId } })} recommended={['short', 'bob', 'bang']} />
      {state.hair.styleId !== 'original' ? <><h4>헤어 색상</h4><PaletteStrip colors={HAIR_COLORS} selected={state.hair.color} onSelect={(color) => onChange({ ...state, hair: { ...state.hair, color } })} /></> : <p className="panel-hint">원본 머리를 그대로 사용해 자연스럽게 연결합니다.</p>}
    </div>
  )
}

function MakeupPanel({ state, onChange }: { state: AvatarState; onChange: (state: AvatarState) => void }) {
  const updatePart = (part: keyof MakeupState, changes: Partial<MakeupState[keyof MakeupState]>) => onChange({ ...state, makeup: { ...state.makeup, [part]: { ...state.makeup[part], ...changes } } })
  return (
    <div className="studio-panel-content makeup-editor">
      {(['lip', 'blush', 'eye'] as const).map((part) => {
        const labels = { lip: '립', blush: '블러셔', eye: '아이섀도' }
        return <div className="makeup-row" key={part}><div><strong>{labels[part]}</strong><b>{state.makeup[part].intensity}%</b></div><PaletteStrip colors={MAKEUP_COLORS.map((item) => item.value)} labels={MAKEUP_COLORS.map((item) => item.label)} selected={state.makeup[part].color} onSelect={(color) => updatePart(part, { color, label: MAKEUP_COLORS.find((item) => item.value === color)?.label ?? '선택 색상' })} /><input type="range" min="0" max="65" value={state.makeup[part].intensity} onChange={(event) => updatePart(part, { intensity: Number(event.target.value) })} aria-label={`${labels[part]} 적용 강도`} /></div>
      })}
      <button type="button" className="panel-reset" onClick={() => onChange({ ...state, makeup: { lip: { ...state.makeup.lip, intensity: 0 }, blush: { ...state.makeup.blush, intensity: 0 }, eye: { ...state.makeup.eye, intensity: 0 } } })}><RotateCcw size={16} />메이크업 모두 지우기</button>
    </div>
  )
}

function OutfitPanel({ category, state, onChange }: { category: 'top' | 'bottom' | 'outer'; state: AvatarState; onChange: (state: AvatarState) => void }) {
  const items = category === 'top' ? TOP_ITEMS : category === 'bottom' ? BOTTOM_ITEMS : OUTER_ITEMS
  const selection = state[category]
  const setColor = (color: string) => onChange({ ...state, [category]: { ...selection, color }, recentColors: [color, ...state.recentColors.filter((item) => item !== color)].slice(0, 8) })
  return (
    <div className="studio-panel-content">
      <ItemGrid items={items} selected={selection.itemId} onSelect={(itemId) => onChange({ ...state, [category]: { ...selection, itemId } })} recommended={category === 'top' ? ['tee', 'shirt', 'knit'] : undefined} />
      {category !== 'outer' || selection.itemId !== 'none' ? <ColorChooser state={state} onColor={setColor} onFavorite={(color) => onChange({ ...state, favoriteColors: state.favoriteColors.includes(color) ? state.favoriteColors.filter((item) => item !== color) : [...state.favoriteColors, color] })} /> : null}
    </div>
  )
}

function AccessoryPanel({ state, onChange }: { state: AvatarState; onChange: (state: AvatarState) => void }) {
  return <div className="studio-panel-content"><div className="accessory-grid">{ACCESSORY_ITEMS.map((item) => { const active = state.accessories.includes(item.id); return <button type="button" className={active ? 'active' : ''} key={item.id} onClick={() => onChange({ ...state, accessories: active ? state.accessories.filter((id) => id !== item.id) : [...state.accessories, item.id] })}><span className={`accessory-preview ${item.id}`} /><b>{item.label}</b>{active ? <Check size={14} /> : null}</button> })}</div></div>
}

function BackgroundPanel({ state, onChange }: { state: AvatarState; onChange: (state: AvatarState) => void }) {
  return <div className="studio-panel-content"><div className="background-grid">{BACKGROUND_ITEMS.map((item) => <button type="button" className={state.backgroundId === item.id ? 'selected' : ''} key={item.id} onClick={() => onChange({ ...state, backgroundId: item.id })}><span style={{ background: item.value }} /> <b>{item.label}</b>{state.backgroundId === item.id ? <Check size={14} /> : null}</button>)}</div></div>
}

function AvatarStyleCard({ student, state, photoUrl, landmarks }: { student: Student; state: AvatarState; photoUrl: string; landmarks: ReturnType<typeof useFaceLandmarks>['landmarks'] }) {
  const info = SEASON_INFO[state.season]
  return (
    <div className={`avatar-style-card season-${state.season}`}>
      <header><span>COLOR MATE · AVATAR STUDIO</span><b>{info.label}</b></header>
      <LayeredAvatarRenderer state={state} photoUrl={photoUrl} landmarks={landmarks} compact />
      <section><small>{student.name}님의 컬러 아바타</small><h2>{state.styleName || '나의 컬러 스타일'}</h2><p>{info.label} · {state.detailType}</p></section>
      <div className="card-item-summary"><span>상의 <b>{TOP_ITEMS.find((item) => item.id === state.top.itemId)?.label}</b></span><span>헤어 <b>{HAIR_ITEMS.find((item) => item.id === state.hair.styleId)?.label}</b></span><span>메이크업 <b>{state.makeup.lip.label}</b></span></div>
      <PaletteStrip colors={info.colors} />
    </div>
  )
}

interface AvatarStudioProps {
  student: Student
  photoUrl: string
  onBack: () => void
  onRetake: () => void
  onComplete: () => void
}

export function AvatarStudio({ student, photoUrl, onBack, onRetake, onComplete }: AvatarStudioProps) {
  const initialSeason = seasonForTone(student.tone)
  const { avatar, setAvatar, undo, redo, reset, canUndo, canRedo } = useAvatarHistory(createDefaultAvatar(initialSeason))
  const { landmarks, status: landmarkStatus } = useFaceLandmarks(photoUrl)
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('top')
  const [previewMode, setPreviewMode] = useState<'avatar' | 'original' | 'compare'>('avatar')
  const [toast, setToast] = useState('')
  const [celebrating, setCelebrating] = useState(false)
  const [savedStyles, setSavedStyles] = useState<AvatarState[]>(() => loadSavedStyles(student.id))
  const cardRef = useRef<HTMLDivElement>(null)

  const completion = useMemo(() => {
    let score = 24
    if (avatar.hair.styleId !== 'original') score += 10
    if (avatar.makeup.lip.intensity > 0) score += 12
    if (avatar.top.itemId) score += 14
    if (avatar.bottom.itemId) score += 10
    if (avatar.outer.itemId !== 'none') score += 8
    if (avatar.accessories.length) score += 8
    if (avatar.backgroundId !== 'ivory') score += 8
    if (avatar.styleName !== '나의 컬러 스타일') score += 6
    return Math.min(100, score)
  }, [avatar])
  const recommendedColors = SEASON_INFO[avatar.season].colors
  const points = [avatar.top.color, avatar.outer.color, avatar.makeup.lip.color].filter((color) => recommendedColors.includes(color)).length * 10

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  const saveCombination = () => {
    persistStyle(student.id, avatar)
    setSavedStyles((current) => [avatar, ...current].slice(0, 5))
    showToast('스타일 조합을 저장했어요')
  }

  const randomize = () => {
    const colors = SEASON_INFO[avatar.season].colors
    setAvatar((current) => ({
      ...current,
      top: { itemId: TOP_ITEMS[Math.floor(Math.random() * TOP_ITEMS.length)].id, color: colors[Math.floor(Math.random() * colors.length)] },
      bottom: { ...current.bottom, itemId: BOTTOM_ITEMS[Math.floor(Math.random() * BOTTOM_ITEMS.length)].id },
      hair: { ...current.hair, styleId: HAIR_ITEMS[1 + Math.floor(Math.random() * (HAIR_ITEMS.length - 1))].id },
      backgroundId: BACKGROUND_ITEMS[Math.floor(Math.random() * BACKGROUND_ITEMS.length)].id,
    }))
    showToast('추천 코디를 골랐어요')
  }

  const downloadCard = async () => {
    if (!cardRef.current) return
    const { toPng } = await import('html-to-image')
    await document.fonts.ready
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#fffdf9', cacheBust: true })
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${student.name}-${avatar.styleName || '컬러아바타'}.png`
    link.click()
    saveCombination()
  }

  const alternateState = { ...avatar, top: { ...avatar.top, color: ALL_COLORS.find((color) => !recommendedColors.includes(color)) ?? '#46577E' } }
  const finishStudio = () => {
    persistStyle(student.id, avatar)
    setCelebrating(true)
    window.setTimeout(onComplete, 1100)
  }

  return (
    <main className="avatar-studio-page">
      <header className="studio-topbar">
        <button type="button" className="studio-back" onClick={onBack} aria-label="활동 홈으로 돌아가기"><ArrowLeft size={19} /></button>
        <div className="studio-student"><small>{student.name}의 스튜디오</small><strong>{SEASON_INFO[avatar.season].label}</strong></div>
        <div className="studio-progress"><span><i style={{ width: `${completion}%` }} /></span><b>{completion}%</b></div>
        <div className="studio-top-actions">
          <button type="button" onClick={undo} disabled={!canUndo} aria-label="실행 취소"><Undo2 size={18} /></button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="다시 실행"><Redo2 size={18} /></button>
          <button type="button" onClick={() => reset(createDefaultAvatar(initialSeason))} aria-label="아바타 초기화"><RotateCcw size={18} /></button>
          <button type="button" className="save" onClick={saveCombination} aria-label="현재 스타일 저장"><Save size={17} /><span>저장</span></button>
        </div>
      </header>

      <div className="studio-workspace">
        <section className="studio-preview-area">
          <div className="point-pill"><Star size={13} fill="currentColor" /><b>{points}P</b><span>추천 컬러 포인트</span></div>
          {previewMode === 'original' ? <div className="studio-original-preview"><PhotoCanvas imageUrl={photoUrl} makeup={avatar.makeup} landmarks={landmarks} placement={{ x: .5, y: .37, scale: .29 }} /><span>실제 얼굴 메이크업 미리보기</span></div> : previewMode === 'compare' ? <div className="studio-tone-compare"><figure><LayeredAvatarRenderer state={avatar} photoUrl={photoUrl} landmarks={landmarks} compact /><figcaption><Star size={12} fill="currentColor" />추천 색상</figcaption></figure><figure><LayeredAvatarRenderer state={alternateState} photoUrl={photoUrl} landmarks={landmarks} compact /><figcaption>다른 계절 색상</figcaption></figure></div> : <LayeredAvatarRenderer state={avatar} photoUrl={photoUrl} landmarks={landmarks} />}

          <div className="preview-controls">
            <div className="pose-switch" aria-label="아바타 방향"><button type="button" className={avatar.pose === 'left' ? 'active' : ''} onClick={() => setAvatar({ ...avatar, pose: 'left' })}>왼쪽</button><button type="button" className={avatar.pose === 'front' ? 'active' : ''} onClick={() => setAvatar({ ...avatar, pose: 'front' })}>정면</button><button type="button" className={avatar.pose === 'right' ? 'active' : ''} onClick={() => setAvatar({ ...avatar, pose: 'right' })}>오른쪽</button></div>
            <button type="button" onClick={() => setAvatar({ ...avatar, zoom: avatar.zoom >= 1.18 ? .86 : avatar.zoom + .08 })} aria-label="아바타 확대 축소"><ZoomIn size={18} /></button>
            <button type="button" onClick={() => setAvatar({ ...avatar, flipped: !avatar.flipped })} aria-label="아바타 좌우 반전"><FlipHorizontal size={18} /></button>
            <button type="button" onClick={randomize} aria-label="랜덤 코디 추천"><Shuffle size={18} /></button>
          </div>
          <div className="preview-mode-actions"><button type="button" className={previewMode === 'original' ? 'active' : ''} onClick={() => setPreviewMode(previewMode === 'original' ? 'avatar' : 'original')}>원본·메이크업</button><button type="button" className={previewMode === 'compare' ? 'active' : ''} onClick={() => setPreviewMode(previewMode === 'compare' ? 'avatar' : 'compare')}>추천·비추천 비교</button></div>
        </section>

        <section className="studio-editor-area">
          <nav className="studio-menu" aria-label="아바타 편집 메뉴">
            {AVATAR_MENUS.map((menu) => { const Icon = MENU_ICONS[menu.id]; return <button type="button" className={activeCategory === menu.id ? 'active' : ''} key={menu.id} onClick={() => { setActiveCategory(menu.id); setPreviewMode('avatar') }}><span><Icon size={19} /></span><b>{menu.label}</b></button> })}
          </nav>
          <div className="studio-bottom-sheet">
            <div className="sheet-handle" />
            <div className="sheet-heading"><div><small>EDIT</small><h2>{AVATAR_MENUS.find((menu) => menu.id === activeCategory)?.label}</h2></div><span>{activeCategory === 'top' || activeCategory === 'makeup' ? <><Star size={12} fill="currentColor" />추천 표시</> : '선택 즉시 적용'}</span></div>
            {activeCategory === 'face' ? <FacePanel state={avatar} onChange={setAvatar} onRetake={onRetake} landmarkStatus={landmarkStatus} /> : null}
            {activeCategory === 'hair' ? <HairPanel state={avatar} onChange={setAvatar} /> : null}
            {activeCategory === 'makeup' ? <MakeupPanel state={avatar} onChange={setAvatar} /> : null}
            {activeCategory === 'top' || activeCategory === 'bottom' || activeCategory === 'outer' ? <OutfitPanel category={activeCategory} state={avatar} onChange={setAvatar} /> : null}
            {activeCategory === 'accessory' ? <AccessoryPanel state={avatar} onChange={setAvatar} /> : null}
            {activeCategory === 'background' ? <BackgroundPanel state={avatar} onChange={setAvatar} /> : null}
            {activeCategory === 'card' ? <div className="studio-card-panel"><label>스타일 이름<input value={avatar.styleName} maxLength={22} onChange={(event) => setAvatar({ ...avatar, styleName: event.target.value })} /></label><div ref={cardRef}><AvatarStyleCard student={student} state={avatar} photoUrl={photoUrl} landmarks={landmarks} /></div><button type="button" className="studio-primary" onClick={downloadCard}><Download size={18} />PNG 저장</button><button type="button" className="studio-secondary" onClick={finishStudio}>완성하고 활동 마치기</button><button type="button" className="studio-restart" onClick={() => { reset(createDefaultAvatar(initialSeason)); setActiveCategory('top') }}><RotateCcw size={15} />처음부터 다시 만들기</button>{savedStyles.length ? <div className="saved-style-list"><strong>이전 스타일 다시 불러오기</strong>{savedStyles.map((style, index) => <button type="button" key={`${style.styleName}-${index}`} onClick={() => setAvatar(style)}><span style={{ background: style.top.color }} /><b>{style.styleName}</b><small>{SEASON_INFO[style.season].label}</small></button>)}</div> : null}</div> : null}
          </div>
        </section>
      </div>
      {toast ? <div className="studio-toast" role="status"><Check size={17} />{toast}</div> : null}
      {celebrating ? <div className="studio-celebration" role="status"><div className="confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div><span><Star size={29} fill="currentColor" /></span><strong>컬러 아바타 완성!</strong><p>{student.name}님만의 스타일이 멋지게 완성됐어요.</p></div> : null}
    </main>
  )
}
