# Integration Tests

> Comprehensive integration tests for Docker deployment, production configuration, and end-to-end system validation.

## 🧪 Test Suites

### Docker Integration Tests (`docker-integration.test.js`)
Tests Docker containerization and service orchestration:
- ✅ Docker Compose configuration validation
- ✅ Service connectivity tests
- ✅ Network configuration verification
- ✅ Volume mounting tests
- ✅ Environment variable validation

### Production Deployment Tests (`production-deployment.test.js`)
Tests production configuration and deployment:
- ✅ Production environment validation
- ✅ SSL/TLS configuration tests
- ✅ Security headers verification
- ✅ Performance optimization checks
- ✅ Health endpoint validation

## 🚀 Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test suite
npm test tests/docker-integration.test.js

# Run with verbose output
npm test -- --verbose
```

## 📁 Structure

```
tests/
├── setup.js                        # Jest configuration
├── docker-integration.test.js      # Docker tests
└── production-deployment.test.js   # Production tests
```

## 🔧 Configuration

### Jest Setup (`setup.js`)
- Test timeout: 120 seconds
- Environment: Node.js
- Test match pattern: `**/*.test.js`

## 📖 Documentation

- [Testing Guide](../docs/testing/QUICK_TEST_GUIDE.md) - Quick reference
- [Test Environment](../docs/testing/TEST_ENVIRONMENT.md) - Environment setup

---

**Maintained by**: Alex Cinovoj, TechTide AI
