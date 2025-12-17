import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Hook to configure StatusBar for Capacitor apps
 * Ensures content doesn't overlap with status bar
 */
export const useCapacitorStatusBar = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setupStatusBar = async () => {
        try {
          // Set status bar style
          await StatusBar.setStyle({ style: Style.Dark });
          
          // Set background color
          await StatusBar.setBackgroundColor({ color: '#000000' });
          
          // Don't overlay - this ensures content respects status bar
          await StatusBar.setOverlaysWebView({ overlay: false });
          
          // Get status bar height and set CSS variable
          const info = await StatusBar.getInfo();
          const statusBarHeight = info.height || 24; // Default to 24px if not available
          
          // Set CSS variable for status bar height
          document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);
          
          // Also set safe area inset top
          const safeAreaTop = window.visualViewport 
            ? Math.max(window.visualViewport.offsetTop, statusBarHeight)
            : statusBarHeight;
          
          document.documentElement.style.setProperty('--safe-area-inset-top', `${safeAreaTop}px`);
        } catch (error) {
          console.warn('StatusBar plugin not available:', error);
          // Fallback: set default status bar height
          document.documentElement.style.setProperty('--status-bar-height', '24px');
          document.documentElement.style.setProperty('--safe-area-inset-top', '24px');
        }
      };

      setupStatusBar();
    }
  }, []);
};

