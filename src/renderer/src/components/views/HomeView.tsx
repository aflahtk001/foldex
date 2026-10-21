import React, { useEffect, useState } from 'react';
import {
  FileUp,
  FileCheck2,
  HardDrive,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import { FileDropzone } from '../FileDropzone';
import { FileItem, HistoryItem } from '../../../../shared/types';
import { formatBytes, formatDate } from '../../utils/formatters';

interface HomeViewProps {
  onNavigate: (tab: 'convert' | 'compress' | 'history') => void;
  onFilesSelected: (files: FileItem[], mode: 'convert' | 'compress') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onFilesSelected }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    window.electronAPI.getHistory().then((h) => setHistory(h.slice(0, 5)));
  }, []);

  const totalSaved = history.reduce((acc, h) => {
    if (h.operation === 'compress') {
      return acc + Math.max(0, h.originalSize - h.outputSize);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero / Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Convert Card */}
        <div
          onClick={() => onNavigate('convert')}
          className="group p-6 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 shadow-card hover:shadow-popup transition-all cursor-pointer relative overflow-hidden"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <FileUp className="w-6 h-6" style={{ color: 'var(--color-primary-accent)' }} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center space-x-1.5">
            <span>Convert Files</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Convert JPG, PNG, WEBP, BMP, TIFF to PDF or image formats, and extract PDF pages to high-resolution images.
          </p>
        </div>

        {/* Quick Compress Card */}
        <div
          onClick={() => onNavigate('compress')}
          className="group p-6 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 shadow-card hover:shadow-popup transition-all cursor-pointer relative overflow-hidden"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <HardDrive className="w-6 h-6" style={{ color: 'var(--color-primary-accent)' }} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center space-x-1.5">
            <span>Compress Files</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Shrink image and PDF file sizes with balanced quality presets, custom downsampling, and metadata removal.
          </p>
        </div>
      </div>

      {/* Direct Dropzone */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center space-x-2">
          <span>Quick Drop File</span>
          <span className="text-xs font-normal text-gray-400">
            (or press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] border border-gray-200">Shift+C</kbd> to compress, <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] border border-gray-200">Shift+V</kbd> to convert in Explorer)
          </span>
        </h3>
        <FileDropzone
          onFilesSelected={(files) => {
            onFilesSelected(files, 'convert');
            onNavigate('convert');
          }}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Recently Processed</h3>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              View all ({history.length})
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No files processed yet. Drop a file above or use Windows Explorer shortcut to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/40 transition-all text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                    }}
                  >
                    {item.operation}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 truncate">
                      {item.sourceFiles[0] ? item.sourceFiles[0].split(/[\\/]/).pop() : 'Processed File'}
                      {item.sourceFiles.length > 1 && ` (+${item.sourceFiles.length - 1} more)`}
                    </p>
                    <div className="text-gray-400 text-[11px] mt-0.5">
                      {formatDate(item.timestamp)} • {formatBytes(item.originalSize)} → {formatBytes(item.outputSize)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  {item.outputFiles && item.outputFiles[0] && (
                    <>
                      <button
                        type="button"
                        onClick={() => window.electronAPI.openPath(item.outputFiles[0])}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
                        title="Open file"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.electronAPI.showItemInFolder(item.outputFiles[0])}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
                        title="Show in folder"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
