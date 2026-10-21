import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import bmp from 'bmp-js';
import { ImageToImageOptions } from '../../shared/types';

// Load image buffer into sharp, handling BMP if needed
export async function loadImageToSharp(inputPath: string): Promise<sharp.Sharp> {
  const ext = path.extname(inputPath).replace('.', '').toLowerCase();
  if (ext === 'bmp') {
    const rawData = await fs.readFile(inputPath);
    const decoded = bmp.decode(rawData);
    return sharp(decoded.data, {
      raw: {
        width: decoded.width,
        height: decoded.height,
        channels: 4,
      },
    });
  }
  return sharp(inputPath);
}

export async function convertImageToImage(
  inputPath: string,
  outputPath: string,
  options: ImageToImageOptions
): Promise<void> {
  let pipeline = await loadImageToSharp(inputPath);
  const targetFormat = options.targetFormat.toLowerCase();

  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    // Flatten alpha with user-chosen background color (default #FFFFFF)
    pipeline = pipeline.flatten({ background: options.backgroundColor || '#FFFFFF' });
    await pipeline.jpeg({ quality: options.quality || 90 }).toFile(outputPath);
  } else if (targetFormat === 'png') {
    await pipeline.png({ quality: options.quality || 90 }).toFile(outputPath);
  } else if (targetFormat === 'webp') {
    await pipeline.webp({ quality: options.quality || 90 }).toFile(outputPath);
  } else if (targetFormat === 'tiff') {
    await pipeline.tiff({ quality: options.quality || 90 }).toFile(outputPath);
  } else if (targetFormat === 'bmp') {
    const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const encoded = bmp.encode({
      data,
      width: info.width,
      height: info.height,
    });
    await fs.writeFile(outputPath, encoded.data);
  } else {
    throw new Error(`Unsupported output format: ${targetFormat}`);
  }
}
