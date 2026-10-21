import React, { useState, useEffect } from 'react';
import {
  AppSettings
} from '../../../../shared/types';
import { CustomSelect } from '../CustomSelect';
import {
  Palette,
  Keyboard,
  FolderOpen,
  Monitor,
  ShieldCheck,
  Check,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { applyTheme, generateShades } from '../../theme/theme';
import { isValidHex } from '../../utils/formatters';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSettingsUpdated: (newSettings: AppSettings) => void;
}

const PRESET_COLORS = [
  { name: 'Warm Linen (Primary)', hex: '#F5EFE1' },
  { name: 'Classic Slate', hex: '#E2E8F0' },
  { name: 'Soft Amber', hex: '#FDE68A' },
  { name: 'Warm Cream', hex: '#FEF3C7' },
  { name: 'Sage Green', hex: '#D1FAE5' },
  { name: 'Sky Tint', hex: '#E0F2FE' },
  { name: 'Indigo Light', hex: '#E0E7FF' },
  { name: 'Royal Blue', hex: '#2563EB' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<AppSettings | null>(settings);
  const [hexInput, setHexInput] = useState<string>(settings?.primaryColor || '#F5EFE1');
  const [shortcutInput, setShortcutInput] = useState<string>(settings?.globalShortcut || 'Shift+Alt+C');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHexInput(settings.primaryColor);
      setShortcutInput(settings.globalShortcut);
    }
  }, [settings]);

  if (!formData) return null;

  const handleColorChange = (newHex: string) => {
    setHexInput(newHex);
    if (isValidHex(newHex)) {
      const normalized = newHex.startsWith('#') ? newHex : `#${newHex}`;
      applyTheme(normalized);
      const updated = { ...formData, primaryColor: normalized };
      setFormData(updated);
      window.electronAPI.saveSettings({ primaryColor: normalized }).then(onSettingsUpdated);
    }
  };

  const handlePickFolder = async () => {
    const folder = await window.electronAPI.pickFolder();
    if (folder) {
      const updated = {
        ...formData,
        customDestinationPath: folder,
        defaultDestination: 'custom_folder' as const,
      };
      setFormData(updated);
      save(updated);
    }
  };

  const save = async (dataToSave?: AppSettings) => {
    const toSave = dataToSave || formData;
    const updated = await window.electronAPI.saveSettings(toSave);
    onSettingsUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const shades = generateShades(formData.primaryColor);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Theme Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              <Palette className="w-5 h-5" style={{ color: 'var(--color-primary-accent)' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Design System & Color Tokens</h3>
              <p className="text-xs text-gray-500">
                Centralized primary color foundation. Updating here dynamically scales all shades, borders, and interactive accents.
              </p>
            </div>
          </div>
        </div>

        {/* Color picker & presets */}
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.primaryColor.startsWith('#') ? formData.primaryColor : `#${formData.primaryColor}`}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300 bg-transparent p-0.5"
              />
              <div>
                <label className="text-[10px] font-semibold uppercase text-gray-400 block">Hex Code</label>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-28 text-xs font-mono font-medium p-1.5 border border-gray-200 rounded-lg bg-white uppercase"
                  placeholder="#F5EFE1"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-semibold uppercase text-gray-400 block mb-1.5">Preset Palettes</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => handleColorChange(preset.hex)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-xs text-gray-700 transition-colors cursor-pointer"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 inline-block"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Tonal Scale Preview */}
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-400 block mb-1.5">
              Generated Tonal Tokens Preview (50 - 950)
            </label>
            <div className="grid grid-cols-11 gap-1 text-center">
              {Object.entries(shades).map(([level, hex]) => (
                <div key={level} className="space-y-1">
                  <div
                    className="h-8 rounded-md border border-black/5 shadow-xs"
                    style={{ backgroundColor: hex }}
                    title={`${level}: ${hex}`}
                  />
                  <span className="text-[9px] text-gray-400 font-mono">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Settings */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <Keyboard className="w-5 h-5" style={{ color: 'var(--color-primary-accent)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Windows File Explorer Keyboard Shortcuts</h3>
            <p className="text-xs text-gray-500">
              Select any file(s) in Windows File Explorer and press these shortcuts to open the popup with files pre-selected.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
              Compression Shortcut (Opens Compress tab)
            </label>
            <input
              type="text"
              value={formData.compressShortcut || 'Shift+C'}
              onChange={(e) => {
                const u = { ...formData, compressShortcut: e.target.value };
                setFormData(u);
              }}
              placeholder="Shift+C"
              className="w-full text-xs font-mono font-semibold p-2 bg-white border border-gray-200 rounded-lg text-gray-800"
            />
            <p className="text-[10px] text-gray-400">Default: <kbd className="font-mono bg-white px-1 border rounded">Shift+C</kbd></p>
          </div>

          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
              Conversion Shortcut (Opens Convert tab)
            </label>
            <input
              type="text"
              value={formData.convertShortcut || 'Shift+V'}
              onChange={(e) => {
                const u = { ...formData, convertShortcut: e.target.value };
                setFormData(u);
              }}
              placeholder="Shift+V"
              className="w-full text-xs font-mono font-semibold p-2 bg-white border border-gray-200 rounded-lg text-gray-800"
            />
            <p className="text-[10px] text-gray-400">Default: <kbd className="font-mono bg-white px-1 border rounded">Shift+V</kbd></p>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => save()}
            className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-text)',
              borderColor: 'var(--color-primary-border)',
            }}
          >
            Save Shortcuts
          </button>
        </div>
      </div>

      {/* Destination & Overwrite Settings */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <FolderOpen className="w-5 h-5" style={{ color: 'var(--color-primary-accent)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">File Output & Overwrite Rules</h3>
            <p className="text-xs text-gray-500">
              Control where processed files are saved and how duplicate file names are resolved.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              Default Output Location
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="default_destination"
                  checked={formData.defaultDestination === 'beside_original'}
                  onChange={() => {
                    const u = { ...formData, defaultDestination: 'beside_original' as const };
                    setFormData(u);
                    save(u);
                  }}
                  className="accent-amber-600"
                />
                <span className="text-gray-700">Save output beside original files (default)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="default_destination"
                  checked={formData.defaultDestination === 'custom_folder'}
                  onChange={() => {
                    const u = { ...formData, defaultDestination: 'custom_folder' as const };
                    setFormData(u);
                    save(u);
                  }}
                  className="accent-amber-600"
                />
                <span className="text-gray-700">Save to a dedicated folder</span>
              </label>
            </div>

            {formData.defaultDestination === 'custom_folder' && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Select custom output folder..."
                  value={formData.customDestinationPath}
                  className="flex-1 text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 truncate"
                />
                <button
                  type="button"
                  onClick={handlePickFolder}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Browse...
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              Collision Handling (When output file already exists)
            </label>
            <CustomSelect
              value={formData.overwriteBehavior}
              onChange={(val) => {
                const u = { ...formData, overwriteBehavior: val as any };
                setFormData(u);
                save(u);
              }}
              options={[
                {
                  value: 'ask',
                  label: 'Auto-rename with (1), (2) (Recommended)',
                  description: 'Guarantees the original file is never overwritten',
                },
                {
                  value: 'overwrite',
                  label: 'Overwrite existing destination file',
                  description: 'Replaces any existing output file with the same name',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Windows Integration & System Tray */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <Monitor className="w-5 h-5" style={{ color: 'var(--color-primary-accent)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Windows System Integration</h3>
            <p className="text-xs text-gray-500">
              Configure shell context menu, background execution, and startup behavior.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
            <div>
              <div className="font-semibold text-gray-800">Windows File Explorer Context Menu</div>
              <div className="text-gray-400 text-[11px]">
                Show "Convert or Compress" entry when right-clicking files in File Explorer.
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.contextMenuEnabled}
              onChange={(e) => {
                const u = { ...formData, contextMenuEnabled: e.target.checked };
                setFormData(u);
                save(u);
              }}
              className="w-4 h-4 rounded text-amber-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer">
            <div>
              <div className="font-semibold text-gray-800">Minimize to System Tray</div>
              <div className="text-gray-400 text-[11px]">
                Keep running in background so keyboard shortcuts and explorer clicks respond instantly.
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.minimizeToTray}
              onChange={(e) => {
                const u = { ...formData, minimizeToTray: e.target.checked };
                setFormData(u);
                save(u);
              }}
              className="w-4 h-4 rounded text-amber-600"
            />
          </label>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};
