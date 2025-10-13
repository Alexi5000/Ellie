# SSL Certificate Setup Guide for Ellie Voice Receptionist

## Overview

This guide explains how to set up SSL certificates for the Ellie Voice Receptionist application in production environments. The application includes automated scripts to help with SSL certificate setup and configuration.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured and pointing to your server
- For self-signed certificates: OpenSSL installed (or WSL on Windows)

## SSL Setup Scripts

The project includes two SSL setup scripts:

1. **PowerShell Script** (`docker/ssl-setup.ps1`) - For Windows environments
2. **Bash Script** (`docker/ssl-setup.sh`) - For Linux/Mac environments

Both scripts perform the same functions:
- Create SSL directory structure
- Generate self-signed certificates for development (optional)
- Provide instructions for production certificate setup

## Quick Start

### For Development (Self-Signed Certificates)

#### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File docker/ssl-setup.ps1 -Domain localhost -SelfSigned
```

#### Linux/Mac (Bash)
```bash
bash docker/ssl-setup.sh localhost --self-signed
```

**Warning:** Self-signed certificates should only be used for development and testing. Browsers will show security warnings.

### For Production (CA-Signed Certificates)

#### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File docker/ssl-setup.ps1 -Domain your-domain.com
```

#### Linux/Mac (Bash)
```bash
bash docker/ssl-setup.sh your-domain.com
```

This will create the directory structure. You'll need to obtain certificates from a Certificate Authority (see below).

## Directory Structure

The scripts create the following directory structure:

```
ssl/
├── certs/          # SSL certificate files
│   └── ellie.crt   # Your SSL certificate (or certificate bundle)
└── private/        # Private key files
    └── ellie.key   # Your private key
```

## Obtaining Production Certificates

### Option 1: Let's Encrypt (Free, Recommended)

Let's Encrypt provides free SSL certificates with automatic renewal.

**Using Certbot:**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/certs/ellie.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/private/ellie.key
sudo chmod 644 ./ssl/certs/ellie.crt
sudo chmod 600 ./ssl/private/ellie.key
```

**Automatic Renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal (cron job)
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet --post-hook "docker-compose -f /path/to/docker-compose.prod.yml restart nginx"
```

### Option 2: Cloudflare SSL

If using Cloudflare:

1. Log in to Cloudflare dashboard
2. Navigate to SSL/TLS → Origin Server
3. Create Certificate
4. Copy the certificate and private key
5. Save to `ssl/certs/ellie.crt` and `ssl/private/ellie.key`

### Option 3: Commercial Certificate Authority

Purchase from providers like DigiCert, GlobalSign, or Comodo:

1. Generate a Certificate Signing Request (CSR)
2. Submit CSR to CA
3. Receive certificate files
4. Place certificate in `ssl/certs/ellie.crt`
5. Place private key in `ssl/private/ellie.key`

**Creating a Certificate Bundle:**

If you have intermediate certificates:

```bash
# Linux/Mac
cat your_domain.crt intermediate.crt > ssl/certs/ellie.crt

# Windows PowerShell
Get-Content your_domain.crt, intermediate.crt | Set-Content ssl/certs/ellie.crt
```

## Configuration Steps

### 1. Enable SSL in Docker Compose

Edit `docker-compose.prod.yml` or `docker/docker-compose.prod.yml`:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx-production.conf:/etc/nginx/nginx.conf:ro
    - ./server-common.conf:/etc/nginx/conf.d/server-common.conf:ro
    # Uncomment these lines:
    - ./ssl/certs:/etc/ssl/certs:ro
    - ./ssl/private:/etc/ssl/private:ro
```

### 2. Enable SSL in Nginx Configuration

Edit `docker/nginx-production.conf`:

1. **Uncomment the HTTPS redirect** in the HTTP server block:
```nginx
server {
    listen 80;
    server_name _;
    
    # Uncomment this line:
    return 301 https://$server_name$request_uri;
}
```

2. **Uncomment SSL certificate paths** in the HTTPS server block:
```nginx
server {
    listen 443 ssl http2;
    server_name _;
    
    # Uncomment these lines:
    ssl_certificate /etc/ssl/certs/ellie.crt;
    ssl_certificate_key /etc/ssl/private/ellie.key;
    
    # ... rest of configuration
}
```

### 3. Update Environment Variables

Update your `.env.production` file:

```env
# Frontend
REACT_APP_API_URL=https://your-domain.com
REACT_APP_SOCKET_URL=https://your-domain.com

# Backend
CORS_ORIGIN=https://your-domain.com
```

### 4. Deploy with SSL

```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Rebuild and start with SSL
docker-compose -f docker-compose.prod.yml up --build -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

## Verification

### 1. Run Verification Script

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File docker/ssl-verification-test.ps1
```

### 2. Test SSL Configuration

```bash
# Check certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Test HTTPS endpoint
curl -I https://your-domain.com/health

# Verify redirect from HTTP to HTTPS
curl -I http://your-domain.com
```

### 3. Online SSL Testing

- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

## Security Best Practices

### File Permissions

Ensure proper permissions on SSL files:

```bash
# Linux/Mac
chmod 755 ssl
chmod 755 ssl/certs
chmod 700 ssl/private
chmod 644 ssl/certs/ellie.crt
chmod 600 ssl/private/ellie.key
```

### Certificate Renewal

- Let's Encrypt certificates expire after 90 days
- Set up automatic renewal (see Let's Encrypt section)
- Monitor certificate expiration dates
- Test renewal process regularly

### Security Headers

The nginx configuration includes security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

### TLS Configuration

The application uses:
- TLS 1.2 and TLS 1.3 only
- Strong cipher suites
- Perfect Forward Secrecy
- Session caching for performance

## Troubleshooting

### Certificate Not Found

**Error:** `nginx: [emerg] cannot load certificate`

**Solution:**
1. Verify files exist: `ls -la ssl/certs/ ssl/private/`
2. Check file permissions
3. Ensure volume mounts are uncommented in docker-compose.prod.yml

### Permission Denied

**Error:** `Permission denied` when accessing certificate files

**Solution:**
```bash
sudo chmod 644 ssl/certs/ellie.crt
sudo chmod 600 ssl/private/ellie.key
```

### Certificate Chain Issues

**Error:** Browser shows "Certificate not trusted"

**Solution:**
- Ensure you have the full certificate chain
- Include intermediate certificates in ellie.crt
- Verify certificate order: server cert first, then intermediates

### Mixed Content Warnings

**Error:** Browser console shows mixed content warnings

**Solution:**
- Update all API URLs to use HTTPS
- Check REACT_APP_API_URL and REACT_APP_SOCKET_URL
- Ensure WebSocket connections use wss:// instead of ws://

### OpenSSL Not Found (Windows)

**Error:** `OpenSSL not found` when generating self-signed certificates

**Solutions:**
1. Install OpenSSL for Windows
2. Use WSL (Windows Subsystem for Linux)
3. Use PowerShell's built-in certificate cmdlet:
```powershell
New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"
```

## Maintenance

### Certificate Renewal Checklist

- [ ] Renew certificate before expiration
- [ ] Update certificate files in ssl/ directory
- [ ] Restart nginx container: `docker-compose -f docker-compose.prod.yml restart nginx`
- [ ] Verify new certificate: `openssl s_client -connect your-domain.com:443`
- [ ] Test application functionality
- [ ] Monitor logs for SSL errors

### Monitoring

Monitor certificate expiration:

```bash
# Check certificate expiration date
openssl x509 -in ssl/certs/ellie.crt -noout -enddate

# Check certificate details
openssl x509 -in ssl/certs/ellie.crt -noout -text
```

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Docker SSL Best Practices](https://docs.docker.com/engine/security/https/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review nginx logs: `docker-compose -f docker-compose.prod.yml logs nginx`
3. Verify SSL configuration with online tools
4. Consult the project documentation in `/docs`
