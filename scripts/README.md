# Scripts - Build & Deployment Automation

> Automated scripts for environment setup, testing, SSL configuration, and deployment verification.

## 📁 Available Scripts

### Test Environment Setup
- `setup-test-env.sh` - Linux/macOS test environment setup
- `setup-test-env.ps1` - Windows test environment setup

### SSL Configuration
- Located in `docker/ssl/`
- `ssl-setup.sh` - Generate SSL certificates (Linux/macOS)
- `ssl-setup.ps1` - Generate SSL certificates (Windows)

### Docker Deployment
- Located in `docker/`
- `verify-docker-config.ps1` - Verify Docker configuration
- `docker-deployment-test.ps1` - Test Docker deployment

## 🚀 Usage

### Setup Test Environment

**Linux/macOS**:
```bash
bash scripts/setup-test-env.sh
```

**Windows**:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-test-env.ps1
```

### Generate SSL Certificates

**Linux/macOS**:
```bash
cd docker && bash ssl-setup.sh
```

**Windows**:
```powershell
cd docker
.\ssl-setup.ps1
```

### Verify Docker Configuration

```powershell
cd docker
.\verify-docker-config.ps1
```

## 📖 Documentation

- [Main README](../README.md) - Project overview
- [Deployment Guide](../docs/deployment/DEPLOYMENT.md) - Production deployment
- [SSL Setup Guide](../docs/deployment/SSL_SETUP_GUIDE.md) - SSL configuration

---

**Maintained by**: Alex Cinovoj, TechTide AI
