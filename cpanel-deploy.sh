#!/bin/bash

# cPanel Deployment Script for HBMP-AgentBot
# This script helps prepare your application for cPanel deployment

set -e

echo "🚀 HBMP-AgentBot cPanel Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"

# Check Node.js version (should be 20.x or higher)
NODE_MAJOR_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠ Warning: Node.js version should be 20.x or higher${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm is installed"

# Step 1: Install dependencies
echo ""
echo "📦 Step 1: Installing dependencies..."
npm install --production=false
echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 2: Build packages
echo ""
echo "🔨 Step 2: Building packages..."
npm run build:packages
echo -e "${GREEN}✓${NC} Packages built"

# Step 3: Build frontend
echo ""
echo "🎨 Step 3: Building frontend..."
npm run build:client
echo -e "${GREEN}✓${NC} Frontend built"

# Step 4: Check for .env file
echo ""
echo "⚙️  Step 4: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Warning: .env file not found${NC}"
    if [ -f ".cpanel.env.example" ]; then
        echo -e "${YELLOW}   Copying .cpanel.env.example to .env${NC}"
        cp .cpanel.env.example .env
        echo -e "${YELLOW}   Please edit .env file with your actual configuration${NC}"
    fi
else
    echo -e "${GREEN}✓${NC} .env file found"
fi

# Step 5: Verify build output
echo ""
echo "🔍 Step 5: Verifying build output..."
if [ ! -d "client/dist" ]; then
    echo -e "${RED}❌ client/dist directory not found. Build may have failed.${NC}"
    exit 1
else
    echo -e "${GREEN}✓${NC} client/dist directory exists"
fi

# Step 6: Create deployment checklist
echo ""
echo "📋 Step 6: Creating deployment checklist..."
cat > DEPLOYMENT_CHECKLIST.txt << EOF
HBMP-AgentBot cPanel Deployment Checklist
=========================================

Before uploading to cPanel:
[ ] All dependencies are installed (npm install completed)
[ ] Frontend is built (client/dist exists)
[ ] .env file is configured with your values
[ ] MongoDB connection string is set correctly
[ ] API keys are added to .env
[ ] Security secrets (JWT_SECRET, SESSION_SECRET) are generated

Files to upload to cPanel:
[ ] All project files EXCEPT:
    - node_modules/ (install on server)
    - .git/ (version control)
    - data-node/ (local MongoDB data)
    - logs/ (will be created automatically)
    - e2e/ (testing files)

cPanel Node.js Selector Configuration:
[ ] Node.js version: 20.x or higher
[ ] Application mode: production
[ ] Application root: /home/username/yourdomain.com
[ ] Application URL: your domain/subdomain
[ ] Application startup file: app.js OR api/server/index.js
[ ] Application port: 3080 (or leave empty for auto)

Environment Variables in cPanel:
[ ] NODE_ENV=production
[ ] PORT=3080
[ ] HOST=0.0.0.0
[ ] MONGO_URI=your_mongodb_connection_string
[ ] DOMAIN_CLIENT=https://yourdomain.com
[ ] DOMAIN_SERVER=https://yourdomain.com
[ ] All API keys added
[ ] All security secrets added

After deployment:
[ ] Application starts successfully
[ ] Check logs for errors
[ ] Test website loads correctly
[ ] Test login/registration
[ ] Verify MongoDB connection
[ ] SSL certificate installed
[ ] Domain properly configured

Troubleshooting:
- Check cPanel Node.js logs
- Verify all environment variables are set
- Test MongoDB connection separately
- Check file permissions (644 for files, 755 for directories)
- Ensure PORT is not conflicting with other applications
EOF

echo -e "${GREEN}✓${NC} Deployment checklist created: DEPLOYMENT_CHECKLIST.txt"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review and update .env file with your configuration"
echo "2. Upload files to cPanel (excluding node_modules, .git, etc.)"
echo "3. Configure Node.js application in cPanel"
echo "4. Add environment variables in cPanel Node.js Selector"
echo "5. Install dependencies on server: npm install --production"
echo "6. Start the application"
echo ""
echo "For detailed instructions, see: CPANEL_DEPLOYMENT.md"
echo ""


