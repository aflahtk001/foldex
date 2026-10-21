import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import {
  createMainWindow,
  createPopupWindow,
  showPopupWindowNearCursor,
  getMainWindow,
  getPopupWindow
} from './windows/windowManager';
import { loadSettings, saveSettings } from './services/settingsStore';
import { loadHistory, clearHistory } from './services/historyStore';
import { getSelectedExplorerFiles, inspectFiles } from './services/explorerIntegration';
import { registerAppShortcuts, unregisterAllShortcuts } from './services/shortcuts';
import { registerContextMenu, unregisterContextMenu, isContextMenuEnabled } from './services/contextMenu';
import { TaskProcessor } from './services/taskProcessor';
import { FileItem } from '../shared/types';

let tray: Tray | null = null;
const taskProcessor = new TaskProcessor();
(app as any).isQuitting = false;

// Cached state for instant popup initialization
let latestPopupState: { files: FileItem[]; mode: 'convert' | 'compress' } = {
  files: [],
  mode: 'compress',
};

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', async (_event, commandLine) => {
    // Check if a file path was passed in commandLine (e.g., from context menu)
    const fileArgs = commandLine.slice(app.isPackaged ? 1 : 2).filter(arg => !arg.startsWith('--'));
    if (fileArgs.length > 0) {
      const files = await inspectFiles(fileArgs);
      latestPopupState = { files, mode: 'convert' };
      const popup = showPopupWindowNearCursor('convert');
      if (popup.webContents.isLoading()) {
        popup.webContents.once('did-finish-load', () => {
          popup.webContents.send('popup:openedWithFiles', files, 'convert');
        });
      } else {
        popup.webContents.send('popup:openedWithFiles', files, 'convert');
      }
    } else {
      const main = createMainWindow();
      if (main.isMinimized()) main.restore();
      main.focus();
    }
  });

  app.whenReady().then(async () => {
    const settings = loadSettings();

    // Check command line args on initial launch
    const initialFiles = process.argv.slice(app.isPackaged ? 1 : 2).filter(arg => !arg.startsWith('--'));

    // Create tray icon
    createTrayIcon();

    // Register context menu if enabled
    if (settings.contextMenuEnabled) {
      registerContextMenu().catch(console.error);
    }

    // Register shortcuts: Shift+C for Compress, Shift+V for Convert
    registerShortcutsFromSettings(settings);

    // Initial window
    if (initialFiles.length > 0) {
      const files = await inspectFiles(initialFiles);
      latestPopupState = { files, mode: 'convert' };
      const popup = showPopupWindowNearCursor('convert');
      if (popup.webContents.isLoading()) {
        popup.webContents.once('did-finish-load', () => {
          popup.webContents.send('popup:openedWithFiles', files, 'convert');
        });
      } else {
        popup.webContents.send('popup:openedWithFiles', files, 'convert');
      }
    } else {
      createMainWindow();
    }

    setupIpcHandlers();
  });
}

function registerShortcutsFromSettings(settings: any) {
  const compressKey = settings.compressShortcut || 'Shift+C';
  const convertKey = settings.convertShortcut || 'Shift+V';

  registerAppShortcuts(
    compressKey,
    () => handleShortcutTrigger('compress'),
    convertKey,
    () => handleShortcutTrigger('convert')
  );
}

async function createTrayIcon() {
  try {
    const candidates = [
      path.join(app.getAppPath(), 'resources/icon.png'),
      path.join(__dirname, '../../resources/icon.png'),
      path.join(process.resourcesPath, 'icon.png'),
    ];

    let iconBuffer: Buffer | null = null;
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        iconBuffer = await sharp(cand)
          .resize(32, 32, { fit: 'contain' })
          .png()
          .toBuffer();
        break;
      }
    }

    if (!iconBuffer) {
      iconBuffer = await sharp({
        create: {
          width: 32,
          height: 32,
          channels: 4,
          background: { r: 156, g: 127, b: 69, alpha: 1 },
        },
      })
        .png()
        .toBuffer();
    }

    const trayImage = nativeImage.createFromBuffer(iconBuffer);
    tray = new Tray(trayImage);
    tray.setToolTip('Foldex');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Foldex',
        click: () => {
          createMainWindow();
        },
      },
      {
        label: 'Quick Compress (Shift+C)',
        click: () => {
          handleShortcutTrigger('compress');
        },
      },
      {
        label: 'Quick Convert (Shift+V)',
        click: () => {
          handleShortcutTrigger('convert');
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      createMainWindow();
    });
  } catch (err) {
    console.error('Failed to create tray icon:', err);
  }
}

async function handleShortcutTrigger(mode: 'compress' | 'convert') {
  try {
    // 1. Get selected file(s) from Windows File Explorer
    const filePaths = await getSelectedExplorerFiles();
    const inspected = await inspectFiles(filePaths);

    // 2. Cache latest popup state so getPopupInitialState returns it synchronously on React mount
    latestPopupState = {
      files: inspected,
      mode,
    };

    // 3. Show popup window near cursor
    const popup = showPopupWindowNearCursor(mode);

    // 4. Send files directly
    const sendFiles = () => {
      if (!popup.isDestroyed()) {
        popup.webContents.send('popup:openedWithFiles', inspected, mode);
      }
    };

    if (popup.webContents.isLoading()) {
      popup.webContents.once('did-finish-load', sendFiles);
    } else {
      sendFiles();
    }
  } catch (error) {
    console.error('Error handling shortcut trigger:', error);
    showPopupWindowNearCursor(mode);
  }
}

function setupIpcHandlers() {
  // Initial state for popup (ensures 100% reliable file delivery on mount)
  ipcMain.handle('popup:getInitialState', async () => {
    return latestPopupState;
  });

  // Explorer selection manual refresh
  ipcMain.handle('explorer:getSelectedFiles', async () => {
    const paths = await getSelectedExplorerFiles();
    return inspectFiles(paths);
  });

  // Pick files dialog
  ipcMain.handle('dialog:pickFiles', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win as any, {
      title: 'Select Files to Convert or Compress',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Supported Files (Images & PDF)',
          extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'pdf'],
        },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'] },
        { name: 'PDF Documents', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }
    return inspectFiles(result.filePaths);
  });

  // Pick folder dialog
  ipcMain.handle('dialog:pickFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win as any, {
      title: 'Select Destination Folder',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Inspect files
  ipcMain.handle('files:inspect', async (_event, paths: string[]) => {
    return inspectFiles(paths);
  });

  // Task execution
  ipcMain.handle('task:convert', async (event, files, outputSettings, options) => {
    const win = BrowserWindow.fromWebContents(event.sender) || undefined;
    return taskProcessor.executeConvert(files, outputSettings, options, win);
  });

  ipcMain.handle('task:compress', async (event, files, outputSettings, options) => {
    const win = BrowserWindow.fromWebContents(event.sender) || undefined;
    return taskProcessor.executeCompress(files, outputSettings, options, win);
  });

  ipcMain.handle('task:cancel', async () => {
    taskProcessor.cancelActiveTask();
  });

  // Shell actions
  ipcMain.handle('shell:openPath', async (_event, filePath: string) => {
    return shell.openPath(filePath);
  });

  ipcMain.handle('shell:showItemInFolder', async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return loadSettings();
  });

  ipcMain.handle('settings:save', async (_event, newSettings) => {
    const saved = saveSettings(newSettings);
    registerShortcutsFromSettings(saved);

    if (typeof newSettings.contextMenuEnabled === 'boolean') {
      if (newSettings.contextMenuEnabled) {
        registerContextMenu().catch(console.error);
      } else {
        unregisterContextMenu().catch(console.error);
      }
    }
    return saved;
  });

  ipcMain.handle('settings:setContextMenu', async (_event, enabled: boolean) => {
    if (enabled) {
      return registerContextMenu();
    } else {
      return unregisterContextMenu();
    }
  });

  // History
  ipcMain.handle('history:get', async () => {
    return loadHistory();
  });

  ipcMain.handle('history:clear', async () => {
    clearHistory();
  });

  // Window controls
  ipcMain.handle('window:openMain', async () => {
    const main = createMainWindow();
    main.show();
    main.focus();
  });

  ipcMain.handle('window:closePopup', async () => {
    const popup = getPopupWindow();
    if (popup && !popup.isDestroyed()) {
      popup.hide();
    }
  });

  ipcMain.handle('window:minimize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.handle('window:maximize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('window:close', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });
}

app.on('will-quit', () => {
  unregisterAllShortcuts();
});

app.on('window-all-closed', () => {
  const settings = loadSettings();
  if (!settings.minimizeToTray) {
    app.quit();
  }
});
