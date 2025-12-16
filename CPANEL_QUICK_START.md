# cPanel Quick Start Guide

## Quick Deployment Steps

### 1. Prepare Locally (5 minutes)

```bash
# Run the deployment preparation script
./cpanel-deploy.sh

# Or manually:
npm install
npm run build:production
```

### 2. Configure Environment

Edit `.env` file (or copy from `.cpanel.env.example`):
- Set `MONGO_URI` (use MongoDB Atlas for easiest setup)
- Set `DOMAIN_CLIENT` and `DOMAIN_SERVER` to your domain
- Add API keys (OpenAI, Anthropic, Google, etc.)
- Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Upload to cPanel

**Via File Manager:**
1. Log into cPanel → File Manager
2. Navigate to your domain directory
3. Upload all files EXCEPT:
   - `node_modules/`
   - `.git/`
   - `data-node/`
   - `logs/`

**Via FTP:**
- Use FileZilla or similar
- Upload to same directory

### 4. Set Up Node.js App in cPanel

1. **cPanel → Node.js Selector → "+ CREATE APPLICATION"**
2. **Configure:**
   - Node.js Version: **20.x**
   - Mode: **production**
   - Application Root: Your domain directory path
   - Application URL: Your domain
   - **Startup File:** `app.js` (or `api/server/index.js`)
   - Port: `3080` (or leave empty)

3. **Add Environment Variables:**
   - Click your app → Environment Variables
   - Add each variable from `.env` file:
     - `NODE_ENV=production`
     - `PORT=3080`
     - `HOST=0.0.0.0`
     - `MONGO_URI=your_connection_string`
     - `DOMAIN_CLIENT=https://yourdomain.com`
     - `DOMAIN_SERVER=https://yourdomain.com`
     - All API keys
     - All secrets (JWT_SECRET, SESSION_SECRET, etc.)

4. **Install Dependencies:**
   - Click "Run NPM Install" or use SSH:
     ```bash
     cd /home/username/yourdomain.com
     npm install --production
     ```

5. **Start Application:**
   - Click "START" button
   - Wait for status to show "started"

### 5. Verify

1. Visit your domain
2. Check if app loads
3. View logs in Node.js Selector if issues

## Common Issues

**App won't start:**
- Check logs in Node.js Selector
- Verify all environment variables are set
- Ensure MongoDB connection works

**MongoDB connection error:**
- Verify `MONGO_URI` is correct
- For Atlas: Check IP whitelist
- Test connection separately

**Static files not loading:**
- Ensure `client/dist` directory exists
- Check file permissions (644 for files, 755 for dirs)
- Verify `DOMAIN_CLIENT` is set correctly

## Need Help?

See `CPANEL_DEPLOYMENT.md` for detailed instructions.


