import type { CatalogItem, LookSelection, WardrobeCategory } from './types'
import type { Tone } from '../types'

const item = (
  id: string,
  category: WardrobeCategory,
  name: string,
  colorName: string,
  tone: CatalogItem['tone'],
  description: string,
): CatalogItem => ({ id, category, name, colorName, tone, description, image: `/catalog/${id}.webp` })

export const CATALOG: CatalogItem[] = [
  item('coral-cardigan', 'top', '코랄 니트 카디건', '코랄', 'warm', '부드러운 라운드넥 니트'),
  item('apricot-knit', 'top', '살구 라운드 니트', '살구', 'warm', '포근한 데일리 니트'),
  item('camel-shirt', 'top', '카멜 코튼 셔츠', '카멜', 'warm', '단정한 코튼 셔츠'),
  item('yellow-sweatshirt', 'top', '버터 옐로 맨투맨', '버터 옐로', 'warm', '가벼운 캐주얼 맨투맨'),
  item('olive-tee', 'top', '올리브 반팔 티', '올리브', 'warm', '편안한 코튼 반팔'),
  item('cream-blouse', 'top', '크림 코튼 블라우스', '크림', 'neutral', '단정한 카라 블라우스'),
  item('lavender-cardigan', 'top', '라벤더 니트 카디건', '라벤더', 'cool', '맑은 라운드넥 니트'),
  item('sky-shirt', 'top', '스카이블루 셔츠', '스카이블루', 'cool', '산뜻한 코튼 셔츠'),
  item('pink-knit', 'top', '블러시 핑크 니트', '핑크', 'cool', '부드러운 라운드 니트'),
  item('navy-sweatshirt', 'top', '딥 네이비 맨투맨', '네이비', 'cool', '깔끔한 데일리 맨투맨'),
  item('berry-hoodie', 'top', '베리 집업 후드', '베리', 'cool', '차분한 집업 후드'),
  item('white-tee', 'top', '클린 화이트 반팔', '화이트', 'neutral', '기본 코튼 반팔'),

  item('camel-wide-pants', 'bottom', '카멜 와이드 팬츠', '카멜', 'warm', '여유로운 와이드 실루엣'),
  item('navy-straight-pants', 'bottom', '네이비 스트레이트 팬츠', '네이비', 'cool', '단정한 일자 실루엣'),
  item('blue-jeans', 'bottom', '미디엄 블루 데님', '블루 데님', 'neutral', '편안한 릴랙스 데님'),
  item('charcoal-slacks', 'bottom', '차콜 스쿨 슬랙스', '차콜', 'cool', '활동하기 편한 슬랙스'),
  item('beige-chinos', 'bottom', '베이지 코튼 치노', '베이지', 'warm', '담백한 코튼 팬츠'),
  item('navy-pleated-skirt', 'bottom', '네이비 플리츠 스커트', '네이비', 'cool', '단정한 무릎 길이'),

  item('camel-chore-jacket', 'outer', '카멜 코튼 재킷', '카멜', 'warm', '가볍게 걸치는 포켓 재킷'),
  item('coral-windbreaker', 'outer', '코랄 바람막이', '코랄', 'warm', '산뜻한 경량 바람막이'),
  item('navy-school-cardigan', 'outer', '네이비 스쿨 카디건', '네이비', 'cool', '배색이 단정한 카디건'),
  item('lavender-zip-hoodie', 'outer', '라벤더 집업 후드', '라벤더', 'cool', '편안한 데일리 아우터'),
  item('cream-blazer', 'outer', '크림 캐주얼 재킷', '크림', 'neutral', '부드러운 캐주얼 재킷'),
  item('sky-denim-jacket', 'outer', '스카이블루 데님 재킷', '스카이블루', 'cool', '밝은 워싱 데님 재킷'),

  item('cream-shoulder-bag', 'accessory', '크림 숄더백', '크림', 'warm', '가벼운 캔버스 숄더백'),
  item('navy-backpack', 'accessory', '네이비 백팩', '네이비', 'cool', '심플한 학생용 백팩'),
  item('camel-cap', 'accessory', '카멜 볼캡', '카멜', 'warm', '로고 없는 코튼 볼캡'),
  item('lavender-glasses', 'accessory', '라벤더 안경', '라벤더', 'cool', '가벼운 투명 프레임'),
  item('coral-hairclip', 'accessory', '코랄 헤어핀', '코랄', 'warm', '작은 패브릭 헤어핀'),
  item('sky-crossbody-bag', 'accessory', '스카이블루 크로스백', '스카이블루', 'cool', '작은 캔버스 크로스백'),
]

export const CATEGORY_LABELS: Record<WardrobeCategory, string> = {
  top: '상의',
  bottom: '하의',
  outer: '아우터',
  accessory: '액세서리',
}

export const DEFAULT_LOOKS: Record<Tone, LookSelection> = {
  warm: {
    top: 'coral-cardigan',
    bottom: 'camel-wide-pants',
    outer: 'cream-blazer',
    accessory: 'cream-shoulder-bag',
  },
  cool: {
    top: 'lavender-cardigan',
    bottom: 'navy-straight-pants',
    outer: 'sky-denim-jacket',
    accessory: 'lavender-glasses',
  },
}

export const LOOK_PRESETS: { id: string; name: string; tone: Tone; selection: LookSelection }[] = [
  { id: 'spring-school', name: '봄빛 스쿨룩', tone: 'warm', selection: DEFAULT_LOOKS.warm },
  { id: 'apricot-casual', name: '살구 데일리', tone: 'warm', selection: { top: 'apricot-knit', bottom: 'beige-chinos', outer: 'coral-windbreaker', accessory: 'camel-cap' } },
  { id: 'camel-classic', name: '카멜 클래식', tone: 'warm', selection: { top: 'cream-blouse', bottom: 'camel-wide-pants', outer: 'camel-chore-jacket', accessory: 'cream-shoulder-bag' } },
  { id: 'summer-school', name: '라벤더 스쿨룩', tone: 'cool', selection: DEFAULT_LOOKS.cool },
  { id: 'sky-casual', name: '스카이 데일리', tone: 'cool', selection: { top: 'sky-shirt', bottom: 'blue-jeans', outer: 'lavender-zip-hoodie', accessory: 'sky-crossbody-bag' } },
  { id: 'navy-clean', name: '네이비 클린룩', tone: 'cool', selection: { top: 'white-tee', bottom: 'navy-pleated-skirt', outer: 'navy-school-cardigan', accessory: 'navy-backpack' } },
]

export const findItem = (id: string) => CATALOG.find((catalogItem) => catalogItem.id === id)
export const itemsFor = (category: WardrobeCategory) => CATALOG.filter((catalogItem) => catalogItem.category === category)
export const selectedItems = (selection: LookSelection) => Object.values(selection).map(findItem).filter((catalogItem): catalogItem is CatalogItem => Boolean(catalogItem))
