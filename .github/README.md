# GitHub Workflows - CI/CD Pipeline

> Automated CI/CD pipeline with GitHub Actions including linting, testing, security scanning, Docker builds, performance monitoring, and automated deployments.

## 🚀 Workflows

### 1. CI Pipeline (`workflows/ci.yml`)
**Triggers**: Push to main/develop, Pull requests

**Jobs**:
- ✅ Lint code (ESLint)
- ✅ Type check (TypeScript)
- ✅ Run tests (Jest/Vitest)
- ✅ Security scan
- ✅ Build applications
- ✅ Docker build & test
- ✅ Integration tests

### 2. Code Quality (`workflows/code-quality.yml`)
**Triggers**: Push to main/develop

**Jobs**:
- ✅ Prettier format check
- ✅ ESLint with annotations
- ✅ TypeScript type check
- ✅ CodeQL security analysis
- ✅ Dependency review

### 3. Docker (`workflows/docker.yml`)
**Triggers**: Push to main

**Jobs**:
- ✅ Build Docker images
- ✅ Security scanning
- ✅ Integration tests
- ✅ Push to registry

### 4. Performance (`workflows/performance.yml`)
**Triggers**: Push to main, Weekly schedule

**Jobs**:
- ✅ Lighthouse audits
- ✅ Bundle size analysis
- ✅ Load testing
- ✅ Performance regression detection

### 5. CD Pipeline (`workflows/cd.yml`)
**Triggers**: Push to main (after CI passes)

**Jobs**:
- ✅ Deploy to staging
- ✅ Run smoke tests
- ✅ Deploy to production
- ✅ Rollback on failure

### 6. Release (`workflows/release.yml`)
**Triggers**: Tag push (v*)

**Jobs**:
- ✅ Generate changelog
- ✅ Create GitHub release
- ✅ Tag version
- ✅ Publish artifacts

### 7. PR Checks (`workflows/pr-checks.yml`)
**Triggers**: Pull request events

**Jobs**:
- ✅ Validate PR format
- ✅ Add size labels
- ✅ Auto-assign reviewers
- ✅ Run PR-specific checks

## 📊 Pipeline Status

**View live status**: https://github.com/Alexi5000/Ellie/actions

## 🔧 Configuration

### Secrets Required
- `OPENAI_API_KEY` - OpenAI API key
- `GROQ_API_KEY` - Groq API key
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `CI` - CI environment flag

## 📖 Documentation

- [CI/CD Pipeline](../docs/ci-cd/CI_CD_PIPELINE.md) - Complete documentation
- [CI/CD Setup](../docs/ci-cd/CI_CD_SETUP.md) - Setup guide
- [Quick Reference](../docs/ci-cd/QUICK_REFERENCE.md) - Common commands

---

**Maintained by**: Alex Cinovoj, TechTide AI
