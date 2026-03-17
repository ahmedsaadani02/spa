const { BrowserWindow, app } = require('electron');
const path = require('path');
const fs = require('fs');

const resolveWindowIconPath = () => {
  const runtimeIcon = path.join(__dirname, '..', 'assets', 'icon.ico');
  const devFallbackIcon = path.join(__dirname, '..', '..', 'build', 'icon.ico');

  if (fs.existsSync(runtimeIcon)) {
    return runtimeIcon;
  }

  if (fs.existsSync(devFallbackIcon)) {
    return devFallbackIcon;
  }

  return undefined;
};

const createMainWindow = () => {
  const iconPath = resolveWindowIconPath();
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'preload.js')
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  return mainWindow;
};

module.exports = { createMainWindow };
