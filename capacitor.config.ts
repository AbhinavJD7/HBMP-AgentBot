import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hbmp.agentbot',
  appName: 'HBMP AgentBot',
  webDir: 'client/dist',
  server: {
    // Point to your production server
    // For development, you can override this or use localhost
    url: process.env.CAPACITOR_SERVER_URL || 'https://grow24hbmpbot.zeabur.app',
    cleartext: false, // Set to true only for HTTP in development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false, // Don't overlay, so content respects status bar
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    Camera: {
      presentationStyle: 'fullscreen',
      quality: 90,
      allowEditing: false,
      resultType: 'uri',
      saveToGallery: false,
      correctOrientation: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set path to your keystore for production builds
    },
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
};

export default config;
