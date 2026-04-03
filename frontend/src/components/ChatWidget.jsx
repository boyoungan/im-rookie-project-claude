import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store.js'

const BACKEND = 'http://localhost:8000'

const CHAR_MAP = {
  IT:         '/단디1.jpg',
  Sales:      '/단디2.jpg',
  HR:         '/똑디1.jpg',
  Compliance: '/똑디2.jpg',
  Marketing:  '/우디1.jpg',
  Strategy:   '/단디1.jpg',
}

// /로 시작할 때 보여줄 서무 기능 목록
const COMMANDS = [
  { cmd: '/비품신청',    desc: 'A4용지·커피 등 소모품 자동 발주',      fill: 'A4용지 주문해줘' },
  { cmd: '/회의실예약',  desc: '빈 회의실 조회 및 예약',              fill: '/회의실예약 내일 오후 2시 소회의실' },
  { cmd: '/주간보고',    desc: '이번 주 업무 요약 보고서 초안 생성',   fill: '/주간보고' },
  { cmd: '/결재상신',    desc: '기안 문서 결재라인 자동 상신',          fill: '/결재상신' },
  { cmd: '/출장신청',    desc: '출장 일정·경비 신청서 작성',            fill: '/출장신청 부산 5월 2일~3일' },
  { cmd: '/법인카드',    desc: '법인카드 사용 내역 조회',               fill: '/법인카드' },
]

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function containsFuzzy(text, keyword, maxDist) {
  const t = text.toLowerCase().replace(/\s/g, '')
  const k = keyword.toLowerCase().replace(/\s/g, '')
  if (t.includes(k)) return true
  const len = k.length
  for (let i = 0; i <= t.length - len; i++) {
    if (levenshtein(t.slice(i, i + len), k) <= maxDist) return true
  }
  return false
}

function isMROIntent(text) {
  const hasItem = containsFuzzy(text, 'a4용지', 2) || containsFuzzy(text, 'a4', 1)
  const hasAction = /주문|신청|구매|사줘|사와|올려|기안|발주|구해/.test(text)
  return hasItem && hasAction
}

export default function ChatWidget() {
  const navigate = useNavigate()
  const { department, xp, level } = useStore()
  const charImg = CHAR_MAP[department] || '/단디1.jpg'
  const [messages, setMessages] = useState([
    { id: 0, from: 'bot', text: `안녕하세요! 저는 iM 루키입니다 😊 무엇을 도와드릴까요?\n/ 를 입력하면 이용 가능한 서무 기능을 확인할 수 있어요!` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (msg) =>
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), ...msg }])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)
    if (val === '/') {
      setSuggestions(COMMANDS)
    } else if (val.startsWith('/') && val.length > 1) {
      const q = val.slice(1).toLowerCase()
      setSuggestions(COMMANDS.filter(c =>
        c.cmd.slice(1).includes(q) || c.desc.includes(q)
      ))
    } else {
      setSuggestions([])
    }
  }

  const applySuggestion = (fill) => {
    setInput(fill)
    setSuggestions([])
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setSuggestions([])
    addMessage({ from: 'user', text })
    setInput('')

    // 슬래시 커맨드 처리
    if (text.startsWith('/주간보고')) {
      addMessage({ from: 'bot', text: '📝 이번 주 업무 보고서 초안을 작성 중입니다...' })
      setTimeout(() => {
        addMessage({ from: 'bot', text: `【${department} 주간업무보고】\n\n▸ 진행 업무: (내용 입력 필요)\n▸ 완료 업무: (내용 입력 필요)\n▸ 차주 계획: (내용 입력 필요)\n▸ 이슈·건의: (없음)\n\n초안이 생성되었습니다. 내용을 수정 후 결재 상신하세요!` })
      }, 800)
      return
    }
    if (text.startsWith('/결재상신')) {
      addMessage({ from: 'bot', text: '📋 결재라인을 확인 중입니다... 팀장 → 부장 → 임원 순으로 상신합니다. 비품 신청 기능을 이용해 자동 상신을 시작하세요!' })
      return
    }
    if (text.startsWith('/회의실예약')) {
      const detail = text.replace('/회의실예약', '').trim()
      addMessage({ from: 'bot', text: `🏢 회의실 예약 요청을 접수했습니다.\n${detail ? `▸ 일시/장소: ${detail}` : '▸ 날짜와 시간을 함께 입력해주세요 (예: /회의실예약 내일 오후 2시 소회의실)'}\n\n* 현재 데모 버전에서는 실제 예약 연동이 지원되지 않습니다.` })
      return
    }
    if (text.startsWith('/출장신청')) {
      const detail = text.replace('/출장신청', '').trim()
      addMessage({ from: 'bot', text: `✈️ 출장 신청서를 작성 중입니다.\n${detail ? `▸ 일정: ${detail}` : '▸ 목적지와 일정을 함께 입력해주세요'}\n\n* 현재 데모 버전에서는 실제 신청 연동이 지원되지 않습니다.` })
      return
    }
    if (text.startsWith('/법인카드')) {
      addMessage({ from: 'bot', text: '💳 법인카드 사용 내역을 조회 중입니다...\n\n* 현재 데모 버전에서는 실제 카드 내역 조회가 지원되지 않습니다.' })
      return
    }
    if (text.startsWith('/비품신청')) {
      setInput('A4용지 주문해줘')
      return
    }

    if (isMROIntent(text)) {
      if (level < 2) {
        addMessage({ from: 'bot', text: '비품 신청은 레벨 2 달성 후 사용할 수 있어요! 퀴즈를 풀어 경험치를 쌓아보세요 📚' })
        return
      }
      setLoading(true)
      addMessage({ from: 'bot', text: '잠깐만요, 지금 바로 주문 처리할게요! 🤖', loading: true })
      try {
        const res = await fetch(`${BACKEND}/api/action/mro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_name: 'A4용지 박스', quantity: 1, user_name: '루키' }),
        })
        const data = await res.json()
        setMessages((prev) => prev.filter((m) => !m.loading))
        if (data.status === 'success') {
          addMessage({
            from: 'bot',
            text: '부장님, A4용지 기안 올려두었습니다!',
            screenshot: `${BACKEND}${data.screenshot_url}?t=${Date.now()}`,
          })
        } else {
          addMessage({ from: 'bot', text: `오류가 발생했어요: ${data.message}` })
        }
      } catch {
        setMessages((prev) => prev.filter((m) => !m.loading))
        addMessage({ from: 'bot', text: '서버 연결에 실패했어요. 백엔드가 실행 중인지 확인해주세요.' })
      } finally {
        setLoading(false)
      }
    } else {
      addMessage({ from: 'bot', text: '죄송해요, 아직 그 명령은 지원하지 않아요. "A4용지 주문해줘"를 입력해보세요!' })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setSuggestions([]); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleHide = () => {
    if (window.electronAPI) window.electronAPI.hideToTray()
  }

  const mroUnlocked = level >= 2

  return (
    <div className="widget">
      {/* 헤더 */}
      <div className="widget-header">
        <img src={charImg} alt="캐릭터" className="avatar-img" />
        <div className="header-info">
          <span className="header-name">iM 루키 / {department || '?'} 부서</span>
        </div>
        <button className="hide-btn" onClick={handleHide} title="트레이로 숨기기">—</button>
      </div>

      {/* XP 바 */}
      <div className="xp-bar-wrap">
        <div className="xp-label">
          <span>Lv.{level}</span>
          <span>경험치 {xp} / 100</span>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${xp}%` }} />
        </div>
      </div>

      {/* 채팅 */}
      <div className="chat-body">
        {messages.map((msg) => (
          <div key={msg.id} className={`bubble-wrap ${msg.from}`}>
            {msg.from === 'bot' && <div className="bot-avatar">🤖</div>}
            <div className={`bubble ${msg.from} ${msg.loading ? 'loading' : ''}`}>
              <p>{msg.text}</p>
              {msg.screenshot && (
                <div className="screenshot-wrap">
                  <img src={msg.screenshot} alt="MRO 결재 완료" className="screenshot"
                    onError={(e) => { e.target.style.display = 'none' }} />
                  <span className="screenshot-caption">📋 결재 상신 완료 화면</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* MRO 버튼 */}
      <button
        className={`mro-btn ${mroUnlocked ? 'unlocked' : 'locked'}`}
        onClick={() => mroUnlocked && setInput('A4용지 주문해줘')}
        disabled={!mroUnlocked}
        title={mroUnlocked ? 'MRO 비품 자동 신청' : '레벨 2 달성 시 활성화'}
      >
        {mroUnlocked ? '🔓 비품 자동 신청' : '🔒 레벨 2 달성 시 활성화'}
      </button>

      {/* 슬래시 커맨드 추천 */}
      {suggestions.length > 0 && (
        <div className="cmd-suggestions">
          {suggestions.map((s) => (
            <button key={s.cmd} className="cmd-item" onClick={() => applySuggestion(s.fill)}>
              <span className="cmd-name">{s.cmd}</span>
              <span className="cmd-desc">{s.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* 입력창 */}
      <div className="chat-input-wrap">
        <input
          className="chat-input"
          type="text"
          placeholder="업무 지시를 입력하세요... (/ 로 기능 목록)"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}
