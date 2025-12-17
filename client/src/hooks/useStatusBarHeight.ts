import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

/**
 * Hook to get and apply status bar height for Capacitor apps
 * Returns the status bar height in pixels
 */
export const useStatusBarHeight = (): number => {
  const [statusBarHeight, setStatusBarHeight] = useState(24); // Default Android status bar height

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const getStatusBarHeight = async () => {
        try {
          const info = await StatusBar.getInfo();
          const height = info.height || 24;
          setStatusBarHeight(height);
          
          // Set CSS variable
          document.documentElement.style.setProperty('--status-bar-height', `${height}px`);
          document.documentElement.style.setProperty('--safe-area-inset-top', `${height}px`);
        } catch (error) {
          console.warn('Could not get status bar height:', error);
          // Use default
          document.documentElement.style.setProperty('--status-bar-height', '24px');
          document.documentElement.style.setProperty('--safe-area-inset-top', '24px');
        }
      };

      getStatusBarHeight();
    } else {
      // Web - no status bar
      setStatusBarHeight(0);
    }
  }, []);

  return statusBarHeight;
};

