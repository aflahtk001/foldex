import React, { useState } from 'react';
import {
  FileItem,
  OutputSettings,
  TaskProgress,
  TaskResult,
  ImageToImageOptions,
  ImageToPdfOptions,
  PdfToImageOptions,
  AppSettings
} from '../../../../shared/types';
import { FileDropzone } from '../FileDropzone';
import { FileCard } from '../FileCard';
import { TaskProgressView } from '../TaskProgressView';
import { TaskResultView } from '../TaskResultView';
import { CustomSelect } from '../CustomSelect';
import {
  FolderOpen,
  ArrowRight,
  Plus,
  Trash2,
  FileCheck2,
  Settings2
} from 'lucide-react';
import { formatBytes } from '../../utils/formatters';

interface ConvertViewProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  settings: AppSettings | null;
  progress: TaskProgress | null;
  result: TaskResult | null;
  setResult: (res: TaskResult | null) => void;
}

export const ConvertView: React.FC<ConvertViewProps> = ({
  files,
  setFiles,
  settings,
  progress,
  result,
  setResult,
}) => {
  // Conversion configuration
  const [targetFormat, setTargetFormat] = useState<string>('pdf');
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit');
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [margin, setMargin] = useState<number>(10);
  const [combineMode, setCombineMode] = useState<'single_pdf' | 'separate_pdfs'>('single_pdf');

  // PDF to Image config
  const [pdfDpi, setPdfDpi] = useState<number>(150);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customPages, setCustomPages] = useState<string>('1');

  // Transparency to JPG background
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');

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

  const handleStartConversion = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const outputSettings: OutputSettings = {
      destinationType,
      customFolderPath,
      overwriteBehavior: settings?.overwriteBehavior || 'ask',
    };

    try {
      if (targetFormat === 'pdf' && hasImages) {
        const imageToPdf: ImageToPdfOptions = {
          combineMode: files.length > 1 ? combineMode : 'separate_pdfs',
          pageSize,
          orientation,
          margin,
        };
        const res = await window.electronAPI.executeConvert(files, outputSettings, { imageToPdf });
        setResult(res);
      } else if (hasPdfs) {
        const pdfToImage: PdfToImageOptions = {
          targetFormat: targetFormat as any,
          dpi: pdfDpi,
          pageRange: pageRangeMode,
          customPages,
        };
        const res = await window.electronAPI.executeConvert(files, outputSettings, { pdfToImage });
        setResult(res);
      } else {
        const imageToImage: ImageToImageOptions = {
          targetFormat: targetFormat as any,
          backgroundColor: bgColor,
          quality: 90,
        };
        const res = await window.electronAPI.executeConvert(files, outputSettings, { imageToImage });
        setResult(res);
      }
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
                <h3 className="text-sm font-semibold text-gray-800">Selected Files</h3>
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

          {/* Right Col: Conversion Settings */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-gray-400" />
                <span>Conversion Options</span>
              </h3>

              {/* Target Format Selector */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">
                  Target Format
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(hasPdfs ? ['png', 'jpg', 'webp'] : ['pdf', 'png', 'jpg', 'webp', 'bmp', 'tiff']).map(
                    (fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setTargetFormat(fmt)}
                        className={`py-2 px-2 text-xs font-semibold uppercase rounded-xl border transition-all cursor-pointer ${
                          targetFormat === fmt
                            ? 'shadow-xs border-transparent font-bold'
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
                    )
                  )}
                </div>
              </div>

              {/* Image to PDF Specific Options */}
              {targetFormat === 'pdf' && hasImages && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  {files.length > 1 && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Batch Output Mode
                      </label>
                      <CustomSelect
                        value={combineMode}
                        onChange={(val) => setCombineMode(val as any)}
                        options={[
                          { value: 'single_pdf', label: 'Combine into One Single PDF' },
                          { value: 'separate_pdfs', label: 'Create Separate PDFs for each image' },
                        ]}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Page Size
                    </label>
                    <CustomSelect
                      value={pageSize}
                      onChange={(val) => setPageSize(val as any)}
                      options={[
                        { value: 'fit', label: 'Fit to Image Size' },
                        { value: 'a4', label: 'Standard A4' },
                        { value: 'letter', label: 'US Letter' },
                      ]}
                    />
                  </div>

                  {pageSize !== 'fit' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Page Orientation
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['auto', 'portrait', 'landscape'] as const).map((ori) => (
                          <button
                            key={ori}
                            type="button"
                            onClick={() => setOrientation(ori)}
                            className={`py-1 text-xs capitalize rounded-lg border transition-all ${
                              orientation === ori
                                ? 'bg-gray-800 text-white font-medium border-gray-800'
                                : 'bg-white border-gray-200 text-gray-600'
                            }`}
                          >
                            {ori}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Margin</span>
                      <span>{margin} pt</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={margin}
                      onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>
              )}

              {/* PDF to Image Specific Options */}
              {hasPdfs && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Rendering Resolution
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[72, 150, 300].map((dpi) => (
                        <button
                          key={dpi}
                          type="button"
                          onClick={() => setPdfDpi(dpi)}
                          className={`py-1.5 text-xs rounded-lg border transition-all ${
                            pdfDpi === dpi
                              ? 'bg-gray-800 text-white font-semibold border-gray-800'
                              : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          {dpi} DPI
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Pages to Convert
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setPageRangeMode('all')}
                        className={`flex-1 py-1 text-xs rounded-lg border ${
                          pageRangeMode === 'all'
                            ? 'bg-gray-800 text-white font-medium'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        All Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageRangeMode('custom')}
                        className={`flex-1 py-1 text-xs rounded-lg border ${
                          pageRangeMode === 'custom'
                            ? 'bg-gray-800 text-white font-medium'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        Range
                      </button>
                    </div>

                    {pageRangeMode === 'custom' && (
                      <input
                        type="text"
                        placeholder="e.g. 1, 3-5"
                        value={customPages}
                        onChange={(e) => setCustomPages(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none"
                      />
                    )}
                  </div>
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
                      name="destination"
                      checked={destinationType === 'beside_original'}
                      onChange={() => setDestinationType('beside_original')}
                      className="accent-amber-600"
                    />
                    <span className="text-gray-700">Beside original file</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destination"
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
                onClick={handleStartConversion}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-subtle cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow mt-2"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-text)',
                  border: '1px solid var(--color-primary-border)',
                }}
              >
                <span>Start Conversion</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
