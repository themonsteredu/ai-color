import { Check, Star } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Swatch } from '../types'

interface SwatchListProps {
  colors: Swatch[]
  selected?: string
  onSelect?: (swatch: Swatch) => void
  /** 내 타입 추천색에 ★ 표시 */
  starred?: boolean
  showNames?: boolean
  compact?: boolean
  ariaLabel?: string
}

export function SwatchList({
  colors,
  selected,
  onSelect,
  starred = false,
  showNames = true,
  compact = false,
  ariaLabel = '색상 목록',
}: SwatchListProps) {
  return (
    <div className={`swatches${compact ? ' swatches--compact' : ''}`} role={onSelect ? 'radiogroup' : 'list'} aria-label={ariaLabel}>
      {colors.map((color, index) => {
        const isSelected = Boolean(selected && color.hex.toLowerCase() === selected.toLowerCase())
        const style = { '--swatch-color': color.hex } as CSSProperties
        if (!onSelect) {
          return (
            <span className="swatch" key={`${color.hex}-${index}`} style={style} role="listitem">
              <span className="swatch__color" />
              {showNames ? <span className="swatch__name">{color.name}</span> : null}
            </span>
          )
        }
        return (
          <button
            className={`swatch${isSelected ? ' is-selected' : ''}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            key={`${color.hex}-${index}`}
            style={style}
            onClick={() => onSelect(color)}
          >
            <span className="swatch__color">{isSelected ? <Check size={20} strokeWidth={3} aria-hidden="true" /> : null}</span>
            {showNames ? <span className="swatch__name">{color.name}</span> : null}
            {starred ? (
              <span className="swatch__star" aria-hidden="true">
                <Star size={12} fill="currentColor" strokeWidth={0} />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** 이름 없이 색만 보여주는 얇은 팔레트 바 */
export function PaletteBar({ colors, ariaLabel = '대표 팔레트' }: { colors: Swatch[]; ariaLabel?: string }) {
  return (
    <div className="swatches swatches--bar" role="img" aria-label={`${ariaLabel}: ${colors.map((color) => color.name).join(', ')}`}>
      {colors.map((color, index) => (
        <span className="swatch-bar-item" key={`${color.hex}-${index}`} style={{ background: color.hex }} />
      ))}
    </div>
  )
}
