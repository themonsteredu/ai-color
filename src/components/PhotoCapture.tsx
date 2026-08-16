import { Camera, ImagePlus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PhotoCaptureProps {
  onPhoto: (url: string) => void
  onCancel: () => void
}

export function PhotoCapture({ onPhoto, onCancel }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'active' | 'blocked'>('idle')

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
    canvas.toBlob((blob) => {
      if (!blob) return
      stopCamera()
      onPhoto(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.92)
  }

  const upload = (file?: File) => {
    if (!file) return
    stopCamera()
    onPhoto(URL.createObjectURL(file))
  }

  return (
    <div className="capture-screen">
      <div className="privacy-hero">
        <span className="privacy-icon"><ShieldCheck size={34} /></span>
        <div><strong>안심하고 촬영하세요</strong><p>사진은 기기 안에서만 사용돼요</p></div>
      </div>

      <div className={`camera-frame ${cameraState === 'active' ? 'is-live' : ''}`}>
        <video ref={videoRef} muted playsInline aria-label="전면 카메라 미리보기" />
        {cameraState !== 'active' ? (
          <div className="camera-empty">
            <Camera size={38} />
            <strong>{cameraState === 'blocked' ? '카메라를 사용할 수 없어요' : '얼굴과 어깨를 맞춰주세요'}</strong>
            <span>{cameraState === 'blocked' ? '아래 사진 업로드를 이용해 주세요' : '정면을 보고 자연스럽게 서 주세요'}</span>
          </div>
        ) : null}
        <div className="face-guide" aria-hidden="true" />
        <div className="shoulder-guide" aria-hidden="true" />
      </div>

      <ul className="privacy-list">
        <li><ShieldCheck size={18} />사진은 저장되지 않아요</li>
        <li><Sparkles size={18} />얼굴과 어깨만 촬영해요</li>
        <li><Trash2 size={18} />활동이 끝나면 자동 삭제돼요</li>
      </ul>

      {cameraState === 'active' ? (
        <button className="primary-button camera-button" type="button" onClick={capture}><Camera size={21} />사진 촬영하기</button>
      ) : (
        <button className="primary-button" type="button" onClick={openCamera} disabled={cameraState === 'loading'}>
          <Camera size={21} />{cameraState === 'loading' ? '카메라 여는 중…' : '카메라 열기'}
        </button>
      )}
      <label className="secondary-button file-button">
        <ImagePlus size={20} />사진에서 선택
        <input type="file" accept="image/*" capture="user" onChange={(event) => upload(event.target.files?.[0])} />
      </label>
      <button className="text-button" type="button" onClick={() => { stopCamera(); onCancel() }}>나중에 하기</button>
    </div>
  )
}

