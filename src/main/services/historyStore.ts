import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { HistoryItem } from '../../shared/types';

function getHistoryPath(): string {
  return path.join(app.getPath('userData'), 'history.json');
}

export function loadHistory(): HistoryItem[] {
  try {
    const filePath = getHistoryPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
  return [];
}

export function addHistoryItem(item: HistoryItem): void {
  try {
    const current = loadHistory();
    // Keep max 100 items, most recent first
    const updated = [item, ...current.filter(i => i.id !== item.id)].slice(0, 100);
    const filePath = getHistoryPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save history item:', error);
  }
}

export function clearHistory(): void {
  try {
    const filePath = getHistoryPath();
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}
