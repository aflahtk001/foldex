import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import bmp from 'bmp-js';
import { ImageCompressionOptions } from '../../shared/types';
import { loadImageToSharp } from './imageConverter';

export async function compressImage(
  inputPath: string,
  outputPath: string,
  options: ImageCompressionOptions
): Promise<void> {
  let pipeline = await loadImageToSharp(inputPath);

  // Resize if specified
  if (options.resizeWidth || options.resizeHeight) {
    pipeline = pipeline.resize(options.resizeWidth || null, options.resizeHeight || null, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Handle metadata stripping
  if (!options.stripMetadata) {
    pipeline = pipeline.withMetadata();
  }

  // Determine quality based on preset or custom quality
  let quality = options.quality;
  if (options.preset === 'low') {
    quality = 85;
  } else if (options.preset === 'balanced') {
    quality = 70;
  } else if (options.preset === 'high') {
    quality = 50;
  }

  // Determine target format
  const inputExt = path.extname(inputPath).replace('.', '').toLowerCase();
  let targetFormat = inputExt;
  if (options.targetFormat && options.targetFormat !== 'same') {
    targetFormat = options.targetFormat;
  }

  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    pipeline = pipeline.flatten({ background: '#FFFFFF' });
    await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outputPath);
  } else if (targetFormat === 'png') {
    // For PNG compression, use pngquant-like compression level
    const compressionLevel = quality < 60 ? 9 : quality < 80 ? 8 : 6;
    await pipeline.png({
      compressionLevel,
      palette: quality < 60,
      quality: quality
    }).toFile(outputPath);
  } else if (targetFormat === 'webp') {
    await pipeline.webp({ quality, effort: 5 }).toFile(outputPath);
  } else if (targetFormat === 'tiff') {
    await pipeline.tiff({ quality, compression: 'deflate' }).toFile(outputPath);
  } else if (targetFormat === 'bmp') {
    const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const encoded = bmp.encode({
      data,
      width: info.width,
      height: info.height,
    });
    await fs.writeFile(outputPath, encoded.data);
  } else {
    // Default fallback to JPEG
    await pipeline.jpeg({ quality }).toFile(outputPath);
  }
}
