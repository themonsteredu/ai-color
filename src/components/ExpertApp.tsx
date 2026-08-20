import { ArrowLeft, Copy, KeyRound, LockKeyhole, MonitorSmartphone, Palette, Plus, Settings, Sparkles, Trash2 } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const TEACHER_PIN = '3035'
const CLASS_STORAGE_KEY = 'color-mate.class-sessions.v1'

interface ClassSession {
  id: string
  code: string
  school: string
  label: string
  createdAt: string
}

function makeClassCode(existing: ClassSession[]) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
    const number = Math.floor(100 + Math.random() * 900)
    const code = `${prefix}${number}`
    if (!existing.some((item) => item.code === code)) return code
  }
  return `CLR${Date.now().toString().slice(-4)}`
}

function loadSessions(): ClassSession[] {
  try {
    const raw = window.localStorage.getItem(CLASS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ClassSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSessions(value: ClassSession[]) {
  window.localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(value))
}

export function ExpertApp() {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState<ClassSession[]>(() => loadSessions())
  const [school, setSchool] = useState('')
  const [label, setLabel] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  const latestSession = useMemo(() => sessions[0], [sessions])

  const unlock = (event: FormEvent) => {
    event.preventDefault()
    if (pin !== TEACHER_PIN) {
      setError('교사용 비밀번호가 올바르지 않습니다.')
      return
    }
    setError('')
    setUnlocked(true)
  }

  const createSession = (event: FormEvent) => {
    event.preventDefault()
    if (!school.trim()) return
    const next: ClassSession = {
      id: crypto.randomUUID(),
      code: makeClassCode(sessions),
      school: school.trim(),
      label: label.trim() || '퍼스널컬러 수업',
      createdAt: new Date().toISOString(),
    }
    const nextSessions = [next, ...sessions]
    setSessions(nextSessions)
    saveSessions(nextSessions)
    setSchool('')
    setLabel('')
  }

  const removeSession = (id: string) => {
    const next = sessions.filter((item) => item.id !== id)
    setSessions(next)
    saveSessions(next)
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    window.setTimeout(() => setCopiedCode(''), 1300)
  }

  if (!unlocked) {
    return (
      <main className="teacher-gate">
        <section className="teacher-lock-card">
          <span className="settings-lock-icon"><LockKeyhole size={34} /></span>
          <small>TEACHER ONLY</small>
          <h1>교사용 관리센터</h1>
          <p>교사용 비밀번호를 입력해 주세요.</p>
          <form onSubmit={unlock}>
            <label>비밀번호<input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => { setPin(event.target.value); setError('') }} placeholder="4자리 입력" autoFocus /></label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button" type="submit"><KeyRound size={18} />관리센터 열기</button>
          </form>
          <Link className="expert-link" to="/"><ArrowLeft size={15} /> 학생 화면으로</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="expert-page teacher-center">
      <header className="expert-header">
        <div className="expert-header-inner">
          <Link className="expert-back" to="/"><ArrowLeft size={20} />학생 화면</Link>
          <div className="expert-brand"><span><Palette size={25} /></span><div><small>COLOR MATE</small><strong>교사용 관리센터</strong></div></div>
          <Link className="expert-settings" to="/settings"><Settings size={17} />AI 설정</Link>
        </div>
      </header>

      <div className="teacher-dashboard">
        <section className="teacher-code-card">
          <small>CLASS SESSION</small>
          <h1>{latestSession?.code ?? '수업코드 만들기'}</h1>
          <p>{latestSession ? `${latestSession.school} · ${latestSession.label}` : '학교나 회차마다 새로운 수업코드를 만들어 사용할 수 있어요.'}</p>
          {latestSession ? <button className="secondary-button" type="button" onClick={() => copyCode(latestSession.code)}><Copy size={17} />{copiedCode === latestSession.code ? '복사했어요' : '최근 수업코드 복사'}</button> : null}
        </section>

        <section className="teacher-flow-card class-manager-card">
          <div className="expert-section-title"><span><Plus size={20} /></span><div><h2>새 수업 만들기</h2><p>같은 프로그램을 여러 학교·반·회차에서 각각 운영할 수 있습니다.</p></div></div>
          <form className="class-session-form" onSubmit={createSession}>
            <label>학교 / 기관명<input value={school} onChange={(event) => setSchool(event.target.value)} placeholder="예: ○○초등학교" required /></label>
            <label>수업명 / 회차<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="예: 5학년 1반 · 1회차" /></label>
            <button className="primary-button" type="submit"><Plus size={18} />새 수업코드 생성</button>
          </form>

          <div className="class-session-list">
            {sessions.length === 0 ? <p className="input-help">아직 만든 수업이 없습니다.</p> : sessions.map((item) => (
              <article className="class-session-row" key={item.id}>
                <div><small>{item.school}</small><strong>{item.code}</strong><span>{item.label}</span></div>
                <div className="class-session-actions">
                  <button type="button" onClick={() => copyCode(item.code)} aria-label={`${item.code} 복사`}><Copy size={16} /></button>
                  <button type="button" onClick={() => removeSession(item.id)} aria-label={`${item.code} 삭제`}><Trash2 size={16} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="teacher-flow-card">
          <div className="expert-section-title"><span><MonitorSmartphone size={20} /></span><div><h2>수업 흐름</h2><p>교사가 학생 톤을 미리 입력하지 않습니다.</p></div></div>
          <div className="teacher-flow-grid">
            <div><b>1</b><strong>학생 입장</strong><small>수업코드 + 이름</small></div>
            <div><b>2</b><strong>컬러 탐색</strong><small>세부 타입 사전 예상</small></div>
            <div><b>3</b><strong>실물 체험</strong><small>선생님과 드레이핑 비교</small></div>
            <div><b>4</b><strong>내 타입 확정</strong><small>12 퍼스널컬러 타입</small></div>
            <div><b>5</b><strong>메이크업</strong><small>내 사진에서 직접 디자인</small></div>
            <div><b>6</b><strong>AI 스타일링</strong><small>의상까지 고른 뒤 최종 1회</small></div>
          </div>
        </section>

        <section className="teacher-ai-card">
          <Sparkles size={22} />
          <div><strong>AI 비용 원칙</strong><p>톤 탐색·메이크업·의상 선택은 무료, 최종 스타일 생성에서만 OpenAI 이미지 API를 1회 사용합니다.</p></div>
          <Link to="/settings">AI 설정 열기</Link>
        </section>
      </div>
    </main>
  )
}
