# Mobile App Setup Guide - HBMP AgentBot

This guide explains how to build Android and iOS mobile apps for HBMP AgentBot using Capacitor.

## What's Been Set Up

✅ **Capacitor Core** - Installed and configured
✅ **Capacitor Plugins** - Camera, StatusBar, SplashScreen, Keyboard, App, Network, Filesystem
✅ **Microphone Integration** - Enhanced speech recognition hook for native platforms
✅ **Build Scripts** - Added npm scripts for building and syncing

## Prerequisites

### For iOS Development:
- macOS (required)
- Xcode (latest version from App Store)
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator or physical iOS device

### For Android Development:
- Android Studio (latest version)
- Java Development Kit (JDK) 17 or higher
- Android SDK (installed via Android Studio)
- Physical Android device or emulator

## Quick Start

### 1. Build the Web App

First, build your React app:

```bash
npm run build:client
```

### 2. Add Native Platforms

Add iOS platform (macOS only):
```bash
npm run cap:add:ios
```

Add Android platform:
```bash
npm run cap:add:android
```

### 3. Sync Web Assets to Native Projects

After building, sync your web assets to native projects:

```bash
npm run cap:sync
```

This command:
- Builds your web app
- Copies `client/dist/` to native projects
- Updates native project configurations
- Installs/updates Capacitor plugins

### 4. Open in Native IDEs

**iOS:**
```bash
npm run cap:open:ios
```
This opens Xcode where you can:
- Configure signing certificates
- Build and run on simulator/device
- Archive for App Store submission

**Android:**
```bash
npm run cap:open:android
```
This opens Android Studio where you can:
- Configure signing keys
- Build APK or AAB
- Run on emulator/device
- Generate signed bundle for Play Store

## Development Workflow

### Live Reload Development

For development with live reload:

1. Start your backend:
```bash
npm run backend:dev
```

2. Start Vite dev server:
```bash
npm run frontend:dev
```

3. Update `capacitor.config.ts` to point to your dev server:
```typescript
server: {
  url: 'http://localhost:3090', // or your dev server URL
  cleartext: true, // Allow HTTP in development
}
```

4. Run on device with live reload:
```bash
npm run cap:run:ios -- --livereload --external
# or
npm run cap:run:android -- --livereload --external
```

### Production Build

1. Build production web app:
```bash
npm run build:production
```

2. Sync to native projects:
```bash
npm run cap:sync
```

3. Open in IDE and build:
```bash
npm run cap:open:ios      # or cap:open:android
```

## Microphone Integration

The microphone feature has been enhanced for Capacitor:

- **Native Permission Dialogs**: Better UX on mobile devices
- **Enhanced Audio Quality**: Optimized settings for mobile recording
- **Automatic Platform Detection**: Uses Capacitor version on native, falls back to web on browser

The microphone button in your chat interface will automatically:
- Request native permissions on first use
- Use optimized audio settings for mobile
- Work seamlessly with your existing backend STT endpoint

### How It Works

1. User taps microphone button
2. App detects Capacitor platform
3. Requests native microphone permission (if needed)
4. Records audio using MediaRecorder API
5. Sends audio to `/api/files/speech/stt` endpoint
6. Displays transcribed text in chat input

## Configuration

### Capacitor Config (`capacitor.config.ts`)

Key settings:
- `appId`: `com.hbmp.agentbot` - Your app bundle identifier
- `appName`: `HBMP AgentBot` - Display name
- `webDir`: `client/dist` - Web build output directory
- `server.url`: Points to your production server

### Environment Variables

You can override the server URL:
```bash
CAPACITOR_SERVER_URL=https://your-custom-server.com npm run cap:sync
```

## Platform-Specific Setup

### iOS

1. **Signing**: Configure in Xcode → Signing & Capabilities
2. **Permissions**: Microphone permission is automatically added
3. **Info.plist**: Capacitor handles microphone permission strings
4. **Build**: Product → Archive for App Store submission

### Android

1. **Permissions**: Microphone permission is automatically added to `AndroidManifest.xml`
2. **Signing**: Configure signing in `android/app/build.gradle`
3. **Build**: Build → Generate Signed Bundle / APK

## Available Scripts

- `npm run cap:sync` - Build web app and sync to native projects
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:add:ios` - Add iOS platform (macOS only)
- `npm run cap:add:android` - Add Android platform
- `npm run cap:run:ios` - Run on iOS (requires Xcode)
- `npm run cap:run:android` - Run on Android (requires Android Studio)

## Troubleshooting

### Microphone Not Working

1. Check device permissions in Settings
2. Ensure `speechToTextEndpoint` is set to `'external'` in your app settings
3. Verify backend `/api/files/speech/stt` endpoint is accessible

### Build Errors

1. Run `npm run cap:sync` after any web build changes
2. Clean native project builds in Xcode/Android Studio
3. Ensure all dependencies are installed: `npm install`

### Live Reload Not Working

1. Ensure dev server is accessible from device
2. Check firewall settings
3. Use device's IP address instead of `localhost`

## Next Steps

1. **Add iOS Platform**: Run `npm run cap:add:ios` (macOS only)
2. **Add Android Platform**: Run `npm run cap:add:android`
3. **Configure Signing**: Set up certificates/keys in native IDEs
4. **Test Microphone**: Test speech recognition on physical devices
5. **Build for Production**: Archive/build signed bundles
6. **Submit to Stores**: Follow App Store and Play Store guidelines

## Additional Features You Can Add

- Push Notifications (`@capacitor/push-notifications`)
- Biometric Authentication (`capacitor-native-biometric`)
- File System Access (`@capacitor/filesystem`)
- Share Sheet (`@capacitor/share`)
- Deep Linking (`@capacitor/app`)

## Support

For Capacitor-specific issues, see:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Community](https://github.com/ionic-team/capacitor)

For app-specific issues, check your backend logs and ensure the API endpoints are accessible from mobile devices.

