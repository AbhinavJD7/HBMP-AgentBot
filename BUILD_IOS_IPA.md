# Building iOS IPA for HBMP AgentBot

## Quick Build

```bash
npm run cap:build:ios
```

This will:
1. Build your web app
2. Sync to iOS project
3. Generate iOS icons from logo.svg
4. Archive the iOS app
5. Create an IPA file

## IPA Location

The IPA file will be created at:
```
ios/build/HBMP-AgentBot.ipa
```

## Current Status

✅ **Unsigned IPA Created** - The IPA is currently unsigned and suitable for:
- Testing on your own device (with Xcode)
- Development builds
- Internal testing

## Signing the IPA for Distribution

To create a signed IPA for App Store or TestFlight:

### Option 1: Using Xcode (Recommended)

1. Open the project:
   ```bash
   npm run cap:open:ios
   ```

2. In Xcode:
   - Select your development team in **Signing & Capabilities**
   - Product → Archive
   - Once archived, click **Distribute App**
   - Choose distribution method:
     - **App Store Connect** - For App Store submission
     - **Ad Hoc** - For testing on specific devices
     - **Enterprise** - For enterprise distribution
     - **Development** - For development builds

3. Follow the export wizard to create a signed IPA

### Option 2: Command Line (Requires Signing Certificates)

If you have signing certificates set up:

```bash
cd ios
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist
```

## Requirements

- **macOS** (required for iOS development)
- **Xcode** (latest version)
- **Apple Developer Account** (for App Store distribution)
- **CocoaPods** (installed automatically by Capacitor)

## Troubleshooting

### "No signing certificate found"

You need to:
1. Open Xcode
2. Go to Preferences → Accounts
3. Add your Apple ID
4. Select your team in the project settings

### "Provisioning profile not found"

1. In Xcode, go to **Signing & Capabilities**
2. Select your **Team**
3. Xcode will automatically create/manage provisioning profiles

### IPA is too large

The current IPA is ~10MB. To reduce size:
- Enable bitcode (if needed)
- Use App Thinning
- Optimize assets

## Testing the IPA

### On Simulator
```bash
xcrun simctl install booted ios/build/HBMP-AgentBot.ipa
```

### On Physical Device
1. Connect device via USB
2. Open Xcode → Window → Devices and Simulators
3. Select your device
4. Drag and drop the IPA file

### Via TestFlight
1. Archive in Xcode
2. Upload to App Store Connect
3. Distribute via TestFlight

## Next Steps

1. **Test on Device**: Install and test all features
2. **Configure Signing**: Set up your Apple Developer account
3. **Submit to App Store**: Follow Apple's guidelines
4. **TestFlight**: Distribute to beta testers

## Notes

- The current IPA is **unsigned** - suitable for development only
- For App Store submission, you'll need proper code signing
- Microphone permissions are automatically configured
- Status bar padding (48px) is applied for proper display

