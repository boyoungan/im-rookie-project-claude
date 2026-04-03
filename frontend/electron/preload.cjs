const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  hideToTray:       () => ipcRenderer.send('hide-to-tray'),
  enterScreensaver: () => ipcRenderer.send('enter-screensaver'),
  exitScreensaver:  () => ipcRenderer.send('exit-screensaver'),

  // F8 단축키 — Electron → React 라우트 이동 요청
  onGoScreensaver: (cb) => ipcRenderer.on('go-screensaver', cb),
  offGoScreensaver: () => ipcRenderer.removeAllListeners('go-screensaver'),
})
