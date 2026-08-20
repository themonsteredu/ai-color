import { useCallback, useMemo, useRef, useState } from 'react'
import { DEFAULT_MAKEUP_OPTIONS, MAKEUP_PRESETS } from '../data/makeup'
import { DEFAULT_LOOKS, selectedItems, type LookSelection, type WardrobeCategory } from '../data/catalog'
import { profileOf } from '../data/personalColors'
import { QUIZ_QUESTIONS, predictType, scoreAnswers } from '../data/quiz'
import { clearStudentSession, loadStudentSession, saveStudentSession } from '../services/studentSession'
import type { MakeupState, PersonalColorProfile, PersonalColorType, StudentSession } from '../types'
import { ConfirmedScreen } from '../screens/ConfirmedScreen'
import { DrapingScreen } from '../screens/DrapingScreen'
import { EntryScreen } from '../screens/EntryScreen'
import { MakeupScreen } from '../screens/MakeupScreen'
import { PhotoScreen } from '../screens/PhotoScreen'
import { PredictionScreen } from '../screens/PredictionScreen'
import { QuizScreen } from '../screens/QuizScreen'
import { ResultScreen } from '../screens/ResultScreen'
import { StylingScreen } from '../screens/StylingScreen'
import { TypePickerScreen } from '../screens/TypePickerScreen'

type Step = 'entry' | 'quiz' | 'prediction' | 'draping' | 'confirm' | 'confirmed' | 'photo' | 'makeup' | 'styling' | 'result'

function makeupForProfile(profile: PersonalColorProfile): MakeupState {
  return {
    lip: { hex: profile.lip[0].hex, name: profile.lip[0].name, intensity: 34, recommended: true },
    blush: { hex: profile.blush[0].hex, name: profile.blush[0].name, intensity: 24, recommended: true },
    eye: { hex: profile.eye[0].hex, name: profile.eye[0].name, intensity: 26, recommended: true },
    options: { ...DEFAULT_MAKEUP_OPTIONS },
    preset: 'school',
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
  // 촬영 단계에서 이미 구도를 맞춰 두었으므로, 여기서는 필요한 경우에만 줄입니다.
  const ratio = Math.min(1400 / bitmap.width, 1750 / bitmap.height, 1)
  if (ratio === 1 && /^image\/(jpeg|png|webp)$/.test(source.type)) {
    // 줄일 필요가 없으면 다시 인코딩하지 않습니다. (JPEG 을 두 번 저장하면 화질이 떨어집니다)
    bitmap.close()
    return fileToDataUrl(source)
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('사진을 준비하지 못했어요.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#FAF8F4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.93)
}

async function assetToDataUrl(path: string) {
  const response = await fetch(path)
  if (!response.ok) throw new Error('의상 이미지를 불러오지 못했어요.')
  return fileToDataUrl(await response.blob())
}

export function StudentJourney() {
  const initial = useMemo(() => loadStudentSession(), [])
  const [step, setStep] = useState<Step>(initial.confirmedType ? 'confirmed' : initial.predictedType ? 'draping' : 'entry')
  const [session, setSession] = useState<StudentSession>(initial)
  const [questionIndex, setQuestionIndex] = useState(Math.min(initial.answers.length, QUIZ_QUESTIONS.length - 1))
  const [photoUrl, setPhotoUrl] = useState('')
  const photoRef = useRef('')
  const [makeup, setMakeup] = useState<MakeupState | null>(null)
  const [selection, setSelection] = useState<LookSelection | null>(null)
  const [resultImage, setResultImage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const profile = session.confirmedType ? profileOf(session.confirmedType) : undefined

  const update = useCallback((patch: Partial<StudentSession>) => {
    setSession((current) => {
      const next = { ...current, ...patch }
      saveStudentSession(next)
      return next
    })
  }, [])

  const start = (classCode: string, name: string) => {
    update({ classCode, name, answers: [], predictedType: undefined, confirmedType: undefined })
    setQuestionIndex(0)
    setStep('quiz')
  }

  const answer = (choice: number) => {
    const answers = [...session.answers.slice(0, questionIndex), choice]
    if (questionIndex < QUIZ_QUESTIONS.length - 1) {
      update({ answers })
      setQuestionIndex(questionIndex + 1)
      return
    }
    const predicted = predictType(answers)
    update({ answers, predictedType: predicted })
    setStep('prediction')
  }

  const restartQuiz = () => {
    update({ answers: [], predictedType: undefined })
    setQuestionIndex(0)
    setStep('quiz')
  }

  const confirmType = (type: PersonalColorType) => {
    const nextProfile = profileOf(type)
    update({ confirmedType: type })
    setMakeup(makeupForProfile(nextProfile))
    setSelection({ ...DEFAULT_LOOKS[nextProfile.tone] })
    setStep('confirmed')
  }

  const handlePhoto = (url: string) => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = url
    setPhotoUrl(url)
    setStep('makeup')
  }

  const applyPreset = (presetKey: string) => {
    const preset = MAKEUP_PRESETS.find((entry) => entry.key === presetKey)
    if (!preset || !makeup) return
    setMakeup({
      ...makeup,
      preset: preset.key,
      options: preset.options ? { ...makeup.options, ...preset.options } : makeup.options,
      lip: { ...makeup.lip, intensity: preset.intensity?.lip ?? makeup.lip.intensity },
      blush: { ...makeup.blush, intensity: preset.intensity?.blush ?? makeup.blush.intensity },
      eye: { ...makeup.eye, intensity: preset.intensity?.eye ?? makeup.eye.intensity },
    })
  }

  const chooseItem = (category: WardrobeCategory, id: string) => {
    setSelection((current) => (current ? { ...current, [category]: id } : current))
    setError('')
  }

  const restart = () => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current)
    photoRef.current = ''
    setPhotoUrl('')
    setMakeup(null)
    setSelection(null)
    setResultImage('')
    setError('')
    setQuestionIndex(0)
    clearStudentSession()
    setSession({ classCode: '', name: '', answers: [] })
    setStep('entry')
  }

  /** 유료 AI 이미지 생성은 이 함수 1회 호출에서만 실행됩니다. */
  const generate = async () => {
    if (!makeup || !selection || !profile || isGenerating) return
    setIsGenerating(true)
    setError('')
    try {
      const personImage = await resizePhoto(photoUrl)
      const items = selectedItems(selection)
      const shoes = items.find((item) => item.category === 'shoes')
      const garments = await Promise.all(
        items
          .filter((item) => Boolean(item.image))
          .map(async (item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            dataUrl: await assetToDataUrl(item.image as string),
          })),
      )
      const response = await fetch('/api/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage,
          garments,
          makeup,
          shoes: shoes ? { name: shoes.name, colorName: shoes.colorName } : undefined,
          personalColorType: profile.type,
          personalColorLabel: `${profile.english} (${profile.temperature} / ${profile.value} / ${profile.chroma})`,
          studentCode: session.classCode,
        }),
      })
      const text = await response.text()
      let payload: { imageDataUrl?: string; error?: string }
      try {
        payload = JSON.parse(text) as { imageDataUrl?: string; error?: string }
      } catch {
        throw new Error('AI 이미지 연결을 확인해 주세요.')
      }
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error ?? '최종 스타일 생성에 실패했어요.')
      setResultImage(payload.imageDataUrl)
      setStep('result')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '최종 스타일 생성에 실패했어요.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (step === 'entry') return <EntryScreen classCode={session.classCode} name={session.name} onStart={start} />

  if (step === 'quiz')
    return (
      <QuizScreen
        index={questionIndex}
        onAnswer={answer}
        onPrevious={() => setQuestionIndex((current) => Math.max(0, current - 1))}
        onExit={() => setStep('entry')}
      />
    )

  if (step === 'prediction' && session.predictedType)
    return (
      <PredictionScreen
        type={session.predictedType}
        axes={scoreAnswers(session.answers)}
        onNext={() => setStep('draping')}
        onRetry={restartQuiz}
      />
    )

  if (step === 'draping' && session.predictedType)
    return <DrapingScreen predictedType={session.predictedType} onNext={() => setStep('confirm')} onBack={() => setStep('prediction')} />

  if (step === 'confirm')
    return <TypePickerScreen predictedType={session.predictedType} onSelect={confirmType} onBack={() => setStep('draping')} />

  if (step === 'confirmed' && session.confirmedType)
    return (
      <ConfirmedScreen
        predictedType={session.predictedType}
        confirmedType={session.confirmedType}
        onNext={() => setStep('photo')}
        onChange={() => setStep('confirm')}
      />
    )

  if (step === 'photo') return <PhotoScreen onPhoto={handlePhoto} onBack={() => setStep('confirmed')} />

  if (step === 'makeup' && profile && makeup && photoUrl)
    return (
      <MakeupScreen
        studentName={session.name}
        profile={profile}
        photoUrl={photoUrl}
        makeup={makeup}
        onChange={setMakeup}
        onPreset={applyPreset}
        onNext={() => setStep('styling')}
        onBack={() => setStep('photo')}
      />
    )

  if (step === 'styling' && profile && makeup && selection && photoUrl)
    return (
      <StylingScreen
        studentName={session.name}
        profile={profile}
        photoUrl={photoUrl}
        makeup={makeup}
        selection={selection}
        onSelect={chooseItem}
        onGenerate={generate}
        isGenerating={isGenerating}
        error={error}
        onBack={() => setStep('makeup')}
      />
    )

  if (step === 'result' && profile && makeup && selection)
    return (
      <ResultScreen
        studentName={session.name}
        classCode={session.classCode}
        profile={profile}
        beforePhotoUrl={photoUrl}
        resultImage={resultImage}
        makeup={makeup}
        selection={selection}
        onRestart={restart}
        onBack={() => setStep('styling')}
      />
    )

  return <EntryScreen classCode={session.classCode} name={session.name} onStart={start} />
}

