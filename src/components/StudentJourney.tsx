import { ArrowRight, Check, Palette, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { PERSONAL_COLOR_PROFILES, PERSONAL_COLOR_TYPES, personalColorLabel } from '../data'
import type { PersonalColorType, Student } from '../types'
import { StyleStudio } from '../wardrobe/StyleStudio'
import { PaletteStrip } from './PaletteStrip'
import { PhotoCapture } from './PhotoCapture'
import { TopBar } from './TopBar'

type JourneyStep = 'start' | 'quiz' | 'prediction' | 'field' | 'confirm' | 'photo' | 'studio' | 'done'
type Axis = 'warm' | 'cool' | 'light' | 'deep' | 'clear' | 'soft'

interface QuizOption { label: string; hint: string; scores: Partial<Record<Axis, number>> }
interface QuizQuestion { title: string; left: QuizOption; right: QuizOption }
interface SessionState { classCode: string; name: string; answers: number[]; predictedType?: PersonalColorType; confirmedType?: PersonalColorType }

const SESSION_KEY = 'color-mate.student-journey.v3'

const QUESTIONS: QuizQuestion[] = [
  { title: '얼굴 가까이에 댔을 때 더 편안해 보이는 흰색은?', left: { label: '아이보리', hint: '크림빛이 도는 흰색', scores: { warm: 3 } }, right: { label: '새하얀 화이트', hint: '푸른기 없이 또렷한 흰색', scores: { cool: 3 } } },
  { title: '더 자연스럽게 어울린다고 느끼는 금속 색은?', left: { label: '골드', hint: '따뜻한 금빛', scores: { warm: 2 } }, right: { label: '실버', hint: '차가운 은빛', scores: { cool: 2 } } },
  { title: '얼굴이 더 생기 있어 보이는 립 계열은?', left: { label: '코랄 · 오렌지', hint: '따뜻한 과일색', scores: { warm: 3, clear: 1 } }, right: { label: '로즈 · 베리', hint: '푸른기가 느껴지는 핑크', scores: { cool: 3, clear: 1 } } },
  { title: '내 얼굴을 더 가볍고 환하게 보이게 하는 쪽은?', left: { label: '밝은 파스텔', hint: '연하고 빛이 많은 색', scores: { light: 3 } }, right: { label: '깊고 진한 색', hint: '무게감 있고 어두운 색', scores: { deep: 3 } } },
  { title: '옷을 입었을 때 얼굴이 더 또렷해지는 명도는?', left: { label: '밝고 가벼운 색', hint: '라이트 베이지 · 파스텔', scores: { light: 2 } }, right: { label: '진하고 무게감 있는 색', hint: '네이비 · 버건디 · 딥브라운', scores: { deep: 2 } } },
  { title: '얼굴과 색이 서로 잘 어울려 보이는 채도는?', left: { label: '맑고 선명한 색', hint: '비비드하고 깨끗한 색', scores: { clear: 3 } }, right: { label: '부드럽고 차분한 색', hint: '회색기가 섞인 소프트 컬러', scores: { soft: 3 } } },
  { title: '핑크 중 더 잘 받는다고 느껴지는 쪽은?', left: { label: '생생한 핑크', hint: '또렷하고 맑은 색', scores: { clear: 2 } }, right: { label: '더스티 핑크', hint: '차분하고 부드러운 색', scores: { soft: 2 } } },
  { title: '브라운 계열을 고른다면?', left: { label: '라이트 카멜', hint: '밝고 따뜻한 브라운', scores: { warm: 1, light: 2 } }, right: { label: '딥 초콜릿', hint: '짙고 깊은 브라운', scores: { warm: 1, deep: 2 } } },
  { title: '블루 계열을 고른다면?', left: { label: '소프트 스카이', hint: '밝고 부드러운 블루', scores: { cool: 1, light: 1, soft: 1 } }, right: { label: '선명한 로열블루', hint: '강하고 또렷한 블루', scores: { cool: 1, deep: 1, clear: 2 } } },
  { title: '전체적으로 내가 더 편안한 색 분위기는?', left: { label: '은은하고 자연스럽게', hint: '색보다 내가 먼저 보여요', scores: { soft: 2 } }, right: { label: '선명하고 존재감 있게', hint: '색과 얼굴 대비가 또렷해요', scores: { clear: 2 } } },
]

function scoreAnswers(answers: number[]) {
  const score: Record<Axis, number> = { warm: 0, cool: 0, light: 0, deep: 0, clear: 0, soft: 0 }
  answers.forEach((choice, index) => {
    const option = choice === 0 ? QUESTIONS[index]?.left : QUESTIONS[index]?.right
    if (!option) return
    Object.entries(option.scores).forEach(([axis, value]) => { score[axis as Axis] += value ?? 0 })
  })
  return score
}

function predictType(answers: number[]): PersonalColorType {
  const s = scoreAnswers(answers)
  const warm = s.warm >= s.cool
  const light = s.light >= s.deep
  const clear = s.clear >= s.soft
  const tempGap = Math.abs(s.warm - s.cool)
  const valueGap = Math.abs(s.light - s.deep)
  const chromaGap = Math.abs(s.clear - s.soft)

  if (warm && light) {
    if (valueGap >= chromaGap && s.light > s.deep + 1) return 'spring-light'
    if (s.clear > s.soft + 1) return 'spring-bright'
    return 'spring-warm'
  }
  if (warm) {
    if (s.deep > s.light + 2) return 'autumn-deep'
    if (s.soft > s.clear + 1) return 'autumn-muted'
    return 'autumn-warm'
  }
  if (light) {
    if (s.light > s.deep + 2) return 'summer-light'
    if (s.soft > s.clear + 1 || chromaGap >= tempGap) return 'summer-muted'
    return 'summer-cool'
  }
  if (s.deep > s.light + 2) return 'winter-deep'
  if (s.clear > s.soft + 1) return 'winter-bright'
  return 'winter-cool'
}

function loadSession(): SessionState {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return { classCode: '', name: '', answers: [] }
    const parsed = JSON.parse(raw) as SessionState
    return { classCode: parsed.classCode ?? '', name: parsed.name ?? '', answers: Array.isArray(parsed.answers) ? parsed.answers : [], predictedType: parsed.predictedType, confirmedType: parsed.confirmedType }
  } catch { return { classCode: '', name: '', answers: [] } }
}

function saveSession(value: SessionState) { window.localStorage.setItem(SESSION_KEY, JSON.stringify(value)) }
function clearSession() { window.localStorage.removeItem(SESSION_KEY) }

const SEASONS: { key: string; title: string; types: PersonalColorType[] }[] = [
  { key: 'spring', title: 'SPRING · 봄', types: ['spring-light', 'spring-bright', 'spring-warm'] },
  { key: 'summer', title: 'SUMMER · 여름', types: ['summer-light', 'summer-muted', 'summer-cool'] },
  { key: 'autumn', title: 'AUTUMN · 가을', types: ['autumn-muted', 'autumn-warm', 'autumn-deep'] },
  { key: 'winter', title: 'WINTER · 겨울', types: ['winter-bright', 'winter-cool', 'winter-deep'] },
]

export function StudentJourney() {
  const initial = useMemo(() => loadSession(), [])
  const [step, setStep] = useState<JourneyStep>(initial.confirmedType ? 'photo' : initial.predictedType ? 'field' : 'start')
  const [classCode, setClassCode] = useState(initial.classCode)
  const [name, setName] = useState(initial.name)
  const [answers, setAnswers] = useState<number[]>(initial.answers)
  const [predictedType, setPredictedType] = useState<PersonalColorType | undefined>(initial.predictedType)
  const [confirmedType, setConfirmedType] = useState<PersonalColorType | undefined>(initial.confirmedType)
  const [questionIndex, setQuestionIndex] = useState(Math.min(initial.answers.length, QUESTIONS.length - 1))
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const photoRef = useRef('')

  const persist = (patch: Partial<SessionState>) => saveSession({ classCode, name, answers, predictedType, confirmedType, ...patch })
  const resetAll = () => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = ''; setPhotoUrl(''); setClassCode(''); setName(''); setAnswers([]); setPredictedType(undefined); setConfirmedType(undefined); setQuestionIndex(0); setError(''); clearSession(); setStep('start')
  }

  const startQuiz = () => {
    const code = classCode.trim().toUpperCase(); const studentName = name.trim()
    if (!/^[A-Z0-9-]{4,12}$/.test(code)) { setError('선생님이 알려준 수업 코드를 정확히 입력해 주세요.'); return }
    if (studentName.length < 2) { setError('이름을 입력해 주세요.'); return }
    setClassCode(code); setName(studentName); setAnswers([]); setPredictedType(undefined); setConfirmedType(undefined); setQuestionIndex(0); setError(''); saveSession({ classCode: code, name: studentName, answers: [] }); setStep('quiz')
  }

  const answerQuestion = (choice: number) => {
    const next = [...answers, choice]; setAnswers(next)
    if (questionIndex < QUESTIONS.length - 1) { setQuestionIndex(questionIndex + 1); persist({ answers: next }); return }
    const predicted = predictType(next); setPredictedType(predicted); persist({ answers: next, predictedType: predicted }); setStep('prediction')
  }

  const confirmType = (type: PersonalColorType) => { setConfirmedType(type); persist({ confirmedType: type }); setStep('photo') }
  const handlePhoto = (url: string) => { if (photoRef.current) URL.revokeObjectURL(photoRef.current); photoRef.current = url; setPhotoUrl(url); setStep('studio') }

  const profile = confirmedType ? PERSONAL_COLOR_PROFILES[confirmedType] : undefined
  const student: Student | null = profile ? { id: `${classCode}-${name}`, name, code: classCode, tone: profile.tone, personalColorType: profile.type, palette: profile.palette, completed: [], createdAt: new Date().toISOString() } : null

  if (step === 'start') return (
    <main className="start-screen page-content no-nav"><section className="intro-block"><div className="intro-mark" aria-hidden="true"><span /><span /><span /><span /><i><Palette size={27} /></i></div><span className="eyebrow">12-TYPE PERSONAL COLOR</span><h1>컬러메이트</h1><p>나의 컬러 DNA를 먼저 예상해 봐요.</p></section><form className="start-form" onSubmit={(event) => { event.preventDefault(); startQuiz() }}><label htmlFor="class-code">수업 코드</label><input id="class-code" value={classCode} onChange={(e) => { setClassCode(e.target.value); setError('') }} placeholder="선생님이 알려준 코드" autoComplete="off" /><label htmlFor="student-name">학생 이름</label><input id="student-name" value={name} onChange={(e) => { setName(e.target.value); setError('') }} placeholder="예: 김하늘" autoComplete="off" /><p className="input-help">웹앱 예상 → 선생님과 실제 드레이핑 → 12타입 최종 확정 순서로 진행해요.</p>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-button" type="submit">12타입 예상 시작하기<ArrowRight size={20} /></button></form><a className="expert-link" href="/expert">교사용 관리 화면</a></main>
  )

  if (step === 'quiz') {
    const q = QUESTIONS[questionIndex]
    return <main className="page-content no-nav"><TopBar title="나의 컬러 DNA" onBack={() => setStep('start')} /><section className="tone-card quiz-card"><p>질문 {questionIndex + 1} / {QUESTIONS.length}</p><h1 className="quiz-title">{q.title}</h1><div className="quiz-choice-grid"><button type="button" onClick={() => answerQuestion(0)}><strong>{q.left.label}</strong><small>{q.left.hint}</small><ArrowRight size={18} /></button><button type="button" onClick={() => answerQuestion(1)}><strong>{q.right.label}</strong><small>{q.right.hint}</small><ArrowRight size={18} /></button></div><p className="input-help">정답은 없어요. 실제 얼굴 가까이에 색을 댔을 때의 느낌을 떠올려 선택하세요.</p></section></main>
  }

  if (step === 'prediction' && predictedType) {
    const p = PERSONAL_COLOR_PROFILES[predictedType]; const score = scoreAnswers(answers)
    return <main className={`tone-result page-content no-nav ${p.tone}`}><section className="tone-card"><span className="eyebrow">MY COLOR PREDICTION</span><p>웹앱 사전 예상</p><h1 className="type-result-title">{p.shortLabel}</h1><div className="color-dna"><span>온도 <b>{score.warm >= score.cool ? 'WARM' : 'COOL'}</b></span><span>명도 <b>{score.light >= score.deep ? 'LIGHT' : 'DEEP'}</b></span><span>채도 <b>{score.clear >= score.soft ? 'CLEAR' : 'SOFT'}</b></span></div><PaletteStrip colors={p.palette} ariaLabel="예상 타입 팔레트" /><div className="keyword-row">{p.keywords.map((word) => <span key={word}>{word}</span>)}</div><div className="expert-note"><Sparkles size={17} /><span><b>이건 예상 결과예요</b>이제 선생님과 실제 컬러천을 대보고 얼굴의 밝기·그림자·윤곽 변화를 비교해 최종 타입을 찾아요.</span></div></section><button className="primary-button" type="button" onClick={() => setStep('field')}>선생님과 실제 타입 찾기<ArrowRight size={20} /></button></main>
  }

  if (step === 'field' && predictedType) return <main className="page-content no-nav"><TopBar title="선생님과 실제 드레이핑" onBack={() => setStep('prediction')} /><section className="tone-card"><span className="eyebrow">OFFLINE COLOR TEST</span><h1 className="field-title">예상 타입 주변부터 비교해요</h1><p className="field-copy">예상은 <b>{personalColorLabel(predictedType)}</b>이에요. 같은 계절의 3가지 타입과 인접 계절 컬러를 실제로 대보며 피부가 맑아지는지, 다크서클·붉은기·그림자가 줄어드는지 관찰하세요.</p><PaletteStrip colors={PERSONAL_COLOR_PROFILES[predictedType].palette} /><div className="teacher-checks"><span>✓ 피부가 맑아지는가</span><span>✓ 얼굴선이 또렷해지는가</span><span>✓ 잡티보다 눈이 먼저 보이는가</span><span>✓ 색이 얼굴보다 튀지 않는가</span></div></section><button className="primary-button" type="button" onClick={() => setStep('confirm')}>드레이핑 완료 · 12타입 확정하기<ArrowRight size={20} /></button></main>

  if (step === 'confirm') return <main className="page-content no-nav wide-confirm"><TopBar title="나의 최종 퍼스널컬러" onBack={() => setStep('field')} /><div className="confirm-intro"><span className="eyebrow">FINAL 12 TYPE</span><h1>선생님과 확인한 타입을 선택하세요</h1>{predictedType ? <p>웹앱 예상: <b>{personalColorLabel(predictedType)}</b> · 달라도 괜찮아요.</p> : null}</div><div className="type-season-grid">{SEASONS.map((season) => <section className="season-group" key={season.key}><h2>{season.title}</h2><div>{season.types.map((type) => { const p = PERSONAL_COLOR_PROFILES[type]; return <button type="button" key={type} className={type === predictedType ? 'predicted' : ''} onClick={() => confirmType(type)}><PaletteStrip colors={p.palette.slice(0, 4)} /><strong>{p.shortLabel}</strong><small>{p.keywords.join(' · ')}</small>{type === predictedType ? <span className="prediction-mark">웹앱 예상</span> : null}<Check size={17} /></button> })}</div></section>)}</div></main>

  if (step === 'photo') return <main className="page-content no-nav"><TopBar title="내 사진 준비하기" onBack={() => setStep('confirm')} /><PhotoCapture onPhoto={handlePhoto} onCancel={() => setStep('confirm')} /></main>
  if (step === 'studio' && student && photoUrl) return <StyleStudio student={student} photoUrl={photoUrl} onBack={() => setStep('photo')} onRetake={() => setStep('photo')} onComplete={() => setStep('done')} />

  return <main className="page-content no-nav"><section className="tone-card"><span className="eyebrow">COLOR MATE COMPLETE</span><h1>{name}님의 스타일링 완료</h1>{confirmedType ? <><p>나의 최종 12타입</p><strong>{personalColorLabel(confirmedType)}</strong><PaletteStrip colors={PERSONAL_COLOR_PROFILES[confirmedType].palette} /></> : null}</section><button className="primary-button" type="button" onClick={resetAll}>새 활동 시작하기<ArrowRight size={20} /></button></main>
}
