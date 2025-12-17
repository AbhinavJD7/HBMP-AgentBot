#!/bin/bash

# Script to build iOS IPA file for HBMP AgentBot

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="${PROJECT_DIR}/ios"
XCODE_PROJECT="${IOS_DIR}/App/App.xcodeproj"
SCHEME="App"
BUILD_DIR="${IOS_DIR}/build"
ARCHIVE_PATH="${BUILD_DIR}/App.xcarchive"
EXPORT_PATH="${BUILD_DIR}/export"
IPA_PATH="${BUILD_DIR}/HBMP-AgentBot.ipa"

echo "📱 Building iOS IPA for HBMP AgentBot"
echo "======================================"

# Step 1: Build web app
echo ""
echo "Step 1: Building web app..."
cd "${PROJECT_DIR}"
npm run build:client

# Step 2: Sync to iOS
echo ""
echo "Step 2: Syncing web assets to iOS..."
npx cap sync ios

# Step 3: Clean build directory
echo ""
echo "Step 3: Cleaning build directory..."
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Step 4: Build and Archive
echo ""
echo "Step 4: Building and archiving iOS app..."
cd "${IOS_DIR}"

# Build for generic iOS device (required for archive)
xcodebuild clean archive \
  -project "${XCODE_PROJECT}" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -archivePath "${ARCHIVE_PATH}" \
  -destination 'generic/platform=iOS' \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  DEVELOPMENT_TEAM="" \
  PROVISIONING_PROFILE_SPECIFIER=""

if [ ! -d "${ARCHIVE_PATH}" ]; then
  echo "❌ Archive failed!"
  exit 1
fi

echo ""
echo "✅ Archive created successfully at: ${ARCHIVE_PATH}"

# Step 5: Create ExportOptions.plist
echo ""
echo "Step 5: Creating export options..."
EXPORT_OPTIONS="${BUILD_DIR}/ExportOptions.plist"
cat > "${EXPORT_OPTIONS}" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string></string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string></string>
</dict>
</plist>
EOF

# Step 6: Export IPA
echo ""
echo "Step 6: Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS}" \
  -allowProvisioningUpdates || {
    echo ""
    echo "⚠️  IPA export with signing failed. Creating unsigned IPA..."
    
    # Alternative: Create IPA manually from archive
    APP_PATH="${ARCHIVE_PATH}/Products/Applications/App.app"
    if [ -d "${APP_PATH}" ]; then
      mkdir -p "${EXPORT_PATH}/Payload"
      cp -r "${APP_PATH}" "${EXPORT_PATH}/Payload/"
      cd "${EXPORT_PATH}"
      zip -r "${IPA_PATH}" Payload
      rm -rf Payload
      echo ""
      echo "✅ Unsigned IPA created at: ${IPA_PATH}"
    else
      echo "❌ Could not find app in archive!"
      exit 1
    fi
  }

if [ -f "${EXPORT_PATH}/App.ipa" ]; then
  mv "${EXPORT_PATH}/App.ipa" "${IPA_PATH}"
fi

if [ -f "${IPA_PATH}" ]; then
  echo ""
  echo "✅ IPA file created successfully!"
  echo "📦 Location: ${IPA_PATH}"
  echo ""
  ls -lh "${IPA_PATH}"
else
  echo ""
  echo "⚠️  IPA file not found in expected location."
  echo "Archive is available at: ${ARCHIVE_PATH}"
  echo "You can export it manually from Xcode:"
  echo "  1. Open ${XCODE_PROJECT} in Xcode"
  echo "  2. Product > Archive"
  echo "  3. Distribute App > Development/Ad Hoc"
fi

