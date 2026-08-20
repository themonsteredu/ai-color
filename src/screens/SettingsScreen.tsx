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

export function SettingsScreen() {
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

  const post = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await readJson(response)
    if (!response.ok) throw new Error(String(payload.error ?? '요청을 처리하지 못했어요.'))
    return payload
  }

  const unlock = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await post({ action: 'verify', pin })
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
      await post({ action: 'save', pin, apiKey, model, quality, size })
      setApiKey('')
      setMessage('OpenAI 설정을 현재 브라우저에 안전하게 저장했어요.')
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
      await post({ action: 'clear', pin })
      setMessage('현재 브라우저의 API 설정을 삭제했어요.')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '설정을 삭제하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  if (!unlocked) {
    return (
      <div className="gate">
        <section className="gate__card">
          <span className="gate__icon" aria-hidden="true">
            <LockKeyhole size={32} />
          </span>
          <div>
            <span className="eyebrow">TEACHER ONLY</span>
            <h1 style={{ marginTop: 6, fontSize: 'var(--fs-title)' }}>AI 설정 잠금</h1>
          </div>
          <form onSubmit={unlock}>
            <label className="field">
              <span>교사용 비밀번호</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="4자리 입력"
                autoComplete="off"
                autoFocus
              />
            </label>
            {!status.storageReady ? (
              <p className="note note--neutral">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>
                  최초 1회 Vercel 환경변수에 <code>SETTINGS_ENCRYPTION_KEY</code>를 등록해야 저장이 가능합니다.
                </span>
              </p>
            ) : null}
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy || !pin}>
              <KeyRound size={18} aria-hidden="true" />
              {busy ? '확인 중…' : '설정 열기'}
            </button>
          </form>
          <Link className="btn btn--quiet" to="/expert">
            <ArrowLeft size={15} aria-hidden="true" /> 교사용 관리센터로
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="teacher-head">
        <div className="shell">
          <div className="teacher-head__inner">
            <div className="teacher-brand">
              <span aria-hidden="true">
                <Settings size={22} />
              </span>
              <div>
                <small>OPENAI IMAGE API</small>
                <strong>AI 설정</strong>
              </div>
            </div>
            <div className="teacher-head__links">
              <Link className="btn btn--neutral" to="/expert">
                <ArrowLeft size={17} aria-hidden="true" />
                관리센터
              </Link>
              <Link className="btn btn--neutral" to="/">
                학생 화면
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="page__body">
        <div className="shell">
          <div className="settings-layout">
            <section className="panel">
              <div className="panel__head">
                <div>
                  <span className="eyebrow">FINAL IMAGE</span>
                  <h2 style={{ marginTop: 4 }}>최종 스타일 생성 설정</h2>
                </div>
                <span className={`badge ${status.configured ? 'badge--recommend' : 'badge--outline'}`}>
                  {status.configured ? <CheckCircle2 size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                  {status.configured ? 'API 키 등록됨' : 'API 키 없음'}
                </span>
              </div>

              <form className="stack" onSubmit={save}>
                <label className="field">
                  <span>OpenAI API 키</span>
                  <div className="secret-input">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder={status.configured ? '변경할 때만 새 키 입력' : 'sk-…'}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((current) => !current)}
                      aria-label={showKey ? 'API 키 숨기기' : 'API 키 보기'}
                    >
                      {showKey ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  <span className="field__help">키는 자바스크립트 저장소가 아닌 암호화된 HttpOnly 쿠키에 보관됩니다.</span>
                </label>

                <div className="select-grid">
                  <label className="field">
                    <span>이미지 모델</span>
                    <select value={model} onChange={(event) => setModel(event.target.value)}>
                      <option value="gpt-image-1.5">gpt-image-1.5</option>
                      <option value="gpt-image-2">gpt-image-2</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>품질</span>
                    <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                      <option value="low">Low · 저비용</option>
                      <option value="medium">Medium · 권장</option>
                      <option value="high">High · 비용 높음</option>
                      <option value="auto">Auto</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>이미지 크기</span>
                    <select value={size} onChange={(event) => setSize(event.target.value)}>
                      <option value="1024x1536">1024×1536 · 세로</option>
                      <option value="1024x1024">1024×1024 · 정사각</option>
                      <option value="1536x1024">1536×1024 · 가로</option>
                      <option value="auto">Auto</option>
                    </select>
                  </label>
                </div>

                {message ? (
                  <p className="note note--calm" role="status">
                    <span>{message}</span>
                  </p>
                ) : null}
                {error ? (
                  <p className="alert" role="alert">
                    {error}
                  </p>
                ) : null}

                <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={busy || (!apiKey && !status.configured)}>
                  <Save size={18} aria-hidden="true" />
                  {busy ? '저장 중…' : '설정 저장'}
                </button>
                {status.configured ? (
                  <button className="btn btn--neutral" type="button" onClick={clear} disabled={busy}>
                    <Trash2 size={17} aria-hidden="true" />현재 브라우저의 API 설정 삭제
                  </button>
                ) : null}
              </form>
            </section>

            <section className="stack">
              <div className="panel">
                <span className="eyebrow">COST</span>
                <h2 style={{ marginTop: 4 }}>학생 1명당 비용</h2>
                <ul className="stack stack--sm" style={{ marginTop: 14 }}>
                  <li>퍼스널컬러 탐색 · 0원</li>
                  <li>메이크업 LAB · 0원</li>
                  <li>의상 · 신발 · 액세서리 선택 · 0원</li>
                  <li>
                    <b>AI 최종 스타일 · 이미지 생성 1회</b>
                  </li>
                </ul>
                <p className="muted" style={{ marginTop: 14 }}>
                  품질을 Medium 이하로 두면 학생 1명당 비용을 낮게 유지할 수 있습니다.
                </p>
              </div>
              <p className="note note--neutral">
                <span>
                  학생이 여러 기기에서 접속하는 운영 방식이라면, 브라우저 쿠키 대신 서버 환경변수{' '}
                  <code>OPENAI_API_KEY</code>를 사용하는 방식이 더 안정적입니다.
                </span>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
