import { DEFAULT_MAKEUP } from '../data'
import type { AvatarCategory, AvatarItem, AvatarState, Season } from './types'

export const SEASON_INFO: Record<Season, { label: string; detail: string; accent: string; colors: string[] }> = {
  spring: { label: '봄 웜톤', detail: '라이트 브라이트', accent: '#FF8066', colors: ['#FF8066', '#FFA071', '#FFC27A', '#F4D35E', '#86C98A'] },
  summer: { label: '여름 쿨톤', detail: '라이트 뮤트', accent: '#927BEB', colors: ['#927BEB', '#B9A7EA', '#F28BB9', '#75AEED', '#86C7D6'] },
  autumn: { label: '가을 웜톤', detail: '뮤트 딥', accent: '#B97848', colors: ['#C58B5A', '#A96846', '#D39A55', '#7E8B5B', '#874D3F'] },
  winter: { label: '겨울 쿨톤', detail: '브라이트 딥', accent: '#4F59A8', colors: ['#4F59A8', '#C94472', '#5D9EEB', '#6F53B8', '#283453'] },
}

export const ALL_COLORS = Object.values(SEASON_INFO).flatMap((season) => season.colors)

export const AVATAR_MENUS: { id: AvatarCategory; label: string }[] = [
  { id: 'face', label: '얼굴' },
  { id: 'hair', label: '헤어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'top', label: '상의' },
  { id: 'bottom', label: '하의' },
  { id: 'outer', label: '아우터' },
  { id: 'accessory', label: '액세서리' },
  { id: 'background', label: '배경' },
  { id: 'card', label: '최종 카드' },
]

export const HAIR_ITEMS: AvatarItem[] = [
  { id: 'original', label: '원본 머리', kind: 'original' },
  { id: 'short', label: '짧은 머리', kind: 'hair' },
  { id: 'bob', label: '단발', kind: 'hair' },
  { id: 'long', label: '긴 머리', kind: 'hair' },
  { id: 'tie', label: '묶은 머리', kind: 'hair' },
  { id: 'curl', label: '곱슬머리', kind: 'hair' },
  { id: 'bang', label: '앞머리', kind: 'hair' },
]

export const HAIR_COLORS = ['#292522', '#4A352B', '#6D4934', '#9A6846', '#3F3C45']

export const TOP_ITEMS: AvatarItem[] = [
  { id: 'tee', label: '반팔 티셔츠', kind: 'top' },
  { id: 'shirt', label: '셔츠', kind: 'top' },
  { id: 'sweatshirt', label: '맨투맨', kind: 'top' },
  { id: 'hoodie', label: '후드', kind: 'top' },
  { id: 'knit', label: '니트', kind: 'top' },
  { id: 'cardigan', label: '카디건', kind: 'top' },
  { id: 'jacket', label: '재킷', kind: 'top' },
  { id: 'uniform', label: '교복 스타일', kind: 'top' },
  { id: 'casual', label: '캐주얼', kind: 'top' },
]

export const BOTTOM_ITEMS: AvatarItem[] = [
  { id: 'wide', label: '와이드 팬츠', kind: 'bottom' },
  { id: 'straight', label: '스트레이트', kind: 'bottom' },
  { id: 'skirt', label: '플리츠 스커트', kind: 'bottom' },
  { id: 'shorts', label: '하프 팬츠', kind: 'bottom' },
]

export const OUTER_ITEMS: AvatarItem[] = [
  { id: 'none', label: '없음', kind: 'outer' },
  { id: 'cardigan', label: '카디건', kind: 'outer' },
  { id: 'jacket', label: '재킷', kind: 'outer' },
  { id: 'hoodie', label: '후드 집업', kind: 'outer' },
]

export const ACCESSORY_ITEMS: AvatarItem[] = [
  { id: 'glasses', label: '안경', kind: 'accessory' },
  { id: 'cap', label: '모자', kind: 'accessory' },
  { id: 'hairpin', label: '머리핀', kind: 'accessory' },
  { id: 'earring', label: '귀걸이', kind: 'accessory' },
  { id: 'necklace', label: '목걸이', kind: 'accessory' },
  { id: 'bag', label: '가방', kind: 'accessory' },
]

export const BACKGROUND_ITEMS = [
  { id: 'ivory', label: '아이보리 스튜디오', value: 'linear-gradient(145deg,#fffdfa,#efe9e0)' },
  { id: 'flowers', label: '봄꽃', value: 'linear-gradient(145deg,#fff4ee,#f8ccd3)' },
  { id: 'sky', label: '여름 하늘', value: 'linear-gradient(145deg,#eaf7ff,#add5f5)' },
  { id: 'park', label: '가을 공원', value: 'linear-gradient(145deg,#f7e8d1,#d7a66a)' },
  { id: 'stars', label: '겨울 별빛', value: 'linear-gradient(145deg,#303b69,#9d92d6)' },
  { id: 'classroom', label: '교실', value: 'linear-gradient(145deg,#f7f2e9,#c9d9c7)' },
  { id: 'gradient', label: '컬러 그라데이션', value: 'linear-gradient(145deg,#ffd6ca,#d8d2fa,#bae2f3)' },
]

export function createDefaultAvatar(season: Season): AvatarState {
  const info = SEASON_INFO[season]
  return {
    season,
    detailType: info.detail,
    face: { scale: 1, x: 0, y: 0, neck: 0, mask: 72, fitMode: 'auto' },
    hair: { styleId: 'original', color: '#292522' },
    makeup: DEFAULT_MAKEUP,
    top: { itemId: 'tee', color: info.colors[0] },
    bottom: { itemId: 'wide', color: '#66708B' },
    outer: { itemId: 'none', color: info.colors[2] },
    accessories: [],
    backgroundId: 'ivory',
    pose: 'front',
    flipped: false,
    zoom: 1,
    favoriteColors: [],
    recentColors: [info.colors[0]],
    styleName: '나의 컬러 스타일',
  }
}

