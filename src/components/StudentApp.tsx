import {
  ArrowRight,
  Check,
  Columns2,
  IdCard,
  Palette,
  RotateCcw,
  ScanFace,
  Shirt,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_MAKEUP, MAKEUP_COLORS, OUTFIT_COLORS, toneLabel } from '../data'
import { loadStudents, saveStudents } from '../store'
import type { ActivityKey, FacePlacement, MakeupState, Student, StudentScreen } from '../types'
import { BottomNav } from './BottomNav'
import { PaletteStrip } from './PaletteStrip'
import { PhotoCanvas } from './PhotoCanvas'
import { PhotoCapture } from './PhotoCapture'
import { ProgressBar } from './ProgressBar'
import { TopBar } from './TopBar'

const MAKEUP_TABS = [
  { key: 'lip', label: '립' },
  { key: 'blush', label: '블러셔' },
  { key: 'eye', label: '아이섀도' },
] as const

const DEFAULT_PLACEMENT: FacePlacement = { x: 0.5, y: 0.37, scale: 0.29 }

function IntroMark() {
  return (
    <div className="intro-mark" aria-hidden="true">
      <span /><span /><span /><span />
      <i><Palette size={27} /></i>
    </div>
  )
}

interface StartScreenProps {
  query: string
  error: string
  onQuery: (value: string) => void
  onSubmit: () => void
}

function StartScreen({ query, error, onQuery, onSubmit }: StartScreenProps) {
  return (
    <main className="start-screen page-content no-nav">
      <div className="start-decoration warm" /><div className="start-decoration cool" />
      <section className="intro-block">
        <IntroMark />
        <span className="eyebrow">MY COLOR ACTIVITY</span>
        <h1>컬러메이트</h1>
        <p>전문가가 찾아준 나의 색</p>
      </section>
      <form className="start-form" onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <label htmlFor="student-query">이름 또는 활동 코드</label>
        <input
          id="student-query"
          autoComplete="off"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="예: 김하늘 또는 COLOR01"
          aria-describedby={error ? 'query-error query-help' : 'query-help'}
        />
        <p id="query-help" className="input-help">테스트: 김하늘 · COLOR01 · 윤보라 · COOL02</p>
        {error ? <p id="query-error" className="form-error" role="alert">{error}</p> : null}
        <button className="primary-button" type="submit">결과 확인하기<ArrowRight size={20} /></button>
      </form>
      <a className="expert-link" href="/expert">전문가 관리 화면</a>
    </main>
  )
}

interface ToneResultProps {
  student: Student
  onContinue: () => void
  onReset: () => void
}

function ToneResult({ student, onContinue, onReset }: ToneResultProps) {
  const warm = student.tone === 'warm'
  return (
    <main className={`tone-result page-content no-nav ${student.tone}`}>
      <button className="quiet-back" type="button" onClick={onReset}>다른 이름 입력</button>
      <section className="tone-card">
        <div className="tone-orbit"><span>{warm ? <Sun size={42} /> : '❄'}</span></div>
        <p>나의 퍼스널컬러</p>
        <h1>{toneLabel(student.tone)}</h1>
        <strong>{warm ? '따뜻하고 생기 있는 색이 잘 어울려요' : '맑고 세련된 색이 잘 어울려요'}</strong>
        <PaletteStrip colors={student.palette} ariaLabel="전문가 추천 팔레트" />
        <div className="expert-note"><Sparkles size={17} /><span><b>전문가의 추천</b>{warm ? '코랄과 살구색으로 밝은 인상을 살려보세요.' : '라벤더와 블루로 맑은 인상을 살려보세요.'}</span></div>
      </section>
      <button className="primary-button" type="button" onClick={onContinue}>컬러 활동 시작하기<ArrowRight size={20} /></button>
    </main>
  )
}

interface ActivityHomeProps {
  student: Student
  hasPhoto: boolean
  onOpen: (screen: StudentScreen) => void
  onReset: () => void
}

function ActivityHome({ student, hasPhoto, onOpen, onReset }: ActivityHomeProps) {
  const completedCount = new Set(student.completed).size
  const percent = (completedCount / 5) * 100
  const activities = [
    { screen: hasPhoto ? 'outfit' : 'photo', title: '옷 색상 비교', copy: hasPhoto ? '상의 색을 바꿔 어울림을 확인해요' : '먼저 사진을 준비해요', icon: Shirt, color: 'coral', done: student.completed.includes('outfit') },
    { screen: hasPhoto ? 'makeup' : 'photo', title: '컬러 메이크업', copy: '립·블러셔·아이섀도를 체험해요', icon: Sparkles, color: 'apricot', done: student.completed.includes('makeup') },
    { screen: hasPhoto ? 'outfitCompare' : 'photo', title: '두 색 비교', copy: '같은 얼굴로 두 색을 나란히 봐요', icon: Columns2, color: 'sage', done: student.completed.includes('compare') },
    { screen: hasPhoto ? 'card' : 'photo', title: '나의 컬러 스타일', copy: '선택한 조합을 카드로 저장해요', icon: IdCard, color: 'lavender', done: student.completed.includes('card') },
  ] as const

  return (
    <>
      <main className="page-content home-screen">
        <div className="welcome-row">
          <div><span>{student.name}님, 반가워요</span><h1>오늘의 컬러 활동</h1></div>
          <span className={`tone-pill ${student.tone}`}>{toneLabel(student.tone)}</span>
        </div>
        <ProgressBar value={percent} label={`${completedCount}/5 활동 완료`} />
        <div className="activity-grid">
          {activities.map(({ screen, title, copy, icon: Icon, color, done }) => (
            <button className={`activity-card ${color}`} type="button" key={title} onClick={() => onOpen(screen)}>
              <span className="activity-icon"><Icon size={26} /></span>
              {done ? <span className="done-mark"><Check size={14} />완료</span> : null}
              <strong>{title}</strong><small>{copy}</small><ArrowRight size={18} className="activity-arrow" />
            </button>
          ))}
        </div>
        {!hasPhoto ? (
          <button className="photo-cta" type="button" onClick={() => onOpen('photo')}>
            <span><ScanFace size={24} /></span><div><strong>사진부터 준비할까요?</strong><small>사진은 서버에 전송되지 않아요</small></div><ArrowRight size={19} />
          </button>
        ) : null}
        <button className="text-button" type="button" onClick={onReset}>활동 종료 및 사진 삭제</button>
      </main>
    </>
  )
}

interface PlacementControlsProps {
  value: FacePlacement
  onChange: (value: FacePlacement) => void
}

function PlacementControls({ value, onChange }: PlacementControlsProps) {
  return (
    <details className="placement-controls">
      <summary>색상 위치가 맞지 않나요?</summary>
      <p>얼굴 중심과 크기를 사진에 맞게 조절해 주세요.</p>
      <label>좌우 위치<input type="range" min="35" max="65" value={value.x * 100} onChange={(event) => onChange({ ...value, x: Number(event.target.value) / 100 })} /></label>
      <label>상하 위치<input type="range" min="27" max="47" value={value.y * 100} onChange={(event) => onChange({ ...value, y: Number(event.target.value) / 100 })} /></label>
      <label>얼굴 크기<input type="range" min="21" max="37" value={value.scale * 100} onChange={(event) => onChange({ ...value, scale: Number(event.target.value) / 100 })} /></label>
    </details>
  )
}

interface OutfitScreenProps {
  imageUrl: string
  selected: string
  placement: FacePlacement
  onPlacement: (value: FacePlacement) => void
  onSelect: (value: string) => void
  onBack: () => void
  onCompare: () => void
  onNext: () => void
}

function OutfitScreen({ imageUrl, selected, placement, onPlacement, onSelect, onBack, onCompare, onNext }: OutfitScreenProps) {
  return (
    <main className="page-content editor-screen no-nav">
      <TopBar title="옷 색상을 바꿔보세요" onBack={onBack} />
      <PhotoCanvas imageUrl={imageUrl} outfitColor={selected} placement={placement} ariaLabel="선택한 상의 색상이 적용된 사진" />
      <div className="editor-panel">
        <div className="section-heading"><div><span>상의 색상</span><strong>{OUTFIT_COLORS.find((color) => color.value === selected)?.label}</strong></div><small>얼굴은 그대로, 목 아래 색만 바뀌어요</small></div>
        <PaletteStrip colors={OUTFIT_COLORS.map((color) => color.value)} labels={OUTFIT_COLORS.map((color) => color.label)} selected={selected} onSelect={onSelect} ariaLabel="상의 색상 선택" />
        <PlacementControls value={placement} onChange={onPlacement} />
      </div>
      <button className="secondary-button" type="button" onClick={onCompare}><Columns2 size={20} />두 색 나란히 비교</button>
      <button className="primary-button" type="button" onClick={onNext}>이 색으로 메이크업 하기<ArrowRight size={20} /></button>
    </main>
  )
}

interface OutfitCompareProps {
  imageUrl: string
  leftColor: string
  rightColor: string
  placement: FacePlacement
  onRightColor: (value: string) => void
  onBack: () => void
  onDone: () => void
}

function OutfitCompare({ imageUrl, leftColor, rightColor, placement, onRightColor, onBack, onDone }: OutfitCompareProps) {
  const leftLabel = OUTFIT_COLORS.find((color) => color.value === leftColor)?.label
  const rightLabel = OUTFIT_COLORS.find((color) => color.value === rightColor)?.label
  return (
    <main className="page-content compare-screen no-nav">
      <TopBar title="어느 쪽이 더 잘 어울리나요?" onBack={onBack} />
      <p className="screen-lead">같은 사진에서 상의 색만 비교해 보세요.</p>
      <div className="side-by-side">
        <figure><PhotoCanvas imageUrl={imageUrl} outfitColor={leftColor} placement={placement} /><figcaption><i style={{ background: leftColor }} />{leftLabel}</figcaption></figure>
        <figure><PhotoCanvas imageUrl={imageUrl} outfitColor={rightColor} placement={placement} /><figcaption><i style={{ background: rightColor }} />{rightLabel}</figcaption></figure>
      </div>
      <div className="editor-panel compact">
        <span className="panel-label">오른쪽 색 바꾸기</span>
        <PaletteStrip colors={OUTFIT_COLORS.map((color) => color.value)} labels={OUTFIT_COLORS.map((color) => color.label)} selected={rightColor} onSelect={onRightColor} />
      </div>
      <button className="primary-button" type="button" onClick={onDone}>비교 완료<Check size={20} /></button>
    </main>
  )
}

interface MakeupScreenProps {
  imageUrl: string
  outfitColor: string
  makeup: MakeupState
  placement: FacePlacement
  onPlacement: (value: FacePlacement) => void
  onMakeup: (value: MakeupState) => void
  onBack: () => void
  onNext: () => void
}

function MakeupScreen({ imageUrl, outfitColor, makeup, placement, onPlacement, onMakeup, onBack, onNext }: MakeupScreenProps) {
  const [activeTab, setActiveTab] = useState<keyof MakeupState>('lip')
  const current = makeup[activeTab]
  const updateCurrent = (changes: Partial<(typeof makeup)[typeof activeTab]>) => onMakeup({ ...makeup, [activeTab]: { ...current, ...changes } })
  return (
    <main className="page-content editor-screen makeup-screen no-nav">
      <TopBar title="컬러 메이크업" onBack={onBack} badge="자연스럽게" />
      <PhotoCanvas imageUrl={imageUrl} outfitColor={outfitColor} makeup={makeup} placement={placement} ariaLabel="메이크업 색상이 적용된 사진" />
      <div className="makeup-tabs" role="tablist" aria-label="메이크업 부위">
        {MAKEUP_TABS.map((tab) => <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} className={activeTab === tab.key ? 'active' : ''} type="button" onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
      </div>
      <div className="editor-panel makeup-panel">
        <PaletteStrip
          colors={MAKEUP_COLORS.map((color) => color.value)}
          labels={MAKEUP_COLORS.map((color) => color.label)}
          selected={current.color}
          onSelect={(color) => updateCurrent({ color, label: MAKEUP_COLORS.find((item) => item.value === color)?.label ?? '선택 색상' })}
          ariaLabel={`${MAKEUP_TABS.find((tab) => tab.key === activeTab)?.label} 색상 선택`}
        />
        <div className="intensity-control">
          <div><span>컬러 강도</span><strong>{current.intensity}%</strong></div>
          <label><span>자연스럽게</span><input type="range" min="0" max="65" value={current.intensity} onChange={(event) => updateCurrent({ intensity: Number(event.target.value) })} /><span>선명하게</span></label>
        </div>
        <PlacementControls value={placement} onChange={onPlacement} />
      </div>
      <button className="secondary-button" type="button" onClick={() => onMakeup(DEFAULT_MAKEUP)}><RotateCcw size={19} />메이크업 초기화</button>
      <button className="primary-button" type="button" onClick={onNext}>적용 전후 비교하기<ArrowRight size={20} /></button>
    </main>
  )
}

interface BeforeAfterProps {
  imageUrl: string
  outfitColor: string
  makeup: MakeupState
  placement: FacePlacement
  onBack: () => void
  onNext: () => void
}

function BeforeAfter({ imageUrl, outfitColor, makeup, placement, onBack, onNext }: BeforeAfterProps) {
  const [position, setPosition] = useState(52)
  return (
    <main className="page-content before-after-screen no-nav">
      <TopBar title="적용 전 · 후" onBack={onBack} />
      <p className="screen-lead">슬라이더를 움직여 같은 사진을 비교해 보세요.</p>
      <div className="comparison-slider" style={{ '--reveal': `${position}%` } as React.CSSProperties}>
        <PhotoCanvas imageUrl={imageUrl} placement={placement} ariaLabel="적용 전 사진" />
        <div className="after-layer"><PhotoCanvas imageUrl={imageUrl} outfitColor={outfitColor} makeup={makeup} placement={placement} ariaLabel="적용 후 사진" /></div>
        <span className="before-label">적용 전</span><span className="after-label">적용 후</span><i className="divider" />
      </div>
      <label className="sr-only" htmlFor="compare-range">적용 전후 비교 위치</label>
      <input id="compare-range" className="compare-range" type="range" min="8" max="92" value={position} onChange={(event) => setPosition(Number(event.target.value))} />
      <div className="selection-summary">
        <div><span style={{ background: outfitColor }} /><small>상의</small><strong>{OUTFIT_COLORS.find((color) => color.value === outfitColor)?.label}</strong></div>
        <div><span style={{ background: makeup.lip.color }} /><small>립</small><strong>{makeup.lip.label}</strong></div>
        <div><span style={{ background: makeup.blush.color }} /><small>블러셔</small><strong>{makeup.blush.label}</strong></div>
      </div>
      <button className="primary-button" type="button" onClick={onNext}>나의 스타일 카드 만들기<IdCard size={20} /></button>
    </main>
  )
}

interface StyleCardScreenProps {
  student: Student
  imageUrl: string
  outfitColor: string
  makeup: MakeupState
  placement: FacePlacement
  onBack: () => void
  onSaved: () => void
  onFinish: () => void
}

function StyleCardScreen({ student, imageUrl, outfitColor, makeup, placement, onBack, onSaved, onFinish }: StyleCardScreenProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const saveCard = async () => {
    if (!cardRef.current) return
    setSaving(true)
    try {
      const { toPng } = await import('html-to-image')
      await document.fonts.ready
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#fffdf9' })
      const link = document.createElement('a')
      link.download = `${student.name}-컬러스타일.png`
      link.href = dataUrl
      link.click()
      onSaved()
    } finally {
      setSaving(false)
    }
  }
  return (
    <main className="page-content style-card-screen no-nav">
      <TopBar title="나의 컬러 스타일" onBack={onBack} />
      <div ref={cardRef} className={`style-card ${student.tone}`}>
        <div className="card-kicker"><span><Sparkles size={15} />COLOR MATE</span><b>{toneLabel(student.tone)}</b></div>
        <div className="card-photo"><PhotoCanvas imageUrl={imageUrl} outfitColor={outfitColor} makeup={makeup} placement={placement} /></div>
        <div className="card-copy"><small>{student.name}님의 퍼스널컬러</small><h2>{toneLabel(student.tone)} 컬러 스타일</h2><p>{student.tone === 'warm' ? '따뜻하고 생기 있는 색으로 완성했어요.' : '맑고 세련된 색으로 완성했어요.'}</p></div>
        <div className="card-selections">
          <div><span style={{ background: outfitColor }} /><small>상의</small><strong>{OUTFIT_COLORS.find((color) => color.value === outfitColor)?.label}</strong></div>
          <div><span style={{ background: makeup.lip.color }} /><small>립</small><strong>{makeup.lip.label}</strong></div>
          <div><span style={{ background: makeup.blush.color }} /><small>블러셔</small><strong>{makeup.blush.label}</strong></div>
          <div><span style={{ background: makeup.eye.color }} /><small>아이</small><strong>{makeup.eye.label}</strong></div>
        </div>
        <PaletteStrip colors={student.palette} ariaLabel="추천 팔레트" />
      </div>
      <p className="save-note">사진과 카드가 하나의 PNG 이미지로 기기에 저장돼요.</p>
      <button className="primary-button" type="button" onClick={saveCard} disabled={saving}><Upload size={20} />{saving ? '이미지 만드는 중…' : '이미지 저장'}</button>
      <button className="secondary-button" type="button" onClick={onFinish}>활동 마치기</button>
    </main>
  )
}

export function StudentApp() {
  const [students, setStudents] = useState<Student[]>(() => loadStudents())
  const [student, setStudent] = useState<Student | null>(null)
  const [screen, setScreen] = useState<StudentScreen>('start')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const photoRef = useRef('')
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0].value)
  const [compareColor, setCompareColor] = useState(OUTFIT_COLORS[3].value)
  const [makeup, setMakeup] = useState<MakeupState>(DEFAULT_MAKEUP)
  const [placement, setPlacement] = useState<FacePlacement>(DEFAULT_PLACEMENT)

  const cleanupPhoto = () => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = ''
    setPhotoUrl('')
  }

  useEffect(() => {
    const handlePageExit = () => {
      if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    }
    window.addEventListener('beforeunload', handlePageExit)
    return () => {
      window.removeEventListener('beforeunload', handlePageExit)
      if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    }
  }, [])

  const completed = useMemo(() => new Set(student?.completed ?? []), [student?.completed])

  const updateCompleted = (activity: ActivityKey) => {
    if (!student || completed.has(activity)) return
    const updatedStudent = { ...student, completed: [...student.completed, activity] }
    const nextStudents = students.map((item) => item.id === updatedStudent.id ? updatedStudent : item)
    setStudent(updatedStudent)
    setStudents(nextStudents)
    saveStudents(nextStudents)
  }

  const handleLookup = () => {
    const normalized = query.trim().toLocaleLowerCase('ko-KR')
    const found = students.find((item) => item.name.toLocaleLowerCase('ko-KR') === normalized || item.code.toLocaleLowerCase('ko-KR') === normalized)
    if (!found) {
      setError('등록된 학생을 찾지 못했어요. 이름이나 코드를 다시 확인해 주세요.')
      return
    }
    setError('')
    setStudent(found)
    setOutfitColor(found.tone === 'warm' ? OUTFIT_COLORS[0].value : OUTFIT_COLORS[3].value)
    setScreen('result')
  }

  const handlePhoto = (url: string) => {
    cleanupPhoto()
    photoRef.current = url
    setPhotoUrl(url)
    updateCompleted('photo')
    setScreen('outfit')
  }

  const finishActivity = () => {
    cleanupPhoto()
    setStudent(null)
    setQuery('')
    setError('')
    setMakeup(DEFAULT_MAKEUP)
    setPlacement(DEFAULT_PLACEMENT)
    setScreen('start')
  }

  const openActivity = (nextScreen: StudentScreen) => {
    if (nextScreen !== 'photo' && !photoUrl) setScreen('photo')
    else setScreen(nextScreen)
  }

  if (screen === 'start' || !student) return <StartScreen query={query} error={error} onQuery={(value) => { setQuery(value); setError('') }} onSubmit={handleLookup} />
  if (screen === 'result') return <ToneResult student={student} onContinue={() => setScreen('home')} onReset={finishActivity} />
  if (screen === 'photo') return <main className="page-content no-nav"><TopBar title="사진 준비하기" onBack={() => setScreen('home')} /><PhotoCapture onPhoto={handlePhoto} onCancel={() => setScreen('home')} /></main>
  if (screen === 'outfit' && photoUrl) return <OutfitScreen imageUrl={photoUrl} selected={outfitColor} placement={placement} onPlacement={setPlacement} onSelect={setOutfitColor} onBack={() => setScreen('home')} onCompare={() => setScreen('outfitCompare')} onNext={() => { updateCompleted('outfit'); setScreen('makeup') }} />
  if (screen === 'outfitCompare' && photoUrl) return <OutfitCompare imageUrl={photoUrl} leftColor={outfitColor} rightColor={compareColor} placement={placement} onRightColor={setCompareColor} onBack={() => setScreen('outfit')} onDone={() => { updateCompleted('compare'); setOutfitColor(compareColor); setScreen('home') }} />
  if (screen === 'makeup' && photoUrl) return <MakeupScreen imageUrl={photoUrl} outfitColor={outfitColor} makeup={makeup} placement={placement} onPlacement={setPlacement} onMakeup={setMakeup} onBack={() => setScreen('home')} onNext={() => { updateCompleted('makeup'); setScreen('beforeAfter') }} />
  if (screen === 'beforeAfter' && photoUrl) return <BeforeAfter imageUrl={photoUrl} outfitColor={outfitColor} makeup={makeup} placement={placement} onBack={() => setScreen('makeup')} onNext={() => setScreen('card')} />
  if (screen === 'card' && photoUrl) return <StyleCardScreen student={student} imageUrl={photoUrl} outfitColor={outfitColor} makeup={makeup} placement={placement} onBack={() => setScreen('beforeAfter')} onSaved={() => updateCompleted('card')} onFinish={finishActivity} />

  return (
    <div className="app-shell">
      <ActivityHome student={student} hasPhoto={Boolean(photoUrl)} onOpen={openActivity} onReset={finishActivity} />
      <BottomNav onHome={() => setScreen('home')} onPalette={() => setScreen('result')} current="home" />
    </div>
  )
}
