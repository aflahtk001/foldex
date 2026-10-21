import React, { useState } from 'react';
import { UploadCloud, FileImage, FileText, Plus } from 'lucide-react';
import { FileItem } from '../../../shared/types';

interface FileDropzoneProps {
  onFilesSelected: (files: FileItem[]) => void;
  compact?: boolean;
  acceptedFormatsText?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  compact = false,
  acceptedFormatsText = 'JPG, PNG, WEBP, BMP, TIFF, PDF',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const paths = files.map((f: any) => f.path).filter(Boolean);
      if (paths.length > 0) {
        const inspected = await window.electronAPI.inspectFiles(paths);
        if (inspected.length > 0) {
          onFilesSelected(inspected);
        }
      }
    }
  };

  const handleBrowse = async () => {
    const files = await window.electronAPI.pickFiles();
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowse}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-600 bg-amber-50/50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
          <UploadCloud className="w-5 h-5 text-gray-400" />
          <span>Drop files or <strong className="text-gray-700 underline font-medium">browse</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
        isDragging
          ? 'border-amber-600 bg-amber-50/40 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 bg-surface'
      }`}
    >
      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <UploadCloud className="w-8 h-8" style={{ color: 'var(--color-primary-accent)' }} />
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Select or drag and drop files
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Supports {acceptedFormatsText}
        </p>

        <button
          type="button"
          onClick={handleBrowse}
          className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-800 shadow-subtle border transition-all cursor-pointer inline-flex items-center space-x-2 hover:shadow"
          style={{
            backgroundColor: 'var(--color-primary)',
            borderColor: 'var(--color-primary-border)',
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Choose Files</span>
        </button>
      </div>
    </div>
  );
};
