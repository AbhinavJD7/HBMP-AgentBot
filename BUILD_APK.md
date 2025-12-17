# Building APK for HBMP AgentBot

## Quick Build (Debug APK)

### Using Command Line (Fastest)

```bash
# Navigate to android directory
cd android

# Build debug APK
./gradlew assembleDebug

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Using Android Studio

1. Open project: `npm run cap:open:android`
2. Wait for Gradle sync
3. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. Wait for build to complete
5. Click "locate" in notification or find at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

## Release APK (For Production/Play Store)

### Step 1: Generate Signing Key

```bash
cd android/app
keytool -genkey -v -keystore hbmp-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias hbmp-release
```

**Important:** Save the keystore password and key password securely!

### Step 2: Configure Signing

Edit `android/app/build.gradle` and add signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('hbmp-release-key.jks')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'hbmp-release'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Release APK

```bash
cd android
./gradlew assembleRelease
```

Release APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

## Installing APK on Device

### Via USB (Debugging Enabled)

1. Enable USB debugging on your Android device
2. Connect device via USB
3. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

### Via File Transfer

1. Copy APK to device (email, cloud storage, etc.)
2. Open APK file on device
3. Allow installation from unknown sources if prompted
4. Install

## Troubleshooting

### Gradle Build Fails

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Missing Android SDK

Install via Android Studio:
- **Tools** → **SDK Manager**
- Install Android SDK Platform-Tools
- Install Android SDK Build-Tools

### Permission Issues

Make gradlew executable:
```bash
chmod +x android/gradlew
```

## Next Steps After Building APK

1. **Test on Device**: Install and test all features
2. **Test Microphone**: Ensure microphone permission works
3. **Test Backend Connection**: Verify API calls work
4. **Build Release**: Create signed release APK for distribution
5. **Upload to Play Store**: Follow Google Play Console guidelines

