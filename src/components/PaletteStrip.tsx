import { Check } from 'lucide-react'

interface PaletteStripProps {
  colors: string[]
  selected?: string
  labels?: string[]
  onSelect?: (color: string) => void
  ariaLabel?: string
}

export function PaletteStrip({ colors, selected, labels, onSelect, ariaLabel = '색상 팔레트' }: PaletteStripProps) {
  return (
    <div className="palette-strip" role={onSelect ? 'radiogroup' : undefined} aria-label={ariaLabel}>
      {colors.map((color, index) => {
        const isSelected = color.toLowerCase() === selected?.toLowerCase()
        const label = labels?.[index] ?? `${index + 1}번째 추천 색상`
        return onSelect ? (
          <button
            className={`color-chip ${isSelected ? 'selected' : ''}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            key={`${color}-${index}`}
            onClick={() => onSelect(color)}
            style={{ '--chip-color': color } as React.CSSProperties}
          >
            {isSelected ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : null}
          </button>
        ) : (
          <span
            className="color-chip static"
            aria-label={label}
            key={`${color}-${index}`}
            style={{ '--chip-color': color } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}

