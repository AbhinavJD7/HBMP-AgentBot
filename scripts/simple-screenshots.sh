#!/bin/bash

# Simple Screenshot Capture - Assumes app is already running in Simulator
# This is the fastest way if you've already built and launched the app

SCREENSHOT_DIR="${HOME}/Desktop/app-store-screenshots"
mkdir -p "${SCREENSHOT_DIR}"

echo "📸 Quick Screenshot Capture"
echo "============================"
echo ""
echo "Make sure your app is running in the iOS Simulator"
echo "Screenshots will be saved to: ${SCREENSHOT_DIR}"
echo ""

# Check if simulator is running
if ! xcrun simctl list devices | grep -q "Booted"; then
    echo "⚠️  No simulator is running. Opening Simulator..."
    open -a Simulator
    sleep 3
    echo "Please launch your app in the simulator, then run this script again."
    exit 1
fi

echo "✅ Simulator detected"
echo ""
echo "Instructions:"
echo "1. Navigate to the screen you want to capture"
echo "2. Press ENTER to take screenshot"
echo "3. Repeat for all screenshots"
echo ""

COUNTER=1
MAX_SCREENSHOTS=10

while [ $COUNTER -le $MAX_SCREENSHOTS ]; do
    echo ""
    read -p "📸 Screenshot ${COUNTER}/${MAX_SCREENSHOTS} - Navigate to screen and press ENTER: " 
    
    SCREENSHOT_FILE="${SCREENSHOT_DIR}/screenshot-${COUNTER}.png"
    
    # Take screenshot
    xcrun simctl io booted screenshot "${SCREENSHOT_FILE}"
    
    if [ -f "${SCREENSHOT_FILE}" ]; then
        DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "${SCREENSHOT_FILE}" 2>/dev/null | grep -E "(pixelWidth|pixelHeight)" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
        FILE_SIZE=$(ls -lh "${SCREENSHOT_FILE}" | awk '{print $5}')
        
        echo "   ✅ Saved: screenshot-${COUNTER}.png (${DIMENSIONS}, ${FILE_SIZE})"
        
        # Open screenshot in Preview for quick review
        open -a Preview "${SCREENSHOT_FILE}"
    else
        echo "   ❌ Failed to capture"
    fi
    
    COUNTER=$((COUNTER + 1))
done

echo ""
echo "============================"
echo "✅ All screenshots captured!"
echo "============================"
echo ""
echo "Location: ${SCREENSHOT_DIR}"
open "${SCREENSHOT_DIR}"

