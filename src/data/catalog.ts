import type { ChromaAxis, PersonalColorProfile, Tone, ValueAxis } from '../types'

export type WardrobeCategory = 'top' | 'bottom' | 'outer' | 'shoes' | 'accessory'

export interface CatalogItem {
  id: string
  category: WardrobeCategory
  name: string
  colorName: string
  /** 사진 카탈로그가 있는 품목만 image 를 가집니다. */
  image?: string
  /** 사진이 없는 품목(신발)은 색 스와치로 표현합니다. */
  swatch?: string
  tone: Tone | 'neutral'
  value: ValueAxis
  chroma: ChromaAxis
  description: string
}

const photoItem = (
  id: string,
  category: WardrobeCategory,
  name: string,
  colorName: string,
  tone: CatalogItem['tone'],
  value: ValueAxis,
  chroma: ChromaAxis,
  description: string,
): CatalogItem => ({ id, category, name, colorName, tone, value, chroma, description, image: `/catalog/${id}.webp` })

const shoeItem = (
  id: string,
  name: string,
  colorName: string,
  swatch: string,
  tone: CatalogItem['tone'],
  value: ValueAxis,
  chroma: ChromaAxis,
  description: string,
): CatalogItem => ({ id, category: 'shoes', name, colorName, swatch, tone, value, chroma, description })

export const CATALOG: CatalogItem[] = [
  photoItem('coral-cardigan', 'top', '코랄 니트 카디건', '코랄', 'warm', 'medium', 'clear', '부드러운 라운드넥 니트'),
  photoItem('apricot-knit', 'top', '살구 라운드 니트', '살구', 'warm', 'light', 'medium', '포근한 데일리 니트'),
  photoItem('camel-shirt', 'top', '카멜 코튼 셔츠', '카멜', 'warm', 'medium', 'soft', '단정한 코튼 셔츠'),
  photoItem('yellow-sweatshirt', 'top', '버터 옐로 맨투맨', '버터 옐로', 'warm', 'light', 'clear', '가벼운 캐주얼 맨투맨'),
  photoItem('olive-tee', 'top', '올리브 반팔 티', '올리브', 'warm', 'deep', 'soft', '편안한 코튼 반팔'),
  photoItem('cream-blouse', 'top', '크림 코튼 블라우스', '크림', 'neutral', 'light', 'soft', '단정한 카라 블라우스'),
  photoItem('lavender-cardigan', 'top', '라벤더 니트 카디건', '라벤더', 'cool', 'light', 'medium', '맑은 라운드넥 니트'),
  photoItem('sky-shirt', 'top', '스카이블루 셔츠', '스카이블루', 'cool', 'light', 'medium', '산뜻한 코튼 셔츠'),
  photoItem('pink-knit', 'top', '블러시 핑크 니트', '핑크', 'cool', 'light', 'soft', '부드러운 라운드 니트'),
  photoItem('navy-sweatshirt', 'top', '딥 네이비 맨투맨', '네이비', 'cool', 'deep', 'clear', '깔끔한 데일리 맨투맨'),
  photoItem('berry-hoodie', 'top', '베리 집업 후드', '베리', 'cool', 'deep', 'medium', '차분한 집업 후드'),
  photoItem('white-tee', 'top', '클린 화이트 반팔', '화이트', 'neutral', 'light', 'clear', '기본 코튼 반팔'),

  photoItem('camel-wide-pants', 'bottom', '카멜 와이드 팬츠', '카멜', 'warm', 'medium', 'soft', '여유로운 와이드 실루엣'),
  photoItem('navy-straight-pants', 'bottom', '네이비 스트레이트 팬츠', '네이비', 'cool', 'deep', 'medium', '단정한 일자 실루엣'),
  photoItem('blue-jeans', 'bottom', '미디엄 블루 데님', '블루 데님', 'neutral', 'medium', 'medium', '편안한 릴랙스 데님'),
  photoItem('charcoal-slacks', 'bottom', '차콜 스쿨 슬랙스', '차콜', 'cool', 'deep', 'soft', '활동하기 편한 슬랙스'),
  photoItem('beige-chinos', 'bottom', '베이지 코튼 치노', '베이지', 'warm', 'light', 'soft', '담백한 코튼 팬츠'),
  photoItem('navy-pleated-skirt', 'bottom', '네이비 플리츠 스커트', '네이비', 'cool', 'deep', 'medium', '단정한 무릎 길이'),

  photoItem('camel-chore-jacket', 'outer', '카멜 코튼 재킷', '카멜', 'warm', 'medium', 'soft', '가볍게 걸치는 포켓 재킷'),
  photoItem('coral-windbreaker', 'outer', '코랄 바람막이', '코랄', 'warm', 'medium', 'clear', '산뜻한 경량 바람막이'),
  photoItem('navy-school-cardigan', 'outer', '네이비 스쿨 카디건', '네이비', 'cool', 'deep', 'medium', '배색이 단정한 카디건'),
  photoItem('lavender-zip-hoodie', 'outer', '라벤더 집업 후드', '라벤더', 'cool', 'light', 'soft', '편안한 데일리 아우터'),
  photoItem('cream-blazer', 'outer', '크림 캐주얼 재킷', '크림', 'neutral', 'light', 'soft', '부드러운 캐주얼 재킷'),
  photoItem('sky-denim-jacket', 'outer', '스카이블루 데님 재킷', '스카이블루', 'cool', 'medium', 'medium', '밝은 워싱 데님 재킷'),

  shoeItem('white-sneakers', '화이트 스니커즈', '화이트', '#F5F3EF', 'neutral', 'light', 'clear', '어디에나 무난한 기본 스니커즈'),
  shoeItem('cream-sneakers', '크림 스니커즈', '크림', '#EADFC9', 'warm', 'light', 'soft', '따뜻한 아이보리 톤 스니커즈'),
  shoeItem('black-sneakers', '블랙 스니커즈', '블랙', '#26262A', 'cool', 'deep', 'clear', '또렷한 대비를 만드는 스니커즈'),
  shoeItem('camel-loafers', '카멜 로퍼', '카멜', '#B98553', 'warm', 'medium', 'soft', '단정한 학교 행사용 로퍼'),
  shoeItem('navy-loafers', '네이비 로퍼', '네이비', '#33405F', 'cool', 'deep', 'medium', '차분한 네이비 로퍼'),
  shoeItem('brown-ankle-boots', '브라운 앵클부츠', '브라운', '#6E4A32', 'warm', 'deep', 'soft', '깊은 색감의 앵클부츠'),
  shoeItem('pink-mary-janes', '핑크 메리제인', '핑크', '#E4A9BC', 'cool', 'light', 'soft', '부드러운 스트랩 구두'),
  shoeItem('silver-sneakers', '실버 스니커즈', '실버', '#C6CBD3', 'cool', 'light', 'clear', '가볍게 반짝이는 스니커즈'),

  photoItem('cream-shoulder-bag', 'accessory', '크림 숄더백', '크림', 'warm', 'light', 'soft', '가벼운 캔버스 숄더백'),
  photoItem('navy-backpack', 'accessory', '네이비 백팩', '네이비', 'cool', 'deep', 'medium', '심플한 학생용 백팩'),
  photoItem('camel-cap', 'accessory', '카멜 볼캡', '카멜', 'warm', 'medium', 'soft', '로고 없는 코튼 볼캡'),
  photoItem('lavender-glasses', 'accessory', '라벤더 안경', '라벤더', 'cool', 'light', 'medium', '가벼운 투명 프레임'),
  photoItem('coral-hairclip', 'accessory', '코랄 헤어핀', '코랄', 'warm', 'medium', 'clear', '작은 패브릭 헤어핀'),
  photoItem('sky-crossbody-bag', 'accessory', '스카이블루 크로스백', '스카이블루', 'cool', 'light', 'medium', '작은 캔버스 크로스백'),
]

export const WARDROBE_CATEGORIES: { key: WardrobeCategory; label: string; english: string }[] = [
  { key: 'top', label: '상의', english: 'TOP' },
  { key: 'bottom', label: '하의', english: 'BOTTOM' },
  { key: 'outer', label: '아우터', english: 'OUTER' },
  { key: 'shoes', label: '신발', english: 'SHOES' },
  { key: 'accessory', label: '액세서리', english: 'ACCESSORY' },
]

export type LookSelection = Record<WardrobeCategory, string>

export const DEFAULT_LOOKS: Record<Tone, LookSelection> = {
  warm: {
    top: 'coral-cardigan',
    bottom: 'camel-wide-pants',
    outer: 'cream-blazer',
    shoes: 'cream-sneakers',
    accessory: 'cream-shoulder-bag',
  },
  cool: {
    top: 'lavender-cardigan',
    bottom: 'navy-straight-pants',
    outer: 'sky-denim-jacket',
    shoes: 'white-sneakers',
    accessory: 'lavender-glasses',
  },
}

/** 색 스와치 위에 올릴 아이콘/글자 색을 밝기에 따라 정합니다. */
export function readableInk(hex?: string) {
  if (!hex) return 'var(--ink-soft)'
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const value = Number.parseInt(full, 16)
  if (Number.isNaN(value)) return 'var(--ink-soft)'
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance > 0.6 ? 'rgba(42, 39, 36, 0.55)' : 'rgba(255, 253, 249, 0.92)'
}

export const findItem = (id: string) => CATALOG.find((item) => item.id === id)
export const itemsFor = (category: WardrobeCategory) => CATALOG.filter((item) => item.category === category)
export const selectedItems = (selection: LookSelection) =>
  (Object.keys(selection) as WardrobeCategory[])
    .map((category) => findItem(selection[category]))
    .filter((item): item is CatalogItem => Boolean(item))

/**
 * 12타입 기준 추천 여부.
 * 추천은 안내일 뿐이며 추천이 아닌 색도 모두 선택할 수 있습니다.
 */
export function isRecommended(item: CatalogItem, profile?: PersonalColorProfile) {
  if (!profile) return false
  if (item.tone === 'neutral') return true
  if (item.tone !== profile.axis.tone) return false
  return item.value === profile.axis.value || item.chroma === profile.axis.chroma || profile.axis.value === 'medium'
}
