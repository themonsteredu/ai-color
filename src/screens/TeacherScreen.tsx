import { ArrowLeft, Copy, Database, KeyRound, LockKeyhole, Palette, Plus, Settings, Sparkles, Trash2 } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { classSessionStore, type ClassSession } from '../services/classSessions'

const TEACHER_PIN = '3035'

const FLOW = [
  { step: '1', title: '학생 입장', copy: '수업코드 + 이름 입력' },
  { step: '2', title: '사전 예상', copy: '질문 10개로 12타입 예상' },
  { step: '3', title: '실제 드레이핑', copy: '선생님과 컬러천 비교' },
  { step: '4', title: '타입 확정', copy: '학생이 직접 12타입 선택' },
  { step: '5', title: '사진 준비', copy: '얼굴 + 어깨 정면 사진 1장' },
  { step: '6', title: '메이크업 LAB', copy: '내 사진 위에서 디자인' },
  { step: '7', title: '패션 스타일링', copy: '상의 · 하의 · 아우터 · 신발 · 액세서리' },
  { step: '8', title: 'AI 최종 스타일', copy: '유료 생성은 여기서 1회' },
]

export function TeacherScreen() {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState<ClassSession[]>(() => classSessionStore.list())
  const [school, setSchool] = useState('')
  const [label, setLabel] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

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
    classSessionStore.create({ school, label })
    setSessions(classSessionStore.list())
    setSchool('')
    setLabel('')
  }

  const removeSession = (id: string) => setSessions(classSessionStore.remove(id))

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard?.writeText(code)
      setCopiedCode(code)
      window.setTimeout(() => setCopiedCode(''), 1400)
    } catch {
      setCopiedCode('')
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
            <h1 style={{ marginTop: 6, fontSize: 'var(--fs-title)' }}>교사용 관리센터</h1>
          </div>
          <form onSubmit={unlock}>
            <label className="field">
              <span>교사용 비밀번호</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value)
                  setError('')
                }}
                placeholder="4자리 입력"
                autoComplete="off"
                autoFocus
              />
            </label>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn btn--primary btn--block" type="submit">
              <KeyRound size={18} aria-hidden="true" />
              관리센터 열기
            </button>
          </form>
          <Link className="btn btn--quiet" to="/">
            <ArrowLeft size={15} aria-hidden="true" /> 학생 화면으로
          </Link>
        </section>
      </div>
    )
  }

  const latest = sessions[0]

  return (
    <div className="page">
      <header className="teacher-head">
        <div className="shell">
          <div className="teacher-head__inner">
            <div className="teacher-brand">
              <span aria-hidden="true">
                <Palette size={24} />
              </span>
              <div>
                <small>COLOR MATE</small>
                <strong>교사용 관리센터</strong>
              </div>
            </div>
            <div className="teacher-head__links">
              <Link className="btn btn--neutral" to="/">
                <ArrowLeft size={17} aria-hidden="true" />
                학생 화면
              </Link>
              <Link className="btn btn--neutral" to="/settings">
                <Settings size={17} aria-hidden="true" />
                AI 설정
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="page__body">
        <div className="shell">
          <div className="stack stack--lg">
            <section className="code-hero">
              <div>
                <span className="eyebrow">CLASS CODE</span>
                <p className="code-hero__code">{latest?.code ?? '수업코드를 만들어 주세요'}</p>
                <p className="lead">
                  {latest ? `${latest.school} · ${latest.label}` : '학교 · 반 · 회차별로 코드를 따로 만들어 운영할 수 있어요.'}
                </p>
              </div>
              {latest ? (
                <button className="btn btn--secondary btn--lg" type="button" onClick={() => copyCode(latest.code)}>
                  <Copy size={18} aria-hidden="true" />
                  {copiedCode === latest.code ? '복사했어요' : '수업코드 복사'}
                </button>
              ) : null}
            </section>

            <div className="teacher-columns">
              <section className="panel">
                <div className="panel__head">
                  <div>
                    <span className="eyebrow">NEW CLASS</span>
                    <h2 style={{ marginTop: 4 }}>새 수업코드 만들기</h2>
                  </div>
                </div>
                <form className="class-form" onSubmit={createSession}>
                  <label className="field">
                    <span>학교 / 기관명</span>
                    <input
                      value={school}
                      onChange={(event) => setSchool(event.target.value)}
                      placeholder="예: 광주○○초등학교"
                      required
                      maxLength={40}
                    />
                  </label>
                  <label className="field">
                    <span>반 / 회차 / 수업명</span>
                    <input
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder="예: 5학년 1반 · 1회차"
                      maxLength={40}
                    />
                  </label>
                  <button className="btn btn--primary btn--lg btn--block" type="submit">
                    <Plus size={19} aria-hidden="true" />새 수업코드 만들기
                  </button>
                </form>
                <p className="note note--neutral" style={{ marginTop: 18 }}>
                  <Database size={18} aria-hidden="true" />
                  <span>
                    <strong>이 브라우저에만 저장됩니다</strong>
                    수업코드는 현재 기기의 저장소(localStorage)에 보관돼요. 다른 기기에서는 보이지 않으니 코드를 따로 적어 두세요.
                    저장 방식은 나중에 서버 저장으로 바꿀 수 있도록 분리해 두었습니다.
                  </span>
                </p>
              </section>

              <section className="panel">
                <div className="panel__head">
                  <div>
                    <span className="eyebrow">SAVED</span>
                    <h2 style={{ marginTop: 4 }}>만든 수업코드 {sessions.length}개</h2>
                  </div>
                </div>
                {sessions.length === 0 ? (
                  <p className="muted">아직 만든 수업이 없습니다. 왼쪽에서 학교와 회차를 입력해 첫 코드를 만들어 보세요.</p>
                ) : (
                  <div className="class-list">
                    {sessions.map((item) => (
                      <article className="class-row" key={item.id}>
                        <div>
                          <p className="class-row__meta">{item.school}</p>
                          <p className="class-row__code">{item.code}</p>
                          <p className="class-row__meta">{item.label}</p>
                        </div>
                        <div className="class-row__actions">
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => copyCode(item.code)}
                            aria-label={`${item.code} 복사`}
                          >
                            <Copy size={17} aria-hidden="true" />
                          </button>
                          <button
                            className="icon-btn"
                            type="button"
                            onClick={() => removeSession(item.id)}
                            aria-label={`${item.code} 삭제`}
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="stack">
              <div>
                <span className="eyebrow">CLASS FLOW</span>
                <h2 style={{ marginTop: 4 }}>수업 흐름</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  교사가 학생의 퍼스널컬러를 미리 등록하지 않습니다. 학생이 직접 예상하고, 드레이핑으로 확인한 뒤 확정합니다.
                </p>
              </div>
              <div className="flow-grid">
                {FLOW.map((item) => (
                  <article className="flow-card" key={item.step}>
                    <b>{item.step}</b>
                    <strong>{item.title}</strong>
                    <small>{item.copy}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="note">
              <Sparkles size={20} aria-hidden="true" />
              <span>
                <strong>AI 비용 원칙</strong>
                퍼스널컬러 탐색 · 메이크업 · 의상 · 신발 선택은 모두 무료이고, 마지막 &lsquo;AI로 내 스타일 완성하기&rsquo;에서만
                OpenAI 이미지 API를 학생당 1회 사용합니다.
              </span>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
