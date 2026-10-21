import path from 'path';
import fs from 'fs/promises';
import { OutputSettings } from '../../shared/types';

export async function getOutputPath(
  sourcePath: string,
  targetExtension: string,
  suffix: string,
  settings: OutputSettings
): Promise<string> {
  const dir = settings.destinationType === 'custom_folder' && settings.customFolderPath
    ? settings.customFolderPath
    : path.dirname(sourcePath);

  const parsed = path.parse(sourcePath);
  const ext = targetExtension.startsWith('.') ? targetExtension : `.${targetExtension}`;
  const baseName = `${parsed.name}${suffix}${ext}`;
  let finalPath = path.join(dir, baseName);

  if (settings.overwriteBehavior === 'overwrite') {
    return finalPath;
  }

  // If file exists and not overwriting, generate non-colliding name
  let counter = 1;
  while (true) {
    try {
      await fs.access(finalPath);
      // File exists, add number
      finalPath = path.join(dir, `${parsed.name}${suffix} (${counter})${ext}`);
      counter++;
    } catch {
      // File does not exist, good to use
      break;
    }
  }

  return finalPath;
}
