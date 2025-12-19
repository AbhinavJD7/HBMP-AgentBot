#!/bin/bash

# Quick Screenshot Capture - Opens Xcode and guides you through screenshots
# This is the simplest and most reliable method

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCREENSHOT_DIR="${HOME}/Desktop/app-store-screenshots"
mkdir -p "${SCREENSHOT_DIR}"

echo "📸 Quick Screenshot Capture for App Store"
echo "=========================================="
echo ""

# Step 1: Build web app
echo "Step 1: Building web app..."
cd "${PROJECT_DIR}"
npm run build:client

# Step 2: Sync with Capacitor
echo ""
echo "Step 2: Syncing with Capacitor..."
npx cap sync ios

# Step 3: Open Xcode
echo ""
echo "Step 3: Opening Xcode..."
echo "Please:"
echo "  1. Select 'iPhone 16 Pro' (or any iPhone) as the simulator"
echo "  2. Build and run the app (⌘R)"
echo "  3. Wait for the app to launch"
echo ""
echo "Opening Xcode now..."
npm run cap:open:ios

echo ""
echo "Once your app is running in the simulator, press ENTER to start taking screenshots..."
read -r

# Step 4: Take screenshots
echo ""
echo "================================"
echo "📸 Ready to Capture Screenshots"
echo "================================"
echo ""
echo "Instructions:"
echo "1. Navigate to the screen you want to capture"
echo "2. Press ENTER in this terminal"
echo "3. Screenshot will be saved automatically"
echo "4. Repeat for all 10 screenshots"
echo ""
echo "Screenshots will be saved to: ${SCREENSHOT_DIR}"
echo ""

COUNTER=1
MAX_SCREENSHOTS=10

while [ $COUNTER -le $MAX_SCREENSHOTS ]; do
    echo ""
    read -p "📸 Screenshot ${COUNTER}/${MAX_SCREENSHOTS} - Navigate to screen, then press ENTER: " 
    
    SCREENSHOT_FILE="${SCREENSHOT_DIR}/screenshot-${COUNTER}.png"
    
    # Take screenshot
    xcrun simctl io booted screenshot "${SCREENSHOT_FILE}" 2>/dev/null
    
    if [ -f "${SCREENSHOT_FILE}" ]; then
        DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "${SCREENSHOT_FILE}" 2>/dev/null | grep -E "(pixelWidth|pixelHeight)" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//' || echo "unknown")
        FILE_SIZE=$(ls -lh "${SCREENSHOT_FILE}" | awk '{print $5}')
        
        echo "   ✅ Saved: screenshot-${COUNTER}.png"
        echo "      Dimensions: ${DIMENSIONS}, Size: ${FILE_SIZE}"
        
        # Open in Preview for quick review
        open -a Preview "${SCREENSHOT_FILE}" 2>/dev/null || true
    else
        echo "   ❌ Failed to capture. Make sure simulator is running."
    fi
    
    COUNTER=$((COUNTER + 1))
done

echo ""
echo "================================"
echo "✅ All screenshots captured!"
echo "================================"
echo ""
echo "Location: ${SCREENSHOT_DIR}"
open "${SCREENSHOT_DIR}"

