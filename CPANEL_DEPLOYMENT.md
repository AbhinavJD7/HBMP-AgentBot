# cPanel GoDaddy Deployment Guide

This guide will help you deploy HBMP-AgentBot to your GoDaddy cPanel hosting using the Node.js Selector.

## Prerequisites

- GoDaddy cPanel hosting with Node.js Selector enabled
- Node.js version 20.x or higher (available in cPanel)
- MongoDB database (can be hosted separately or use MongoDB Atlas)
- FTP/File Manager access to your cPanel account
- SSH access (recommended, but not required)

## Step 1: Prepare Your Application

### 1.1 Build the Frontend

Before uploading, build the production frontend:

```bash
# From your local machine
npm install
npm run build:production
```

This will create the `client/dist` directory with all static files.

### 1.2 Prepare Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3080
HOST=0.0.0.0
TRUST_PROXY=1

# MongoDB Connection
MONGO_URI=mongodb://username:password@host:port/database
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Domain Configuration (replace with your domain)
DOMAIN_CLIENT=https://yourdomain.com
DOMAIN_SERVER=https://yourdomain.com

# Meilisearch (if using)
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=your_master_key_here

# API Keys (add your keys)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_KEY=your-google-key-here

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-here
JWT_REFRESH_SECRET=your-random-refresh-secret-key-here

# Session Secret (generate a random string)
SESSION_SECRET=your-random-session-secret-here

# File Upload (optional)
FILE_UPLOAD_SIZE_LIMIT=10485760
```

**Important:** Generate secure random strings for JWT_SECRET, JWT_REFRESH_SECRET, and SESSION_SECRET. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Upload Files to cPanel

### 2.1 Upload via File Manager

1. Log into your cPanel account
2. Navigate to **File Manager**
3. Go to your domain's root directory (usually `public_html` or a subdirectory)
4. Upload all project files **except**:
   - `node_modules/` (will be installed on server)
   - `.git/` directory
   - `data-node/` (local MongoDB data)
   - `logs/` (will be created automatically)
   - `e2e/` (testing files)
   - `*.md` files (optional, can keep for reference)

### 2.2 Upload via FTP (Alternative)

If you prefer FTP:
- Use an FTP client like FileZilla
- Connect to your cPanel FTP server
- Upload files to the same directory

## Step 3: Set Up Node.js Application in cPanel

### 3.1 Create Node.js Application

1. In cPanel, navigate to **Node.js Selector** (under "Software")
2. Click **"+ CREATE APPLICATION"**
3. Fill in the form:
   - **Node.js Version:** Select 20.x (or latest available)
   - **Application Mode:** Select `production`
   - **Application Root:** `/home/yourusername/yourdomain.com` (or your chosen directory)
   - **Application URL:** Choose your domain/subdomain
   - **Application Startup File:** `api/server/index.js`
   - **Application Port:** Leave empty (cPanel will assign automatically) OR set to `3080` if you have a specific port

### 3.2 Configure Environment Variables

In the Node.js Selector interface:
1. Click on your application
2. Go to **"Environment Variables"** or **"Settings"**
3. Add all environment variables from your `.env` file:
   - Click **"Add Variable"** for each variable
   - Enter the variable name and value
   - Save each one

**Note:** Some cPanel versions allow uploading a `.env` file directly. Check if your cPanel has this option.

### 3.3 Install Dependencies

1. In Node.js Selector, click on your application
2. Click **"Run NPM Install"** or use SSH:
   ```bash
   cd /home/yourusername/yourdomain.com
   npm install --production
   ```

### 3.4 Start the Application

1. In Node.js Selector, click **"START"** or toggle the status to "Started"
2. Wait for the application to start (check logs if available)

## Step 4: Configure MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your cPanel server's IP address
5. Get your connection string and add it to `MONGO_URI` in environment variables

### Option B: Local MongoDB (if available)

If your hosting provider offers MongoDB:
1. Create a MongoDB database in cPanel
2. Use the provided connection string in `MONGO_URI`

## Step 5: Set Up Domain and SSL

### 5.1 Domain Configuration

1. In cPanel, go to **Domains** or **Subdomains**
2. Point your domain/subdomain to the Node.js application directory
3. Ensure the domain is properly configured

### 5.2 SSL Certificate

1. In cPanel, go to **SSL/TLS Status**
2. Install a free SSL certificate (Let's Encrypt) for your domain
3. Force HTTPS redirect if needed

## Step 6: Verify Deployment

1. Visit your domain in a browser
2. Check the application loads correctly
3. Test login/registration functionality
4. Check cPanel Node.js logs for any errors

## Step 7: Set Up Process Manager (Optional but Recommended)

For better reliability, you can use PM2 via SSH:

```bash
# Install PM2 globally
npm install -g pm2

# Start your application with PM2
cd /home/yourusername/yourdomain.com
pm2 start api/server/index.js --name hbmp-agentbot

# Save PM2 configuration
pm2 save

# Set up PM2 to start on server reboot
pm2 startup
```

## Troubleshooting

### Application Won't Start

1. **Check Logs:**
   - In Node.js Selector, click "View Logs"
   - Look for error messages
   - Common issues: missing environment variables, MongoDB connection errors

2. **Verify Port:**
   - Ensure PORT is set correctly in environment variables
   - Check if the port is available

3. **Check Dependencies:**
   - Ensure `npm install` completed successfully
   - Check for missing modules in logs

### MongoDB Connection Issues

1. **Verify Connection String:**
   - Check `MONGO_URI` format is correct
   - Ensure credentials are correct
   - Verify IP whitelist (for Atlas)

2. **Test Connection:**
   - Use MongoDB Compass or mongo shell to test connection
   - Check firewall settings

### Static Files Not Loading

1. **Verify Build:**
   - Ensure `client/dist` directory exists
   - Check that build completed successfully

2. **Check Paths:**
   - Verify `DOMAIN_CLIENT` is set correctly
   - Check file permissions (should be 644 for files, 755 for directories)

### Performance Issues

1. **Enable Compression:**
   - Ensure `DISABLE_COMPRESSION` is not set to `true`

2. **Check Memory Limits:**
   - cPanel may have memory limits
   - Consider upgrading hosting plan if needed

3. **Use CDN:**
   - Consider using a CDN for static assets

## File Structure on Server

Your server directory should look like:

```
/home/yourusername/yourdomain.com/
├── api/
│   ├── server/
│   │   └── index.js (startup file)
│   └── ...
├── client/
│   └── dist/ (built frontend)
├── packages/
├── node_modules/
├── .env (environment variables)
├── package.json
└── ...
```

## Updating Your Application

1. **Upload New Files:**
   - Upload updated files via File Manager or FTP
   - Keep `node_modules/` and `.env` unless dependencies changed

2. **Update Dependencies:**
   ```bash
   npm install --production
   ```

3. **Rebuild Frontend (if changed):**
   - Build locally: `npm run build:production`
   - Upload `client/dist/` directory

4. **Restart Application:**
   - In Node.js Selector, click "RESTART"
   - Or via SSH: `pm2 restart hbmp-agentbot`

## Security Checklist

- [ ] All environment variables are set (no defaults in code)
- [ ] JWT secrets are strong and unique
- [ ] MongoDB credentials are secure
- [ ] SSL certificate is installed and working
- [ ] File permissions are correct (644 for files, 755 for directories)
- [ ] `.env` file is not publicly accessible
- [ ] Regular backups are configured
- [ ] API keys are kept secure

## Support

If you encounter issues:
1. Check cPanel Node.js logs
2. Review application logs in `logs/` directory
3. Verify all environment variables are set correctly
4. Test MongoDB connection separately
5. Contact GoDaddy support if cPanel-specific issues persist

## Additional Resources

- [cPanel Node.js Documentation](https://docs.cpanel.net/knowledge-base/web-services/guide-to-the-node-js-selector/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Deployment Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)


