import React from 'react';
import { FileImage, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FileItem } from '../../../shared/types';
import { formatBytes } from '../utils/formatters';

interface FileCardProps {
  file: FileItem;
  onRemove?: () => void;
  status?: 'pending' | 'processing' | 'success' | 'failed';
  errorMessage?: string;
  compact?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onRemove,
  status,
  errorMessage,
  compact = false,
}) => {
  return (
    <div
      className={`group relative flex items-center justify-between rounded-xl border border-gray-100 bg-white transition-all shadow-subtle hover:border-gray-200 ${
        compact ? 'p-2.5' : 'p-3.5'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 pr-2">
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            {file.fileType === 'pdf' ? (
              <FileText className="w-5 h-5 text-red-500" />
            ) : (
              <FileImage className="w-5 h-5" style={{ color: 'var(--color-primary-accent)' }} />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
            <span className="uppercase font-semibold text-[10px] tracking-wide px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
              {file.extension}
            </span>
            <span>{formatBytes(file.size)}</span>
            {file.dimensions && (
              <span>• {file.dimensions.width}×{file.dimensions.height}px</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        {status === 'processing' && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary-accent)' }} />
        )}
        {status === 'success' && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
        {status === 'failed' && (
          <AlertCircle className="w-4 h-4 text-rose-500" title={errorMessage || 'Failed'} />
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
