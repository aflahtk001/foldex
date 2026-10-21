import fs from 'fs/promises';
import path from 'path';
import { BrowserWindow } from 'electron';
import {
  FileItem,
  OutputSettings,
  ImageToImageOptions,
  ImageToPdfOptions,
  PdfToImageOptions,
  ImageCompressionOptions,
  PdfCompressionOptions,
  TaskResult,
  TaskResultItem,
  TaskProgress,
  HistoryItem
} from '../../shared/types';
import { getOutputPath } from './outputManager';
import { convertImageToImage } from './imageConverter';
import { compressImage } from './imageCompressor';
import { convertImagesToPdf, convertPdfToImages } from './pdfConverter';
import { compressPdf } from './pdfCompressor';
import { addHistoryItem } from './historyStore';

export class TaskProcessor {
  private activeTaskId: string | null = null;
  private isCancelled: boolean = false;

  public cancelActiveTask(): void {
    this.isCancelled = true;
  }

  public isBusy(): boolean {
    return this.activeTaskId !== null;
  }

  // Convert Task
  public async executeConvert(
    files: FileItem[],
    outputSettings: OutputSettings,
    options: {
      imageToImage?: ImageToImageOptions;
      imageToPdf?: ImageToPdfOptions;
      pdfToImage?: PdfToImageOptions;
    },
    targetWindow?: BrowserWindow
  ): Promise<TaskResult> {
    const taskId = `convert_${Date.now()}`;
    this.activeTaskId = taskId;
    this.isCancelled = false;

    const resultItems: TaskResultItem[] = [];

    const sendProgress = (currentFile: string, currentIndex: number, percent: number, statusText: string) => {
      if (targetWindow && !targetWindow.isDestroyed()) {
        const progress: TaskProgress = {
          taskId,
          currentFile,
          currentIndex,
          totalFiles: files.length,
          percent,
          statusText,
          isCancelled: this.isCancelled,
        };
        targetWindow.webContents.send('task:progress', progress);
      }
    };

    try {
      // Special case: Multiple images combined into single PDF
      if (options.imageToPdf && options.imageToPdf.combineMode === 'single_pdf') {
        const firstFile = files[0];
        sendProgress(firstFile.name, 1, 10, 'Combining images into single PDF...');

        const targetExt = 'pdf';
        const outPath = await getOutputPath(firstFile.path, targetExt, '_combined', outputSettings);
        const inputPaths = files.map(f => f.path);

        try {
          await convertImagesToPdf(inputPaths, outPath, options.imageToPdf);
          const outStat = await fs.stat(outPath);
          const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);

          resultItems.push({
            originalPath: inputPaths.join('; '),
            originalSize: totalOriginalSize,
            outputPath: outPath,
            outputSize: outStat.size,
            status: 'success',
          });
          sendProgress(path.basename(outPath), files.length, 100, 'Combined PDF created successfully');
        } catch (err: any) {
          resultItems.push({
            originalPath: inputPaths.join('; '),
            originalSize: 0,
            status: 'failed',
            errorMessage: err.message || 'Failed to combine images into PDF',
          });
        }
      } else {
        // Individual file processing
        for (let i = 0; i < files.length; i++) {
          if (this.isCancelled) {
            resultItems.push({
              originalPath: files[i].path,
              originalSize: files[i].size,
              status: 'cancelled',
              errorMessage: 'Task was cancelled by user',
            });
            continue;
          }

          const file = files[i];
          const progressBase = Math.round((i / files.length) * 100);
          sendProgress(file.name, i + 1, progressBase, `Processing ${file.name}...`);

          try {
            if (file.fileType === 'pdf' && options.pdfToImage) {
              // PDF to Image
              const dir = outputSettings.destinationType === 'custom_folder' && outputSettings.customFolderPath
                ? outputSettings.customFolderPath
                : path.dirname(file.path);

              const generatedFiles = await convertPdfToImages(file.path, dir, options.pdfToImage, (curr, total) => {
                const subPercent = progressBase + Math.round((curr / total) * (100 / files.length));
                sendProgress(file.name, i + 1, subPercent, `Rendering page ${curr} of ${total}...`);
              });

              let totalGeneratedSize = 0;
              for (const genPath of generatedFiles) {
                const s = await fs.stat(genPath);
                totalGeneratedSize += s.size;
              }

              resultItems.push({
                originalPath: file.path,
                originalSize: file.size,
                outputPath: generatedFiles[0], // First page or directory
                outputSize: totalGeneratedSize,
                status: 'success',
              });
            } else if (file.fileType === 'image' && options.imageToPdf) {
              // Image to PDF (separate)
              const outPath = await getOutputPath(file.path, 'pdf', '_converted', outputSettings);
              await convertImagesToPdf([file.path], outPath, options.imageToPdf);
              const outStat = await fs.stat(outPath);

              resultItems.push({
                originalPath: file.path,
                originalSize: file.size,
                outputPath: outPath,
                outputSize: outStat.size,
                status: 'success',
              });
            } else if (file.fileType === 'image' && options.imageToImage) {
              // Image to Image
              const outPath = await getOutputPath(file.path, options.imageToImage.targetFormat, '_converted', outputSettings);
              await convertImageToImage(file.path, outPath, options.imageToImage);
              const outStat = await fs.stat(outPath);

              resultItems.push({
                originalPath: file.path,
                originalSize: file.size,
                outputPath: outPath,
                outputSize: outStat.size,
                status: 'success',
              });
            } else {
              resultItems.push({
                originalPath: file.path,
                originalSize: file.size,
                status: 'failed',
                errorMessage: 'Unsupported conversion for this file type',
              });
            }
          } catch (err: any) {
            resultItems.push({
              originalPath: file.path,
              originalSize: file.size,
              status: 'failed',
              errorMessage: err.message || 'Conversion error',
            });
          }
        }
      }
    } finally {
      this.activeTaskId = null;
    }

    const taskResult: TaskResult = {
      id: taskId,
      operation: 'convert',
      timestamp: Date.now(),
      items: resultItems,
    };

    // Save to history
    this.recordHistory(taskResult);

    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('task:completed', taskResult);
    }

    return taskResult;
  }

  // Compress Task
  public async executeCompress(
    files: FileItem[],
    outputSettings: OutputSettings,
    options: {
      imageCompression?: ImageCompressionOptions;
      pdfCompression?: PdfCompressionOptions;
    },
    targetWindow?: BrowserWindow
  ): Promise<TaskResult> {
    const taskId = `compress_${Date.now()}`;
    this.activeTaskId = taskId;
    this.isCancelled = false;

    const resultItems: TaskResultItem[] = [];

    const sendProgress = (currentFile: string, currentIndex: number, percent: number, statusText: string) => {
      if (targetWindow && !targetWindow.isDestroyed()) {
        const progress: TaskProgress = {
          taskId,
          currentFile,
          currentIndex,
          totalFiles: files.length,
          percent,
          statusText,
          isCancelled: this.isCancelled,
        };
        targetWindow.webContents.send('task:progress', progress);
      }
    };

    try {
      for (let i = 0; i < files.length; i++) {
        if (this.isCancelled) {
          resultItems.push({
            originalPath: files[i].path,
            originalSize: files[i].size,
            status: 'cancelled',
            errorMessage: 'Task was cancelled by user',
          });
          continue;
        }

        const file = files[i];
        const progressBase = Math.round((i / files.length) * 100);
        sendProgress(file.name, i + 1, progressBase, `Compressing ${file.name}...`);

        try {
          if (file.fileType === 'image' && options.imageCompression) {
            const ext = options.imageCompression.targetFormat && options.imageCompression.targetFormat !== 'same'
              ? options.imageCompression.targetFormat
              : file.extension;

            const outPath = await getOutputPath(file.path, ext, '_compressed', outputSettings);
            await compressImage(file.path, outPath, options.imageCompression);
            const outStat = await fs.stat(outPath);

            const savingsBytes = Math.max(0, file.size - outStat.size);
            const savingsPercent = Math.round((savingsBytes / file.size) * 100);

            resultItems.push({
              originalPath: file.path,
              originalSize: file.size,
              outputPath: outPath,
              outputSize: outStat.size,
              savingsBytes,
              savingsPercent,
              status: 'success',
            });
          } else if (file.fileType === 'pdf' && options.pdfCompression) {
            const outPath = await getOutputPath(file.path, 'pdf', '_compressed', outputSettings);
            const res = await compressPdf(file.path, outPath, options.pdfCompression, (percent) => {
              const subPercent = progressBase + Math.round((percent / 100) * (100 / files.length));
              sendProgress(file.name, i + 1, subPercent, `Compressing PDF (${percent}%)...`);
            });

            resultItems.push({
              originalPath: file.path,
              originalSize: res.originalSize,
              outputPath: outPath,
              outputSize: res.compressedSize,
              savingsBytes: res.savingsBytes,
              savingsPercent: res.savingsPercent,
              status: 'success',
            });
          } else {
            resultItems.push({
              originalPath: file.path,
              originalSize: file.size,
              status: 'failed',
              errorMessage: 'Unsupported compression for this file type',
            });
          }
        } catch (err: any) {
          resultItems.push({
            originalPath: file.path,
            originalSize: file.size,
            status: 'failed',
            errorMessage: err.message || 'Compression error',
          });
        }
      }
    } finally {
      this.activeTaskId = null;
    }

    const taskResult: TaskResult = {
      id: taskId,
      operation: 'compress',
      timestamp: Date.now(),
      items: resultItems,
    };

    // Save to history
    this.recordHistory(taskResult);

    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('task:completed', taskResult);
    }

    return taskResult;
  }

  private recordHistory(result: TaskResult): void {
    const successItems = result.items.filter(it => it.status === 'success');
    const totalOrig = result.items.reduce((acc, it) => acc + it.originalSize, 0);
    const totalOut = result.items.reduce((acc, it) => acc + (it.outputSize || 0), 0);

    const historyItem: HistoryItem = {
      id: result.id,
      timestamp: result.timestamp,
      operation: result.operation,
      sourceFiles: result.items.map(it => it.originalPath),
      outputFiles: successItems.map(it => it.outputPath!).filter(Boolean),
      originalSize: totalOrig,
      outputSize: totalOut,
      status: successItems.length === result.items.length ? 'completed' : successItems.length > 0 ? 'partial' : 'failed',
      details: `${result.operation === 'convert' ? 'Converted' : 'Compressed'} ${successItems.length} of ${result.items.length} file(s)`,
    };

    addHistoryItem(historyItem);
  }
}
