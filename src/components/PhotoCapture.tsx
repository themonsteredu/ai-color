import { Camera, ImagePlus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PhotoCaptureProps { onPhoto: (url: string) => void; onCancel: () => void }

export function PhotoCapture({ onPhoto, onCancel }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active' | 'blocked'>('idle')
  const [consent, setConsent] = useState(false)

  const stopCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraState('idle') }
  useEffect(() => stopCamera, [])

  const openCamera = async () => {
    setCameraState('loading')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraState('active')
    } catch { setCameraState('blocked') }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const context = canvas.getContext('2d'); if (!context) return
    context.translate(canvas.width, 0); context.scale(-1, 1); context.drawImage(video, 0, 0)
    canvas.toBlob((blob) => { if (!blob) return; stopCamera(); onPhoto(URL.createObjectURL(blob)) }, 'image/jpeg', 0.92)
  }

  const upload = (file?: File) => { if (!file) return; stopCamera(); onPhoto(URL.createObjectURL(file)) }

  return <div className="capture-screen">
    <div className="privacy-hero"><span className="privacy-icon"><ShieldCheck size={34} /></span><div><strong>사진 처리 안내</strong><p>최종 스타일 생성 버튼을 누를 때만 사진이 OpenAI API로 전송돼요.</p></div></div>
    <div className={`camera-frame ${cameraState === 'active' ? 'is-live' : ''}`}>
      <video ref={videoRef} muted playsInline aria-label="전면 카메라 미리보기" />
      {cameraState !== 'active' ? <div className="camera-empty"><Camera size={38} /><strong>{cameraState === 'blocked' ? '카메라를 사용할 수 없어요' : '얼굴과 어깨가 선명하게 보이면 충분해요'}</strong><span>{cameraState === 'blocked' ? '아래 사진 업로드를 이용해 주세요' : '정면을 보고 머리카락이 얼굴을 너무 가리지 않게 찍어 주세요'}</span></div> : null}
      <div className="portrait-guide" aria-hidden="true" />
    </div>
    <ul className="privacy-list"><li><ShieldCheck size={18} />앱 저장소에는 사진을 보관하지 않아요</li><li><Sparkles size={18} />전신사진이 없어도 AI가 자연스러운 전신 스타일을 구성해요</li><li><Trash2 size={18} />활동 종료 시 임시 사진을 지워요</li></ul>
    <label className="photo-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>최종 스타일 생성을 위해 선택한 사진이 OpenAI API에서 처리되는 것에 동의합니다.</span></label>
    {cameraState === 'active' ? <button className="primary-button camera-button" type="button" onClick={capture}><Camera size={21} />이 사진 사용하기</button> : <button className="primary-button" type="button" onClick={openCamera} disabled={!consent || cameraState === 'loading'}><Camera size={21} />{cameraState === 'loading' ? '카메라 여는 중…' : '카메라로 찍기'}</button>}
    <label className={`secondary-button file-button${consent ? '' : ' disabled'}`}><ImagePlus size={20} />기존 사진에서 선택<input type="file" accept="image/*" capture="user" disabled={!consent} onChange={(e) => upload(e.target.files?.[0])} /></label>
    <button className="text-button" type="button" onClick={() => { stopCamera(); onCancel() }}>이전으로</button>
  </div>
}
