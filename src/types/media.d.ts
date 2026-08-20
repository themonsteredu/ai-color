/**
 * 카메라 화질 제어 항목은 표준 TypeScript DOM 타입에 아직 포함되어 있지 않습니다.
 * (MediaStream Image Capture 명세) 선언 병합으로 안전하게 사용합니다.
 */
interface MediaSettingsRange {
  max: number
  min: number
  step: number
}

interface MediaTrackCapabilities {
  focusMode?: string[]
  exposureMode?: string[]
  whiteBalanceMode?: string[]
  brightness?: MediaSettingsRange
  sharpness?: MediaSettingsRange
  zoom?: MediaSettingsRange
}

interface MediaTrackConstraintSet {
  focusMode?: ConstrainDOMString
  exposureMode?: ConstrainDOMString
  whiteBalanceMode?: ConstrainDOMString
}
