import { ArrowLeft, KeyRound, LockKeyhole, MonitorSmartphone, Palette, Settings, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

export const CLASS_CODE = 'COLOR26'
const TEACHER_PIN = '3035'

export function ExpertApp() {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')

  const unlock = (event: FormEvent) => {
    event.preventDefault()
    if (pin !== TEACHER_PIN) {
      setError('교사용 비밀번호가 올바르지 않습니다.')
      return
    }
    setError('')
    setUnlocked(true)
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
            <label>비밀번호<input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(event) => { setPin(event.target.value); setError('') }} placeholder="3035" autoFocus /></label>
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
          <small>TODAY'S CLASS CODE</small>
          <h1>{CLASS_CODE}</h1>
          <p>학생은 첫 화면에서 이 수업코드와 자기 이름을 입력하고 시작합니다.</p>
        </section>

        <section className="teacher-flow-card">
          <div className="expert-section-title"><span><MonitorSmartphone size={20} /></span><div><h2>오늘 수업 흐름</h2><p>교사가 학생 톤을 미리 입력하지 않습니다.</p></div></div>
          <div className="teacher-flow-grid">
            <div><b>1</b><strong>학생 입장</strong><small>{CLASS_CODE} + 이름</small></div>
            <div><b>2</b><strong>내 톤 예상</strong><small>웹앱 4문항</small></div>
            <div><b>3</b><strong>실물 체험</strong><small>선생님과 컬러천 비교</small></div>
            <div><b>4</b><strong>내 톤 확정</strong><small>웜톤 / 쿨톤</small></div>
            <div><b>5</b><strong>메이크업</strong><small>무료 실시간 미리보기</small></div>
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
