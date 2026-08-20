import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ExpertApp } from './components/ExpertApp'
import { SettingsApp } from './components/SettingsApp'
import { StudentJourney } from './components/StudentJourney'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/expert" element={<ExpertApp />} />
        <Route path="/settings" element={<SettingsApp />} />
        <Route path="*" element={<StudentJourney />} />
      </Routes>
    </BrowserRouter>
  )
}
