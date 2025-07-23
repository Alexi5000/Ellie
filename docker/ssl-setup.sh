#!/bin/bash

# SSL Certificate Setup Script for Ellie Voice Receptionist
# This script helps set up SSL certificates for production deployment

set -e

DOMAIN=${1:-"your-domain.com"}
SSL_DIR="./ssl"
CERTS_DIR="${SSL_DIR}/certs"
PRIVATE_DIR="${SSL_DIR}/private"

echo "Setting up SSL certificates for domain: ${DOMAIN}"

# Create SSL directories
mkdir -p "${CERTS_DIR}"
mkdir -p "${PRIVATE_DIR}"

# Set proper permissions
chmod 755 "${SSL_DIR}"
chmod 755 "${CERTS_DIR}"
chmod 700 "${PRIVATE_DIR}"

echo "SSL directory structure created:"
echo "  ${CERTS_DIR}/ - Place your SSL certificate files here"
echo "  ${PRIVATE_DIR}/ - Place your private key files here"
echo ""

# Generate self-signed certificate for development/testing
if [ "$2" = "--self-signed" ]; then
    echo "Generating self-signed certificate for development..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${PRIVATE_DIR}/ellie.key" \
        -out "${CERTS_DIR}/ellie.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=${DOMAIN}"
    
    echo "Self-signed certificate generated:"
    echo "  Certificate: ${CERTS_DIR}/ellie.crt"
    echo "  Private Key: ${PRIVATE_DIR}/ellie.key"
    echo ""
    echo "WARNING: Self-signed certificates should only be used for development!"
else
    echo "For production, you need to obtain SSL certificates from a Certificate Authority."
    echo "Popular options:"
    echo "  - Let's Encrypt (free): https://letsencrypt.org/"
    echo "  - Cloudflare SSL"
    echo "  - Commercial CA (DigiCert, GlobalSign, etc.)"
    echo ""
    echo "Place your certificate files as:"
    echo "  ${CERTS_DIR}/ellie.crt - Your SSL certificate"
    echo "  ${PRIVATE_DIR}/ellie.key - Your private key"
    echo ""
    echo "If you have intermediate certificates, create a bundle:"
    echo "  cat your_domain.crt intermediate.crt > ${CERTS_DIR}/ellie.crt"
fi

echo ""
echo "After placing your SSL certificates, update docker-compose.prod.yml to uncomment the SSL volume mounts."
echo "Then update docker/nginx-production.conf to uncomment and configure the SSL certificate paths."