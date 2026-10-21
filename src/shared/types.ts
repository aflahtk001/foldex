export type SupportedImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'bmp' | 'tiff';
export type SupportedDocFormat = 'pdf';
export type SupportedFormat = SupportedImageFormat | SupportedDocFormat;

export interface FileItem {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  thumbnailUrl?: string;
  fileType: 'image' | 'pdf' | 'other';
  dimensions?: { width: number; height: number };
  pageCount?: number;
}

export interface ImageToImageOptions {
  targetFormat: 'png' | 'jpg' | 'webp' | 'bmp' | 'tiff';
  backgroundColor: string; // for transparency conversion, default #FFFFFF
  quality: number; // 1-100
}

export interface ImageToPdfOptions {
  combineMode: 'single_pdf' | 'separate_pdfs';
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: number;
}

export interface PdfToImageOptions {
  targetFormat: 'png' | 'jpg' | 'webp';
  dpi: number; // 72, 150, 300
  pageRange: 'all' | 'custom';
  customPages?: string; // e.g. "1, 2-4"
}

export type ImageCompressionPreset = 'low' | 'balanced' | 'high' | 'custom';
export interface ImageCompressionOptions {
  preset: ImageCompressionPreset;
  quality: number;
  resizeWidth?: number;
  resizeHeight?: number;
  stripMetadata: boolean;
  targetFormat?: 'same' | 'jpg' | 'webp' | 'png';
}

export type PdfCompressionPreset = 'basic' | 'balanced' | 'strong';
export interface PdfCompressionOptions {
  preset: PdfCompressionPreset;
  imageQuality?: number;
  downsampleDpi?: number;
  stripMetadata?: boolean;
}

export interface OutputSettings {
  destinationType: 'beside_original' | 'custom_folder';
  customFolderPath?: string;
  overwriteBehavior: 'ask' | 'rename' | 'overwrite';
}

export interface TaskProgress {
  taskId: string;
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  percent: number;
  statusText: string;
  isCancelled: boolean;
}

export interface TaskResultItem {
  originalPath: string;
  originalSize: number;
  outputPath?: string;
  outputSize?: number;
  savingsBytes?: number;
  savingsPercent?: number;
  status: 'success' | 'failed' | 'cancelled';
  errorMessage?: string;
}

export interface TaskResult {
  id: string;
  operation: 'convert' | 'compress';
  timestamp: number;
  items: TaskResultItem[];
}

export interface AppSettings {
  primaryColor: string; // default "#F5EFE1"
  compressShortcut: string; // default "Shift+C"
  convertShortcut: string; // default "Shift+V"
  globalShortcut?: string;
  defaultDestination: 'beside_original' | 'custom_folder';
  customDestinationPath: string;
  overwriteBehavior: 'ask' | 'rename' | 'overwrite';
  autoStart: boolean;
  minimizeToTray: boolean;
  contextMenuEnabled: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  operation: 'convert' | 'compress';
  sourceFiles: string[];
  outputFiles: string[];
  originalSize: number;
  outputSize: number;
  status: 'completed' | 'failed' | 'partial';
  details: string;
}
