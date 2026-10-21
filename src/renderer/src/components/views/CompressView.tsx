import React, { useState } from 'react';
import {
  FileItem,
  OutputSettings,
  TaskProgress,
  TaskResult,
  ImageCompressionOptions,
  PdfCompressionOptions,
  AppSettings
} from '../../../../shared/types';
import { FileDropzone } from '../FileDropzone';
import { FileCard } from '../FileCard';
import { TaskProgressView } from '../TaskProgressView';
import { TaskResultView } from '../TaskResultView';
import {
  FolderOpen,
  ArrowRight,
  Plus,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
  HardDrive
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface CompressViewProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  settings: AppSettings | null;
  progress: TaskProgress | null;
  result: TaskResult | null;
  setResult: (res: TaskResult | null) => void;
}

export const CompressView: React.FC<CompressViewProps> = ({
  files,
  setFiles,
  settings,
  progress,
  result,
  setResult,
}) => {
  const [preset, setPreset] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced image compression settings
  const [customQuality, setCustomQuality] = useState<number>(75);
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [targetFormat, setTargetFormat] = useState<'same' | 'webp' | 'jpg'>('same');

  // Destination config
  const [destinationType, setDestinationType] = useState<'beside_original' | 'custom_folder'>(
    settings?.defaultDestination || 'beside_original'
  );
  const [customFolderPath, setCustomFolderPath] = useState<string>(
    settings?.customDestinationPath || ''
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const hasPdfs = files.some((f) => f.fileType === 'pdf');
  const hasImages = files.some((f) => f.fileType === 'image');

  const handlePickFolder = async () => {
    const folder = await window.electronAPI.pickFolder();
    if (folder) {
      setCustomFolderPath(folder);
      setDestinationType('custom_folder');
    }
  };

  const handleStartCompression = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const outputSettings: OutputSettings = {
      destinationType,
      customFolderPath,
      overwriteBehavior: settings?.overwriteBehavior || 'ask',
    };

    try {
      const pdfCompression: PdfCompressionOptions = {
        preset,
      };

      const imageCompression: ImageCompressionOptions = {
        preset,
        quality: showAdvanced ? customQuality : preset === 'low' ? 85 : preset === 'balanced' ? 70 : 50,
        resizeWidth: resizeWidth ? parseInt(resizeWidth, 10) : undefined,
        resizeHeight: resizeHeight ? parseInt(resizeHeight, 10) : undefined,
        stripMetadata,
        targetFormat,
      };

      const res = await window.electronAPI.executeCompress(files, outputSettings, {
        imageCompression,
        pdfCompression,
      });
      setResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {progress ? (
        <TaskProgressView progress={progress} onCancel={() => window.electronAPI.cancelTask()} />
      ) : result ? (
        <TaskResultView result={result} onReset={() => setResult(null)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: File Input & Batch List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Files to Compress</h3>
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-rose-500 hover:text-rose-600 inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              {files.length === 0 ? (
                <FileDropzone
                  onFilesSelected={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
                />
              ) : (
                <div className="space-y-3">
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {files.map((file, idx) => (
                      <FileCard
                        key={`${file.id}-${idx}`}
                        file={file}
                        onRemove={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      />
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {files.length} file(s) • Total:{' '}
                      <strong className="text-gray-800">
                        {formatBytes(files.reduce((a, b) => a + b.size, 0))}
                      </strong>
                    </span>

                    <button
                      type="button"
                      onClick={async () => {
                        const more = await window.electronAPI.pickFiles();
                        if (more && more.length > 0) {
                          setFiles((prev) => [...prev, ...more]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add more</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Compression Settings */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-gray-400" />
                <span>Compression Settings</span>
              </h3>

              {/* Compression Presets */}
              <div className="space-y-2">
                {[
                  {
                    id: 'low',
                    label: 'Low Compression',
                    desc: 'Higher visual quality, subtle reduction',
                  },
                  {
                    id: 'balanced',
                    label: 'Balanced (Recommended)',
                    desc: 'Best balance of size and visual clarity',
                  },
                  {
                    id: 'high',
                    label: 'High Compression',
                    desc: 'Smallest file size, maximum space saved',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPreset(item.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      preset === item.id
                        ? 'shadow-xs border-transparent'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    style={
                      preset === item.id
                        ? {
                            backgroundColor: 'var(--color-primary-light)',
                            borderColor: 'var(--color-primary-border)',
                          }
                        : {}
                    }
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900">{item.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{item.desc}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        preset === item.id ? 'border-amber-600 bg-amber-600' : 'border-gray-300'
                      }`}
                    >
                      {preset === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Advanced Image Options Accordion */}
              {hasImages && (
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-gray-900 py-1"
                  >
                    <span className="flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-gray-400" />
                      <span>Advanced Image Controls</span>
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 pt-3">
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Quality</span>
                          <span>{customQuality}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="95"
                          value={customQuality}
                          onChange={(e) => setCustomQuality(parseInt(e.target.value, 10))}
                          className="w-full accent-amber-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Max Width (px)</label>
                          <input
                            type="number"
                            placeholder="Optional"
                            value={resizeWidth}
                            onChange={(e) => setResizeWidth(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">Max Height (px)</label>
                          <input
                            type="number"
                            placeholder="Optional"
                            value={resizeHeight}
                            onChange={(e) => setResizeHeight(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg text-gray-800"
                          />
                        </div>
                      </div>

                      <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={stripMetadata}
                          onChange={(e) => setStripMetadata(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>Remove EXIF metadata (smaller size)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Destination Folder */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="text-xs font-medium text-gray-600 block">
                  Output Destination
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destination_compress"
                      checked={destinationType === 'beside_original'}
                      onChange={() => setDestinationType('beside_original')}
                      className="accent-amber-600"
                    />
                    <span className="text-gray-700">Beside original file</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destination_compress"
                      checked={destinationType === 'custom_folder'}
                      onChange={() => setDestinationType('custom_folder')}
                      className="accent-amber-600"
                    />
                    <span className="text-gray-700">Custom folder</span>
                  </label>
                </div>

                {destinationType === 'custom_folder' && (
                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="text"
                      readOnly
                      placeholder="Select folder..."
                      value={customFolderPath}
                      className="flex-1 text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 truncate"
                    />
                    <button
                      type="button"
                      onClick={handlePickFolder}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Start Button */}
              <button
                type="button"
                disabled={files.length === 0 || isProcessing}
                onClick={handleStartCompression}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-subtle cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow mt-2"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-text)',
                  border: '1px solid var(--color-primary-border)',
                }}
              >
                <span>Start Compression</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
