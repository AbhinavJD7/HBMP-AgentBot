#!/bin/bash
# Production Build Script for HBMP AgentBot
# This script builds the application for production deployment

set -e  # Exit on error

echo "🚀 Starting Production Build..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version 20 or higher is required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Set memory limit for build
export NODE_OPTIONS="--max-old-space-size=8192"
echo -e "${GREEN}✅ Memory limit set to 8192MB${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found. Some features may not work.${NC}"
fi

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
rm -rf client/dist
rm -rf packages/*/dist
echo -e "${GREEN}✅ Clean complete${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --no-audit
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Build packages
echo ""
echo "🔨 Building packages..."
echo "  → Building data-provider..."
npm run build:data-provider || { echo -e "${RED}❌ Failed to build data-provider${NC}"; exit 1; }

echo "  → Building data-schemas..."
npm run build:data-schemas || { echo -e "${RED}❌ Failed to build data-schemas${NC}"; exit 1; }

echo "  → Building api package..."
npm run build:api || { echo -e "${RED}❌ Failed to build api package${NC}"; exit 1; }

echo "  → Building client package..."
npm run build:client-package || { echo -e "${RED}❌ Failed to build client package${NC}"; exit 1; }

echo -e "${GREEN}✅ All packages built successfully${NC}"

# Build client
echo ""
echo "🎨 Building React client..."
npm run build:client || { echo -e "${RED}❌ Failed to build client${NC}"; exit 1; }
echo -e "${GREEN}✅ Client built successfully${NC}"

# Verify build output
echo ""
echo "🔍 Verifying build output..."
if [ ! -d "client/dist" ]; then
    echo -e "${RED}❌ Client dist directory not found${NC}"
    exit 1
fi

DIST_SIZE=$(du -sh client/dist | cut -f1)
echo -e "${GREEN}✅ Build output verified (Size: $DIST_SIZE)${NC}"

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Production build completed successfully!${NC}"
echo ""
echo "📁 Build output: client/dist"
echo "🚀 Ready for deployment"
echo ""
echo "Next steps:"
echo "  1. Test locally: npm run backend"
echo "  2. Deploy to Zeabur/Railway/etc."
echo "  3. Set environment variables in deployment platform"
echo ""


