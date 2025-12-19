# Production Build Guide

This guide covers building and deploying HBMP AgentBot for production.

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- MongoDB database (local or cloud)
- Meilisearch instance (optional, for search features)
- Environment variables configured

## Quick Build

### Option 1: Using Build Script (Recommended)

```bash
chmod +x scripts/build-production.sh
./scripts/build-production.sh
```

### Option 2: Manual Build

```bash
# Set memory limit
export NODE_OPTIONS="--max-old-space-size=6144"

# Install dependencies
npm ci

# Build packages
npm run build:packages

# Build client
npm run build:client
```

## Build Configuration

### Memory Settings

The build process requires **6GB (6144MB)** of memory to prevent "JavaScript heap out of memory" errors. This is configured in:

- **Dockerfile**: `NODE_OPTIONS="--max-old-space-size=6144"`
- **nixpacks.toml**: `env = { NODE_OPTIONS = "--max-old-space-size=6144" }`
- **Build script**: `export NODE_OPTIONS="--max-old-space-size=6144"`

### Vite Optimizations

The `client/vite.config.ts` is optimized for production:

- ✅ **Minification**: `esbuild` (40% less memory than terser)
- ✅ **Sourcemaps**: Disabled (saves ~30% memory)
- ✅ **Code splitting**: Optimized manual chunks
- ✅ **Compression**: Gzip/Brotli enabled
- ✅ **PWA**: Service worker configured

## Environment Variables

### Required Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017/LibreChat

# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=3080

# Search (optional)
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=your-master-key

# Vector DB (optional)
RAG_API_URL=http://localhost:8000
```

### AI Provider Keys (at least one required)

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_KEY=...
```

See `.env.example` for complete list.

## Deployment Options

### Zeabur Deployment

1. **Connect Repository**
   - Go to [Zeabur Dashboard](https://dash.zeabur.com)
   - Click "New Project" → "Import from Git"
   - Select your repository

2. **Configure Environment Variables**
   - Go to your service → "Environment Variables"
   - Add all required variables (see above)
   - **Important**: Add `NODE_OPTIONS=--max-old-space-size=6144`

3. **Build Configuration**
   - Zeabur will automatically detect `nixpacks.toml`
   - The build will use 6GB memory limit
   - Build time: ~10-15 minutes

4. **Deploy**
   - Click "Deploy" or push to main branch
   - Monitor build logs for any errors
   - Wait for deployment to complete

### Railway Deployment

1. **Deploy Template**
   - Use: https://railway.app/template/b5k2mn
   - Or connect your repository

2. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=3080
   NODE_OPTIONS=--max-old-space-size=6144
   MONGO_URI=mongodb://mongodb:27017/LibreChat
   ```

3. **Deploy**
   - Railway will build automatically
   - Check logs for build progress

### Docker Deployment

#### Build Docker Image

```bash
docker build -t hbmp-agentbot:latest .
```

#### Run Container

```bash
docker run -d \
  --name hbmp-agentbot \
  -p 3080:3080 \
  --env-file .env \
  hbmp-agentbot:latest
```

#### Docker Compose

```bash
docker-compose -f deploy-compose.yml up -d
```

## Build Verification

After building, verify the output:

```bash
# Check build output exists
ls -la client/dist

# Check build size
du -sh client/dist

# Test production build locally
npm run backend
```

## Troubleshooting

### "JavaScript heap out of memory" Error

**Solution**: Ensure `NODE_OPTIONS` is set to `--max-old-space-size=6144`

- Check `nixpacks.toml` has the correct value
- Verify environment variable in deployment platform
- Clear build cache and rebuild

### Build Fails on Zeabur

1. **Check Build Logs**
   - Go to Zeabur dashboard → Your service → Logs
   - Look for memory-related errors

2. **Verify Memory Limit**
   - Ensure `NODE_OPTIONS=--max-old-space-size=6144` is set
   - Check `nixpacks.toml` configuration

3. **Clear Build Cache**
   - In Zeabur: Service → Settings → Clear Build Cache
   - Redeploy

### Slow Build Times

- **Normal**: 10-15 minutes for first build
- **Subsequent**: 5-10 minutes (with cache)
- **If slower**: Check network connection and Zeabur status

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] Build completes successfully
- [ ] Production build tested locally (`npm run backend`)
- [ ] API keys are valid
- [ ] MongoDB is accessible
- [ ] Meilisearch is running (if used)
- [ ] SSL/TLS configured (for HTTPS)
- [ ] Domain configured (if using custom domain)
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place

## Performance Optimization

### Build Optimizations Already Applied

- ✅ Memory limit set to 6GB
- ✅ esbuild minification (faster, less memory)
- ✅ Sourcemaps disabled in production
- ✅ Code splitting optimized
- ✅ Compression enabled (gzip/brotli)
- ✅ Tree shaking enabled
- ✅ Dead code elimination

### Runtime Optimizations

- ✅ Compression middleware enabled
- ✅ Static file caching configured
- ✅ Database connection pooling
- ✅ Request rate limiting

## Monitoring

### Health Check Endpoint

```bash
curl http://your-domain.com/api/health
```

### Logs

- **Local**: Check `api/logs/` directory
- **Zeabur**: Dashboard → Service → Logs
- **Railway**: Dashboard → Service → Logs

## Support

For issues or questions:

1. Check build logs in deployment platform
2. Verify environment variables
3. Test locally first
4. Check GitHub issues

## Next Steps

After successful deployment:

1. ✅ Create admin user account
2. ✅ Configure AI provider keys
3. ✅ Test agent creation
4. ✅ Set up custom domain (optional)
5. ✅ Configure SSL/TLS (optional)
6. ✅ Set up monitoring (optional)





