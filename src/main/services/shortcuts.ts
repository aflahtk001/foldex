import { globalShortcut } from 'electron';

export function registerAppShortcuts(
  compressShortcut: string,
  onCompress: () => void,
  convertShortcut: string,
  onConvert: () => void
): { compressSuccess: boolean; convertSuccess: boolean } {
  globalShortcut.unregisterAll();

  let compressSuccess = false;
  let convertSuccess = false;

  try {
    const formattedCompress = compressShortcut.replace(/Ctrl/i, 'Control').trim();
    compressSuccess = globalShortcut.register(formattedCompress, onCompress);
    console.log(`Registered compression shortcut (${formattedCompress}):`, compressSuccess);
  } catch (err) {
    console.error(`Failed to register compression shortcut: ${compressShortcut}`, err);
  }

  try {
    const formattedConvert = convertShortcut.replace(/Ctrl/i, 'Control').trim();
    convertSuccess = globalShortcut.register(formattedConvert, onConvert);
    console.log(`Registered conversion shortcut (${formattedConvert}):`, convertSuccess);
  } catch (err) {
    console.error(`Failed to register conversion shortcut: ${convertShortcut}`, err);
  }

  return { compressSuccess, convertSuccess };
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
}
