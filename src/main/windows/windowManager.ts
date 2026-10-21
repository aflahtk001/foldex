import { BrowserWindow, screen, app } from 'electron';
import path from 'path';

import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let popupWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getPreloadPath(): string {
  const candidates = [
    path.join(__dirname, '../../preload/index.js'),
    path.join(__dirname, '../preload/index.js'),
    path.join(app.getAppPath(), 'dist-electron/preload/index.js'),
    path.join(app.getAppPath(), 'dist-electron/src/preload/index.js'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.join(app.getAppPath(), 'dist-electron/preload/index.js');
}

function getRendererHtmlPath(): string {
  const candidates = [
    path.join(app.getAppPath(), 'dist-renderer/index.html'),
    path.join(__dirname, '../../../dist-renderer/index.html'),
    path.join(__dirname, '../../dist-renderer/index.html'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.join(app.getAppPath(), 'dist-renderer/index.html');
}

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1060,
    height: 720,
    minWidth: 840,
    minHeight: 580,
    title: 'File Converter & Compressor',
    backgroundColor: '#FFFFFF',
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?mode=main`);
  } else {
    mainWindow.loadFile(getRendererHtmlPath(), {
      query: { mode: 'main' },
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    // If not quitting and minimizeToTray is enabled, hide instead of quit
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function createPopupWindow(initialMode: 'convert' | 'compress' = 'compress'): BrowserWindow {
  if (popupWindow && !popupWindow.isDestroyed()) {
    return popupWindow;
  }

  // Calculate position near cursor
  const cursor = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursor);
  const width = 450;
  const height = 580;

  // Position near cursor, but keep inside workArea
  let x = cursor.x + 20;
  let y = cursor.y + 20;
  const workArea = currentDisplay.workArea;

  if (x + width > workArea.x + workArea.width) {
    x = Math.max(workArea.x, cursor.x - width - 20);
  }
  if (y + height > workArea.y + workArea.height) {
    y = Math.max(workArea.y, cursor.y - height - 20);
  }

  popupWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#FFFFFF',
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    popupWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}?mode=popup&tab=${initialMode}`);
  } else {
    popupWindow.loadFile(getRendererHtmlPath(), {
      query: { mode: 'popup', tab: initialMode },
    });
  }

  popupWindow.on('closed', () => {
    popupWindow = null;
  });

  return popupWindow;
}

export function showPopupWindowNearCursor(initialMode: 'convert' | 'compress' = 'compress'): BrowserWindow {
  const cursor = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursor);
  const width = 450;
  const height = 580;
  const workArea = currentDisplay.workArea;

  let x = cursor.x + 20;
  let y = cursor.y + 20;

  if (x + width > workArea.x + workArea.width) {
    x = Math.max(workArea.x, cursor.x - width - 20);
  }
  if (y + height > workArea.y + workArea.height) {
    y = Math.max(workArea.y, cursor.y - height - 20);
  }

  const win = createPopupWindow(initialMode);
  win.setPosition(x, y);
  win.show();
  win.focus();
  return win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function getPopupWindow(): BrowserWindow | null {
  return popupWindow;
}
