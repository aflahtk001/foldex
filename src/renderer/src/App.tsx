import React, { useEffect, useState } from 'react';
import { MainApp } from './components/MainApp';
import { PopupApp } from './components/PopupApp';
import { applyTheme } from './theme/theme';

export const App: React.FC = () => {
  const [isPopup, setIsPopup] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Detect mode from query param
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    setIsPopup(mode === 'popup');

    // Initialize theme from settings
    window.electronAPI.getSettings().then((settings) => {
      if (settings?.primaryColor) {
        applyTheme(settings.primaryColor);
      } else {
        applyTheme('#F5EFE1');
      }
      setIsReady(true);
    }).catch(() => {
      applyTheme('#F5EFE1');
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return <div className="h-screen w-screen bg-white" />;
  }

  return isPopup ? <PopupApp /> : <MainApp />;
};
