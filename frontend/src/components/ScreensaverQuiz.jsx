import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store.js'

const BACKEND = 'http://localhost:8000'
const XP_CORRECT = 35

// 백엔드 실패 시 폴백 목업 퀴즈
const FALLBACK_QUIZ = {
  question: 'IT 부서의 비밀번호 변경 주기는 얼마입니까?',
  options: ['30일', '60일', '90일', '180일'],
  answer: 2,
  explanation: '보안 정책에 따라 비밀번호는 90일마다 변경해야 합니다.',
}

export default function ScreensaverQuiz() {
  const navigate = useNavigate()
  const { department, addXP } = useStore()
  const [quiz, setQuiz] = useState(null)
  const [selected, setSelected] = useState(null)   // 선택한 보기 인덱스
  const [revealed, setRevealed] = useState(false)  // 정답 공개 여부
  const [xpAnim, setXpAnim] = useState(false)       // +XP 애니메이션
  const [loading, setLoading] = useState(true)

  const fetchQuiz = async () => {
    setLoading(true)
    setSelected(null)
    setRevealed(false)
    setXpAnim(false)
    try {
      const dept = department || 'IT'
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`${BACKEND}/api/quiz?department=${dept}`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.question) throw new Error('invalid response')
      setQuiz(data)
    } catch {
      setQuiz(FALLBACK_QUIZ)
    } finally {
      setLoading(false)
    }
  }

  // 화면 진입 시 1회만 호출
  useEffect(() => { fetchQuiz() }, [])

  // ESC 키로 화면보호기 종료
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') exitScreensaver()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const exitScreensaver = () => {
    navigate('/tray')
    if (window.electronAPI) window.electronAPI.exitScreensaver()
  }

  const handleSelect = (idx) => {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)

    if (idx === quiz.answer) {
      addXP(XP_CORRECT)
      setXpAnim(true)
      // 정답 시 2.5초 후 자동으로 위젯으로 복귀
      setTimeout(() => exitScreensaver(), 2500)
    }
  }

  const getOptionClass = (idx) => {
    if (!revealed) return 'option'
    if (idx === quiz.answer) return 'option correct'
    if (idx === selected) return 'option wrong'
    return 'option dim'
  }

  return (
    <div className="screensaver" onClick={(e) => e.target === e.currentTarget && exitScreensaver()}>
      <div className="screensaver-inner">
        {/* 나가기 버튼 */}
        <button className="ss-exit-btn" onClick={exitScreensaver}>✕ ESC</button>

        <div className="ss-badge">{department || 'IT'} 부서 업무 지식 퀴즈</div>

        {loading ? (
          <div className="ss-loading">퀴즈를 불러오는 중... ✨</div>
        ) : (
          <>
            <h2 className="ss-question">{quiz.question}</h2>

            <div className="ss-options">
              {quiz.options.map((opt, idx) => (
                <button key={idx} className={getOptionClass(idx)} onClick={() => handleSelect(idx)}>
                  <span className="option-num">{idx + 1}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>

            {revealed && (
              <div className={`ss-result ${selected === quiz.answer ? 'correct' : 'wrong'}`}>
                {selected === quiz.answer
                  ? `🎉 정답입니다! +${XP_CORRECT} 경험치`
                  : `😢 오답입니다.`}
                {selected === quiz.answer && (
                  <p className="ss-explanation">{quiz.explanation}</p>
                )}
                <p className="ss-explanation" style={{marginTop: '8px', opacity: 0.6}}>
                  ESC를 눌러 위젯으로 돌아가세요
                </p>
              </div>
            )}
          </>
        )}

        {/* +XP 애니메이션 */}
        {xpAnim && (
          <div className="xp-popup">+{XP_CORRECT} XP!</div>
        )}
      </div>
    </div>
  )
}
