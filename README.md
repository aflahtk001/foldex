# Foldex (Windows Desktop Application)

Foldex is a modern, fast Windows desktop application built with Electron, React, TypeScript, Vite, Tailwind CSS, Sharp, and PDF.js / pdf-lib. Allows users to convert and compress files directly from Windows File Explorer using keyboard shortcuts (`Shift+C` to compress, `Shift+V` to convert) and a compact contextual popup.

---

## 🌐 Live Website & Downloads

- **Official Website**: [https://aflahtk001.github.io/foldex/](https://aflahtk001.github.io/foldex/)
- **Latest Release (v1.0.0)**: [https://github.com/aflahtk001/foldex/releases/tag/v1.0.0](https://github.com/aflahtk001/foldex/releases/tag/v1.0.0)

---

## Key Features

### 1. Windows File Explorer Integration
- **Global Keyboard Shortcuts**:
  - `Shift + C`: Opens instant contextual popup ready to **compress** selected files.
  - `Shift + V`: Opens instant contextual popup ready to **convert** selected files.
  - Selection is grabbed natively via PowerShell COM (`Shell.Application`) without requiring you to switch windows.
- **Shell Context Menu Integration**: Adds a clean right-click context menu entry (**"Convert or Compress with Foldex"**) to Windows File Explorer via `HKCU\Software\Classes` (no admin rights needed).
- **Background Tray Service**: Operates seamlessly from the Windows system tray with quick actions and background responsiveness.

### 2. Compact Popup Interface
- Fast, distraction-free popup window positioned near the active mouse pointer.
- Instant file metadata display: name, file type, file size, image thumbnail/preview.
- Context-aware action tabs (**Convert** vs **Compress**), tailoring available options to the selected file type.
- Output destination selector (beside original vs custom directory).
- One-click action button with real-time progress indicators and space-saved metrics.

### 3. File Conversion Engine
- **Image to PDF**:
  - Supports **JPG**, **JPEG**, **PNG**, **WEBP**, **BMP**, and **TIFF**.
  - Combine multiple images into a single consolidated PDF or create separate individual PDFs.
  - Page sizing options: Fit to Image, Standard A4, and US Letter.
  - Page orientation: Auto-detect, Portrait, or Landscape.
- **PDF to Image**:
  - Convert PDF pages to **PNG**, **JPG**, or **WEBP**.
  - DPI selection: 72 DPI (screen), 150 DPI (standard), and 300 DPI (high-fidelity print).
  - Page range selection: All pages or custom page ranges (e.g. `1, 3-5`).
- **Image to Image**:
  - Full matrix conversion between PNG, JPG, WEBP, BMP, and TIFF.
  - Transparency preservation across compatible formats.
- **Non-Destructive Guarantee**: Never overwrites original files; automatically renames collisions (`filename (1).ext`) unless configured otherwise.

### 4. File Compression Engine
- **Image Compression**:
  - Three distinct presets: **Low Compression** (higher quality), **Balanced** (optimal size/clarity), and **High Compression** (smallest file size).
  - Advanced image controls: manual quality slider (20% - 95%), max width/height resizing, and EXIF metadata stripping.
- **PDF Compression**:
  - **Basic**: Strips document metadata and applies PDF object stream compression.
  - **Balanced / Strong**: Intelligent downsampling and JPEG re-encoding of rasterized pages with preserved layout.
  - Detailed real-time metric breakdown: original size, compressed size, space saved in bytes, and percentage reduction.

### 5. Design System & Theme Foundation
- Foundation color token: **`#F5EFE1`** (Warm Linen).
- Clean, minimal light mode interface with white dominant surfaces and neutral gray typography.
- Live color picker in Settings allowing immediate real-time restyling across the entire application.

---

## 👨‍💻 Developer & Author

**AFLAH TK**
- **GitHub**: [@aflahtk001](https://github.com/aflahtk001)
- **Portfolio**: [https://aflahtk001.github.io/portfolio/](https://aflahtk001.github.io/portfolio/)
- **Twitter / X**: [@aflahthorakatil](https://twitter.com/aflahthorakatil)
- **Email**: aflahthorakkattil@gmail.com
- **Location**: Kerala, India

---

## Development and Build Commands

### 1. Run in Development
```bash
npm start
```

### 2. Run Comprehensive Functional Tests
Executes all 17 end-to-end tests validating conversions, compressions, resize filters, and collision safety:
```bash
node test/functional-tests.js
```

### 3. Build Production Binaries & Windows Installer
Compiles the React frontend, builds the TypeScript main process, and runs Electron Builder to generate the installer and portable application:
```bash
npm run package
```
Output files will be generated in `release/`:
- `release/Foldex Setup 1.0.0.exe` (NSIS Installer)
- `release/Foldex 1.0.0.exe` (Portable EXE)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
