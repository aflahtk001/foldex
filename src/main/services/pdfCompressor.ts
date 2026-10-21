import { PDFDocument } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { PdfCompressionOptions } from '../../shared/types';

export async function compressPdf(
  inputPath: string,
  outputPath: string,
  options: PdfCompressionOptions,
  onProgress?: (percent: number) => void
): Promise<{ originalSize: number; compressedSize: number; savingsBytes: number; savingsPercent: number }> {
  const origStat = await fs.stat(inputPath);
  const originalSize = origStat.size;

  if (options.preset === 'basic') {
    if (onProgress) onProgress(20);
    const existingBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingBytes, { ignoreEncryption: true });

    // Strip metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    if (onProgress) onProgress(60);
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

    if (compressedBytes.length < originalSize) {
      await fs.writeFile(outputPath, compressedBytes);
      const compressedSize = compressedBytes.length;
      const savingsBytes = originalSize - compressedSize;
      const savingsPercent = Math.round((savingsBytes / originalSize) * 100);
      if (onProgress) onProgress(100);
      return { originalSize, compressedSize, savingsBytes, savingsPercent };
    } else {
      // If basic compression didn't reduce size, copy original
      await fs.copyFile(inputPath, outputPath);
      if (onProgress) onProgress(100);
      return { originalSize, compressedSize: originalSize, savingsBytes: 0, savingsPercent: 0 };
    }
  }

  // Balanced or Strong preset: Raster & optimize page downsampling
  const dpi = options.preset === 'strong' ? 100 : 150;
  const jpegQuality = options.preset === 'strong' ? 60 : 75;
  const scale = dpi / 72;

  const pdfBytes = await fs.readFile(inputPath);
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDoc = await loadingTask.promise;

  const newDoc = await PDFDocument.create();
  const totalPages = pdfDoc.numPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx as any,
      viewport: viewport,
      canvas: canvas as any,
    } as any).promise;

    const rawPng = canvas.toBuffer('image/png');
    const compressedJpgBuf = await sharp(rawPng)
      .flatten({ background: '#FFFFFF' })
      .jpeg({ quality: jpegQuality, mozjpeg: true })
      .toBuffer();

    const embedded = await newDoc.embedJpg(compressedJpgBuf);
    const origViewport = page.getViewport({ scale: 1.0 });

    const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embedded, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });

    if (onProgress) {
      onProgress(Math.round((i / totalPages) * 90));
    }
  }

  const finalPdfBytes = await newDoc.save({ useObjectStreams: true });

  if (finalPdfBytes.length < originalSize) {
    await fs.writeFile(outputPath, finalPdfBytes);
    const compressedSize = finalPdfBytes.length;
    const savingsBytes = originalSize - compressedSize;
    const savingsPercent = Math.round((savingsBytes / originalSize) * 100);
    if (onProgress) onProgress(100);
    return { originalSize, compressedSize, savingsBytes, savingsPercent };
  } else {
    // Fall back to original file if re-encoding didn't reduce size
    await fs.copyFile(inputPath, outputPath);
    if (onProgress) onProgress(100);
    return { originalSize, compressedSize: originalSize, savingsBytes: 0, savingsPercent: 0 };
  }
}
