import { ArrowRight, Palette } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { JourneyOutline } from '../components/JourneyBar'

interface EntryScreenProps {
  classCode: string
  name: string
  onStart: (classCode: string, name: string) => void
}

const ROLES = ['퍼스널컬러 컨설턴트', '메이크업 아티스트', '패션 스타일리스트']

export function EntryScreen({ classCode, name, onStart }: EntryScreenProps) {
  const [code, setCode] = useState(classCode)
  const [studentName, setStudentName] = useState(name)
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = studentName.trim()
    if (!/^[A-Z0-9-]{4,12}$/.test(trimmedCode)) {
      setError('선생님이 알려준 수업 코드를 정확히 입력해 주세요.')
      return
    }
    if (trimmedName.length < 2) {
      setError('이름을 두 글자 이상 입력해 주세요.')
      return
    }
    setError('')
    onStart(trimmedCode, trimmedName)
  }

  return (
    <div className="page page--tinted">
      <main className="page__body">
        <div className="shell">
          <div className="entry">
            <section className="entry__intro">
              <div className="entry__brand">
                <span className="entry__mark" aria-hidden="true">
                  <Palette size={28} />
                </span>
                <div>
                  <span className="eyebrow">12-TYPE PERSONAL COLOR CLASS</span>
                  <strong style={{ fontSize: 'var(--fs-lead)' }}>컬러메이트</strong>
                </div>
              </div>
              <h1>오늘은 내가 컬러 전문가</h1>
              <p className="lead">
                퍼스널컬러를 직접 찾아보고, 내 사진에 메이크업을 디자인하고, 어울리는 옷까지 골라 하나의 스타일을 완성하는 진로체험
                활동이에요.
              </p>
              <div className="entry__roles">
                {ROLES.map((role) => (
                  <span className="tag" key={role}>
                    {role}
                  </span>
                ))}
              </div>
              <div className="entry__flow only-desktop">
                <strong>오늘의 활동 순서</strong>
                <JourneyOutline current="entry" />
              </div>
            </section>

            <section className="panel">
              <div className="stack">
                <div>
                  <span className="eyebrow">START</span>
                  <h2 style={{ marginTop: 4 }}>수업에 입장하기</h2>
                  <p className="muted" style={{ marginTop: 6 }}>
                    선생님이 알려준 수업 코드와 내 이름을 입력하면 활동이 시작돼요.
                  </p>
                </div>

                <form className="entry__form" onSubmit={submit} noValidate>
                  <label className="field">
                    <span>수업 코드</span>
                    <input
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value)
                        setError('')
                      }}
                      placeholder="예: ABC482"
                      autoComplete="off"
                      inputMode="text"
                      maxLength={12}
                    />
                  </label>
                  <label className="field">
                    <span>학생 이름</span>
                    <input
                      value={studentName}
                      onChange={(event) => {
                        setStudentName(event.target.value)
                        setError('')
                      }}
                      placeholder="예: 김하늘"
                      autoComplete="off"
                      maxLength={20}
                    />
                  </label>
                  <p className="field__help">
                    사전 예상 → 선생님과 실제 드레이핑 → 12타입 확정 순서로 진행해요. 예상과 결과가 달라도 괜찮아요.
                  </p>
                  {error ? (
                    <p className="alert" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button className="btn btn--primary btn--lg btn--block" type="submit">
                    활동 시작하기
                    <ArrowRight size={20} aria-hidden="true" />
                  </button>
                </form>

                <Link className="btn btn--quiet" to="/expert">
                  교사용 관리 화면
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
