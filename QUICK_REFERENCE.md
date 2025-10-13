# CI/CD Quick Reference

## 🚀 Quick Commands

### Linting
```bash
# Check
npm run lint                    # Both backend and frontend
cd backend && npm run lint      # Backend only
cd frontend && npm run lint     # Frontend only

# Fix
npm run lint:fix
cd backend && npm run lint:fix
cd frontend && npm run lint:fix
```

### Formatting
```bash
# Check
cd backend && npm run format:check
cd frontend && npm run format:check

# Fix
cd backend && npm run format
cd frontend && npm run format
```

### Type Checking
```bash
cd backend && npm run type-check
cd frontend && npm run type-check
```

### Testing
```bash
npm test                        # All tests
npm run test:backend           # Backend only
npm run test:frontend          # Frontend only
npm run test:integration       # Integration tests
npm run test:all               # Everything
```

### Building
```bash
cd backend && npm run build
cd frontend && npm run build
```

### Docker
```bash
npm run docker:up              # Start development
npm run docker:down            # Stop containers
npm run docker:prod            # Start production
```

---

## 📋 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI Pipeline | Push/PR to main/develop | Full CI checks |
| Code Quality | Push/PR to main/develop | Linting, formatting, security |
| Docker | Push/PR to main, Weekly | Docker builds and scans |
| Performance | PR to main, Weekly | Performance testing |
| CD Pipeline | Push to main, Tags | Deployment |
| Release | Version tags (v*.*.*) | Release automation |
| PR Checks | PR opened/updated | PR validation |

---

## 🏷️ PR Title Format

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- perf: Performance
- test: Testing
- build: Build system
- ci: CI/CD
- chore: Maintenance
```

**Examples:**
```
feat(backend): add user authentication
fix(frontend): resolve button click issue
docs: update CI/CD documentation
ci: add performance testing workflow
```

---

## ✅ Pre-Commit Checklist

```bash
# 1. Lint
npm run lint

# 2. Format
cd backend && npm run format
cd frontend && npm run format

# 3. Type check
cd backend && npm run type-check
cd frontend && npm run type-check

# 4. Test
npm test

# 5. Build
cd backend && npm run build
cd frontend && npm run build
```

---

## 🔧 Common Fixes

### Fix All Linting Issues
```bash
cd backend && npm run lint:fix
cd frontend && npm run lint:fix
```

### Fix All Formatting
```bash
cd backend && npm run format
cd frontend && npm run format
```

### Clean and Rebuild
```bash
# Backend
cd backend
rm -rf dist node_modules
npm ci
npm run build

# Frontend
cd frontend
rm -rf dist node_modules
npm ci
npm run build
```

---

## 🚢 Deployment

### Deploy to Staging
```bash
git checkout main
git pull origin main
git push origin main
# Automatic deployment triggers
```

### Deploy to Production
```bash
# Create release
npm version patch  # or minor, or major
git push origin main
git push origin --tags

# Or manually
git tag v1.0.0
git push origin v1.0.0
```

---

## 🔍 Debugging CI Failures

### Linting Failed
```bash
npm run lint:fix
git add .
git commit -m "fix: resolve linting issues"
git push
```

### Type Check Failed
```bash
cd backend && npm run type-check
cd frontend && npm run type-check
# Fix errors in code
```

### Tests Failed
```bash
npm test
# Fix failing tests
```

### Build Failed
```bash
cd backend && npm run build
cd frontend && npm run build
# Fix build errors
```

---

## 📊 Status Checks

All PRs must pass:
- ✅ Lint Code
- ✅ TypeScript Type Check
- ✅ Backend Tests
- ✅ Frontend Tests
- ✅ Build Applications
- ✅ Integration Tests
- ✅ Docker Build & Test

---

## 🔐 Required Secrets

### For Deployment
```
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
```

### Optional
```
SLACK_WEBHOOK
SNYK_TOKEN
CODECOV_TOKEN
```

---

## 📚 Documentation

- [Complete Pipeline Docs](docs/CI_CD_PIPELINE.md)
- [Setup Guide](docs/CI_CD_SETUP.md)
- [Implementation Summary](CI_CD_IMPLEMENTATION_SUMMARY.md)

---

## 🆘 Getting Help

1. Check workflow logs in Actions tab
2. Review documentation
3. Search existing issues
4. Contact DevOps team

---

**Quick Links:**
- [GitHub Actions](https://github.com/YOUR_REPO/actions)
- [Pull Requests](https://github.com/YOUR_REPO/pulls)
- [Issues](https://github.com/YOUR_REPO/issues)
