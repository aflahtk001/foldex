import React from 'react';
import { CheckCircle2, AlertTriangle, ExternalLink, FolderOpen, RotateCcw } from 'lucide-react';
import { TaskResult } from '../../../shared/types';
import { formatBytes } from '../utils/formatters';

interface TaskResultViewProps {
  result: TaskResult;
  onReset: () => void;
  compact?: boolean;
}

export const TaskResultView: React.FC<TaskResultViewProps> = ({
  result,
  onReset,
  compact = false,
}) => {
  const successCount = result.items.filter(i => i.status === 'success').length;
  const isAllSuccess = successCount === result.items.length;
  const totalOriginal = result.items.reduce((acc, i) => acc + i.originalSize, 0);
  const totalOutput = result.items.reduce((acc, i) => acc + (i.outputSize || 0), 0);
  const totalSavingsBytes = Math.max(0, totalOriginal - totalOutput);
  const totalSavingsPercent = totalOriginal > 0 ? Math.round((totalSavingsBytes / totalOriginal) * 100) : 0;

  const handleOpenFile = (path?: string) => {
    if (path) window.electronAPI.openPath(path);
  };

  const handleOpenFolder = (path?: string) => {
    if (path) window.electronAPI.showItemInFolder(path);
  };

  return (
    <div className={`rounded-2xl bg-white border border-gray-100 shadow-card ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isAllSuccess ? '#ECFDF5' : '#FFFBEB' }}
        >
          {isAllSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            {isAllSuccess ? 'Operation Completed' : 'Completed with Notes'}
          </h4>
          <p className="text-xs text-gray-500">
            {result.operation === 'convert' ? 'Converted' : 'Compressed'} {successCount} of {result.items.length} file(s)
          </p>
        </div>
      </div>

      {result.operation === 'compress' && totalSavingsBytes > 0 && (
        <div
          className="p-3 rounded-xl mb-4 flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)' }}
        >
          <div>
            <div className="text-xs text-gray-500 font-medium">Space Saved</div>
            <div className="text-sm font-bold text-gray-900">
              {formatBytes(totalSavingsBytes)} ({totalSavingsPercent}% smaller)
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>{formatBytes(totalOriginal)} → <strong className="text-gray-800">{formatBytes(totalOutput)}</strong></div>
          </div>
        </div>
      )}

      {/* Output items list */}
      <div className="space-y-2 mb-5 max-h-48 overflow-y-auto pr-1">
        {result.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 text-xs"
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="font-medium text-gray-800 truncate" title={item.outputPath || item.originalPath}>
                {item.outputPath ? item.outputPath.split(/[\\/]/).pop() : item.originalPath.split(/[\\/]/).pop()}
              </div>
              <div className="text-gray-400 mt-0.5">
                {item.outputSize ? formatBytes(item.outputSize) : ''}
                {item.savingsPercent ? ` • ${item.savingsPercent}% saved` : ''}
                {item.errorMessage && <span className="text-rose-500"> ({item.errorMessage})</span>}
              </div>
            </div>

            {item.outputPath && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenFile(item.outputPath)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                  title="Open Output File"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenFolder(item.outputPath)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                  title="Show in Folder"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer inline-flex items-center justify-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Process Another File</span>
        </button>
      </div>
    </div>
  );
};
