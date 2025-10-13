# CI/CD Pipeline Documentation

Complete documentation for the Ellie Voice Receptionist CI/CD pipeline powered by GitHub Actions.

## 📚 Documentation Index

### Core Documentation
- **[CI/CD Pipeline](CI_CD_PIPELINE.md)** - Complete pipeline documentation
- **[CI/CD Setup](CI_CD_SETUP.md)** - Setup and configuration guide
- **[Quick Reference](QUICK_REFERENCE.md)** - Quick command reference

### Status & Reports
- **[CI/CD Status](CI_CD_STATUS.md)** - Current pipeline status
- **[Test Report](CI_CD_TEST_REPORT.md)** - Detailed test results
- **[Test Summary](CI_CD_TEST_SUMMARY.md)** - Quick test overview
- **[Implementation Summary](CI_CD_IMPLEMENTATION_SUMMARY.md)** - Implementation details

## 🚀 Quick Start

### View Pipeline Status
```bash
# View recent workflow runs
gh run list --limit 10

# Watch a specific run
gh run watch <run-id>

# View detailed results
gh run view <run-id>
```

### Common Commands
```bash
# Lint and fix code
npm run lint:fix

# Format code
cd backend && npm run format
cd frontend && npm run format

# Type check
npm run type-check

# Run all tests
npm run test:all

# Build applications
cd backend && npm run build
cd frontend && npm run build
```

## 🔧 Workflows

### 1. CI Pipeline (.github/workflows/ci.yml)
Runs on every push and pull request to main/develop branches.

**Jobs:**
- Lint code (ESLint)
- Type check (TypeScript)
- Run tests (Jest/Vitest)
- Security scan
- Build applications
- Docker build & test
- Integration tests

### 2. Code Quality (.github/workflows/code-quality.yml)
Comprehensive code quality checks.

**Jobs:**
- Prettier format check
- ESLint check with annotations
- TypeScript type check
- CodeQL security analysis
- Dependency review

### 3. Docker (.github/workflows/docker.yml)
Docker image building and testing.

**Jobs:**
- Build Docker images
- Security scanning
- Integration tests
- Push to registry

### 4. Performance (.github/workflows/performance.yml)
Performance monitoring and optimization.

**Jobs:**
- Lighthouse audits
- Bundle size analysis
- Load testing
- Performance regression detection

### 5. CD Pipeline (.github/workflows/cd.yml)
Automated deployment to staging and production.

**Jobs:**
- Deploy to staging
- Run smoke tests
- Deploy to production
- Rollback on failure

### 6. Release (.github/workflows/release.yml)
Automated release management.

**Jobs:**
- Generate changelog
- Create GitHub release
- Tag version
- Publish artifacts

### 7. PR Checks (.github/workflows/pr-checks.yml)
Pull request validation and automation.

**Jobs:**
- Validate PR format
- Add size labels
- Auto-assign reviewers
- Run PR-specific checks

## 📊 Pipeline Status

**View live status**: https://github.com/Alexi5000/Ellie/actions

### Current Status
- ✅ All workflows configured and active
- ✅ Automated testing on every push
- ✅ Security scanning enabled
- ✅ Performance monitoring active
- ✅ Automated deployments ready

## 🔍 Troubleshooting

### Common Issues

**1. Workflow fails on type check**
```bash
# Run type check locally
npm run type-check

# Fix type errors
# Then commit and push
```

**2. Linting failures**
```bash
# Run lint locally
npm run lint

# Auto-fix issues
npm run lint:fix
```

**3. Formatting issues**
```bash
# Check formatting
cd backend && npm run format:check
cd frontend && npm run format:check

# Fix formatting
cd backend && npm run format
cd frontend && npm run format
```

**4. Test failures**
```bash
# Run tests locally
npm run test:all

# Run specific tests
npm run test:backend
npm run test:frontend
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Main README](../../README.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Testing Guide](../testing/QUICK_TEST_GUIDE.md)

---

**Last Updated**: October 2025  
**Maintained By**: Alex Cinovoj, TechTide AI
