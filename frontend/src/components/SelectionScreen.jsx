import { useNavigate } from 'react-router-dom'
import useStore from '../store.js'

// 부서 → 캐릭터 매핑
const CHAR_MAP = {
  IT:         { name: '단디', img: '/단디1.jpg' },
  Sales:      { name: '단디', img: '/단디2.jpg' },
  HR:         { name: '똑디', img: '/똑디1.jpg' },
  Compliance: { name: '똑디', img: '/똑디2.jpg' },
  Marketing:  { name: '우디', img: '/우디1.jpg' },
  Strategy:   { name: '단디', img: '/단디1.jpg' },
}

const DEPARTMENTS = [
  { id: 'IT',         label: 'IT기획부',   color: '#6366f1' },
  { id: 'Sales',      label: '영업점',     color: '#10b981' },
  { id: 'Compliance', label: '준법감시부',  color: '#f59e0b' },
  { id: 'HR',         label: '인사부',     color: '#ec4899' },
  { id: 'Marketing',  label: '홍보부',     color: '#8b5cf6' },
  { id: 'Strategy',   label: '전략기획부',  color: '#0ea5e9' },
]

export default function SelectionScreen() {
  const navigate = useNavigate()
  const setDepartment = useStore((s) => s.setDepartment)

  const handleSelect = (dept) => {
    setDepartment(dept.id)
    navigate('/tray')
    // 부서 선택 시 전체화면 해제 → 위젯 크기로 복원
    if (window.electronAPI) window.electronAPI.exitScreensaver()
  }

  return (
    <div className="selection-screen">
      <div className="selection-inner">
        <div className="selection-header">
          <h1 className="selection-title">iM 루키</h1>
          <p className="selection-sub">부서를 선택하면 맞춤형 AI 서무 에이전트가 시작됩니다</p>
        </div>

        <div className="dept-grid">
          {DEPARTMENTS.map((dept) => {
            const char = CHAR_MAP[dept.id]
            return (
              <button
                key={dept.id}
                className="dept-card"
                style={{ '--accent': dept.color }}
                onClick={() => handleSelect(dept)}
              >
                <img src={char.img} alt={char.name} className="dept-char-img" />
                <div className="dept-card-info">
                  <span className="dept-char-name">iM 루키 / {dept.label}</span>
                  <span className="dept-label">{dept.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
