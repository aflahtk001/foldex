import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { TaskProgress } from '../../../shared/types';

interface TaskProgressViewProps {
  progress: TaskProgress;
  onCancel: () => void;
}

export const TaskProgressView: React.FC<TaskProgressViewProps> = ({
  progress,
  onCancel,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-primary-accent)' }} />
          <h4 className="text-sm font-semibold text-gray-800">
            {progress.statusText || 'Processing...'}
          </h4>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
          {progress.percent}%
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(5, progress.percent)}%`,
            backgroundColor: 'var(--color-primary-accent)',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="truncate max-w-[280px]">
          <span className="text-gray-400">File: </span>
          <span className="font-medium text-gray-700">{progress.currentFile}</span>
          {progress.totalFiles > 1 && (
            <span className="text-gray-400 ml-1">
              ({progress.currentIndex} of {progress.totalFiles})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center space-x-1 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};
