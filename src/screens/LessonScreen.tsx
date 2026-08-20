import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, Maximize2, Minimize2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { SlideView } from '../components/lesson/SlideView'
import { LESSON_TRACKS } from '../data/lesson'

export function LessonScreen() {
  const flat = useMemo(
    () =>
      LESSON_TRACKS.flatMap((track, trackIndex) =>
        track.slides.map((slide) => ({ slide, track, trackIndex })),
      ),
    [],
  )
  const trackStarts = useMemo(() => {
    const starts: number[] = []
    let cursor = 0
    LESSON_TRACKS.forEach((track) => {
      starts.push(cursor)
      cursor += track.slides.length
    })
    return starts
  }, [])

  const [index, setIndex] = useState(0)
  const [showNotes, setShowNotes] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)

  const total = flat.length
  const current = flat[index]

  const go = useCallback(
    (next: number) => setIndex((value) => Math.min(total - 1, Math.max(0, typeof next === 'number' ? next : value))),
    [total],
  )
  const move = useCallback((delta: number) => setIndex((value) => Math.min(total - 1, Math.max(0, value + delta))), [total])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        move(1)
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        move(-1)
      } else if (event.key === 'Home') {
        go(0)
      } else if (event.key === 'End') {
        go(total - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move, go, total])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await stageRef.current?.closest('.lesson')?.requestFullscreen()
    } catch {
      // 전체화면을 지원하지 않는 환경에서는 그대로 사용합니다.
    }
  }

  return (
    <div className={`lesson${showNotes ? ' show-notes' : ''}`} style={{ '--track-accent': current.track.accent } as CSSProperties}>
      <header className="lesson__bar">
        <Link className="lesson__exit" to="/expert" aria-label="교사용 관리센터로 돌아가기">
          <ArrowLeft size={19} aria-hidden="true" />
          <span>나가기</span>
        </Link>

        <nav className="lesson__tracks" aria-label="주제 이동">
          {LESSON_TRACKS.map((track, trackIndex) => (
            <button
              className={current.trackIndex === trackIndex ? 'is-active' : ''}
              type="button"
              key={track.key}
              style={{ '--chip-accent': track.accent } as CSSProperties}
              onClick={() => go(trackStarts[trackIndex])}
            >
              {track.short}
            </button>
          ))}
        </nav>

        <div className="lesson__tools">
          <button
            className={`lesson__tool${showNotes ? ' is-on' : ''}`}
            type="button"
            onClick={() => setShowNotes((value) => !value)}
            aria-pressed={showNotes}
          >
            <Lightbulb size={17} aria-hidden="true" />
            <span>교사 노트</span>
          </button>
          <button className="lesson__tool" type="button" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}
            <span>{isFullscreen ? '창으로' : '전체화면'}</span>
          </button>
        </div>
      </header>

      <div className="lesson__stage" ref={stageRef}>
        <div
          className="lesson__rail"
          style={{ transform: `translateX(${-index * 100}%)` }}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current
            touchStart.current = null
            if (start === null) return
            const delta = (event.changedTouches[0]?.clientX ?? start) - start
            if (Math.abs(delta) > 56) move(delta < 0 ? 1 : -1)
          }}
        >
          {flat.map(({ slide }, slideIndex) => (
            <div className="lesson__cell" key={slide.id}>
              <SlideView slide={slide} active={slideIndex === index} />
            </div>
          ))}
        </div>

        <button
          className="lesson__nav lesson__nav--prev"
          type="button"
          onClick={() => move(-1)}
          disabled={index === 0}
          aria-label="이전 슬라이드"
        >
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
        <button
          className="lesson__nav lesson__nav--next"
          type="button"
          onClick={() => move(1)}
          disabled={index === total - 1}
          aria-label="다음 슬라이드"
        >
          <ChevronRight size={26} aria-hidden="true" />
        </button>
      </div>

      <footer className="lesson__foot">
        <div className="lesson__progress" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
          <span style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <div className="lesson__foot-row">
          <span className="lesson__where">{current.track.label}</span>
          <div className="lesson__dots">
            {flat.map(({ slide }, slideIndex) => (
              <button
                type="button"
                key={slide.id}
                className={slideIndex === index ? 'is-active' : ''}
                onClick={() => go(slideIndex)}
                aria-label={`${slideIndex + 1}번째 슬라이드`}
              />
            ))}
          </div>
          <span className="lesson__count">
            {index + 1} / {total}
          </span>
        </div>
      </footer>
    </div>
  )
}
