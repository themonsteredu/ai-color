import { Home, Palette, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BottomNavProps {
  onHome: () => void
  onPalette: () => void
  current?: 'home' | 'palette'
}

export function BottomNav({ onHome, onPalette, current = 'home' }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      <button type="button" className={current === 'home' ? 'active' : ''} onClick={onHome}>
        <Home size={21} aria-hidden="true" /><span>홈</span>
      </button>
      <button type="button" className={current === 'palette' ? 'active' : ''} onClick={onPalette}>
        <Palette size={21} aria-hidden="true" /><span>내 팔레트</span>
      </button>
      <Link to="/expert">
        <UserCog size={21} aria-hidden="true" /><span>전문가</span>
      </Link>
    </nav>
  )
}
