# Marketing Site Deployment Guide

This guide provides comprehensive instructions for deploying the Ellie marketing website to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Node.js 18+ and npm 9+
- Docker (for containerized deployment)
- Git

### Required Access

- Repository access
- Deployment platform credentials
- Domain/DNS management access
- SSL certificate (for HTTPS)

## Build Process

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Tests

Ensure all tests pass before deployment:

```bash
# Unit tests
npm test -- --run

# Integration tests
npm test -- integration/ --run

# Accessibility tests
npm test -- accessibility/ --run

# Browser tests
npm run test:browser
```

### 3. Build for Production

```bash
npm run build
```

This creates an optimized production build in `frontend/dist/`.

### 4. Verify Build

```bash
# Preview the production build locally
npm run preview
```

Visit `http://localhost:4173` to verify the build.

### 5. Run Lighthouse Audit

```bash
npm run lighthouse
```

Ensure scores meet targets:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Build Docker Image

```bash
# From project root
cd frontend
docker build -t ellie-marketing:latest .
```

#### Run Container Locally

```bash
docker run -p 80:80 ellie-marketing:latest
```

#### Deploy to Production

```bash
# Tag for registry
docker tag ellie-marketing:latest registry.example.com/ellie-marketing:latest

# Push to registry
docker push registry.example.com/ellie-marketing:latest

# Deploy on server
docker pull registry.example.com/ellie-marketing:latest
docker run -d -p 80:80 --name ellie-marketing registry.example.com/ellie-marketing:latest
```

#### Docker Compose

Use the provided `docker-compose.yml`:

```bash
# From project root
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Static Hosting (Vercel, Netlify, etc.)

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

Configuration (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod --dir=dist
```

Configuration (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Traditional Web Server (Nginx)

#### Build and Copy Files

```bash
# Build
cd frontend
npm run build

# Copy to web server
scp -r dist/* user@server:/var/www/ellie
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ellie.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ellie.example.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/ellie.crt;
    ssl_certificate_key /etc/ssl/private/ellie.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/ellie;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Configuration

### Environment Variables

Create `.env.production` in `frontend/`:

```bash
# API Configuration
VITE_API_URL=https://api.ellie.example.com
VITE_API_KEY=your_api_key_here

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true

# Environment
VITE_ENV=production
```

### Build-Time Variables

Variables are embedded at build time:

```bash
# Build with production env
npm run build

# Or specify env file
npm run build -- --mode production
```

### Runtime Configuration

For runtime configuration, use a config endpoint:

```typescript
// src/config.ts
export async function loadConfig() {
  const response = await fetch('/config.json');
  return response.json();
}
```

Deploy `config.json` separately from the build.

## Performance Optimization

### 1. Enable Compression

Ensure gzip/brotli compression is enabled on your server.

**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

**Verify:**
```bash
curl -H "Accept-Encoding: gzip" -I https://ellie.example.com
```

### 2. Configure Caching

Set appropriate cache headers:

```nginx
# Immutable assets (with hash in filename)
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Images
location ~* \.(png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML (no cache)
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. Enable HTTP/2

```nginx
listen 443 ssl http2;
```

### 4. Preload Critical Resources

Add to `index.html`:

```html
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
```

### 5. Use CDN

Configure CDN for static assets:

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.VITE_CDN_URL || '/',
});
```

### 6. Optimize Images

```bash
# Install image optimization tools
npm install -g sharp-cli

# Optimize images
sharp -i input.png -o output.webp --webp
```

## Monitoring

### 1. Health Checks

Implement health check endpoint:

```typescript
// src/health.ts
export function setupHealthCheck() {
  // Expose health endpoint
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      console.log('App loaded successfully');
    });
  }
}
```

### 2. Error Tracking

Integrate error tracking (e.g., Sentry):

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  });
}
```

### 3. Analytics

Add analytics tracking:

```typescript
// src/analytics.ts
export function initAnalytics() {
  if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    // Google Analytics
    window.gtag('config', import.meta.env.VITE_GA_TRACKING_ID);
  }
}
```

### 4. Performance Monitoring

Monitor Core Web Vitals:

```typescript
// src/performance.ts
import { getCLS, getFID, getLCP } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getLCP(console.log);
}
```

### 5. Uptime Monitoring

Set up external monitoring:
- Pingdom
- UptimeRobot
- StatusCake

Configure alerts for:
- Site downtime
- Slow response times (> 2s)
- SSL certificate expiration
- High error rates

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d ellie.example.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Manual Certificate

```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes -keyout ellie.key -out ellie.csr

# After receiving certificate from CA
sudo cp ellie.crt /etc/ssl/certs/
sudo cp ellie.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/ellie.key
```

## CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:

```yaml
name: Deploy Marketing Site

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Run tests
        working-directory: frontend
        run: npm test -- --run
      
      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_API_KEY: ${{ secrets.API_KEY }}
      
      - name: Run Lighthouse
        working-directory: frontend
        run: npm run lighthouse
      
      - name: Deploy to production
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: registry.example.com/ellie-marketing:latest
```

## Rollback Procedure

### Docker Deployment

```bash
# List previous images
docker images registry.example.com/ellie-marketing

# Stop current container
docker stop ellie-marketing
docker rm ellie-marketing

# Run previous version
docker run -d -p 80:80 --name ellie-marketing registry.example.com/ellie-marketing:previous-tag
```

### Static Hosting

```bash
# Vercel
vercel rollback

# Netlify
netlify rollback
```

### Traditional Server

```bash
# Keep previous builds
mv /var/www/ellie /var/www/ellie-backup-$(date +%Y%m%d)
cp -r new-build /var/www/ellie

# Rollback if needed
rm -rf /var/www/ellie
mv /var/www/ellie-backup-YYYYMMDD /var/www/ellie
```

## Troubleshooting

### Build Fails

**Check Node version:**
```bash
node --version  # Should be 18+
```

**Clear cache:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Blank Page After Deploy

**Check console errors:**
Open browser DevTools and check for errors.

**Verify base path:**
Ensure `base` in `vite.config.ts` matches deployment path.

**Check routing:**
Ensure server is configured for SPA routing.

### Assets Not Loading

**Check paths:**
Verify asset paths in built files match server configuration.

**Check CORS:**
Ensure CORS headers are set if assets are on different domain.

### Performance Issues

**Run Lighthouse:**
```bash
npm run lighthouse
```

**Check bundle size:**
```bash
npm run build -- --mode production
ls -lh dist/assets/
```

**Analyze bundle:**
```bash
npm run build -- --mode production --analyze
```

### SSL Issues

**Verify certificate:**
```bash
openssl s_client -connect ellie.example.com:443 -servername ellie.example.com
```

**Check expiration:**
```bash
echo | openssl s_client -connect ellie.example.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Theme toggle works
- [ ] Mobile menu functions
- [ ] Forms submit properly
- [ ] Links work correctly
- [ ] Images load
- [ ] Fonts render
- [ ] Analytics tracking
- [ ] Error tracking
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable
- [ ] Accessibility score 90+
- [ ] SEO score 90+
- [ ] Health check responds
- [ ] Monitoring alerts configured

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API keys not exposed
- [ ] Dependencies updated
- [ ] No console.log in production
- [ ] Error messages don't expose internals
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Regular security audits scheduled

## Related Documentation

- [Docker Deployment](./docs/DEPLOYMENT.md)
- [SSL Setup Guide](./docs/SSL_SETUP_GUIDE.md)
- [Performance Guide](./frontend/PERFORMANCE.md)
- [Testing Guide](./frontend/src/__tests__/README.md)
