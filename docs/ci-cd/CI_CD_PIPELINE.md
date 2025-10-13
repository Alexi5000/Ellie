# CI/CD Pipeline Documentation

## Overview

This document describes the complete CI/CD pipeline for the Ellie Voice Receptionist project. The pipeline is built using GitHub Actions and provides comprehensive automation for testing, building, and deploying the application.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Push/PR                             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│  Code Quality │         │   CI Build   │
│   - Prettier  │         │   - Lint     │
│   - ESLint    │         │   - Type     │
│   - CodeQL    │         │   - Test     │
└───────┬───────┘         └──────┬───────┘
        │                        │
        └────────────┬───────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Docker Build  │
            │  - Backend     │
            │  - Frontend    │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │  Integration   │
            │     Tests      │
            └────────┬───────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│   Staging     │         │  Production  │
│  Deployment   │         │  Deployment  │
└───────────────┘         └──────────────┘
```

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Lint
- Runs ESLint on backend and frontend
- Enforces code style standards
- Fails on any linting errors

#### Type Check
- Runs TypeScript compiler in check mode
- Validates type safety across codebase
- No compilation, just validation

#### Test Backend
- Runs Jest test suite for backend
- Includes Redis service for integration tests
- Uploads coverage to Codecov

#### Test Frontend
- Runs Vitest test suite for frontend
- Tests React components and hooks
- Uploads coverage to Codecov

#### Build
- Compiles TypeScript for backend
- Builds production bundle for frontend
- Uploads build artifacts

#### Integration Tests
- Tests Docker container integration
- Validates service communication
- Tests API endpoints

#### Docker Build
- Builds Docker images for both services
- Uses BuildKit for caching
- Validates Dockerfile syntax

#### Security Scan
- Runs npm audit on dependencies
- Scans for known vulnerabilities
- Uses Snyk for advanced scanning

### 2. Code Quality (`.github/workflows/code-quality.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests

**Jobs:**

#### Prettier
- Checks code formatting
- Ensures consistent style
- Fails if formatting is incorrect

#### ESLint
- Detailed linting with annotations
- Provides inline PR comments
- Reports unused disable directives

#### TypeScript
- Comprehensive type checking
- Validates all TypeScript files
- Checks for type errors

#### Dependency Review
- Reviews dependency changes in PRs
- Checks for security vulnerabilities
- Validates license compatibility

#### CodeQL
- Advanced security analysis
- Detects security vulnerabilities
- Scans for code quality issues

### 3. CD Pipeline (`.github/workflows/cd.yml`)

**Triggers:**
- Push to `main` branch
- Version tags (`v*`)
- Manual workflow dispatch

**Jobs:**

#### Build and Push
- Builds production Docker images
- Pushes to GitHub Container Registry
- Tags with version and SHA

#### Deploy Staging
- Deploys to staging environment
- Runs health checks
- Notifies team via Slack

#### Deploy Production
- Deploys to production (tags only)
- Requires staging success
- Creates GitHub release
- Notifies team via Slack

#### Rollback
- Automatic rollback on failure
- Reverts to previous version
- Notifies team of rollback

### 4. Performance Testing (`.github/workflows/performance.yml`)

**Triggers:**
- Pull requests to `main`
- Weekly schedule (Sundays)
- Manual dispatch

**Jobs:**

#### Lighthouse
- Runs Lighthouse performance audits
- Tests multiple pages
- Uploads results as artifacts

#### Bundle Size
- Analyzes frontend bundle size
- Tracks size changes over time
- Comments on PRs with size diff

#### Load Testing
- Uses k6 for load testing
- Tests backend performance
- Validates response times

### 5. Docker Workflow (`.github/workflows/docker.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main`
- Weekly schedule (Mondays)

**Jobs:**

#### Build Test
- Builds Docker images
- Runs Trivy security scanner
- Uploads security results

#### Integration Test
- Tests Docker Compose setup
- Validates container health
- Runs integration tests

#### Scan Images
- Scans images with Snyk
- Checks for vulnerabilities
- Reports security issues

### 6. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Version tags (`v*.*.*`)

**Jobs:**

#### Create Release
- Generates changelog
- Creates GitHub release
- Documents Docker images

#### Build Release Assets
- Builds production bundles
- Creates release archives
- Uploads to GitHub release

#### Notify
- Sends Slack notification
- Includes release link
- Notifies team of new version

## Environment Variables

### Required Secrets

#### GitHub Secrets
```bash
# Deployment
STAGING_HOST          # Staging server hostname
STAGING_USER          # SSH username for staging
STAGING_SSH_KEY       # SSH private key for staging
PRODUCTION_HOST       # Production server hostname
PRODUCTION_USER       # SSH username for production
PRODUCTION_SSH_KEY    # SSH private key for production

# Notifications
SLACK_WEBHOOK         # Slack webhook URL for notifications

# Security Scanning
SNYK_TOKEN           # Snyk API token (optional)

# API Keys (optional, uses mocks if not provided)
OPENAI_API_KEY       # OpenAI API key
GROQ_API_KEY         # Groq API key
```

### Environment-Specific Variables

#### CI Environment
```bash
CI=true
NODE_ENV=test
REDIS_URL=redis://localhost:6379
```

#### Staging Environment
```bash
NODE_ENV=staging
DOMAIN=staging.ellie-voice.com
```

#### Production Environment
```bash
NODE_ENV=production
DOMAIN=ellie-voice.com
```

## Branch Strategy

### Main Branch (`main`)
- Production-ready code
- Protected branch
- Requires PR reviews
- All checks must pass
- Deploys to staging automatically
- Deploys to production on tags

### Develop Branch (`develop`)
- Development code
- Integration branch
- Runs all CI checks
- Does not deploy

### Feature Branches
- Created from `develop`
- Naming: `feature/description`
- Runs CI checks on PR
- Merged to `develop` via PR

### Release Branches
- Created from `develop`
- Naming: `release/v1.0.0`
- Final testing before production
- Merged to `main` and tagged

## Deployment Process

### Staging Deployment

1. **Automatic Trigger**
   - Push to `main` branch
   - Or manual workflow dispatch

2. **Build Process**
   - Build Docker images
   - Push to container registry
   - Tag with branch name and SHA

3. **Deployment**
   - SSH to staging server
   - Pull latest code
   - Pull Docker images
   - Restart containers

4. **Verification**
   - Health check endpoints
   - Smoke tests
   - Slack notification

### Production Deployment

1. **Manual Trigger**
   - Create version tag: `git tag v1.0.0`
   - Push tag: `git push origin v1.0.0`

2. **Build Process**
   - Build production Docker images
   - Push to container registry
   - Tag with version number

3. **Deployment**
   - Requires staging success
   - SSH to production server
   - Pull tagged version
   - Restart containers

4. **Verification**
   - Health check endpoints
   - Smoke tests
   - Create GitHub release
   - Slack notification

5. **Rollback (if needed)**
   - Automatic on failure
   - Reverts to previous version
   - Notifies team

## Status Badges

Add these badges to your README.md:

```markdown
[![CI Pipeline](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/workflows/CI%20Pipeline/badge.svg)](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/actions/workflows/ci.yml)
[![Code Quality](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/workflows/Code%20Quality/badge.svg)](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/actions/workflows/code-quality.yml)
[![Docker](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/workflows/Docker/badge.svg)](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/actions/workflows/docker.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/ellie-voice-receptionist/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/ellie-voice-receptionist)
```

## Local Testing

### Run Linting
```bash
# Backend
cd backend
npm run lint
npm run format:check

# Frontend
cd frontend
npm run lint
npm run format:check
```

### Run Type Checking
```bash
# Backend
cd backend
npm run type-check

# Frontend
cd frontend
npm run type-check
```

### Run Tests
```bash
# All tests
npm run test:all

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend

# Integration tests
npm run test:integration
```

### Build Locally
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Test Docker Build
```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start containers
docker-compose -f docker/docker-compose.yml up

# Run integration tests
npm run test:integration
```

## Troubleshooting

### CI Failures

#### Linting Errors
```bash
# Fix automatically
cd backend && npm run lint:fix
cd frontend && npm run lint:fix
```

#### Type Errors
```bash
# Check locally
cd backend && npm run type-check
cd frontend && npm run type-check
```

#### Test Failures
```bash
# Run tests locally
npm run test:all

# Run specific test
cd backend && npm test -- path/to/test.ts
```

#### Build Failures
```bash
# Clean and rebuild
cd backend
rm -rf dist node_modules
npm ci
npm run build
```

### Deployment Failures

#### SSH Connection Issues
- Verify SSH key is correct
- Check server firewall rules
- Validate server hostname

#### Docker Issues
- Check Docker daemon is running
- Verify image tags are correct
- Check container logs

#### Health Check Failures
- Verify services are running
- Check application logs
- Test endpoints manually

## Best Practices

### Before Committing
1. Run linting: `npm run lint`
2. Run type check: `npm run type-check`
3. Run tests: `npm test`
4. Check formatting: `npm run format:check`

### Pull Requests
1. Keep PRs small and focused
2. Write descriptive titles
3. Include tests for new features
4. Update documentation
5. Wait for all checks to pass

### Releases
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Create and push tag
6. Monitor deployment

### Security
1. Never commit secrets
2. Use environment variables
3. Keep dependencies updated
4. Review security scan results
5. Address vulnerabilities promptly

## Monitoring

### GitHub Actions
- View workflow runs in Actions tab
- Check logs for failures
- Review security scan results

### Codecov
- View coverage reports
- Track coverage trends
- Review uncovered code

### Container Registry
- View published images
- Check image sizes
- Review security scans

## Maintenance

### Weekly Tasks
- Review security scan results
- Update dependencies
- Check performance metrics
- Review error logs

### Monthly Tasks
- Update GitHub Actions versions
- Review and update documentation
- Audit access permissions
- Review deployment process

### Quarterly Tasks
- Major dependency updates
- Security audit
- Performance optimization
- Infrastructure review

## Support

For issues with the CI/CD pipeline:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check GitHub Actions status page
4. Contact DevOps team

---

**Last Updated:** December 2025  
**Maintained By:** Alex Cinovoj, TechTide AI
