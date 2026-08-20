import { createZip, type ZipEntry } from './zip'

/**
 * 한글(HWPX / OWPML) 문서 생성기.
 *
 * HWPX 는 한글의 공개 표준 문서 형식(KS X 6101)이며 ZIP 안에 XML 이 들어 있는
 * 구조라 브라우저에서 직접 만들 수 있습니다. 반면 이진 형식인 .hwp 는 비공개
 * 규격이라 브라우저에서 생성할 수 없습니다. 한글 2014 이상은 .hwpx 를 그대로 엽니다.
 *
 * 구조와 속성 이름은 한글이 실제로 저장한 문서를 기준으로 맞췄습니다.
 * (hp/hh/hs 요소의 속성에는 네임스페이스 접두사를 붙이지 않습니다)
 */

export type HwpxStyle =
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bullet'
  | 'note'
  | 'answer'
  | 'blank'

export interface HwpxBlock {
  style: HwpxStyle
  text?: string
}

export interface HwpxDocument {
  title: string
  creator?: string
  blocks: HwpxBlock[]
}

/** 문단 모양 id */
const PARA = { body: 0, center: 1, indent: 2 } as const
/** 글자 모양 id */
const CHAR = { body: 0, title: 1, subtitle: 2, heading: 3, subheading: 4, note: 5, answer: 6, bullet: 7 } as const

const STYLE_MAP: Record<HwpxStyle, { para: number; char: number; prefix?: string }> = {
  title: { para: PARA.center, char: CHAR.title },
  subtitle: { para: PARA.center, char: CHAR.subtitle },
  heading: { para: PARA.body, char: CHAR.heading },
  subheading: { para: PARA.body, char: CHAR.subheading },
  body: { para: PARA.body, char: CHAR.body },
  bullet: { para: PARA.indent, char: CHAR.bullet, prefix: '· ' },
  note: { para: PARA.indent, char: CHAR.note },
  answer: { para: PARA.indent, char: CHAR.answer },
  blank: { para: PARA.body, char: CHAR.body },
}

const NS = [
  'xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app"',
  'xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"',
  'xmlns:hp10="http://www.hancom.co.kr/hwpml/2016/paragraph"',
  'xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"',
  'xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"',
  'xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"',
  'xmlns:hhs="http://www.hancom.co.kr/hwpml/2011/history"',
  'xmlns:hm="http://www.hancom.co.kr/hwpml/2011/master-page"',
  'xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf"',
  'xmlns:dc="http://purl.org/dc/elements/1.1/"',
  'xmlns:opf="http://www.idpf.org/2007/opf/"',
  'xmlns:epub="http://www.idpf.org/2007/ops"',
  'xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"',
].join(' ')

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** XML 에 넣을 수 없는 제어문자를 제거합니다. */
function sanitize(value: string) {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim()
}

function charPr(id: number, height: number, color: string, fontRef: number, bold: boolean) {
  return [
    `<hh:charPr id="${id}" height="${height}" textColor="${color}" shadeColor="none" useFontSpace="0" useKerning="0" symMark="NONE" borderFillIDRef="2">`,
    `<hh:fontRef hangul="${fontRef}" latin="${fontRef}" hanja="${fontRef}" japanese="${fontRef}" other="${fontRef}" symbol="${fontRef}" user="${fontRef}"/>`,
    '<hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>',
    '<hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>',
    '<hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>',
    '<hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>',
    bold ? '<hh:bold/>' : '',
    '<hh:underline type="NONE" shape="SOLID" color="#000000"/>',
    '<hh:strikeout shape="NONE" color="#000000"/>',
    '<hh:outline type="NONE"/>',
    '<hh:shadow type="NONE" color="#C0C0C0" offsetX="10" offsetY="10"/>',
    '</hh:charPr>',
  ].join('')
}

function paraPr(id: number, align: string, left: number, prev: number, next: number) {
  const margin = [
    '<hh:margin>',
    '<hc:intent value="0" unit="HWPUNIT"/>',
    `<hc:left value="${left}" unit="HWPUNIT"/>`,
    '<hc:right value="0" unit="HWPUNIT"/>',
    `<hc:prev value="${prev}" unit="HWPUNIT"/>`,
    `<hc:next value="${next}" unit="HWPUNIT"/>`,
    '</hh:margin>',
    '<hh:lineSpacing type="PERCENT" value="160" unit="HWPUNIT"/>',
  ].join('')
  return [
    `<hh:paraPr id="${id}" tabPrIDRef="0" condense="0" fontLineHeight="0" snapToGrid="1" suppressLineNumbers="0" checked="0" textDir="LTR">`,
    `<hh:align horizontal="${align}" vertical="BASELINE"/>`,
    '<hh:heading type="NONE" idRef="0" level="0"/>',
    '<hh:breakSetting breakLatinWord="KEEP_WORD" breakNonLatinWord="BREAK_WORD" widowOrphan="0" keepWithNext="0" keepLines="0" pageBreakBefore="0" lineWrap="BREAK"/>',
    '<hh:autoSpacing eAsianEng="0" eAsianNum="0"/>',
    margin,
    '<hh:border borderFillIDRef="2" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="0" ignoreMargin="0"/>',
    '</hh:paraPr>',
  ].join('')
}

function buildHeader() {
  const fontLangs = ['HANGUL', 'LATIN', 'HANJA', 'JAPANESE', 'OTHER', 'SYMBOL', 'USER']
  const fontfaces = fontLangs
    .map(
      (lang) =>
        `<hh:fontface lang="${lang}" fontCnt="2">` +
        '<hh:font id="0" face="함초롬돋움" type="TTF" isEmbedded="0"><hh:typeInfo familyType="FCAT_GOTHIC" weight="6" proportion="4" contrast="0" strokeVariation="1" armStyle="1" letterform="1" midline="1" xHeight="1"/></hh:font>' +
        '<hh:font id="1" face="함초롬바탕" type="TTF" isEmbedded="0"><hh:typeInfo familyType="FCAT_MYUNGJO" weight="6" proportion="4" contrast="0" strokeVariation="1" armStyle="1" letterform="1" midline="1" xHeight="1"/></hh:font>' +
        '</hh:fontface>',
    )
    .join('')

  const borderFillBody =
    '<hh:slash type="NONE" Crooked="0" isCounter="0"/>' +
    '<hh:backSlash type="NONE" Crooked="0" isCounter="0"/>' +
    '<hh:leftBorder type="NONE" width="0.1 mm" color="#000000"/>' +
    '<hh:rightBorder type="NONE" width="0.1 mm" color="#000000"/>' +
    '<hh:topBorder type="NONE" width="0.1 mm" color="#000000"/>' +
    '<hh:bottomBorder type="NONE" width="0.1 mm" color="#000000"/>' +
    '<hh:diagonal type="SOLID" width="0.1 mm" color="#000000"/>'

  const borderFills =
    '<hh:borderFills itemCnt="2">' +
    `<hh:borderFill id="1" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0">${borderFillBody}</hh:borderFill>` +
    `<hh:borderFill id="2" threeD="0" shadow="0" centerLine="NONE" breakCellSeparateLine="0">${borderFillBody}<hc:fillBrush><hc:winBrush faceColor="none" hatchColor="#999999" alpha="0"/></hc:fillBrush></hh:borderFill>` +
    '</hh:borderFills>'

  // 글자 모양: 본문 / 큰제목 / 부제 / 제목 / 소제목 / 교사노트 / 정답 / 항목
  const charProperties =
    '<hh:charProperties itemCnt="8">' +
    charPr(CHAR.body, 1000, '#2A2724', 1, false) +
    charPr(CHAR.title, 2200, '#CD5340', 0, true) +
    charPr(CHAR.subtitle, 1200, '#6B6560', 0, false) +
    charPr(CHAR.heading, 1600, '#CD5340', 0, true) +
    charPr(CHAR.subheading, 1200, '#2A2724', 0, true) +
    charPr(CHAR.note, 1000, '#8A6524', 1, false) +
    charPr(CHAR.answer, 1000, '#2F7A58', 1, true) +
    charPr(CHAR.bullet, 1000, '#2A2724', 1, false) +
    '</hh:charProperties>'

  const paraProperties =
    '<hh:paraProperties itemCnt="3">' +
    paraPr(PARA.body, 'JUSTIFY', 0, 0, 300) +
    paraPr(PARA.center, 'CENTER', 0, 0, 400) +
    paraPr(PARA.indent, 'JUSTIFY', 1400, 0, 200) +
    '</hh:paraProperties>'

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<hh:head ${NS} version="1.4" secCnt="1">` +
    '<hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/>' +
    '<hh:refList>' +
    `<hh:fontfaces itemCnt="7">${fontfaces}</hh:fontfaces>` +
    borderFills +
    charProperties +
    '<hh:tabProperties itemCnt="1"><hh:tabPr id="0" autoTabLeft="0" autoTabRight="0"/></hh:tabProperties>' +
    '<hh:numberings itemCnt="0"/>' +
    paraProperties +
    '<hh:styles itemCnt="1">' +
    '<hh:style id="0" type="PARA" name="바탕글" engName="Normal" paraPrIDRef="0" charPrIDRef="0" nextStyleIDRef="0" langID="1042" lockForm="0"/>' +
    '</hh:styles>' +
    '</hh:refList>' +
    '</hh:head>'
  )
}

/** 첫 문단에 들어가는 구역 설정 (A4 세로) */
const SECTION_PROPERTIES =
  '<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0">' +
  '<hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/>' +
  '<hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/>' +
  '<hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/>' +
  '<hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/>' +
  '<hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY">' +
  '<hp:margin header="4252" footer="4252" gutter="0" left="8504" right="8504" top="5668" bottom="4252"/>' +
  '</hp:pagePr>' +
  '<hp:footNotePr>' +
  '<hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>' +
  '<hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/>' +
  '<hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/>' +
  '<hp:numbering type="CONTINUOUS" newNum="1"/>' +
  '<hp:placement place="EACH_COLUMN" beneathText="0"/>' +
  '</hp:footNotePr>' +
  '<hp:endNotePr>' +
  '<hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>' +
  '<hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/>' +
  '<hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/>' +
  '<hp:numbering type="CONTINUOUS" newNum="1"/>' +
  '<hp:placement place="END_OF_DOCUMENT" beneathText="0"/>' +
  '</hp:endNotePr>' +
  '<hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
  '<hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
  '<hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER"><hp:offset left="1417" right="1417" top="1417" bottom="1417"/></hp:pageBorderFill>' +
  '</hp:secPr>' +
  '<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl>'

const LINE_SEG =
  '<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="42520" flags="393216"/></hp:linesegarray>'

function buildSection(blocks: HwpxBlock[]) {
  const paragraphs = blocks.map((block, index) => {
    const map = STYLE_MAP[block.style] ?? STYLE_MAP.body
    const text = block.style === 'blank' ? '' : sanitize(block.text ?? '')
    const content = text ? escapeXml(`${map.prefix ?? ''}${text}`) : ''
    const sectionRun = index === 0 ? `<hp:run charPrIDRef="${map.char}">${SECTION_PROPERTIES}</hp:run>` : ''
    return (
      `<hp:p id="${2000000000 + index}" paraPrIDRef="${map.para}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">` +
      sectionRun +
      `<hp:run charPrIDRef="${map.char}"><hp:t>${content}</hp:t></hp:run>` +
      LINE_SEG +
      '</hp:p>'
    )
  })

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><hs:sec ${NS}>${paragraphs.join('')}</hs:sec>`
}

function buildContentHpf(title: string, creator: string) {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<opf:package ${NS} version="" unique-identifier="" id="">` +
    '<opf:metadata>' +
    `<opf:title>${escapeXml(title)}</opf:title>` +
    '<opf:language>ko</opf:language>' +
    `<opf:meta name="creator" content="${escapeXml(creator)}"/>` +
    '</opf:metadata>' +
    '<opf:manifest>' +
    '<opf:item id="header" href="Contents/header.xml" media-type="application/xml"/>' +
    '<opf:item id="section0" href="Contents/section0.xml" media-type="application/xml"/>' +
    '<opf:item id="settings" href="settings.xml" media-type="application/xml"/>' +
    '</opf:manifest>' +
    '<opf:spine><opf:itemref idref="header" linear="yes"/><opf:itemref idref="section0" linear="yes"/></opf:spine>' +
    '</opf:package>'
  )
}

const CONTAINER_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<ocf:container xmlns:ocf="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:hpf="http://www.hancom.co.kr/schema/2011/hpf">' +
  '<ocf:rootfiles>' +
  '<ocf:rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/>' +
  '<ocf:rootfile full-path="Preview/PrvText.txt" media-type="text/plain"/>' +
  '</ocf:rootfiles>' +
  '</ocf:container>'

const MANIFEST_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<odf:manifest xmlns:odf="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"/>'

const VERSION_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<hv:HCFVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version" tagetApplication="WORDPROCESSOR" major="5" minor="1" micro="1" buildNumber="0" os="1" xmlVersion="1.5" application="Color Mate" appVersion="1.0"/>'

const SETTINGS_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<ha:HWPApplicationSetting xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0">' +
  '<ha:CaretPosition listIDRef="0" paraIDRef="0" pos="0"/>' +
  '</ha:HWPApplicationSetting>'

/** 한글 문서(.hwpx) 바이트를 만듭니다. */
export function buildHwpx(source: HwpxDocument): Uint8Array {
  const encoder = new TextEncoder()
  const creator = source.creator ?? '컬러메이트'
  const preview = source.blocks
    .map((block) => (block.style === 'blank' ? '' : sanitize(block.text ?? '')))
    .filter(Boolean)
    .slice(0, 40)
    .join('\n')

  const entries: ZipEntry[] = [
    // mimetype 은 반드시 첫 번째 항목이어야 합니다.
    { name: 'mimetype', data: encoder.encode('application/hwp+zip') },
    { name: 'version.xml', data: encoder.encode(VERSION_XML) },
    { name: 'settings.xml', data: encoder.encode(SETTINGS_XML) },
    { name: 'META-INF/container.xml', data: encoder.encode(CONTAINER_XML) },
    { name: 'META-INF/manifest.xml', data: encoder.encode(MANIFEST_XML) },
    { name: 'Contents/content.hpf', data: encoder.encode(buildContentHpf(source.title, creator)) },
    { name: 'Contents/header.xml', data: encoder.encode(buildHeader()) },
    { name: 'Contents/section0.xml', data: encoder.encode(buildSection(source.blocks)) },
    { name: 'Preview/PrvText.txt', data: encoder.encode(preview) },
  ]

  return createZip(entries)
}

/** 만든 문서를 파일로 내려받습니다. */
export function downloadHwpx(source: HwpxDocument, fileName: string) {
  const bytes = buildHwpx(source)
  const blob = new Blob([bytes as BlobPart], { type: 'application/hwp+zip' })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.hwpx') ? fileName : `${fileName}.hwpx`
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
