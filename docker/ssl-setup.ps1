# SSL Certificate Setup Script for Ellie Voice Receptionist (PowerShell)
# This script helps set up SSL certificates for production deployment

param(
    [string]$Domain = "your-domain.com",
    [switch]$SelfSigned
)

Write-Host "Setting up SSL certificates for domain: $Domain" -ForegroundColor Green

$SSL_DIR = "./ssl"
$CERTS_DIR = "$SSL_DIR/certs"
$PRIVATE_DIR = "$SSL_DIR/private"

# Create SSL directories
if (!(Test-Path $SSL_DIR)) { New-Item -ItemType Directory -Path $SSL_DIR -Force }
if (!(Test-Path $CERTS_DIR)) { New-Item -ItemType Directory -Path $CERTS_DIR -Force }
if (!(Test-Path $PRIVATE_DIR)) { New-Item -ItemType Directory -Path $PRIVATE_DIR -Force }

Write-Host "SSL directory structure created:" -ForegroundColor Yellow
Write-Host "  $CERTS_DIR/ - Place your SSL certificate files here"
Write-Host "  $PRIVATE_DIR/ - Place your private key files here"
Write-Host ""

# Generate self-signed certificate for development/testing
if ($SelfSigned) {
    Write-Host "Generating self-signed certificate for development..." -ForegroundColor Yellow
    
    try {
        # Check if OpenSSL is available
        $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
        if ($opensslPath) {
            & openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
                -keyout "$PRIVATE_DIR/ellie.key" `
                -out "$CERTS_DIR/ellie.crt" `
                -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$Domain"
            
            Write-Host "Self-signed certificate generated:" -ForegroundColor Green
            Write-Host "  Certificate: $CERTS_DIR/ellie.crt"
            Write-Host "  Private Key: $PRIVATE_DIR/ellie.key"
            Write-Host ""
            Write-Host "WARNING: Self-signed certificates should only be used for development!" -ForegroundColor Red
        } else {
            Write-Host "OpenSSL not found. Please install OpenSSL or use WSL to run the bash version." -ForegroundColor Red
            Write-Host "Alternative: Use PowerShell's New-SelfSignedCertificate cmdlet for Windows development."
        }
    } catch {
        Write-Host "Error generating certificate: $_" -ForegroundColor Red
    }
} else {
    Write-Host "For production, you need to obtain SSL certificates from a Certificate Authority." -ForegroundColor Yellow
    Write-Host "Popular options:"
    Write-Host "  - Let's Encrypt (free): https://letsencrypt.org/"
    Write-Host "  - Cloudflare SSL"
    Write-Host "  - Commercial CA (DigiCert, GlobalSign, etc.)"
    Write-Host ""
    Write-Host "Place your certificate files as:"
    Write-Host "  $CERTS_DIR/ellie.crt - Your SSL certificate"
    Write-Host "  $PRIVATE_DIR/ellie.key - Your private key"
    Write-Host ""
    Write-Host "If you have intermediate certificates, create a bundle:"
    Write-Host "  Get-Content your_domain.crt, intermediate.crt | Set-Content $CERTS_DIR/ellie.crt"
}

Write-Host ""
Write-Host "After placing your SSL certificates, update docker-compose.prod.yml to uncomment the SSL volume mounts." -ForegroundColor Cyan
Write-Host "Then update docker/nginx-production.conf to uncomment and configure the SSL certificate paths." -ForegroundColor Cyan