import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ExpertApp } from './components/ExpertApp'
import { StudentApp } from './components/StudentApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/expert" element={<ExpertApp />} />
        <Route path="*" element={<StudentApp />} />
      </Routes>
    </BrowserRouter>
  )
}

