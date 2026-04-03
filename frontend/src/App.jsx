import { useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import SelectionScreen from './components/SelectionScreen.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import ScreensaverQuiz from './components/ScreensaverQuiz.jsx'
import useStore from './store.js'
import './App.css'

const IDLE_MS = 10 * 60 * 1000  // 10분

function IdleWatcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const timer = useRef(null)

  const reset = () => {
    clearTimeout(timer.current)
    if (location.pathname === '/tray') {
      timer.current = setTimeout(() => {
        navigate('/screensaver')                              // 라우트 먼저
        if (window.electronAPI) {
          setTimeout(() => window.electronAPI.enterScreensaver(), 100) // 100ms 후 전체화면
        }
      }, IDLE_MS)
    }
  }

  useEffect(() => {
    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('keydown', reset)
    window.addEventListener('mousedown', reset)
    return () => {
      clearTimeout(timer.current)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('mousedown', reset)
    }
  }, [location.pathname])

  // F8 단축키 IPC 수신
  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.onGoScreensaver(() => navigate('/screensaver'))
    return () => window.electronAPI.offGoScreensaver()
  }, [])

  return null
}

// 부서 선택 완료 후 `/`로 돌아오면 `/tray`로 리다이렉트
function GuardedSelection() {
  const locked = useStore((s) => s.departmentLocked)
  return locked ? <Navigate to="/tray" replace /> : <SelectionScreen />
}

function AppRoutes() {
  return (
    <>
      <IdleWatcher />
      <Routes>
        <Route path="/" element={<GuardedSelection />} />
        <Route path="/tray" element={<ChatWidget />} />
        <Route path="/screensaver" element={<ScreensaverQuiz />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
