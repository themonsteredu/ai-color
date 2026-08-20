import { Check, Lightbulb, RotateCcw, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { findItem } from '../../data/catalog'
import { PERSONAL_COLOR_PROFILES } from '../../data/personalColors'
import type { LessonSlide, SlideQuiz } from '../../data/lessonTypes'
import type { PersonalColorType } from '../../types'

function PaletteRow({ type }: { type: PersonalColorType }) {
  const profile = PERSONAL_COLOR_PROFILES[type]
  if (!profile) return null
  return (
    <div className="slide-palette">
      <div className="slide-palette__head">
        <strong>{profile.korean}</strong>
        <span>{profile.english}</span>
        <em>
          {profile.temperature} · {profile.value} · {profile.chroma}
        </em>
      </div>
      <div className="slide-palette__colors">
        {profile.palette.map((color) => (
          <span key={color.hex} style={{ '--swatch-color': color.hex } as CSSProperties}>
            <i />
            <small>{color.name}</small>
          </span>
        ))}
      </div>
    </div>
  )
}

function QuizBlock({ quiz }: { quiz: SlideQuiz }) {
  const [picked, setPicked] = useState<number | null>(null)
  useEffect(() => setPicked(null), [quiz])
  const answered = picked !== null
  const isRight = answered && quiz.options[picked]?.correct

  return (
    <div className="slide-quiz">
      <p className="slide-quiz__question">{quiz.question}</p>
      {quiz.hint && !answered ? <p className="slide-quiz__hint">{quiz.hint}</p> : null}

      <div className="slide-quiz__options">
        {quiz.options.map((option, index) => {
          const chosen = picked === index
          const reveal = answered && (chosen || option.correct)
          const state = !answered ? '' : option.correct ? ' is-correct' : chosen ? ' is-wrong' : ' is-dim'
          return (
            <button
              className={`slide-quiz__option${state}`}
              type="button"
              key={option.label}
              onClick={() => setPicked(index)}
              disabled={answered}
            >
              {option.color ? <i className="slide-quiz__chip" style={{ background: option.color }} /> : null}
              <span className="slide-quiz__label">{option.label}</span>
              {answered && option.correct ? <Check size={20} aria-hidden="true" /> : null}
              {chosen && !option.correct ? <X size={20} aria-hidden="true" /> : null}
              {reveal ? <small>{option.why}</small> : null}
            </button>
          )
        })}
      </div>

      {answered ? (
        <div className={`slide-quiz__result${isRight ? ' is-right' : ''}`}>
          <strong>{isRight ? '정답이에요!' : '다시 한 번 볼까요?'}</strong>
          <button type="button" onClick={() => setPicked(null)}>
            <RotateCcw size={16} aria-hidden="true" />
            다시 풀기
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function SlideView({ slide, active }: { slide: LessonSlide; active: boolean }) {
  const bodyClass = `slide__body slide__body--${slide.kind}${slide.image ? ' has-image' : ''}`

  return (
    <article className={`slide slide--${slide.kind}${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div className="slide__inner">
        <header className="slide__head">
          {slide.eyebrow ? <span className="eyebrow">{slide.eyebrow}</span> : null}
          <h2 className="slide__title">{slide.title}</h2>
          {slide.lead ? <p className="slide__lead">{slide.lead}</p> : null}
        </header>

        <div className={bodyClass}>
          <div className="slide__main">
            {slide.bullets?.length ? (
              <ul className="slide-bullets">
                {slide.bullets.map((bullet) => (
                  <li key={bullet.strong}>
                    <strong>{bullet.strong}</strong>
                    <span>{bullet.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {slide.steps?.length ? (
              <ol className="slide-steps">
                {slide.steps.map((step, index) => (
                  <li key={step.title}>
                    <b>{index + 1}</b>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            {slide.compare ? (
              <div className="slide-compare">
                {[slide.compare.left, slide.compare.right].map((side) => (
                  <div className="slide-compare__side" key={side.title}>
                    <strong>{side.title}</strong>
                    {side.colors?.length ? (
                      <div className="slide-compare__colors">
                        {side.colors.map((hex) => (
                          <i key={hex} style={{ background: hex }} />
                        ))}
                      </div>
                    ) : null}
                    <p>{side.text}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {slide.paletteType ? <PaletteRow type={slide.paletteType} /> : null}
            {slide.paletteTypes?.length ? (
              <div className="slide-palette-list">
                {slide.paletteTypes.map((type) => (
                  <PaletteRow type={type} key={type} />
                ))}
              </div>
            ) : null}

            {slide.galleryItems?.length ? (
              <div className="slide-gallery">
                {slide.galleryItems
                  .map((id) => findItem(id))
                  .filter((item): item is NonNullable<typeof item> => Boolean(item?.image))
                  .map((item) => (
                    <figure key={item.id}>
                      <img src={item.image} alt="" loading="lazy" />
                      <figcaption>
                        <strong>{item.name}</strong>
                        <small>{item.colorName}</small>
                      </figcaption>
                    </figure>
                  ))}
              </div>
            ) : null}

            {slide.quiz ? <QuizBlock quiz={slide.quiz} /> : null}
          </div>

          {slide.image ? (
            <figure className="slide__figure">
              <img src={slide.image.src} alt={slide.image.alt} loading="lazy" />
            </figure>
          ) : null}
        </div>
      </div>

      {slide.teacherNote ? (
        <p className="slide__note">
          <Lightbulb size={17} aria-hidden="true" />
          <span>{slide.teacherNote}</span>
        </p>
      ) : null}
    </article>
  )
}
