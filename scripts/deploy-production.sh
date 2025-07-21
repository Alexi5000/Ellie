#!/bin/bash

# Production Deployment Script for Ellie Voice Receptionist
# Requirements: 4.3, 4.4

set -e

echo "🚀 Starting Ellie Voice Receptionist Production Deployment"

# Configuration
DOMAIN=${DOMAIN:-"your-domain.com"}
EMAIL=${EMAIL:-"admin@your-domain.com"}
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Production compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Setup SSL certificates
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    # Create SSL directory structure
    mkdir -p ssl/certs ssl/private
    
    if [ ! -f "ssl/certs/${DOMAIN}.crt" ] || [ ! -f "ssl/private/${DOMAIN}.key" ]; then
        log_warn "SSL certificates not found for domain: $DOMAIN"
        log_info "You can:"
        log_info "1. Use Let's Encrypt: certbot certonly --standalone -d $DOMAIN"
        log_info "2. Use self-signed certificates for testing:"
        log_info "   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
        log_info "     -keyout ssl/private/${DOMAIN}.key \\"
        log_info "     -out ssl/certs/${DOMAIN}.crt \\"
        log_info "     -subj \"/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}\""
        
        read -p "Generate self-signed certificate for testing? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "ssl/private/${DOMAIN}.key" \
                -out "ssl/certs/${DOMAIN}.crt" \
                -subj "/C=US/ST=State/L=City/O=Ellie/CN=${DOMAIN}"
            log_info "Self-signed certificate generated"
        else
            log_warn "Skipping SSL setup. HTTPS will not be available."
            return
        fi
    fi
    
    # Set proper permissions
    chmod 600 ssl/private/*
    chmod 644 ssl/certs/*
    
    log_info "SSL certificates configured"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Backend environment
    if [ ! -f "backend/.env.production" ]; then
        log_warn "Production environment file not found: backend/.env.production"
        
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env.production
            log_info "Created backend/.env.production from example"
            log_warn "Please edit backend/.env.production with your production values"
        else
            log_error "No environment template found"
            exit 1
        fi
    fi
    
    # Update docker-compose with domain
    if [ "$DOMAIN" != "your-domain.com" ]; then
        sed -i.bak "s/your-domain.com/$DOMAIN/g" "$COMPOSE_FILE"
        log_info "Updated domain in compose file to: $DOMAIN"
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying application..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build application images
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop existing containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_info "Deployment completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost/health" > /dev/null; then
            log_info "Health check passed"
            return 0
        fi
        
        log_info "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Show status
show_status() {
    log_info "Deployment Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo
    log_info "Service URLs:"
    echo "  Health Check: http://localhost/health"
    echo "  Metrics: http://localhost/metrics"
    echo "  Application: http://localhost"
    
    if [ -f "ssl/certs/${DOMAIN}.crt" ]; then
        echo "  HTTPS: https://$DOMAIN"
    fi
    
    echo
    log_info "Monitoring:"
    echo "  Prometheus: http://localhost:9090"
    echo "  Logs: docker-compose -f $COMPOSE_FILE logs -f"
}

# Cleanup function
cleanup() {
    if [ -f "${COMPOSE_FILE}.bak" ]; then
        mv "${COMPOSE_FILE}.bak" "$COMPOSE_FILE"
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    check_prerequisites
    setup_environment
    setup_ssl
    deploy
    
    if health_check; then
        show_status
        log_info "🎉 Production deployment successful!"
    else
        log_error "❌ Deployment failed health check"
        log_info "Check logs: docker-compose -f $COMPOSE_FILE logs"
        exit 1
    fi
}

# Run main function
main "$@"