import { PDFDocument, PageSizes } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { ImageToPdfOptions, PdfToImageOptions } from '../../shared/types';
import { loadImageToSharp } from './imageConverter';

// Parse page range string like "1, 3-5, 8" into 1-based page numbers
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || rangeStr.trim() === '') {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pages.add(p);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  }

  const result = Array.from(pages).sort((a, b) => a - b);
  return result.length > 0 ? result : Array.from({ length: maxPages }, (_, i) => i + 1);
}

export async function convertImagesToPdf(
  inputPaths: string[],
  outputPath: string,
  options: ImageToPdfOptions
): Promise<string> {
  const doc = await PDFDocument.create();

  for (const imgPath of inputPaths) {
    const ext = path.extname(imgPath).replace('.', '').toLowerCase();
    let embeddedImg;

    if (ext === 'jpg' || ext === 'jpeg') {
      const bytes = await fs.readFile(imgPath);
      embeddedImg = await doc.embedJpg(bytes);
    } else if (ext === 'png') {
      const bytes = await fs.readFile(imgPath);
      embeddedImg = await doc.embedPng(bytes);
    } else {
      // WEBP, BMP, TIFF: convert to PNG buffer first
      const pipeline = await loadImageToSharp(imgPath);
      const pngBytes = await pipeline.png().toBuffer();
      embeddedImg = await doc.embedPng(pngBytes);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;
    const margin = options.margin || 0;

    let pageWidth = imgWidth + margin * 2;
    let pageHeight = imgHeight + margin * 2;
    let drawWidth = imgWidth;
    let drawHeight = imgHeight;
    let drawX = margin;
    let drawY = margin;

    if (options.pageSize === 'a4' || options.pageSize === 'letter') {
      let [stdWidth, stdHeight] = options.pageSize === 'a4' ? PageSizes.A4 : PageSizes.Letter;

      // Orientation handling
      let isLandscape = false;
      if (options.orientation === 'landscape') {
        isLandscape = true;
      } else if (options.orientation === 'portrait') {
        isLandscape = false;
      } else {
        // Auto
        isLandscape = imgWidth > imgHeight;
      }

      pageWidth = isLandscape ? Math.max(stdWidth, stdHeight) : Math.min(stdWidth, stdHeight);
      pageHeight = isLandscape ? Math.min(stdWidth, stdHeight) : Math.max(stdWidth, stdHeight);

      // Fit inside page margins
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;

      // Center in page
      drawX = margin + (availableWidth - drawWidth) / 2;
      drawY = margin + (availableHeight - drawHeight) / 2;
    }

    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const pdfBytes = await doc.save();
  await fs.writeFile(outputPath, pdfBytes);
  return outputPath;
}

export async function convertPdfToImages(
  inputPath: string,
  outputDir: string,
  options: PdfToImageOptions,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pdfBytes = await fs.readFile(inputPath);
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const targetPages = options.pageRange === 'custom' && options.customPages
    ? parsePageRange(options.customPages, totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const baseName = path.parse(inputPath).name;
  const targetFormat = options.targetFormat || 'png';
  const scale = (options.dpi || 150) / 72;
  const generatedFiles: string[] = [];

  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx as any,
      viewport: viewport,
      canvas: canvas as any,
    } as any).promise;

    const rawPngBuffer = canvas.toBuffer('image/png');
    const outFileName = `${baseName}_page_${pageNum}.${targetFormat}`;
    const outFilePath = path.join(outputDir, outFileName);

    let finalPipeline = sharp(rawPngBuffer);
    if ((targetFormat as string) === 'jpg' || (targetFormat as string) === 'jpeg') {
      finalPipeline = finalPipeline.flatten({ background: '#FFFFFF' }).jpeg({ quality: 90 });
    } else if (targetFormat === 'webp') {
      finalPipeline = finalPipeline.webp({ quality: 90 });
    } else {
      finalPipeline = finalPipeline.png();
    }

    await finalPipeline.toFile(outFilePath);
    generatedFiles.push(outFilePath);

    if (onProgress) {
      onProgress(idx + 1, targetPages.length);
    }
  }

  return generatedFiles;
}
