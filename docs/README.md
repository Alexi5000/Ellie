# Ellie Voice Receptionist Documentation

Welcome to the Ellie Voice Receptionist documentation. This directory contains comprehensive documentation for the entire application.

## Documentation Structure

- [Architecture](./architecture.md) - System architecture and design decisions
- [API Documentation](./api.md) - Backend API endpoints and usage
- [Deployment Guide](./deployment.md) - Docker deployment instructions
- [Development Setup](./development.md) - Local development environment setup
- [Testing Guide](./testing.md) - Testing strategies and procedures
- [Configuration](./configuration.md) - Environment and configuration options
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Quick Start

1. **Development Environment**:
   ```bash
   npm run docker:up
   ```

2. **Production Environment**:
   ```bash
   npm run docker:prod
   ```

3. **Run Tests**:
   ```bash
   npm run test:all
   ```

## Project Structure

```
/
├── backend/           # Node.js/Express backend
├── frontend/          # React frontend
├── docker/           # Docker configuration files
├── scripts/          # Build and deployment scripts
├── tests/            # Integration tests
├── docs/             # Documentation
└── .kiro/            # Kiro IDE configuration
```

## Key Features

- **Voice Processing**: Real-time speech-to-text and text-to-speech
- **AI Integration**: OpenAI and Groq API integration
- **Legal Compliance**: Built-in legal disclaimer and compliance features
- **Containerized Deployment**: Full Docker support with development and production configurations
- **Monitoring**: Prometheus integration for system monitoring
- **SSL Support**: Automated SSL certificate generation and configuration

## Support

For technical support or questions, please refer to the troubleshooting guide or contact the development team.