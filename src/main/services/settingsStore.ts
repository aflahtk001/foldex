import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppSettings } from '../../shared/types';

const defaultSettings: AppSettings = {
  primaryColor: '#F5EFE1',
  compressShortcut: 'Shift+C',
  convertShortcut: 'Shift+V',
  globalShortcut: 'Shift+C',
  defaultDestination: 'beside_original',
  customDestinationPath: '',
  overwriteBehavior: 'ask',
  autoStart: false,
  minimizeToTray: true,
  contextMenuEnabled: true,
};

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function loadSettings(): AppSettings {
  try {
    const filePath = getSettingsPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...defaultSettings };
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    const filePath = getSettingsPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return loadSettings();
  }
}
