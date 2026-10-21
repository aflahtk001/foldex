const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const bmp = require('bmp-js');
const { PDFDocument } = require('pdf-lib');

const { convertImageToImage } = require('../dist-electron/main/services/imageConverter');
const { compressImage } = require('../dist-electron/main/services/imageCompressor');
const { convertImagesToPdf, convertPdfToImages } = require('../dist-electron/main/services/pdfConverter');
const { compressPdf } = require('../dist-electron/main/services/pdfCompressor');
const { loadSettings, saveSettings } = require('../dist-electron/main/services/settingsStore');
const { loadHistory, addHistoryItem, clearHistory } = require('../dist-electron/main/services/historyStore');
const { getOutputPath } = require('../dist-electron/main/services/outputManager');

const TEST_DIR = path.resolve(__dirname, 'test-artifacts');

async function setupTestFiles() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });

  console.log('Generating test fixtures...');

  // 1. Generate test PNG with transparency
  const pngBuf = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 255, g: 100, b: 50, alpha: 0.5 },
    },
  }).png().toBuffer();
  fs.writeFileSync(path.join(TEST_DIR, 'sample.png'), pngBuf);

  // 2. Generate test JPG
  const jpgBuf = await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 3,
      background: { r: 50, g: 150, b: 220 },
    },
  }).jpeg().toBuffer();
  fs.writeFileSync(path.join(TEST_DIR, 'sample.jpg'), jpgBuf);

  // 3. Generate test WEBP
  const webpBuf = await sharp({
    create: {
      width: 250,
      height: 250,
      channels: 4,
      background: { r: 40, g: 180, b: 90, alpha: 1 },
    },
  }).webp().toBuffer();
  fs.writeFileSync(path.join(TEST_DIR, 'sample.webp'), webpBuf);

  // 4. Generate test BMP
  const bmpData = Buffer.alloc(100 * 100 * 4);
  for (let i = 0; i < bmpData.length; i += 4) {
    bmpData[i] = 200;
    bmpData[i + 1] = 50;
    bmpData[i + 2] = 120;
    bmpData[i + 3] = 255;
  }
  const encodedBmp = bmp.encode({ data: bmpData, width: 100, height: 100 });
  fs.writeFileSync(path.join(TEST_DIR, 'sample.bmp'), encodedBmp.data);

  // 5. Generate test TIFF
  const tiffBuf = await sharp({
    create: {
      width: 150,
      height: 150,
      channels: 3,
      background: { r: 180, g: 70, b: 200 },
    },
  }).tiff().toBuffer();
  fs.writeFileSync(path.join(TEST_DIR, 'sample.tiff'), tiffBuf);

  // 6. Generate test multipage PDF
  const pdfDoc = await PDFDocument.create();
  const page1 = pdfDoc.addPage([400, 300]);
  const imgEmbed = await pdfDoc.embedJpg(jpgBuf);
  page1.drawImage(imgEmbed, { x: 0, y: 0, width: 400, height: 300 });

  const page2 = pdfDoc.addPage([300, 400]);
  const pngEmbed = await pdfDoc.embedPng(pngBuf);
  page2.drawImage(pngEmbed, { x: 50, y: 50, width: 200, height: 200 });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(TEST_DIR, 'sample.pdf'), pdfBytes);

  console.log('Test fixtures created successfully.\n');
}

async function runTests() {
  await setupTestFiles();
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  console.log('--- TEST SUITE 1: Image to Image Conversions ---');
  try {
    // 1. PNG to JPG (with background flattening)
    const pngToJpgOut = path.join(TEST_DIR, 'out_png_to_jpg.jpg');
    await convertImageToImage(path.join(TEST_DIR, 'sample.png'), pngToJpgOut, {
      targetFormat: 'jpg',
      backgroundColor: '#FFFFFF',
      quality: 90,
    });
    assert(fs.existsSync(pngToJpgOut) && fs.statSync(pngToJpgOut).size > 0, 'PNG to JPG conversion');

    // 2. JPG to PNG
    const jpgToPngOut = path.join(TEST_DIR, 'out_jpg_to_png.png');
    await convertImageToImage(path.join(TEST_DIR, 'sample.jpg'), jpgToPngOut, {
      targetFormat: 'png',
      backgroundColor: '#FFFFFF',
      quality: 90,
    });
    assert(fs.existsSync(jpgToPngOut) && fs.statSync(jpgToPngOut).size > 0, 'JPG to PNG conversion');

    // 3. PNG to WEBP
    const pngToWebpOut = path.join(TEST_DIR, 'out_png_to_webp.webp');
    await convertImageToImage(path.join(TEST_DIR, 'sample.png'), pngToWebpOut, {
      targetFormat: 'webp',
      backgroundColor: '#FFFFFF',
      quality: 85,
    });
    assert(fs.existsSync(pngToWebpOut) && fs.statSync(pngToWebpOut).size > 0, 'PNG to WEBP conversion');

    // 4. BMP to PNG
    const bmpToPngOut = path.join(TEST_DIR, 'out_bmp_to_png.png');
    await convertImageToImage(path.join(TEST_DIR, 'sample.bmp'), bmpToPngOut, {
      targetFormat: 'png',
      backgroundColor: '#FFFFFF',
      quality: 90,
    });
    assert(fs.existsSync(bmpToPngOut) && fs.statSync(bmpToPngOut).size > 0, 'BMP to PNG conversion');

    // 5. TIFF to JPG
    const tiffToJpgOut = path.join(TEST_DIR, 'out_tiff_to_jpg.jpg');
    await convertImageToImage(path.join(TEST_DIR, 'sample.tiff'), tiffToJpgOut, {
      targetFormat: 'jpg',
      backgroundColor: '#FFFFFF',
      quality: 90,
    });
    assert(fs.existsSync(tiffToJpgOut) && fs.statSync(tiffToJpgOut).size > 0, 'TIFF to JPG conversion');

    // 6. JPG to BMP
    const jpgToBmpOut = path.join(TEST_DIR, 'out_jpg_to_bmp.bmp');
    await convertImageToImage(path.join(TEST_DIR, 'sample.jpg'), jpgToBmpOut, {
      targetFormat: 'bmp',
      backgroundColor: '#FFFFFF',
      quality: 90,
    });
    assert(fs.existsSync(jpgToBmpOut) && fs.statSync(jpgToBmpOut).size > 0, 'JPG to BMP conversion');
  } catch (err) {
    console.error('Image conversion error:', err);
    failed++;
  }

  console.log('\n--- TEST SUITE 2: Image to PDF Conversions ---');
  try {
    // 1. Combine multiple formats (JPG, PNG, WEBP, BMP, TIFF) into single PDF
    const combinedPdfOut = path.join(TEST_DIR, 'out_combined.pdf');
    const inputImages = [
      path.join(TEST_DIR, 'sample.jpg'),
      path.join(TEST_DIR, 'sample.png'),
      path.join(TEST_DIR, 'sample.webp'),
      path.join(TEST_DIR, 'sample.bmp'),
      path.join(TEST_DIR, 'sample.tiff'),
    ];
    await convertImagesToPdf(inputImages, combinedPdfOut, {
      combineMode: 'single_pdf',
      pageSize: 'fit',
      orientation: 'auto',
      margin: 10,
    });
    assert(fs.existsSync(combinedPdfOut) && fs.statSync(combinedPdfOut).size > 0, 'Multi-image to single PDF');

    // Verify page count of combined PDF
    const combinedBytes = fs.readFileSync(combinedPdfOut);
    const loadedDoc = await PDFDocument.load(combinedBytes);
    assert(loadedDoc.getPageCount() === 5, 'Combined PDF contains exact 5 pages');

    // 2. Standard A4 sizing with landscape auto-detect
    const a4PdfOut = path.join(TEST_DIR, 'out_a4.pdf');
    await convertImagesToPdf([path.join(TEST_DIR, 'sample.jpg')], a4PdfOut, {
      combineMode: 'separate_pdfs',
      pageSize: 'a4',
      orientation: 'auto',
      margin: 20,
    });
    assert(fs.existsSync(a4PdfOut), 'Single image to A4 PDF with margins');
  } catch (err) {
    console.error('Image to PDF error:', err);
    failed++;
  }

  console.log('\n--- TEST SUITE 3: PDF to Image Conversions ---');
  try {
    const pdfIn = path.join(TEST_DIR, 'sample.pdf');

    // 1. Convert all pages to PNG at 150 DPI
    const genPngs = await convertPdfToImages(pdfIn, TEST_DIR, {
      targetFormat: 'png',
      dpi: 150,
      pageRange: 'all',
    });
    assert(genPngs.length === 2, `PDF to PNG produced ${genPngs.length} pages (expected 2)`);
    assert(fs.existsSync(genPngs[0]) && fs.existsSync(genPngs[1]), 'PDF page PNG files exist on disk');

    // 2. Convert specific page range to JPG
    const genJpgs = await convertPdfToImages(pdfIn, TEST_DIR, {
      targetFormat: 'jpg',
      dpi: 72,
      pageRange: 'custom',
      customPages: '1',
    });
    assert(genJpgs.length === 1, `PDF page range "1" produced 1 image`);
  } catch (err) {
    console.error('PDF to Image error:', err);
    failed++;
  }

  console.log('\n--- TEST SUITE 4: Image Compression ---');
  try {
    // 1. High compression preset
    const compHighOut = path.join(TEST_DIR, 'out_comp_high.jpg');
    const origStat = fs.statSync(path.join(TEST_DIR, 'sample.jpg'));
    await compressImage(path.join(TEST_DIR, 'sample.jpg'), compHighOut, {
      preset: 'high',
      quality: 50,
      stripMetadata: true,
      targetFormat: 'same',
    });
    const highStat = fs.statSync(compHighOut);
    assert(fs.existsSync(compHighOut) && highStat.size <= origStat.size, 'High compression produces smaller or equal image');

    // 2. Image compression with max dimensions resize
    const compResizeOut = path.join(TEST_DIR, 'out_comp_resize.jpg');
    await compressImage(path.join(TEST_DIR, 'sample.jpg'), compResizeOut, {
      preset: 'custom',
      quality: 60,
      resizeWidth: 150,
      resizeHeight: 150,
      stripMetadata: true,
    });
    const resizeMeta = await sharp(compResizeOut).metadata();
    assert(resizeMeta.width <= 150 && resizeMeta.height <= 150, 'Image compression resize bounds enforced');
  } catch (err) {
    console.error('Image compression error:', err);
    failed++;
  }

  console.log('\n--- TEST SUITE 5: PDF Compression ---');
  try {
    const pdfIn = path.join(TEST_DIR, 'sample.pdf');
    const compPdfBasic = path.join(TEST_DIR, 'out_comp_pdf_basic.pdf');

    const resBasic = await compressPdf(pdfIn, compPdfBasic, { preset: 'basic' });
    assert(fs.existsSync(compPdfBasic) && resBasic.originalSize > 0, 'Basic PDF compression executes');

    const compPdfStrong = path.join(TEST_DIR, 'out_comp_pdf_strong.pdf');
    const resStrong = await compressPdf(pdfIn, compPdfStrong, { preset: 'strong' });
    assert(fs.existsSync(compPdfStrong) && resStrong.compressedSize > 0, 'Strong PDF compression executes and produces valid output');
  } catch (err) {
    console.error('PDF compression error:', err);
    failed++;
  }

  console.log('\n--- TEST SUITE 6: Output Manager & Overwrite Safety ---');
  try {
    const orig = path.join(TEST_DIR, 'sample.png');

    // Test non-overwrite collision avoidance
    const path1 = await getOutputPath(orig, 'png', '_converted', {
      destinationType: 'beside_original',
      overwriteBehavior: 'ask',
    });
    fs.writeFileSync(path1, 'test-1');

    const path2 = await getOutputPath(orig, 'png', '_converted', {
      destinationType: 'beside_original',
      overwriteBehavior: 'ask',
    });

    assert(path1 !== path2 && path2.includes('(1)'), `Auto-rename generates non-colliding name: ${path2}`);
  } catch (err) {
    console.error('Output manager error:', err);
    failed++;
  }

  console.log('\n====================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
