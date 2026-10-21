import React, { useState, useEffect } from 'react';
import {
  FileUp,
  HardDrive,
  Home,
  Clock,
  Settings as SettingsIcon,
  Minus,
  Square,
  X,
  Sparkles
} from 'lucide-react';
import {
  FileItem,
  AppSettings,
  TaskProgress,
  TaskResult
} from '../../../shared/types';
import appLogo from '../assets/logo.png';
import { HomeView } from './views/HomeView';
import { ConvertView } from './views/ConvertView';
import { CompressView } from './views/CompressView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';

export const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'convert' | 'compress' | 'history' | 'settings'>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Shared file state for convert & compress views
  const [files, setFiles] = useState<FileItem[]>([]);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings);

    const unbindProgress = window.electronAPI.onTaskProgress((p) => {
      setProgress(p);
    });

    const unbindCompleted = window.electronAPI.onTaskCompleted((res) => {
      setProgress(null);
      setResult(res);
    });

    return () => {
      unbindProgress();
      unbindCompleted();
    };
  }, []);

  const handleFilesSelectedFromHome = (selectedFiles: FileItem[], mode: 'convert' | 'compress') => {
    setFiles(selectedFiles);
    setResult(null);
    setProgress(null);
    setActiveTab(mode);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'convert', label: 'Convert', icon: FileUp },
    { id: 'compress', label: 'Compress', icon: HardDrive },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <div className="flex h-screen w-screen bg-white select-none overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-56 bg-surface-subtle border-r border-gray-200/80 flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Brand header */}
          <div className="flex items-center space-x-3 px-2 py-3 mb-6">
            <img
              src={appLogo}
              alt="Logo"
              className="w-8 h-8 rounded-xl object-contain shadow-subtle border border-gray-100"
            />
            <div>
              <h1 className="text-xs font-bold text-gray-900 tracking-tight leading-tight">
                File Converter
              </h1>
              <span className="text-[10px] text-gray-500 font-medium">& Compressor</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-primary-text)',
                          border: '1px solid var(--color-primary-border)',
                        }
                      : {}
                  }
                >
                  <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Explorer Shortcut Badge */}
        <div className="p-3 rounded-xl border border-gray-100 bg-white shadow-subtle text-center space-y-1">
          <div className="text-[10px] uppercase font-bold text-gray-400">Shortcuts</div>
          <div className="text-[11px] font-mono font-bold text-gray-800">
            <span className="text-amber-700">Shift+C</span> : Compress
          </div>
          <div className="text-[11px] font-mono font-bold text-gray-800">
            <span className="text-amber-700">Shift+V</span> : Convert
          </div>
          <div className="text-[9px] text-gray-400">Press with file(s) selected</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Title bar / Window Header */}
        <header className="titlebar-drag h-12 flex items-center justify-between px-6 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="text-xs font-bold text-gray-700 capitalize">
            {activeTab}
          </div>

          {/* Window action buttons */}
          <div className="titlebar-nodrag flex items-center space-x-1">
            <button
              type="button"
              onClick={() => window.electronAPI.minimizeWindow()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => window.electronAPI.maximizeWindow()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Maximize"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => window.electronAPI.closeWindow()}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* View container */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface-subtle">
          {activeTab === 'home' && (
            <HomeView
              onNavigate={(tab) => setActiveTab(tab)}
              onFilesSelected={handleFilesSelectedFromHome}
            />
          )}

          {activeTab === 'convert' && (
            <ConvertView
              files={files}
              setFiles={setFiles}
              settings={settings}
              progress={progress}
              result={result}
              setResult={setResult}
            />
          )}

          {activeTab === 'compress' && (
            <CompressView
              files={files}
              setFiles={setFiles}
              settings={settings}
              progress={progress}
              result={result}
              setResult={setResult}
            />
          )}

          {activeTab === 'history' && <HistoryView />}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
