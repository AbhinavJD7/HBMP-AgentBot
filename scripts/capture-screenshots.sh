#!/bin/bash

# Automated Screenshot Capture Script for iOS App Store
# This script helps automate taking screenshots for App Store submission

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCREENSHOT_DIR="${PROJECT_DIR}/screenshots"
# Try to find a suitable iPhone simulator (6.5" or larger display)
PREFERRED_DEVICES=("iPhone 16 Pro Max" "iPhone 15 Pro Max" "iPhone 14 Pro Max" "iPhone 16 Pro" "iPhone 15 Pro" "iPhone 14 Pro")
SIMULATOR_UDID=""
SIMULATOR_NAME=""

echo "📸 iOS Screenshot Capture Tool"
echo "================================"

# Step 1: Build the app
echo ""
echo "Step 1: Building web app..."
cd "${PROJECT_DIR}"
npm run build:client

# Step 2: Sync with Capacitor
echo ""
echo "Step 2: Syncing with Capacitor..."
npx cap sync ios

# Step 3: Create screenshots directory
echo ""
echo "Step 3: Creating screenshots directory..."
mkdir -p "${SCREENSHOT_DIR}"

# Step 4: Get or create simulator
echo ""
echo "Step 4: Setting up iOS Simulator..."

# List available simulators
echo "Available simulators:"
xcrun simctl list devices available | grep -i "iphone" | head -10

# Find simulator UDID - try preferred devices first
for DEVICE_NAME in "${PREFERRED_DEVICES[@]}"; do
    SIMULATOR_UDID=$(xcrun simctl list devices available | grep -i "${DEVICE_NAME}" | grep -v "unavailable" | head -1 | grep -oE '\([A-F0-9-]+\)' | tr -d '()' | head -1)
    if [ -n "$SIMULATOR_UDID" ]; then
        SIMULATOR_NAME="${DEVICE_NAME}"
        break
    fi
done

# If still not found, try any iPhone Pro or Pro Max
if [ -z "$SIMULATOR_UDID" ]; then
    echo "⚠️  Preferred devices not found. Looking for any iPhone Pro..."
    SIMULATOR_UDID=$(xcrun simctl list devices available | grep -iE "iPhone.*Pro" | grep -v "unavailable" | head -1 | grep -oE '\([A-F0-9-]+\)' | tr -d '()' | head -1)
    if [ -n "$SIMULATOR_UDID" ]; then
        SIMULATOR_NAME=$(xcrun simctl list devices available | grep -iE "iPhone.*Pro" | grep -v "unavailable" | head -1 | sed 's/.*iPhone/iPhone/' | sed 's/(.*//' | xargs)
    fi
fi

# Last resort: any iPhone
if [ -z "$SIMULATOR_UDID" ]; then
    echo "⚠️  Looking for any available iPhone..."
    SIMULATOR_UDID=$(xcrun simctl list devices available | grep -i "iPhone" | grep -v "unavailable" | head -1 | grep -oE '\([A-F0-9-]+\)' | tr -d '()' | head -1)
    if [ -n "$SIMULATOR_UDID" ]; then
        SIMULATOR_NAME=$(xcrun simctl list devices available | grep -i "iPhone" | grep -v "unavailable" | head -1 | sed 's/.*iPhone/iPhone/' | sed 's/(.*//' | xargs)
    fi
fi

if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ No suitable simulator found. Please create one in Xcode:"
    echo "   Xcode > Window > Devices and Simulators > Simulators > +"
    echo "   Recommended: iPhone 15 Pro Max or iPhone 16 Pro Max"
    exit 1
fi

echo "✅ Using simulator: ${SIMULATOR_NAME} (${SIMULATOR_UDID})"

# Step 5: Boot simulator
echo ""
echo "Step 5: Booting simulator..."
xcrun simctl boot "${SIMULATOR_UDID}" 2>/dev/null || echo "Simulator already booted"
open -a Simulator

# Wait for simulator to be ready
echo "Waiting for simulator to be ready..."
sleep 5

# Step 6: Build and install app (optional - can skip if app is already running)
echo ""
echo "Step 6: Building and installing app..."
echo "⚠️  Note: For faster workflow, you can skip this step if app is already running"
echo "   Press Ctrl+C to skip building, or Enter to continue..."
read -t 3 -r || true

cd "${PROJECT_DIR}/ios/App"

# Try to build, but don't fail if it doesn't work
if [ -d "App.xcodeproj" ]; then
    echo "Building app..."
    xcodebuild -project App.xcodeproj \
      -scheme App \
      -configuration Release \
      -destination "id=${SIMULATOR_UDID}" \
      -derivedDataPath ../build/DerivedData \
      build 2>&1 | grep -E "(error|warning|succeeded|failed)" || true
    
    # Try to find and install the app
    APP_PATH=$(find ../build/DerivedData -name "App.app" -type d 2>/dev/null | head -1)
    if [ -n "$APP_PATH" ] && [ -d "$APP_PATH" ]; then
        echo "Installing app..."
        xcrun simctl install "${SIMULATOR_UDID}" "${APP_PATH}" 2>/dev/null || true
        echo "Launching app..."
        xcrun simctl launch "${SIMULATOR_UDID}" com.hbmp.agentbot 2>/dev/null || true
        sleep 3
    fi
else
    echo "⚠️  Xcode project not found. Please build and run manually in Xcode first."
fi

cd "${PROJECT_DIR}"

# Step 7: Screenshot capture helper
echo ""
echo "================================"
echo "📸 Screenshot Capture Ready!"
echo "================================"
echo ""
echo "The simulator is now open with your app running."
echo ""
echo "To take screenshots:"
echo "1. Navigate to the screen you want to capture"
echo "2. Press ENTER in this terminal to capture"
echo "3. Repeat for all 10 screenshots"
echo ""
echo "Screenshots will be saved to: ${SCREENSHOT_DIR}"
echo ""
echo "Press Ctrl+C to exit"
echo ""

# Screenshot counter
COUNTER=1
MAX_SCREENSHOTS=10

while [ $COUNTER -le $MAX_SCREENSHOTS ]; do
    echo ""
    echo "📸 Screenshot ${COUNTER}/${MAX_SCREENSHOTS}"
    echo "Navigate to the screen you want to capture, then press ENTER..."
    read -r
    
    SCREENSHOT_FILE="${SCREENSHOT_DIR}/screenshot-${COUNTER}.png"
    
    # Take screenshot
    xcrun simctl io booted screenshot "${SCREENSHOT_FILE}"
    
    if [ -f "${SCREENSHOT_FILE}" ]; then
        # Get image dimensions
        DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "${SCREENSHOT_FILE}" 2>/dev/null | grep -E "(pixelWidth|pixelHeight)" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
        FILE_SIZE=$(ls -lh "${SCREENSHOT_FILE}" | awk '{print $5}')
        
        echo "✅ Screenshot saved: ${SCREENSHOT_FILE}"
        echo "   Dimensions: ${DIMENSIONS}"
        echo "   Size: ${FILE_SIZE}"
        
        # Verify dimensions (should be 1242x2688 or similar)
        WIDTH=$(echo $DIMENSIONS | cut -d'x' -f1)
        if [ "$WIDTH" -lt 1200 ]; then
            echo "⚠️  Warning: Screenshot width is less than 1200px. May need resizing."
        fi
    else
        echo "❌ Failed to capture screenshot"
    fi
    
    COUNTER=$((COUNTER + 1))
done

echo ""
echo "================================"
echo "✅ All screenshots captured!"
echo "================================"
echo ""
echo "Screenshots saved to: ${SCREENSHOT_DIR}"
echo ""
ls -lh "${SCREENSHOT_DIR}"/*.png 2>/dev/null || echo "No screenshots found"
echo ""
echo "Next steps:"
echo "1. Review screenshots in ${SCREENSHOT_DIR}"
echo "2. Resize if needed (should be 1242 x 2688px or 1284 x 2778px)"
echo "3. Upload to App Store Connect"
echo ""

