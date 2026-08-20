import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StudentJourney } from './components/StudentJourney'
import { SettingsScreen } from './screens/SettingsScreen'
import { TeacherScreen } from './screens/TeacherScreen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/expert" element={<TeacherScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<StudentJourney />} />
      </Routes>
    </BrowserRouter>
  )
}
