export interface CameraInfo {
  width: number
  height: number
  /** 짧은 변이 620px 미만이면 화질 안내가 필요합니다. */
  lowResolution: boolean
}

/**
 * 노트북 웹캠에서 가능한 가장 넓은 화각과 높은 해상도로 스트림을 엽니다.
 *
 * 화각(FOV) 관련 중요한 사실
 * - 세로형 해상도(예: 1080×1350)를 요청하면 브라우저는 확대가 아니라 **크롭**으로
 *   맞추기 때문에 가로 화각이 크게 잘립니다. 그래서 세로는 지정하지 않고
 *   가로 해상도만 요청해 카메라 기본 화면을 그대로 받습니다.
 * - 카메라 zoom 제약의 최솟값은 보통 1.0(=줌 없음)이라 화각을 더 넓힐 수 없습니다.
 *   따라서 4:5 인물 구도는 촬영 뒤 캔버스에서 잘라 만듭니다.
 */
export async function openCamera(): Promise<{ stream: MediaStream; info: CameraInfo }> {
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1920 }, frameRate: { ideal: 30 } },
      audio: false,
    })
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
  }

  const [track] = stream.getVideoTracks()

  if (track && typeof track.getCapabilities === 'function') {
    const capabilities = track.getCapabilities()
    const advanced: MediaTrackConstraintSet[] = []
    if (capabilities.focusMode?.includes('continuous')) advanced.push({ focusMode: 'continuous' })
    if (capabilities.exposureMode?.includes('continuous')) advanced.push({ exposureMode: 'continuous' })
    if (capabilities.whiteBalanceMode?.includes('continuous')) advanced.push({ whiteBalanceMode: 'continuous' })

    if (advanced.length > 0) {
      try {
        // applyConstraints 는 기존 제약을 합치지 않고 통째로 교체합니다.
        // 기존 제약을 함께 넘기지 않으면 해상도 요청이 사라져 640×480 으로 떨어집니다.
        // 또한 항목마다 나눠 부르면 캡처가 매번 재시작되므로 한 번에 적용합니다.
        await track.applyConstraints({ ...track.getConstraints(), advanced })
      } catch {
        // 지원하지 않는 항목은 무시합니다. 스트림은 그대로 사용합니다.
      }
    }
  }

  const settings = track?.getSettings?.() ?? {}
  return {
    stream,
    info: describeCamera(settings.width ?? 0, settings.height ?? 0),
  }
}

export function describeCamera(width: number, height: number): CameraInfo {
  const shortSide = width && height ? Math.min(width, height) : 0
  return { width, height, lowResolution: shortSide > 0 && shortSide < 620 }
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
