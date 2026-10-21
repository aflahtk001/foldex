import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { FileItem } from '../../shared/types';

const execFileAsync = promisify(execFile);

export const SUPPORTED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'pdf'
]);

// Inline PowerShell script that finds selected items in Windows File Explorer or Desktop
const PS_SELECTION_SCRIPT = `
$shell = New-Object -ComObject Shell.Application
$items = [System.Collections.Generic.List[string]]::new()

# 1. Enumerate Shell Windows (File Explorer windows)
foreach ($w in $shell.Windows()) {
    try {
        $selection = $w.Document.SelectedItems()
        if ($selection.Count -gt 0) {
            foreach ($item in $selection) {
                if ($item.Path) {
                    $items.Add($item.Path)
                }
            }
            break
        }
    } catch {}
}

# 2. Check Clipboard file drop list as fallback if no window selection
if ($items.Count -eq 0) {
    try {
        $clip = Get-Clipboard -Format FileDropList -ErrorAction SilentlyContinue
        if ($clip) {
            foreach ($f in $clip) {
                if ($f) { $items.Add($f) }
            }
        }
    } catch {}
}

# Always output a valid JSON array
$arr = @($items)
Write-Output (ConvertTo-Json -InputObject $arr -Compress)
`;

export async function getSelectedExplorerFiles(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      PS_SELECTION_SCRIPT
    ], { timeout: 3500 });

    const trimmed = stdout.trim();
    if (!trimmed || trimmed === '[]' || trimmed === 'null') {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      const fileList: string[] = Array.isArray(parsed) ? parsed : [parsed];
      const validFiles: string[] = [];

      for (const itemPath of fileList) {
        if (typeof itemPath === 'string' && itemPath.trim().length > 0) {
          try {
            const stat = await fs.stat(itemPath);
            if (stat.isFile()) {
              validFiles.push(itemPath);
            }
          } catch {}
        }
      }

      return validFiles;
    } catch (parseErr) {
      console.error('Failed to parse explorer selection JSON:', parseErr);
      return [];
    }
  } catch (error) {
    console.error('Failed to get selected files from Explorer:', error);
    return [];
  }
}

export async function inspectFile(filePath: string): Promise<FileItem | null> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return null;

    const ext = path.extname(filePath).replace('.', '').toLowerCase();
    const name = path.basename(filePath);
    const size = stat.size;

    let fileType: 'image' | 'pdf' | 'other' = 'other';
    if (ext === 'pdf') {
      fileType = 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'].includes(ext)) {
      fileType = 'image';
    }

    let dimensions: { width: number; height: number } | undefined = undefined;
    let thumbnailUrl: string | undefined = undefined;

    if (fileType === 'image') {
      try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.width && metadata.height) {
          dimensions = { width: metadata.width, height: metadata.height };
        }
        // Generate small thumbnail base64 for fast UI preview
        const thumbBuf = await sharp(filePath)
          .resize(160, 160, { fit: 'inside' })
          .jpeg({ quality: 75 })
          .toBuffer();
        thumbnailUrl = `data:image/jpeg;base64,${thumbBuf.toString('base64')}`;
      } catch (err) {
        // Continue without preview if format thumbnail fails
      }
    }

    return {
      id: filePath,
      path: filePath,
      name,
      extension: ext,
      size,
      fileType,
      dimensions,
      thumbnailUrl,
    };
  } catch (error) {
    console.error(`Error inspecting file ${filePath}:`, error);
    return null;
  }
}

export async function inspectFiles(filePaths: string[]): Promise<FileItem[]> {
  const results: FileItem[] = [];
  for (const p of filePaths) {
    const item = await inspectFile(p);
    if (item) {
      results.push(item);
    }
  }
  return results;
}
