import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Save, Settings, ShieldCheck, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

interface SettingsStatus {
  storageReady: boolean
  configured: boolean
  model?: string
  quality?: string
  size?: string
}

const defaultStatus: SettingsStatus = { storageReady: false, configured: false }

async function readJson(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error('설정 API 응답을 확인해 주세요.')
  }
}

export function SettingsApp() {
  const [status, setStatus] = useState<SettingsStatus>(defaultStatus)
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [model, setModel] = useState('gpt-image-1.5')
  const [quality, setQuality] = useState('medium')
  const [size, setSize] = useState('1024x1536')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    const response = await fetch('/api/settings', { cache: 'no-store' })
    const payload = await readJson(response)
    if (!response.ok) throw new Error(String(payload.error ?? '설정 상태를 확인하지 못했어요.'))
    const next = payload as unknown as SettingsStatus
    setStatus(next)
    if (next.model) setModel(next.model)
    if (next.quality) setQuality(next.quality)
    if (next.size) setSize(next.size)
  }

  useEffect(() => {
    refresh().catch((caught) => setError(caught instanceof Error ? caught.message : '설정 상태를 확인하지 못했어요.'))
  }, [])

  const unlock = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', pin }) })
      const payload = await readJson(response)
      if (!response.ok) throw new Error(String(payload.error ?? '비밀번호를 확인해 주세요.'))
      setUnlocked(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '비밀번호를 확인해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', pin, apiKey, model, quality, size }),
      })
      const payload = await readJson(response)
      if (!response.ok) throw new Error(String(payload.error ?? '설정을 저장하지 못했어요.'))
      setApiKey('')
      setMessage('OpenAI 설정을 이 기기에 안전하게 저장했어요.')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '설정을 저장하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const clear = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'clear', pin }) })
      const payload = await readJson(response)
      if (!response.ok) throw new Error(String(payload.error ?? '설정을 삭제하지 못했어요.'))
      setMessage('이 기기에 저장된 API 설정을 삭제했어요.')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '설정을 삭제하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <Link to="/expert"><ArrowLeft size={20} />전문가 관리</Link>
        <div><span><Settings size={23} /></span><strong>AI 설정</strong></div>
        <Link to="/">학생 화면</Link>
      </header>

      {!unlocked ? (
        <section className="settings-lock-card">
          <span className="settings-lock-icon"><LockKeyhole size={34} /></span>
          <small>EXPERT ONLY</small>
          <h1>설정 잠금</h1>
          <p>전문가 설정 비밀번호를 입력해 주세요.</p>
          <form onSubmit={unlock}>
            <label>설정 비밀번호<input type="password" inputMode="numeric" maxLength={12} value={pin} onChange={(event) => setPin(event.target.value)} placeholder="비밀번호 입력" autoFocus /></label>
            <button type="submit" disabled={busy || !pin}><KeyRound size={18} />{busy ? '확인 중…' : '설정 열기'}</button>
          </form>
          {!status.storageReady ? <div className="settings-setup-note"><ShieldCheck size={18} /><span>최초 1회 Vercel에 <code>SETTINGS_PIN</code>과 <code>SETTINGS_ENCRYPTION_KEY</code>를 등록해야 합니다.</span></div> : null}
          {error ? <p className="settings-error" role="alert">{error}</p> : null}
        </section>
      ) : (
        <section className="settings-form-card">
          <div className="settings-title"><span><KeyRound size={22} /></span><div><small>OPENAI DIRECT API</small><h1>가상착의 API 설정</h1><p>Vercel AI Gateway를 거치지 않고 OpenAI에 직접 연결합니다.</p></div></div>
          <div className={`settings-status ${status.configured ? 'ready' : ''}`}>{status.configured ? <><CheckCircle2 size={17} />이 기기에 API 키가 설정되어 있어요</> : <><ShieldCheck size={17} />아직 API 키가 없어요</>}</div>
          <form onSubmit={save}>
            <label>OpenAI API 키<div className="secret-input"><input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={status.configured ? '변경할 때만 새 키 입력' : 'sk-…'} autoComplete="off" /><button type="button" onClick={() => setShowKey((current) => !current)} aria-label={showKey ? 'API 키 숨기기' : 'API 키 보기'}>{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><small>키는 자바스크립트 저장소가 아닌 암호화된 HttpOnly 쿠키에 보관됩니다.</small></label>
            <div className="settings-select-grid">
              <label>이미지 모델<select value={model} onChange={(event) => setModel(event.target.value)}><option value="gpt-image-1.5">gpt-image-1.5</option><option value="gpt-image-2">gpt-image-2</option></select></label>
              <label>품질<select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="low">Low · 저비용</option><option value="medium">Medium · 권장</option><option value="high">High · 비용 높음</option><option value="auto">Auto</option></select></label>
              <label>이미지 크기<select value={size} onChange={(event) => setSize(event.target.value)}><option value="1024x1536">1024×1536 · 세로</option><option value="1024x1024">1024×1024 · 정사각</option><option value="1536x1024">1536×1024 · 가로</option><option value="auto">Auto</option></select></label>
            </div>
            <div className="settings-cost-warning"><b>학생당 500원 제한 권장값</b><span>gpt-image-1.5 · Medium · 1024×1536 · 생성 2회</span></div>
            {message ? <p className="settings-success" role="status">{message}</p> : null}
            {error ? <p className="settings-error" role="alert">{error}</p> : null}
            <button className="settings-save" type="submit" disabled={busy || (!apiKey && !status.configured)}><Save size={18} />{busy ? '저장 중…' : '설정 저장'}</button>
            {status.configured ? <button className="settings-clear" type="button" onClick={clear} disabled={busy}><Trash2 size={17} />이 기기의 API 설정 삭제</button> : null}
          </form>
          <p className="settings-device-note">보안을 위해 설정은 현재 브라우저에만 적용됩니다. 학생들이 같은 기기에서 활동할 때 사용하세요.</p>
        </section>
      )}
    </main>
  )
}
