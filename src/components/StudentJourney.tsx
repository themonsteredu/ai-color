import { ArrowRight, Check, Palette, Sparkles, Sun } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { TONE_PALETTES, toneLabel } from '../data'
import type { Student, Tone } from '../types'
import { StyleStudio } from '../wardrobe/StyleStudio'
import { PaletteStrip } from './PaletteStrip'
import { PhotoCapture } from './PhotoCapture'
import { TopBar } from './TopBar'

type JourneyStep = 'start' | 'quiz' | 'prediction' | 'field' | 'confirm' | 'photo' | 'studio' | 'done'
type Answer = 'warm' | 'cool'

interface SessionState {
  classCode: string
  name: string
  answers: Answer[]
  predictedTone?: Tone
  confirmedTone?: Tone
}

const SESSION_KEY = 'color-mate.student-journey.v2'

const QUESTIONS = [
  { title: '내 피부가 더 편안해 보이는 쪽은?', warm: '노란빛 · 아이보리 계열', cool: '핑크빛 · 새하얀 계열' },
  { title: '얼굴 가까이에 댔을 때 더 자연스러운 색은?', warm: '코랄 · 살구 · 카멜', cool: '로즈 · 라벤더 · 블루' },
  { title: '평소 더 잘 어울린다고 느끼는 액세서리는?', warm: '골드', cool: '실버' },
  { title: '내 얼굴이 더 또렷해 보이는 색감은?', warm: '따뜻하고 부드러운 색', cool: '맑고 차가운 색' },
] as const

function loadSession(): SessionState {
  try {
    const saved = window.localStorage.getItem(SESSION_KEY)
    if (!saved) return { classCode: '', name: '', answers: [] }
    const parsed = JSON.parse(saved) as SessionState
    return { classCode: parsed.classCode ?? '', name: parsed.name ?? '', answers: Array.isArray(parsed.answers) ? parsed.answers : [], predictedTone: parsed.predictedTone, confirmedTone: parsed.confirmedTone }
  } catch {
    return { classCode: '', name: '', answers: [] }
  }
}

function saveSession(value: SessionState) { window.localStorage.setItem(SESSION_KEY, JSON.stringify(value)) }
function clearSession() { window.localStorage.removeItem(SESSION_KEY) }
function predictTone(answers: Answer[]): Tone { return answers.filter((answer) => answer === 'warm').length >= Math.ceil(answers.length / 2) ? 'warm' : 'cool' }

export function StudentJourney() {
  const initial = useMemo(() => loadSession(), [])
  const [step, setStep] = useState<JourneyStep>(initial.confirmedTone ? 'photo' : initial.predictedTone ? 'field' : 'start')
  const [classCode, setClassCode] = useState(initial.classCode)
  const [name, setName] = useState(initial.name)
  const [answers, setAnswers] = useState<Answer[]>(initial.answers)
  const [predictedTone, setPredictedTone] = useState<Tone | undefined>(initial.predictedTone)
  const [confirmedTone, setConfirmedTone] = useState<Tone | undefined>(initial.confirmedTone)
  const [questionIndex, setQuestionIndex] = useState(Math.min(initial.answers.length, QUESTIONS.length - 1))
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const photoRef = useRef('')

  const persist = (patch: Partial<SessionState>) => saveSession({ classCode, name, answers, predictedTone, confirmedTone, ...patch })

  const resetAll = () => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = ''
    setPhotoUrl('')
    setClassCode('')
    setName('')
    setAnswers([])
    setPredictedTone(undefined)
    setConfirmedTone(undefined)
    setQuestionIndex(0)
    setError('')
    clearSession()
    setStep('start')
  }

  const startQuiz = () => {
    if (classCode.trim().length < 3) { setError('선생님이 알려준 수업 코드를 입력해 주세요.'); return }
    if (name.trim().length < 2) { setError('이름을 입력해 주세요.'); return }
    const nextCode = classCode.trim().toUpperCase()
    const nextName = name.trim()
    setError('')
    setClassCode(nextCode)
    setName(nextName)
    setAnswers([])
    setPredictedTone(undefined)
    setConfirmedTone(undefined)
    saveSession({ classCode: nextCode, name: nextName, answers: [] })
    setQuestionIndex(0)
    setStep('quiz')
  }

  const answerQuestion = (answer: Answer) => {
    const nextAnswers = [...answers, answer]
    setAnswers(nextAnswers)
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1)
      persist({ answers: nextAnswers })
      return
    }
    const prediction = predictTone(nextAnswers)
    setPredictedTone(prediction)
    persist({ answers: nextAnswers, predictedTone: prediction })
    setStep('prediction')
  }

  const confirmTone = (tone: Tone) => {
    setConfirmedTone(tone)
    persist({ confirmedTone: tone })
    setStep('photo')
  }

  const handlePhoto = (url: string) => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = url
    setPhotoUrl(url)
    setStep('studio')
  }

  const student: Student | null = confirmedTone ? {
    id: `${classCode}-${name}`,
    name,
    code: classCode,
    tone: confirmedTone,
    palette: TONE_PALETTES[confirmedTone],
    completed: [],
    createdAt: new Date().toISOString(),
  } : null

  if (step === 'start') return (
    <main className="start-screen page-content no-nav">
      <section className="intro-block">
        <div className="intro-mark" aria-hidden="true"><span /><span /><span /><span /><i><Palette size={27} /></i></div>
        <span className="eyebrow">MY COLOR ACTIVITY</span><h1>컬러메이트</h1><p>먼저 내가 어떤 톤일지 예상해 봐요.</p>
      </section>
      <form className="start-form" onSubmit={(event) => { event.preventDefault(); startQuiz() }}>
        <label htmlFor="class-code">수업 코드</label><input id="class-code" value={classCode} onChange={(event) => { setClassCode(event.target.value); setError('') }} placeholder="선생님이 알려준 코드" autoComplete="off" />
        <label htmlFor="student-name">학생 이름</label><input id="student-name" value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="예: 김하늘" autoComplete="off" />
        <p className="input-help">학생별 퍼스널컬러는 미리 등록하지 않아요. 직접 예상하고 체험한 뒤 내 톤을 확정합니다.</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-button" type="submit">내 톤 예상하기<ArrowRight size={20} /></button>
      </form>
      <a className="expert-link" href="/expert">교사용 관리 화면</a>
    </main>
  )

  if (step === 'quiz') {
    const question = QUESTIONS[questionIndex]
    return <main className="page-content no-nav"><TopBar title="나의 톤 예상하기" onBack={() => setStep('start')} /><section className="tone-card"><p>질문 {questionIndex + 1} / {QUESTIONS.length}</p><h1 style={{ fontSize: 'clamp(1.7rem, 6vw, 2.4rem)' }}>{question.title}</h1><div className="tone-options" style={{ marginTop: 28 }}><button type="button" className="tone-option warm" onClick={() => answerQuestion('warm')}><span>☀</span><div><strong>{question.warm}</strong><small>이쪽이 더 가까워요</small></div><ArrowRight size={18} /></button><button type="button" className="tone-option cool" onClick={() => answerQuestion('cool')}><span>❄</span><div><strong>{question.cool}</strong><small>이쪽이 더 가까워요</small></div><ArrowRight size={18} /></button></div><p className="input-help" style={{ marginTop: 24 }}>이 단계는 진단이 아니라 나의 예상입니다. 실제 결과는 선생님과 직접 색을 대보며 확인해요.</p></section></main>
  }

  if (step === 'prediction' && predictedTone) return <main className={`tone-result page-content no-nav ${predictedTone}`}><section className="tone-card"><div className="tone-orbit"><span>{predictedTone === 'warm' ? <Sun size={42} /> : '❄'}</span></div><p>나의 예상 퍼스널컬러</p><h1>{toneLabel(predictedTone)}</h1><strong>이 결과가 정말 맞을까요?</strong><PaletteStrip colors={TONE_PALETTES[predictedTone]} ariaLabel="예상 톤 팔레트" /><div className="expert-note"><Sparkles size={17} /><span><b>다음은 실제 체험</b>웹앱을 잠시 내려놓고 선생님과 컬러천을 얼굴 가까이에 대어 변화가 어떻게 보이는지 직접 관찰해 보세요.</span></div></section><button className="primary-button" type="button" onClick={() => setStep('field')}>선생님과 내 톤 찾아보기<ArrowRight size={20} /></button></main>

  if (step === 'field') return <main className="page-content no-nav"><TopBar title="선생님과 실제 체험" onBack={() => setStep('prediction')} /><section className="tone-card"><span className="eyebrow">OFFLINE COLOR TEST</span><h1>이제 직접 확인해 볼 차례예요</h1><p style={{ lineHeight: 1.8 }}>컬러천을 얼굴 가까이에 대고 피부가 맑아 보이는지, 그림자가 줄어드는지, 얼굴 윤곽이 또렷해지는지 관찰해 보세요.</p>{predictedTone ? <div className="expert-note"><Sparkles size={17} /><span><b>웹앱 예상</b>{toneLabel(predictedTone)}으로 예상했어요. 실제 체험 결과와 같은지 비교해 봐요.</span></div> : null}</section><button className="primary-button" type="button" onClick={() => setStep('confirm')}>체험했어요 · 내 톤 입력하기<ArrowRight size={20} /></button></main>

  if (step === 'confirm') return <main className="page-content no-nav"><TopBar title="실제로 찾아본 내 톤" onBack={() => setStep('field')} /><section className="tone-card"><p>선생님과 직접 확인한 결과를 선택하세요.</p><h1>나의 퍼스널컬러는?</h1><div className="tone-options" style={{ marginTop: 28 }}><button type="button" className="tone-option warm" onClick={() => confirmTone('warm')}><span>☀</span><div><strong>웜톤</strong><small>코랄 · 살구 · 카멜 계열</small></div><Check size={18} /></button><button type="button" className="tone-option cool" onClick={() => confirmTone('cool')}><span>❄</span><div><strong>쿨톤</strong><small>로즈 · 라벤더 · 블루 계열</small></div><Check size={18} /></button></div>{predictedTone ? <p className="input-help" style={{ marginTop: 24 }}>처음 예상은 {toneLabel(predictedTone)}이었어요. 실제 관찰 결과를 기준으로 다음 활동을 진행합니다.</p> : null}</section></main>

  if (step === 'photo') return <main className="page-content no-nav"><TopBar title="스타일링 사진 준비" onBack={() => setStep('confirm')} /><PhotoCapture onPhoto={handlePhoto} onCancel={() => setStep('confirm')} /></main>

  if (step === 'studio' && student && photoUrl) return <StyleStudio student={student} photoUrl={photoUrl} onBack={() => setStep('photo')} onRetake={() => setStep('photo')} onComplete={() => setStep('done')} />

  return <main className="page-content no-nav"><section className="tone-card"><span className="eyebrow">COLOR MATE COMPLETE</span><h1>{name}님의 스타일링 완료</h1>{confirmedTone ? <><p>실제로 확인한 나의 톤</p><strong>{toneLabel(confirmedTone)}</strong><PaletteStrip colors={TONE_PALETTES[confirmedTone]} /></> : null}</section><button className="primary-button" type="button" onClick={resetAll}>새 활동 시작하기<ArrowRight size={20} /></button></main>
}
