import React, { useState, useEffect } from 'react';
import {
  FileItem,
  OutputSettings,
  TaskProgress,
  TaskResult,
  AppSettings,
  ImageToImageOptions,
  ImageToPdfOptions,
  PdfToImageOptions,
  ImageCompressionOptions,
  PdfCompressionOptions
} from '../../../shared/types';
import appLogo from '../assets/logo.png';
import { FileCard } from './FileCard';
import { FileDropzone } from './FileDropzone';
import { TaskProgressView } from './TaskProgressView';
import { TaskResultView } from './TaskResultView';
import { CustomSelect } from './CustomSelect';
import {
  X,
  Maximize2,
  SlidersHorizontal,
  FolderOpen,
  ArrowRight,
  Layers,
  Sparkles,
  Files,
  Trash2
} from 'lucide-react';
import { formatBytes } from '../utils/formatters';

export const PopupApp: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [operationTab, setOperationTab] = useState<'convert' | 'compress'>('compress');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Conversion state
  const [targetFormat, setTargetFormat] = useState<string>('png');
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit');
  const [combineMode, setCombineMode] = useState<'single_pdf' | 'separate_pdfs'>('single_pdf');
  const [pdfDpi, setPdfDpi] = useState<number>(150);

  // Compression state
  const [compressionPreset, setCompressionPreset] = useState<'low' | 'balanced' | 'high'>('balanced');

  // Destination state
  const [destinationType, setDestinationType] = useState<'beside_original' | 'custom_folder'>('beside_original');
  const [customFolderPath, setCustomFolderPath] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);

  useEffect(() => {
    // Check URL query param for default tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'convert' || tabParam === 'compress') {
      setOperationTab(tabParam);
    }

    // Load settings
    window.electronAPI.getSettings().then((s) => {
      setSettings(s);
      setDestinationType(s.defaultDestination);
      setCustomFolderPath(s.customDestinationPath || '');
    });

    // 1. Fetch initial state immediately from main process
    window.electronAPI.getPopupInitialState().then((initState) => {
      if (initState) {
        if (initState.mode) {
          setOperationTab(initState.mode);
        }
        if (initState.files && initState.files.length > 0) {
          setFiles(initState.files);
          initOptionsForFiles(initState.files);
        }
      }
    });

    // 2. Listen to subsequent updates when popup is triggered while open
    const unbindFiles = window.electronAPI.onPopupOpenedWithFiles((receivedFiles, mode) => {
      if (mode) {
        setOperationTab(mode);
      }
      if (receivedFiles && receivedFiles.length > 0) {
        setFiles(receivedFiles);
        initOptionsForFiles(receivedFiles);
        setResult(null);
        setProgress(null);
      }
    });

    // Listen to progress & completion
    const unbindProgress = window.electronAPI.onTaskProgress((p) => {
      setProgress(p);
    });

    const unbindCompleted = window.electronAPI.onTaskCompleted((res) => {
      setIsProcessing(false);
      setProgress(null);
      setResult(res);
    });

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electronAPI.closePopupWindow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unbindFiles();
      unbindProgress();
      unbindCompleted();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initOptionsForFiles = (currentFiles: FileItem[]) => {
    if (currentFiles.length === 0) return;
    const first = currentFiles[0];
    if (first.fileType === 'pdf') {
      setTargetFormat('png');
    } else if (first.extension === 'png') {
      setTargetFormat('jpg');
    } else if (first.extension === 'jpg' || first.extension === 'jpeg') {
      setTargetFormat('png');
    } else {
      setTargetFormat('pdf');
    }
  };

  const currentFile = files[0];
  const isPdf = files.some(f => f.fileType === 'pdf');
  const isImage = files.some(f => f.fileType === 'image');

  // Valid target formats based on current file(s)
  const getAvailableFormats = (): string[] => {
    if (!currentFile) return ['png', 'jpg', 'webp', 'pdf'];
    if (isPdf) {
      return ['png', 'jpg', 'webp'];
    }
    const base = ['pdf', 'png', 'jpg', 'webp', 'tiff', 'bmp'];
    return base.filter((fmt) => fmt !== currentFile.extension.toLowerCase());
  };

  const handlePickFolder = async () => {
    const folder = await window.electronAPI.pickFolder();
    if (folder) {
      setCustomFolderPath(folder);
      setDestinationType('custom_folder');
    }
  };

  const handleStartProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({
      taskId: 'active',
      currentFile: files[0].name,
      currentIndex: 1,
      totalFiles: files.length,
      percent: 5,
      statusText: 'Starting...',
      isCancelled: false,
    });

    const outputSettings: OutputSettings = {
      destinationType,
      customFolderPath,
      overwriteBehavior: settings?.overwriteBehavior || 'ask',
    };

    if (operationTab === 'convert') {
      if (targetFormat === 'pdf' && isImage) {
        const imageToPdf: ImageToPdfOptions = {
          combineMode: files.length > 1 ? combineMode : 'separate_pdfs',
          pageSize,
          orientation: 'auto',
          margin: 10,
        };
        await window.electronAPI.executeConvert(files, outputSettings, { imageToPdf });
      } else if (isPdf) {
        const pdfToImage: PdfToImageOptions = {
          targetFormat: targetFormat as 'png' | 'jpg' | 'webp',
          dpi: pdfDpi,
          pageRange: 'all',
        };
        await window.electronAPI.executeConvert(files, outputSettings, { pdfToImage });
      } else {
        const imageToImage: ImageToImageOptions = {
          targetFormat: targetFormat as any,
          backgroundColor: '#FFFFFF',
          quality: 90,
        };
        await window.electronAPI.executeConvert(files, outputSettings, { imageToImage });
      }
    } else {
      // Compress
      if (isPdf) {
        const pdfCompression: PdfCompressionOptions = {
          preset: compressionPreset,
        };
        await window.electronAPI.executeCompress(files, outputSettings, { pdfCompression });
      } else {
        const imageCompression: ImageCompressionOptions = {
          preset: compressionPreset,
          quality: compressionPreset === 'low' ? 85 : compressionPreset === 'balanced' ? 70 : 50,
          stripMetadata: true,
          targetFormat: 'same',
        };
        await window.electronAPI.executeCompress(files, outputSettings, { imageCompression });
      }
    }
  };

  const handleCancel = () => {
    window.electronAPI.cancelTask();
  };

  const handleOpenFullApp = () => {
    window.electronAPI.openMainWindow();
    window.electronAPI.closePopupWindow();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white select-none border border-gray-200/80 rounded-2xl shadow-popup overflow-hidden">
      {/* Title Bar */}
      <div className="titlebar-drag flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-surface-subtle">
        <div className="flex items-center space-x-2">
          <img
            src={appLogo}
            alt="Logo"
            className="w-5 h-5 rounded-md object-contain"
          />
          <span className="text-xs font-semibold text-gray-800">
            Foldex • {operationTab === 'compress' ? 'Compress' : 'Convert'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
            {operationTab === 'compress' ? 'Shift+C' : 'Shift+V'}
          </span>
        </div>

        <div className="titlebar-nodrag flex items-center space-x-1">
          <button
            type="button"
            onClick={handleOpenFullApp}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Open Full Application"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => window.electronAPI.closePopupWindow()}
            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {files.length === 0 ? (
          <div className="py-6">
            <p className="text-xs text-gray-500 mb-3 text-center">
              No files currently selected in File Explorer.
            </p>
            <FileDropzone
              compact
              onFilesSelected={(newFiles) => {
                setFiles(newFiles);
                initOptionsForFiles(newFiles);
              }}
            />
          </div>
        ) : (
          <>
            {/* Selected File(s) Section */}
            {files.length === 1 ? (
              <FileCard
                file={currentFile}
                compact
                onRemove={() => setFiles([])}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1 text-gray-600">
                  <div className="flex items-center space-x-1.5 font-semibold text-gray-800">
                    <Files className="w-4 h-4 text-amber-600" />
                    <span>{files.length} Files Selected</span>
                  </div>
                  <span className="font-medium text-gray-500">
                    Total: {formatBytes(files.reduce((a, b) => a + b.size, 0))}
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 rounded-xl p-1.5 bg-gray-50/50">
                  {files.map((file, idx) => (
                    <FileCard
                      key={`${file.id}-${idx}`}
                      file={file}
                      compact
                      onRemove={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress View */}
            {isProcessing && progress ? (
              <TaskProgressView progress={progress} onCancel={handleCancel} />
            ) : result ? (
              <TaskResultView
                result={result}
                compact
                onReset={() => {
                  setResult(null);
                  setProgress(null);
                }}
              />
            ) : (
              <>
                {/* Operation Tabs: Convert vs Compress */}
                <div className="flex rounded-xl p-1 bg-gray-100/80 border border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setOperationTab('compress')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      operationTab === 'compress'
                        ? 'bg-white text-gray-900 shadow-sm font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Compress (Shift+C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperationTab('convert')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      operationTab === 'convert'
                        ? 'bg-white text-gray-900 shadow-sm font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Convert (Shift+V)
                  </button>
                </div>

                {/* Compress Configuration */}
                {operationTab === 'compress' && (
                  <div className="space-y-3 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      Compression Preset
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { id: 'low', label: 'Low Compression', desc: 'Highest visual quality' },
                        { id: 'balanced', label: 'Balanced (Recommended)', desc: 'Optimal size & sharpness' },
                        { id: 'high', label: 'High Compression', desc: 'Smallest file size' },
                      ].map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => setCompressionPreset(preset.id as any)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            compressionPreset === preset.id
                              ? 'shadow-xs border-transparent'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                          style={
                            compressionPreset === preset.id
                              ? {
                                  backgroundColor: 'var(--color-primary-light)',
                                  borderColor: 'var(--color-primary-border)',
                                }
                              : {}
                          }
                        >
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{preset.label}</div>
                            <div className="text-[10px] text-gray-500">{preset.desc}</div>
                          </div>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              compressionPreset === preset.id ? 'border-amber-600 bg-amber-600' : 'border-gray-300'
                            }`}
                          >
                            {compressionPreset === preset.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Convert Configuration */}
                {operationTab === 'convert' && (
                  <div className="space-y-3 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Output Format
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {getAvailableFormats().map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setTargetFormat(fmt)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold uppercase border transition-all cursor-pointer ${
                              targetFormat === fmt
                                ? 'shadow-sm font-bold border-transparent'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                            style={
                              targetFormat === fmt
                                ? {
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'var(--color-primary-text)',
                                    borderColor: 'var(--color-primary-border)',
                                  }
                                : {}
                            }
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image to PDF options */}
                    {targetFormat === 'pdf' && isImage && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                        <div>
                          <label className="text-[10px] font-medium text-gray-500 block mb-1">
                            Page Size
                          </label>
                          <CustomSelect
                            value={pageSize}
                            onChange={(val) => setPageSize(val as any)}
                            compact
                            options={[
                              { value: 'fit', label: 'Fit to Image' },
                              { value: 'a4', label: 'Standard A4' },
                              { value: 'letter', label: 'US Letter' },
                            ]}
                          />
                        </div>
                        {files.length > 1 && (
                          <div>
                            <label className="text-[10px] font-medium text-gray-500 block mb-1">
                              Batch Mode
                            </label>
                            <CustomSelect
                              value={combineMode}
                              onChange={(val) => setCombineMode(val as any)}
                              compact
                              options={[
                                { value: 'single_pdf', label: 'Combine into Single PDF' },
                                { value: 'separate_pdfs', label: 'Separate PDFs' },
                              ]}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* PDF to Image options */}
                    {isPdf && (
                      <div className="pt-1 border-t border-gray-100">
                        <label className="text-[10px] font-medium text-gray-500 block mb-1">
                          Resolution (DPI)
                        </label>
                        <div className="flex space-x-1.5">
                          {[72, 150, 300].map((dpi) => (
                            <button
                              key={dpi}
                              type="button"
                              onClick={() => setPdfDpi(dpi)}
                              className={`flex-1 py-1 text-xs rounded-lg border transition-all ${
                                pdfDpi === dpi
                                  ? 'bg-gray-800 text-white font-semibold border-gray-800'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {dpi} DPI
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Output Destination Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span>Destination</span>
                    <button
                      type="button"
                      onClick={handlePickFolder}
                      className="text-gray-700 hover:text-black underline cursor-pointer"
                    >
                      {destinationType === 'custom_folder' && customFolderPath ? 'Change' : 'Custom folder'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 truncate bg-gray-50 p-2 rounded-lg border border-gray-100">
                    {destinationType === 'custom_folder' && customFolderPath ? (
                      <span title={customFolderPath}>📁 {customFolderPath}</span>
                    ) : (
                      <span>📁 Same directory as original file(s)</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-3 bg-surface border-t border-gray-100 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => window.electronAPI.closePopupWindow()}
          className="py-2.5 px-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Close
        </button>

        <button
          type="button"
          disabled={files.length === 0 || isProcessing}
          onClick={handleStartProcess}
          className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all shadow-subtle cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            border: '1px solid var(--color-primary-border)',
          }}
        >
          <span>
            {operationTab === 'convert'
              ? files.length > 1
                ? `Convert ${files.length} Files`
                : 'Convert File'
              : files.length > 1
              ? `Compress ${files.length} Files`
              : 'Compress File'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
