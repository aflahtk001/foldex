import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { app } from 'electron';

const execAsync = promisify(exec);

const REG_KEY_ALL = 'HKCU\\Software\\Classes\\*\\shell\\ConvertCompress';
const REG_KEY_DIR = 'HKCU\\Software\\Classes\\Directory\\shell\\ConvertCompress';

export async function isContextMenuEnabled(): Promise<boolean> {
  try {
    await execAsync(`reg query "${REG_KEY_ALL}"`);
    return true;
  } catch {
    return false;
  }
}

export async function registerContextMenu(): Promise<boolean> {
  try {
    const exePath = app.getPath('exe');
    // For development vs production
    const commandValue = app.isPackaged
      ? `\\"${exePath}\\" \\"%1\\"`
      : `\\"${process.execPath}\\" \\"${app.getAppPath()}\\" \\"%1\\"`;

    const iconValue = exePath;

    // Register for all files
    await execAsync(`reg add "${REG_KEY_ALL}" /ve /d "Convert or Compress with Foldex" /f`);
    await execAsync(`reg add "${REG_KEY_ALL}" /v "Icon" /d "${iconValue}" /f`);
    await execAsync(`reg add "${REG_KEY_ALL}\\command" /ve /d "${commandValue}" /f`);

    // Register for directories
    await execAsync(`reg add "${REG_KEY_DIR}" /ve /d "Convert or Compress with Foldex" /f`);
    await execAsync(`reg add "${REG_KEY_DIR}" /v "Icon" /d "${iconValue}" /f`);
    await execAsync(`reg add "${REG_KEY_DIR}\\command" /ve /d "${commandValue}" /f`);

    return true;
  } catch (error) {
    console.error('Failed to register context menu in registry:', error);
    return false;
  }
}

export async function unregisterContextMenu(): Promise<boolean> {
  try {
    await execAsync(`reg delete "${REG_KEY_ALL}" /f`);
    await execAsync(`reg delete "${REG_KEY_DIR}" /f`);
    return true;
  } catch (error) {
    console.error('Failed to unregister context menu:', error);
    return false;
  }
}
