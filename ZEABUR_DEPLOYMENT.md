# Zeabur Deployment Guide

Quick reference for deploying HBMP AgentBot to Zeabur.

## Quick Deploy Steps

### 1. Connect Repository

1. Go to [Zeabur Dashboard](https://dash.zeabur.com)
2. Click **"New Project"** → **"Import from Git"**
3. Select your GitHub/GitLab repository
4. Select the branch (usually `main` or `master`)

### 2. Configure Environment Variables

Go to your service → **"Environment Variables"** and add:

#### Required Variables

```bash
# Server Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3080

# Memory Limit (CRITICAL - prevents build failures)
NODE_OPTIONS=--max-old-space-size=6144

# Database (use Zeabur MongoDB service or external)
MONGO_URI=mongodb://your-mongodb-uri/LibreChat

# Search (optional - use Zeabur Meilisearch service)
MEILI_HOST=http://your-meilisearch-service:7700
MEILI_MASTER_KEY=your-master-key
```

#### AI Provider Keys (at least one required)

```bash
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_KEY=your-google-key
```

### 3. Deploy

1. Click **"Deploy"** or push to your main branch
2. Monitor build logs
3. Wait 10-15 minutes for first build
4. Access your app via Zeabur-provided URL

## Build Configuration

Zeabur automatically detects `nixpacks.toml` which includes:

- ✅ Node.js 20
- ✅ 6GB memory limit for builds
- ✅ Optimized build commands
- ✅ Production-ready configuration

## Common Issues & Solutions

### Build Fails with "JavaScript heap out of memory"

**Solution**: 
1. Add `NODE_OPTIONS=--max-old-space-size=6144` to environment variables
2. Clear build cache: Service → Settings → Clear Build Cache
3. Redeploy

### Build Still Shows 2048MB

**Solution**:
1. Verify `nixpacks.toml` has correct memory setting
2. Ensure environment variable is set in Zeabur dashboard
3. Clear cache and redeploy

### Database Connection Errors

**Solution**:
1. Verify `MONGO_URI` is correct
2. Check MongoDB service is running (if using Zeabur MongoDB)
3. Ensure network connectivity between services

### Slow Build Times

**Normal**: 10-15 minutes for first build, 5-10 minutes for subsequent builds

**If slower**:
- Check Zeabur status page
- Verify network connection
- Consider upgrading plan for faster builds

## Monitoring

### View Logs

1. Go to Zeabur Dashboard
2. Select your service
3. Click **"Logs"** tab
4. Filter by "build" or "runtime"

### Health Check

```bash
curl https://your-app.zeabur.app/api/health
```

## Scaling

### Horizontal Scaling

1. Go to Service → Settings
2. Adjust **"Instances"** slider
3. Zeabur will auto-scale based on traffic

### Resource Limits

- **Free Tier**: Limited resources
- **Paid Plans**: More CPU/RAM available
- Adjust in Service → Settings → Resources

## Custom Domain

1. Go to Service → Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for SSL certificate (automatic)

## Environment-Specific Configs

### Development

```bash
NODE_ENV=development
```

### Production

```bash
NODE_ENV=production
HOST=0.0.0.0
```

## Support

- **Zeabur Docs**: https://zeabur.com/docs
- **Zeabur Discord**: https://discord.gg/zeabur
- **GitHub Issues**: Check repository issues

## Checklist

Before deploying:

- [ ] Repository connected to Zeabur
- [ ] All environment variables set
- [ ] `NODE_OPTIONS` set to 6144MB
- [ ] MongoDB URI configured
- [ ] AI provider keys added
- [ ] Build cache cleared (if redeploying)
- [ ] Monitoring/logging configured

After deployment:

- [ ] Build completed successfully
- [ ] App accessible via URL
- [ ] Health check passes
- [ ] Can create user account
- [ ] Can create agents
- [ ] API endpoints working





