import { ArrowLeft, Check, Plus, Settings, Trash2, UserCog, UserRound } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { TONE_PALETTES, toneLabel } from '../data'
import { createActivityCode, loadStudents, saveStudents } from '../store'
import type { Student, Tone } from '../types'
import { PaletteStrip } from './PaletteStrip'

export function ExpertApp() {
  const [students, setStudents] = useState<Student[]>(() => loadStudents())
  const [name, setName] = useState('')
  const [tone, setTone] = useState<Tone>('warm')
  const [palette, setPalette] = useState<string[]>(TONE_PALETTES.warm)
  const [formError, setFormError] = useState('')

  const changeTone = (nextTone: Tone) => {
    setTone(nextTone)
    setPalette(TONE_PALETTES[nextTone])
  }

  const addStudent = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    if (students.some((student) => student.name.toLocaleLowerCase('ko-KR') === name.trim().toLocaleLowerCase('ko-KR'))) {
      setFormError('같은 이름의 학생이 이미 등록되어 있어요.')
      return
    }
    const nextStudent: Student = {
      id: crypto.randomUUID(),
      name: name.trim(),
      code: createActivityCode(students),
      tone,
      palette,
      completed: [],
      createdAt: new Date().toISOString(),
    }
    const nextStudents = [nextStudent, ...students]
    setStudents(nextStudents)
    saveStudents(nextStudents)
    setName('')
    setFormError('')
  }

  const removeStudent = (id: string) => {
    const nextStudents = students.filter((student) => student.id !== id)
    setStudents(nextStudents)
    saveStudents(nextStudents)
  }

  return (
    <main className="expert-page">
      <header className="expert-header">
        <div className="expert-header-inner">
          <Link className="expert-back" to="/"><ArrowLeft size={20} />학생 화면</Link>
          <div className="expert-brand"><span><UserCog size={25} /></span><div><small>COLOR MATE</small><strong>전문가 관리</strong></div></div>
          <div className="expert-header-actions"><div className="expert-count"><b>{students.length}</b><span>등록 학생</span></div><Link className="expert-settings" to="/settings"><Settings size={17} />AI 설정</Link></div>
        </div>
      </header>

      <div className="expert-layout">
        <section className="expert-panel add-student-panel">
          <div className="expert-section-title"><span><Plus size={20} /></span><div><h1>학생 추가</h1><p>진단 결과와 추천 색을 지정해 주세요.</p></div></div>
          <form onSubmit={addStudent}>
            <label>학생 이름<input value={name} onChange={(event) => { setName(event.target.value); setFormError('') }} placeholder="예: 김하늘" required /></label>
            {formError ? <p className="form-error" role="alert">{formError}</p> : null}
            <fieldset>
              <legend>퍼스널컬러</legend>
              <div className="tone-options">
                <button type="button" className={`tone-option warm ${tone === 'warm' ? 'selected' : ''}`} onClick={() => changeTone('warm')}><span>☀</span><div><strong>웜톤</strong><small>코랄 · 살구 · 카멜</small></div>{tone === 'warm' ? <Check size={18} /> : null}</button>
                <button type="button" className={`tone-option cool ${tone === 'cool' ? 'selected' : ''}`} onClick={() => changeTone('cool')}><span>❄</span><div><strong>쿨톤</strong><small>라벤더 · 핑크 · 블루</small></div>{tone === 'cool' ? <Check size={18} /> : null}</button>
              </div>
            </fieldset>
            <fieldset>
              <legend>추천 색상 5개</legend>
              <div className="color-inputs">
                {palette.map((color, index) => <label key={index} style={{ background: color }} aria-label={`${index + 1}번째 추천 색상`}><input type="color" value={color} onChange={(event) => setPalette((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}
              </div>
              <PaletteStrip colors={palette} />
            </fieldset>
            <button className="primary-button" type="submit"><Plus size={20} />학생 추가하기</button>
          </form>
          <p className="privacy-footnote">얼굴 사진은 이 관리 화면이나 로컬 저장소에 저장되지 않습니다.</p>
        </section>

        <section className="expert-panel student-list-panel">
          <div className="expert-section-title"><span><UserRound size={20} /></span><div><h2>학생 활동 현황</h2><p>이 브라우저에 저장된 프로토타입 데이터입니다.</p></div></div>
          <div className="student-table" role="list">
            {students.length === 0 ? <div className="empty-students"><UserRound size={32} /><p>아직 등록된 학생이 없어요.</p></div> : students.map((student) => {
              const progress = Math.round((new Set(student.completed).size / 5) * 100)
              return (
                <article className="student-row" role="listitem" key={student.id}>
                  <div className="student-avatar" style={{ background: student.palette[0] }}>{student.name.slice(-1)}</div>
                  <div className="student-main">
                    <div className="student-line"><strong>{student.name}</strong><span className={`tone-pill ${student.tone}`}>{toneLabel(student.tone)}</span></div>
                    <small className="name-login-note">학생 이름으로 바로 입장</small>
                    <div className="student-progress"><span><i style={{ width: `${progress}%` }} /></span><b>{progress}%</b></div>
                  </div>
                  <button className="delete-button" type="button" onClick={() => removeStudent(student.id)} aria-label={`${student.name} 삭제`}><Trash2 size={18} /></button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
