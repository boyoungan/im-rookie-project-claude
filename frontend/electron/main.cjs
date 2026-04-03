const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, screen } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged
const VITE_URL = 'http://localhost:5174'

const WIDGET_W = 420
const WIDGET_H = 650

let mainWindow = null
let tray = null

// ── 위치 저장/복원 ──────────────────────────────
function getPosFile() {
  return path.join(app.getPath('userData'), 'window-pos.json')
}

function loadPos() {
  try {
    const data = JSON.parse(fs.readFileSync(getPosFile(), 'utf8'))
    // 저장된 위치가 현재 화면 범위 안에 있는지 검증
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
    if (data.x >= 0 && data.y >= 0 && data.x + WIDGET_W <= sw + 200 && data.y + WIDGET_H <= sh + 200) {
      return { x: data.x, y: data.y }
    }
  } catch {}
  // 기본값: 화면 우하단
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  return { x: sw - WIDGET_W - 20, y: sh - WIDGET_H - 20 }
}

function savePos() {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  fs.writeFileSync(getPosFile(), JSON.stringify({ x, y }), 'utf8')
}
// ────────────────────────────────────────────────

function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    show: false,   // 콘텐츠 로드 전 숨김 → 깜빡임 방지
    resizable: true,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(VITE_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 콘텐츠 로드 완료 후 전체화면으로 표시 — 깜빡임 없음
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('moved', savePos)
  mainWindow.on('closed', () => { mainWindow = null })
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADUSURBVDiNpZMxDoIwFIY/SuJgYmJiYmJiYqLEweQR3HkBFhYWFhYWFhYuHsDkERxcXVxcXVxcXFxcXCbpg5S2QN/kJ23e1/f6XloAkPQC5mY2SZoAJ+AkqZN0BDYx7oE9cAUWwBq4hXkHNsBW0hbYS1oAH0kLYA18YnwEngHEuJf0lbQDnkDOeQDknAeQc56UUgJIKaWUUgIopZRSSgmglFJKKaUEUEoppZRSAiillFJKCaCUUkoppQBQSimllFICKKWUUkopAJRSSimllABKKaWUUgIopZRSKqUHkAMJCyvFWwAAAABJRU5ErkJggg=='
  )
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'iM 루키 열기', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ])

  tray.setToolTip('iM 루키 에이전트')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })
}

function enterFullscreen() {
  if (!mainWindow) return
  // 전체화면 진입 전 현재 위젯 위치를 저장 (moved 이벤트가 덮어쓰기 전에)
  savePos()
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds
  // moved 이벤트가 전체화면 좌표를 저장하지 않도록 일시 차단
  mainWindow.removeListener('moved', savePos)
  mainWindow.setBounds({ x, y, width, height })  // animate 없이 즉시 적용
  setTimeout(() => mainWindow && mainWindow.on('moved', savePos), 500)
}

function exitFullscreen() {
  if (!mainWindow) return
  const { x, y } = loadPos()  // 전체화면 진입 전 저장된 위젯 위치로 복원
  mainWindow.setBounds({ x, y, width: WIDGET_W, height: WIDGET_H }, true)
}

// IPC: idle 감지 후 전체화면
ipcMain.on('enter-screensaver', () => { enterFullscreen() })

// IPC: 화면보호기 종료
ipcMain.on('exit-screensaver', () => { exitFullscreen() })

// IPC: 트레이로 숨기기
ipcMain.on('hide-to-tray', () => { mainWindow?.hide() })

function registerShortcuts() {
  const f8ok = globalShortcut.register('F8', () => {
    if (!mainWindow) return
    // 라우트 먼저 → 퀴즈 화면으로 전환 후 전체화면 적용
    mainWindow.webContents.send('go-screensaver')
    setTimeout(() => enterFullscreen(), 100)
  })
  console.log('[단축키] F8', f8ok ? '등록 성공' : '등록 실패')
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  registerShortcuts()
})

app.on('window-all-closed', () => {
  // 트레이 앱 — 창이 닫혀도 종료하지 않음
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})
