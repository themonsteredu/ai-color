import { Camera, ImagePlus, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { JourneyBar } from '../components/JourneyBar'

interface PhotoScreenProps {
  onPhoto: (url: string) => void
  onBack: () => void
}

export function PhotoScreen({ onPhoto, onBack }: PhotoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active' | 'blocked'>('idle')
  const [consent, setConsent] = useState(false)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraState('idle')
  }

  useEffect(() => stopCamera, [])

  const openCamera = async () => {
    setCameraState('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraState('active')
    } catch {
      setCameraState('blocked')
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        stopCamera()
        onPhoto(URL.createObjectURL(blob))
      },
      'image/jpeg',
      0.92,
    )
  }

  const upload = (file?: File) => {
    if (!file) return
    stopCamera()
    onPhoto(URL.createObjectURL(file))
  }

  return (
    <div className="page">
      <JourneyBar current="photo" title="내 사진 준비하기" subtitle="STEP 6 · 스타일링에 사용할 사진" onBack={onBack} />
      <main className="page__body">
        <div className="shell">
          <div className="photo">
            <section className="stack">
              <div>
                <span className="eyebrow">MY PHOTO</span>
                <h1 style={{ fontSize: 'var(--fs-display)', lineHeight: 'var(--lh-display)', marginTop: 6 }}>
                  얼굴과 어깨가 보이는 사진 한 장이면 충분해요
                </h1>
                <p className="lead" style={{ marginTop: 12 }}>
                  이 사진 위에 메이크업을 올려 보고, 마지막 AI 스타일링에도 그대로 사용합니다.
                </p>
              </div>

              <div className="photo__tips">
                <div className="tip">
                  <UserRound size={20} aria-hidden="true" />
                  <span>얼굴과 어깨가 선명하게 보이도록 촬영하세요.</span>
                </div>
                <div className="tip">
                  <Camera size={20} aria-hidden="true" />
                  <span>정면을 바라보고 밝은 곳에서 촬영하세요.</span>
                </div>
                <div className="tip">
                  <Sun size={20} aria-hidden="true" />
                  <span>앞머리가 눈썹과 눈을 너무 가리지 않게 정리하면 메이크업 미리보기가 더 잘 맞아요.</span>
                </div>
                <div className="tip">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <span>사진은 기기에만 두고, 마지막 &lsquo;AI로 내 스타일 완성하기&rsquo;를 누를 때 1회만 전송됩니다.</span>
                </div>
              </div>

              <label className="consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>최종 스타일 생성을 위해 내가 고른 사진이 OpenAI 이미지 API에서 처리되는 것에 동의합니다.</span>
              </label>
            </section>

            <section className="stack">
              <div className={`camera-frame${cameraState === 'active' ? ' is-live' : ''}`}>
                <video ref={videoRef} muted playsInline aria-label="전면 카메라 미리보기" />
                {cameraState !== 'active' ? (
                  <div className="camera-frame__empty">
                    <Camera size={40} aria-hidden="true" />
                    <strong>{cameraState === 'blocked' ? '카메라를 사용할 수 없어요' : '얼굴 + 어깨 정면 사진'}</strong>
                    <span className="muted">
                      {cameraState === 'blocked'
                        ? '아래에서 갤러리 사진을 선택해 주세요.'
                        : '전신사진은 필요하지 않아요.'}
                    </span>
                  </div>
                ) : null}
                <div className="camera-guide" aria-hidden="true" />
              </div>

              <div className="btn-row">
                {cameraState === 'active' ? (
                  <button className="btn btn--primary btn--lg" type="button" onClick={capture}>
                    <Camera size={20} aria-hidden="true" />이 사진 사용하기
                  </button>
                ) : (
                  <button
                    className="btn btn--primary btn--lg"
                    type="button"
                    onClick={openCamera}
                    disabled={!consent || cameraState === 'loading'}
                  >
                    <Camera size={20} aria-hidden="true" />
                    {cameraState === 'loading' ? '카메라 여는 중…' : '카메라로 찍기'}
                  </button>
                )}
                <label className={`btn btn--secondary btn--lg file-button${consent ? '' : ' is-disabled'}`}>
                  <ImagePlus size={20} aria-hidden="true" />
                  갤러리에서 선택
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!consent}
                    onChange={(event) => upload(event.target.files?.[0])}
                  />
                </label>
              </div>
              {!consent ? <p className="muted">동의를 체크하면 촬영과 사진 선택을 시작할 수 있어요.</p> : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
