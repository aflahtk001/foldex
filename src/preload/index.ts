import { contextBridge, ipcRenderer } from 'electron';
import {
  FileItem,
  OutputSettings,
  ImageToImageOptions,
  ImageToPdfOptions,
  PdfToImageOptions,
  ImageCompressionOptions,
  PdfCompressionOptions,
  TaskResult,
  TaskProgress,
  AppSettings,
  HistoryItem
} from '../shared/types';

export interface ElectronAPI {
  getSelectedFiles: () => Promise<FileItem[]>;
  pickFiles: () => Promise<FileItem[]>;
  pickFolder: () => Promise<string | null>;
  inspectFiles: (paths: string[]) => Promise<FileItem[]>;
  executeConvert: (
    files: FileItem[],
    outputSettings: OutputSettings,
    options: {
      imageToImage?: ImageToImageOptions;
      imageToPdf?: ImageToPdfOptions;
      pdfToImage?: PdfToImageOptions;
    }
  ) => Promise<TaskResult>;
  executeCompress: (
    files: FileItem[],
    outputSettings: OutputSettings,
    options: {
      imageCompression?: ImageCompressionOptions;
      pdfCompression?: PdfCompressionOptions;
    }
  ) => Promise<TaskResult>;
  cancelTask: () => Promise<void>;
  onTaskProgress: (callback: (progress: TaskProgress) => void) => () => void;
  onTaskCompleted: (callback: (result: TaskResult) => void) => () => void;
  getPopupInitialState: () => Promise<{ files: FileItem[]; mode: 'convert' | 'compress' }>;
  onPopupOpenedWithFiles: (callback: (files: FileItem[], mode?: 'convert' | 'compress') => void) => () => void;
  openPath: (filePath: string) => Promise<void>;
  showItemInFolder: (filePath: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getHistory: () => Promise<HistoryItem[]>;
  clearHistory: () => Promise<void>;
  openMainWindow: () => Promise<void>;
  closePopupWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  setContextMenuEnabled: (enabled: boolean) => Promise<boolean>;
}

const api: ElectronAPI = {
  getSelectedFiles: () => ipcRenderer.invoke('explorer:getSelectedFiles'),
  pickFiles: () => ipcRenderer.invoke('dialog:pickFiles'),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  inspectFiles: (paths: string[]) => ipcRenderer.invoke('files:inspect', paths),
  executeConvert: (files, outputSettings, options) =>
    ipcRenderer.invoke('task:convert', files, outputSettings, options),
  executeCompress: (files, outputSettings, options) =>
    ipcRenderer.invoke('task:compress', files, outputSettings, options),
  cancelTask: () => ipcRenderer.invoke('task:cancel'),
  onTaskProgress: (callback) => {
    const handler = (_event: any, progress: TaskProgress) => callback(progress);
    ipcRenderer.on('task:progress', handler);
    return () => ipcRenderer.removeListener('task:progress', handler);
  },
  onTaskCompleted: (callback) => {
    const handler = (_event: any, result: TaskResult) => callback(result);
    ipcRenderer.on('task:completed', handler);
    return () => ipcRenderer.removeListener('task:completed', handler);
  },
  getPopupInitialState: () => ipcRenderer.invoke('popup:getInitialState'),
  onPopupOpenedWithFiles: (callback) => {
    const handler = (_event: any, files: FileItem[], mode?: 'convert' | 'compress') => callback(files, mode);
    ipcRenderer.on('popup:openedWithFiles', handler);
    return () => ipcRenderer.removeListener('popup:openedWithFiles', handler);
  },
  openPath: (filePath: string) => ipcRenderer.invoke('shell:openPath', filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', settings),
  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  openMainWindow: () => ipcRenderer.invoke('window:openMain'),
  closePopupWindow: () => ipcRenderer.invoke('window:closePopup'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  setContextMenuEnabled: (enabled: boolean) => ipcRenderer.invoke('settings:setContextMenu', enabled),
};

contextBridge.exposeInMainWorld('electronAPI', api);
