# File Converter & Compressor (Windows Desktop Application)

A modern, fast Windows desktop application built with Electron, React, TypeScript, Vite, Tailwind CSS, Sharp, and PDF.js / pdf-lib. Allows users to convert and compress files directly from Windows File Explorer using keyboard shortcuts and a compact contextual popup.

---

## Key Features

### 1. Windows File Explorer Integration
- **Global Keyboard Shortcut**: Default `Shift + Alt + C` (customizable in Settings). When pressed inside Windows File Explorer (or Desktop), a lightweight PowerShell COM query retrieves the active selection and displays the contextual popup right near your cursor.
- **Shell Context Menu Integration**: Adds a clean right-click context menu entry (**"Convert or Compress"**) to Windows File Explorer via `HKCU\Software\Classes` (no admin rights needed; can be toggled on/off in Settings).
- **Background Tray Service**: Operates seamlessly from the Windows system tray with quick-launch shortcuts and background responsiveness.

### 2. Compact Popup Interface
- Fast, distraction-free popup window positioned near the active mouse pointer.
- Instant file metadata display: name, file type, file size, image thumbnail/preview.
- Context-aware action tabs (**Convert** vs **Compress**), tailoring available options to the selected file type.
- Output destination selector (beside original vs custom directory).
- One-click action button with real-time progress indicators and space-saved metrics.
- Seamless escalation button to open the full main application.

### 3. File Conversion Engine
- **Image to PDF**:
  - Supports **JPG**, **JPEG**, **PNG**, **WEBP**, **BMP**, and **TIFF**.
  - Combine multiple images into a single consolidated PDF or create separate individual PDFs.
  - Page sizing options: Fit to Image, Standard A4, and US Letter.
  - Page orientation: Auto-detect, Portrait, or Landscape.
  - Configurable page margins.
- **PDF to Image**:
  - Convert PDF pages to **PNG**, **JPG**, or **WEBP**.
  - DPI selection: 72 DPI (screen), 150 DPI (standard), and 300 DPI (high-fidelity print).
  - Page range selection: All pages or custom page ranges (e.g. `1, 3-5`).
  - Multipage documents saved as separate organized images.
- **Image to Image**:
  - Full matrix conversion between PNG, JPG, WEBP, BMP, and TIFF.
  - Transparency preservation across compatible formats.
  - Automatic background flattening with configurable background color (default white) when converting transparent images to JPG.
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
- Fully parameterized CSS variables generating an 11-step tonal scale (`50` through `950`), hover states, border tokens, and contrast-checked text.
- Live color picker in Settings allowing immediate real-time restyling across the entire application without touching components.

---

## Project Structure

```
├── dist-electron/            # Compiled Electron main process and preload scripts
├── dist-renderer/            # Production Vite React build assets
├── release/                  # Packaged Windows installer & portable binaries
│   ├── File Converter & Compressor Setup 1.0.0.exe  # NSIS installer
│   ├── File Converter & Compressor 1.0.0.exe        # Standalone portable EXE
│   └── win-unpacked/                               # Unpacked application files
├── src/
│   ├── main/                 # Electron Main Process
│   │   ├── services/
│   │   │   ├── contextMenu.ts         # Windows Shell Registry context menu
│   │   │   ├── explorerIntegration.ts # PowerShell COM File Explorer selection
│   │   │   ├── getExplorerSelection.ps1# Windows COM script
│   │   │   ├── historyStore.ts        # Processing history storage
│   │   │   ├── imageCompressor.ts     # Sharp image compressor
│   │   │   ├── imageConverter.ts      # Sharp + bmp-js format converter
│   │   │   ├── outputManager.ts       # Output filename generation & safety
│   │   │   ├── pdfCompressor.ts       # PDF stream & downsample compressor
│   │   │   ├── pdfConverter.ts        # pdf-lib + pdfjs-dist / canvas converter
│   │   │   ├── settingsStore.ts       # App settings persistence
│   │   │   ├── shortcuts.ts           # Global keyboard shortcut manager
│   │   │   └── taskProcessor.ts       # Batch task execution & progress coordinator
│   │   ├── windows/
│   │   │   └── windowManager.ts       # Main window & compact popup manager
│   │   └── index.ts                   # Application lifecycle, tray, and IPC handlers
│   ├── preload/
│   │   └── index.ts                   # Context-isolated secure preload bridge
│   ├── renderer/             # React + Vite Frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── views/
│   │   │   │   │   ├── HomeView.tsx
│   │   │   │   │   ├── ConvertView.tsx
│   │   │   │   │   ├── CompressView.tsx
│   │   │   │   │   ├── HistoryView.tsx
│   │   │   │   │   └── SettingsView.tsx
│   │   │   │   ├── FileCard.tsx
│   │   │   │   ├── FileDropzone.tsx
│   │   │   │   ├── MainApp.tsx
│   │   │   │   ├── PopupApp.tsx
│   │   │   │   ├── TaskProgressView.tsx
│   │   │   │   └── TaskResultView.tsx
│   │   │   ├── theme/
│   │   │   │   └── theme.ts           # Centralized token & shade generator
│   │   │   ├── utils/
│   │   │   │   └── formatters.ts
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   └── main.tsx
│   │   └── index.html
│   └── shared/
│       └── types.ts          # Shared TypeScript models and settings contracts
├── test/
│   └── functional-tests.js   # 17-test end-to-end processing test suite
└── package.json
```

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
- `release/File Converter & Compressor Setup 1.0.0.exe` (NSIS Installer)
- `release/File Converter & Compressor 1.0.0.exe` (Portable EXE)
