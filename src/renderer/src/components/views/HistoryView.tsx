import React, { useEffect, useState } from 'react';
import {
  HistoryItem
} from '../../../../shared/types';
import {
  Trash2,
  ExternalLink,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock
} from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    window.electronAPI.getHistory().then(setHistory);
  };

  const handleClear = async () => {
    await window.electronAPI.clearHistory();
    setHistory([]);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>Processing History</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            View recently converted and compressed files. File contents are never stored.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-card text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-600 mb-1">No history records yet</p>
          <p className="text-xs">Your completed tasks will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-subtle hover:shadow-card transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5 min-w-0 pr-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary-dark)',
                    border: '1px solid var(--color-primary-border)',
                  }}
                >
                  {item.operation === 'convert' ? 'Conv' : 'Comp'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {item.sourceFiles[0] ? item.sourceFiles[0].split(/[\\/]/).pop() : 'Task'}
                      {item.sourceFiles.length > 1 && ` (+${item.sourceFiles.length - 1} more files)`}
                    </span>
                    {item.status === 'completed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Success
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                        Failed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                    <span>{formatDate(item.timestamp)}</span>
                    <span>•</span>
                    <span>
                      {formatBytes(item.originalSize)} → <strong className="text-gray-700">{formatBytes(item.outputSize)}</strong>
                    </span>
                    {item.originalSize > item.outputSize && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">
                          Saved {formatBytes(item.originalSize - item.outputSize)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {item.outputFiles && item.outputFiles.length > 0 && (
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => window.electronAPI.openPath(item.outputFiles[0])}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 transition-colors"
                    title="Open Output File"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => window.electronAPI.showItemInFolder(item.outputFiles[0])}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 transition-colors"
                    title="Show in Folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
