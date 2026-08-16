import { ArrowLeft, Sparkles } from 'lucide-react'

interface TopBarProps {
  title: string
  onBack?: () => void
  badge?: string
}

export function TopBar({ title, onBack, badge }: TopBarProps) {
  return (
    <header className="top-bar">
      {onBack ? (
        <button className="icon-button" type="button" onClick={onBack} aria-label="이전 화면">
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
      ) : (
        <span className="top-bar-spacer" />
      )}
      <div className="top-bar-title-wrap">
        <h1>{title}</h1>
        {badge ? <span className="mini-badge"><Sparkles size={12} />{badge}</span> : null}
      </div>
      <span className="top-bar-spacer" />
    </header>
  )
}

