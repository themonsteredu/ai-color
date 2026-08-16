import { memo } from 'react'
import { BACKGROUND_ITEMS } from './data'
import type { AvatarRendererProps } from './types'
import { PhotoCanvas } from '../components/PhotoCanvas'

const PHOTO_PLACEMENT = { x: 0.5, y: 0.37, scale: 0.29 }

const hairBackPath: Record<string, string> = {
  short: 'M128 170C126 89 165 42 202 42s77 43 75 128c-22-28-43-39-75-39s-53 11-74 39Z',
  bob: 'M118 184C111 87 159 40 202 40s91 48 84 144l-22 54-24-49h-76l-24 49-22-54Z',
  long: 'M111 189C103 84 154 35 202 35s99 50 91 154l-12 150-43-48 16-112H150l16 112-43 48-12-150Z',
  tie: 'M122 177C117 88 158 41 202 41s85 45 80 136c25 3 44 26 37 57-17-22-37-27-55-15l-16-51h-92l-16 51c-18-12-38-7-55 15-7-31 12-54 37-57Z',
  curl: 'M110 198C91 165 102 87 155 51c55-37 118 2 139 60 13 36 5 72-2 93-14-13-24-30-25-49-11 22-29 33-47 35-29 3-59-11-78-34 0 17-12 33-32 42Z',
  bang: 'M120 182C114 86 158 40 202 40s88 48 82 142c-22-32-43-44-82-44s-60 12-82 44Z',
}

const hairFrontPath: Record<string, string> = {
  short: 'M130 137c13-65 44-82 72-82 32 0 62 22 73 78-26-18-43-24-69-24-31 0-52 9-76 28Z',
  bob: 'M126 142c8-66 42-91 76-91 39 0 70 29 78 89-28-19-48-26-76-26-31 0-53 8-78 28Z',
  long: 'M121 142c7-71 43-98 81-98 42 0 77 31 82 98-31-23-49-30-82-30s-53 10-81 30Z',
  tie: 'M127 141c10-66 43-88 75-88 36 0 68 26 76 87-26-18-45-25-75-25-29 0-50 8-76 26Z',
  curl: 'M116 150c1-70 39-105 86-105 49 0 87 38 87 106-20-12-31-28-35-47-15 18-34 29-54 30-26 2-50-9-66-29-2 19-8 34-18 45Z',
  bang: 'M119 149c3-73 40-102 83-102 44 0 80 32 84 99-16-16-31-26-47-31-5 17-18 29-33 33-3-17-12-29-26-37-6 21-25 34-61 38Z',
}

function OutfitDetails({ topId, color }: { topId: string; color: string }) {
  if (topId === 'shirt' || topId === 'uniform') return <><path d="M202 232v116" stroke="#fff" strokeOpacity=".72" strokeWidth="3" /><path d="m178 234 24 28 24-28" fill="#fff" fillOpacity=".82" /><circle cx="202" cy="280" r="3" fill="#fff" /><circle cx="202" cy="304" r="3" fill="#fff" /></>
  if (topId === 'hoodie') return <><path d="M165 241c14 22 60 22 74 0" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="4" /><path d="M185 250v38M219 250v38" stroke="#fff" strokeOpacity=".8" strokeWidth="2" /><rect x="174" y="313" width="56" height="30" rx="14" fill="#000" fillOpacity=".08" /></>
  if (topId === 'knit') return <><path d="M144 270h116M139 291h126M136 312h132M133 333h138" stroke="#fff" strokeOpacity=".18" strokeWidth="3" /><path d="M176 228c2 22 50 22 52 0" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="5" /></>
  if (topId === 'cardigan') return <><path d="M202 232v120" stroke="#f9f1e8" strokeWidth="5" /><circle cx="202" cy="274" r="3" fill="#f9f1e8" /><circle cx="202" cy="298" r="3" fill="#f9f1e8" /></>
  if (topId === 'jacket') return <><path d="m174 234 28 48 28-48M202 282v70" fill="none" stroke="#fff" strokeOpacity=".58" strokeWidth="4" /><path d="M181 239h42" stroke={color} strokeWidth="3" /></>
  if (topId === 'sweatshirt') return <path d="M174 233c2 22 54 22 56 0" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="6" />
  if (topId === 'casual') return <><path d="M148 265h108" stroke="#fff" strokeOpacity=".22" strokeWidth="18" /><circle cx="202" cy="306" r="19" fill="#fff" fillOpacity=".15" /></>
  return <path d="M172 232c4 19 56 19 60 0" fill="none" stroke="#fff" strokeOpacity=".36" strokeWidth="4" />
}

export const LayeredAvatarRenderer = memo(function LayeredAvatarRenderer({ state, photoUrl, landmarks, compact = false }: AvatarRendererProps) {
  const background = BACKGROUND_ITEMS.find((item) => item.id === state.backgroundId)?.value ?? BACKGROUND_ITEMS[0].value
  const poseOffset = state.pose === 'left' ? -9 : state.pose === 'right' ? 9 : 0
  const hairBack = hairBackPath[state.hair.styleId]
  const hairFront = hairFrontPath[state.hair.styleId]
  const has = (id: string) => state.accessories.includes(id)

  return (
    <div
      className={`avatar-renderer ${compact ? 'compact' : ''} pose-${state.pose} ${state.flipped ? 'flipped' : ''}`}
      style={{
        '--avatar-bg': background,
        '--avatar-zoom': state.zoom,
        '--pose-offset': `${poseOffset}px`,
        '--face-scale': state.face.scale,
        '--face-x': `${state.face.x}px`,
        '--face-y': `${state.face.y}px`,
        '--face-mask': `${state.face.mask}%`,
        '--hair-color': state.hair.color,
      } as React.CSSProperties}
      aria-label="꾸미는 중인 나의 컬러 아바타"
    >
      <div className="avatar-scene-decor" aria-hidden="true"><i /><i /><i /></div>
      <div className="avatar-model">
        <svg className="avatar-body-layer" viewBox="0 0 404 520" aria-hidden="true">
          <ellipse cx="202" cy="489" rx="91" ry="17" fill="#4c3f36" opacity=".12" />
          {hairBack ? <path d={hairBack} fill={state.hair.color} stroke="#1f1b19" strokeOpacity=".14" strokeWidth="4" /> : null}
          <path d="M165 340 152 486h40l10-118 10 118h40l-13-146Z" fill={state.bottom.color} />
          {state.bottom.itemId === 'skirt' ? <path d="m155 334-24 96h142l-24-96Z" fill={state.bottom.color} /> : null}
          {state.bottom.itemId === 'shorts' ? <path d="M153 336v75h40l9-52 9 52h40v-75Z" fill={state.bottom.color} /> : null}
          <path d="M143 244c-32 10-49 53-48 104l33 3 19-73-2 79h114l-2-79 19 73 33-3c1-51-16-94-48-104-24-8-39-12-59-12s-35 4-59 12Z" fill={state.top.color} stroke="#7e5b50" strokeOpacity=".12" strokeWidth="3" />
          <OutfitDetails topId={state.top.itemId} color={state.top.color} />
          {state.outer.itemId !== 'none' ? <><path d="M143 246c-23 12-36 47-37 94l25 8 29-87 3 94h39V241c-19 0-35 2-59 5Z" fill={state.outer.color} opacity=".94" /><path d="M261 246c23 12 36 47 37 94l-25 8-29-87-3 94h-39V241c19 0 35 2 59 5Z" fill={state.outer.color} opacity=".94" /><path d="M202 243v112" stroke="#fff" strokeOpacity=".35" strokeWidth="3" /></> : null}
          <rect x="184" y={196 + state.face.neck} width="36" height="58" rx="18" fill="#E8B792" stroke="#9B6E59" strokeOpacity=".16" strokeWidth="2" />
          {has('necklace') ? <><path d="M170 239c8 36 56 36 64 0" fill="none" stroke="#d7aa4d" strokeWidth="3" /><circle cx="202" cy="265" r="5" fill="#f2ca6b" /></> : null}
          {has('bag') ? <><path d="M267 278c43 43 31 108 21 148" fill="none" stroke="#6e4c3d" strokeWidth="8" /><rect x="265" y="376" width="58" height="66" rx="16" fill="#a86c4d" /></> : null}
        </svg>

        <div className="avatar-face-window">
          <PhotoCanvas imageUrl={photoUrl} makeup={state.makeup} landmarks={landmarks} placement={PHOTO_PLACEMENT} ariaLabel="학생 얼굴이 적용된 아바타" />
          <span className="avatar-face-outline" />
        </div>

        <svg className="avatar-front-layer" viewBox="0 0 404 520" aria-hidden="true">
          {hairFront ? <path d={hairFront} fill={state.hair.color} stroke="#1f1b19" strokeOpacity=".12" strokeWidth="3" /> : null}
          {has('glasses') ? <><rect x="147" y="139" width="47" height="31" rx="14" fill="none" stroke="#453f3d" strokeWidth="4" /><rect x="210" y="139" width="47" height="31" rx="14" fill="none" stroke="#453f3d" strokeWidth="4" /><path d="M194 151h16" stroke="#453f3d" strokeWidth="4" /></> : null}
          {has('hairpin') ? <path d="m259 104 20 16-22 6" fill="none" stroke="#ffcf67" strokeLinecap="round" strokeWidth="7" /> : null}
          {has('earring') ? <><circle cx="142" cy="177" r="5" fill="#f4cf6a" /><circle cx="262" cy="177" r="5" fill="#f4cf6a" /></> : null}
          {has('cap') ? <><path d="M126 102c13-57 49-72 76-72 33 0 68 19 77 72Z" fill={state.top.color} /><path d="M202 101c41-4 79 4 97 17-36 8-69 3-97-17Z" fill={state.top.color} opacity=".86" /></> : null}
        </svg>
      </div>
      <div className="avatar-stage-label"><span>2.5D COLOR AVATAR</span><b>{state.styleName || '나의 컬러 스타일'}</b></div>
    </div>
  )
})
