# CI/CD Pipeline Setup Guide

## Quick Start

This guide will help you set up the complete CI/CD pipeline for the Ellie Voice Receptionist project.

## Prerequisites

- GitHub repository
- GitHub account with admin access
- (Optional) Staging and production servers
- (Optional) Slack workspace for notifications
- (Optional) Snyk account for security scanning

## Step 1: Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  prettier
```

### Frontend Dependencies
```bash
cd frontend
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  eslint-plugin-jsx-a11y \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  prettier
```

## Step 2: Configure GitHub Secrets

Go to your repository settings → Secrets and variables → Actions

### Required Secrets

#### For Deployment (Optional)
```
STAGING_HOST          # e.g., staging.example.com
STAGING_USER          # e.g., deploy
STAGING_SSH_KEY       # Your SSH private key
PRODUCTION_HOST       # e.g., example.com
PRODUCTION_USER       # e.g., deploy
PRODUCTION_SSH_KEY    # Your SSH private key
```

#### For Notifications (Optional)
```
SLACK_WEBHOOK         # Your Slack webhook URL
```

#### For Security Scanning (Optional)
```
SNYK_TOKEN           # Your Snyk API token
```

#### For API Keys (Optional - uses mocks if not provided)
```
OPENAI_API_KEY       # Your OpenAI API key
GROQ_API_KEY         # Your Groq API key
```

## Step 3: Enable GitHub Actions

1. Go to your repository
2. Click on "Actions" tab
3. Enable workflows if prompted
4. All workflows should now be visible

## Step 4: Configure Branch Protection

### Main Branch Protection

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

### Required Status Checks

Select these checks as required:
- ✅ Lint Code
- ✅ TypeScript Type Check
- ✅ Backend Tests
- ✅ Frontend Tests
- ✅ Build Applications
- ✅ Integration Tests
- ✅ Docker Build & Test

## Step 5: Set Up Container Registry

### GitHub Container Registry (GHCR)

1. Go to Settings → Developer settings → Personal access tokens
2. Create token with `write:packages` scope
3. Token is automatically available as `GITHUB_TOKEN` in workflows

### Alternative: Docker Hub

If using Docker Hub instead:

1. Create Docker Hub account
2. Create access token
3. Add secrets:
   ```
   DOCKER_USERNAME
   DOCKER_PASSWORD
   ```
4. Update workflows to use Docker Hub

## Step 6: Configure Codecov (Optional)

1. Go to [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token
5. Add as secret: `CODECOV_TOKEN`

## Step 7: Configure Snyk (Optional)

1. Go to [snyk.io](https://snyk.io)
2. Sign in with GitHub
3. Get your API token
4. Add as secret: `SNYK_TOKEN`

## Step 8: Set Up Slack Notifications (Optional)

1. Go to your Slack workspace
2. Create an Incoming Webhook
3. Copy the webhook URL
4. Add as secret: `SLACK_WEBHOOK`

## Step 9: Test the Pipeline

### Test CI Pipeline

1. Create a feature branch:
   ```bash
   git checkout -b feature/test-ci
   ```

2. Make a small change:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: CI pipeline"
   git push origin feature/test-ci
   ```

3. Create a pull request
4. Watch the CI checks run
5. All checks should pass ✅

### Test CD Pipeline (After Deployment Setup)

1. Merge PR to main:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create a release tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. Watch the deployment workflow
4. Check staging deployment
5. Check production deployment

## Step 10: Update README

Add status badges to your README.md:

```markdown
# Ellie Voice Receptionist

[![CI Pipeline](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/workflows/CI%20Pipeline/badge.svg)](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/actions/workflows/ci.yml)
[![Code Quality](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/workflows/Code%20Quality/badge.svg)](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/actions/workflows/code-quality.yml)
[![Docker](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/workflows/Docker/badge.svg)](https://github.com/YOUR_USERNAME/ellie-voice-receptionist/actions/workflows/docker.yml)
```

## Workflow Files Created

Your `.github/workflows/` directory now contains:

1. **ci.yml** - Main CI pipeline
2. **cd.yml** - Deployment pipeline
3. **code-quality.yml** - Code quality checks
4. **docker.yml** - Docker build and scan
5. **performance.yml** - Performance testing
6. **release.yml** - Release automation
7. **pr-checks.yml** - PR validation
8. **test.yml** - Original test workflow (can be removed)

## Configuration Files Created

1. **backend/.eslintrc.js** - Backend ESLint config
2. **backend/.prettierrc** - Backend Prettier config
3. **frontend/.eslintrc.js** - Frontend ESLint config (updated)
4. **frontend/.prettierrc** - Frontend Prettier config
5. **.github/auto-assign.yml** - Auto-assign reviewers

## Scripts Added

### Backend package.json
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint issues
- `type-check` - TypeScript type checking
- `format` - Format code with Prettier
- `format:check` - Check code formatting
- `test:coverage` - Run tests with coverage

### Frontend package.json
- `lint` - Run ESLint
- `lint:fix` - Fix ESLint issues
- `type-check` - TypeScript type checking
- `format` - Format code with Prettier
- `format:check` - Check code formatting
- `test:coverage` - Run tests with coverage

## Verification Checklist

- [ ] All dependencies installed
- [ ] GitHub secrets configured
- [ ] Branch protection enabled
- [ ] Container registry set up
- [ ] Codecov configured (optional)
- [ ] Snyk configured (optional)
- [ ] Slack notifications configured (optional)
- [ ] Test PR created and passed
- [ ] Status badges added to README
- [ ] Team members added as reviewers

## Troubleshooting

### Workflow Not Running

**Problem:** Workflows don't trigger on push/PR

**Solution:**
1. Check Actions are enabled in repository settings
2. Verify workflow files are in `.github/workflows/`
3. Check YAML syntax is valid
4. Ensure branch names match triggers

### Linting Failures

**Problem:** ESLint or Prettier checks fail

**Solution:**
```bash
# Fix automatically
npm run lint:fix
npm run format

# Or manually
cd backend && npm run lint:fix && npm run format
cd frontend && npm run lint:fix && npm run format
```

### Type Check Failures

**Problem:** TypeScript type errors

**Solution:**
```bash
# Check locally
cd backend && npm run type-check
cd frontend && npm run type-check

# Fix errors in code
```

### Test Failures

**Problem:** Tests fail in CI but pass locally

**Solution:**
1. Check environment variables
2. Verify test setup scripts run
3. Check for race conditions
4. Review CI logs for details

### Docker Build Failures

**Problem:** Docker images fail to build

**Solution:**
1. Test build locally:
   ```bash
   docker build -t test ./backend
   docker build -t test ./frontend
   ```
2. Check Dockerfile syntax
3. Verify all files are included
4. Check .dockerignore

### Deployment Failures

**Problem:** Deployment to staging/production fails

**Solution:**
1. Verify SSH keys are correct
2. Check server is accessible
3. Verify Docker is installed on server
4. Check server logs
5. Test SSH connection manually:
   ```bash
   ssh -i key.pem user@host
   ```

## Next Steps

1. **Customize Workflows**
   - Adjust test timeouts
   - Add more checks
   - Configure notifications

2. **Add More Tests**
   - Increase test coverage
   - Add E2E tests
   - Add performance tests

3. **Improve Security**
   - Enable Dependabot
   - Add SAST scanning
   - Configure security policies

4. **Monitor Performance**
   - Set up monitoring
   - Track metrics
   - Set up alerts

## Support

For help with CI/CD setup:
1. Check [CI/CD Pipeline Documentation](CI_CD_PIPELINE.md)
2. Review GitHub Actions logs
3. Check workflow file comments
4. Contact DevOps team

---

**Last Updated:** December 2025  
**Maintained By:** Ellie Voice Receptionist Team
