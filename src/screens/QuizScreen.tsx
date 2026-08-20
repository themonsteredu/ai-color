import { ArrowLeft } from 'lucide-react'
import { JourneyBar } from '../components/JourneyBar'
import { QUIZ_QUESTIONS } from '../data/quiz'

interface QuizScreenProps {
  index: number
  onAnswer: (choice: number) => void
  onPrevious: () => void
  onExit: () => void
}

export function QuizScreen({ index, onAnswer, onPrevious, onExit }: QuizScreenProps) {
  const question = QUIZ_QUESTIONS[index]
  if (!question) return null

  return (
    <div className="page">
      <JourneyBar
        current="quiz"
        title="나의 퍼스널컬러 사전 예상"
        subtitle={`질문 ${index + 1} / ${QUIZ_QUESTIONS.length}`}
        onBack={index === 0 ? onExit : onPrevious}
      />
      <main className="page__body page__body--center">
        <div className="shell shell--narrow">
          <section className="panel">
            <span className="eyebrow">QUESTION {index + 1}</span>
            <h1 className="quiz__title" style={{ marginTop: 8 }}>
              {question.title}
            </h1>
            <p className="quiz__hint muted">{question.hint}</p>

            <div className="quiz__choices">
              {question.options.map((option, optionIndex) => (
                <button className="choice" type="button" key={option.label} onClick={() => onAnswer(optionIndex)}>
                  <span className="choice__swatches" aria-hidden="true">
                    {option.swatches.map((hex) => (
                      <span key={hex} style={{ background: hex }} />
                    ))}
                  </span>
                  <strong>{option.label}</strong>
                  <small>{option.caption}</small>
                </button>
              ))}
            </div>

            <div className="quiz__foot">
              <p className="muted">정답은 없어요. 얼굴 가까이에 색을 댔을 때의 느낌을 떠올려 선택하세요.</p>
              {index > 0 ? (
                <button className="btn btn--quiet" type="button" onClick={onPrevious}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  이전 질문
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
