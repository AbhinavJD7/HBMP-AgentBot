#!/bin/bash

# Script to build iOS IPA file for App Store submission
# This creates a properly signed IPA ready for App Store Connect

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="${PROJECT_DIR}/ios"
XCODE_PROJECT="${IOS_DIR}/App/App.xcodeproj"
SCHEME="App"
BUILD_DIR="${IOS_DIR}/build"
ARCHIVE_PATH="${BUILD_DIR}/App.xcarchive"
EXPORT_PATH="${BUILD_DIR}/export"
IPA_PATH="${BUILD_DIR}/HBMP-AgentBot.ipa"

echo "📱 Building iOS IPA for App Store Submission"
echo "=============================================="

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed or xcodebuild is not in PATH"
    echo "Please install Xcode from the App Store"
    exit 1
fi

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
echo "⚠️  Note: You need to configure signing in Xcode before running this script"
echo ""
cd "${IOS_DIR}"

# Build for generic iOS device (required for archive)
# Note: Signing will be handled by Xcode settings
xcodebuild clean archive \
  -project "${XCODE_PROJECT}" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -archivePath "${ARCHIVE_PATH}" \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates

if [ ! -d "${ARCHIVE_PATH}" ]; then
  echo "❌ Archive failed!"
  echo ""
  echo "Common issues:"
  echo "1. Signing not configured - Open Xcode and set up your Apple Developer account"
  echo "2. Provisioning profile missing - Create one in Apple Developer portal"
  echo "3. Team ID not set - Configure in Xcode project settings"
  exit 1
fi

echo ""
echo "✅ Archive created successfully at: ${ARCHIVE_PATH}"

# Step 5: Create ExportOptions.plist for App Store
echo ""
echo "Step 5: Creating export options for App Store..."
EXPORT_OPTIONS="${BUILD_DIR}/ExportOptions.plist"

# Get team ID from archive if available
TEAM_ID=$(grep -o 'DEVELOPMENT_TEAM = [^;]*' "${XCODE_PROJECT}/project.pbxproj" | head -1 | awk '{print $3}' | tr -d '"' || echo "")

cat > "${EXPORT_OPTIONS}" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

# Step 6: Export IPA for App Store
echo ""
echo "Step 6: Exporting IPA for App Store..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS}" \
  -allowProvisioningUpdates

if [ -f "${EXPORT_PATH}/App.ipa" ]; then
  mv "${EXPORT_PATH}/App.ipa" "${IPA_PATH}"
  echo ""
  echo "✅ IPA file created successfully for App Store!"
  echo "📦 Location: ${IPA_PATH}"
  echo ""
  ls -lh "${IPA_PATH}"
  echo ""
  echo "📤 Next steps:"
  echo "1. Upload to App Store Connect using Transporter app or:"
  echo "   xcrun altool --upload-app --type ios --file \"${IPA_PATH}\" --apiKey YOUR_API_KEY --apiIssuer YOUR_ISSUER_ID"
  echo ""
  echo "2. Or use Xcode:"
  echo "   - Open Xcode"
  echo "   - Window > Organizer"
  echo "   - Select the archive"
  echo "   - Click 'Distribute App'"
  echo "   - Choose 'App Store Connect'"
else
  echo ""
  echo "⚠️  IPA export failed. You can export manually from Xcode:"
  echo "  1. Open ${XCODE_PROJECT} in Xcode"
  echo "  2. Window > Organizer"
  echo "  3. Select the archive: ${ARCHIVE_PATH}"
  echo "  4. Click 'Distribute App'"
  echo "  5. Choose 'App Store Connect'"
  exit 1
fi

