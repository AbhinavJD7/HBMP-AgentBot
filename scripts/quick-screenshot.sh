#!/bin/bash

# Quick Screenshot Tool - Takes a single screenshot
# Usage: ./scripts/quick-screenshot.sh [screenshot-number]

SCREENSHOT_DIR="${HOME}/Desktop/screenshots"
mkdir -p "${SCREENSHOT_DIR}"

SCREENSHOT_NUM=${1:-$(date +%s)}
SCREENSHOT_FILE="${SCREENSHOT_DIR}/screenshot-${SCREENSHOT_NUM}.png"

echo "📸 Taking screenshot..."
xcrun simctl io booted screenshot "${SCREENSHOT_FILE}"

if [ -f "${SCREENSHOT_FILE}" ]; then
    DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "${SCREENSHOT_FILE}" 2>/dev/null | grep -E "(pixelWidth|pixelHeight)" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
    echo "✅ Screenshot saved: ${SCREENSHOT_FILE}"
    echo "   Dimensions: ${DIMENSIONS}"
    open "${SCREENSHOT_DIR}"
else
    echo "❌ Failed to capture screenshot"
    exit 1
fi

