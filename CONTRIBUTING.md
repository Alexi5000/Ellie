# Contributing to Ellie Voice Receptionist

Thank you for your interest in contributing to Ellie Voice Receptionist! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/Alexi5000/Ellie.git
   cd Ellie
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   
   # Root (for integration tests)
   cd .. && npm install
   ```

3. **Environment Configuration**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start Development Environment**
   ```bash
   npm run docker:up
   ```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write Code**
   - Follow coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

2. **Test Locally**
   ```bash
   # Run all tests
   npm run test:all
   
   # Run specific tests
   npm run test:backend
   npm run test:frontend
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add voice recording pause functionality
fix: resolve WebSocket connection timeout issue
docs: update API documentation for voice endpoints
test: add integration tests for AI service
```

## 💻 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises

**Example:**
```typescript
/**
 * Process voice input and generate AI response
 * @param audioData - Raw audio buffer
 * @param sessionId - User session identifier
 * @returns Processed response with audio
 */
async function processVoiceInput(
  audioData: Buffer,
  sessionId: string
): Promise<VoiceResponse> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Implement proper prop types
- Add accessibility attributes
- Handle loading and error states
- Use meaningful component names

**Example:**
```typescript
interface VoiceButtonProps {
  onStart: () => void;
  onStop: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onStart,
  onStop,
  isRecording,
  disabled = false,
}) => {
  // Implementation
};
```

### Python (FastAPI)

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions
- Use Pydantic models for validation

**Example:**
```python
from pydantic import BaseModel, Field

class VoiceRequest(BaseModel):
    """Voice processing request model"""
    text: str = Field(..., max_length=4000)
    language: str = Field(default="en", regex="^[a-z]{2}$")
    
    class Config:
        schema_extra = {
            "example": {
                "text": "Hello, how can I help you?",
                "language": "en"
            }
        }
```

## 🧪 Testing Guidelines

### Writing Tests

1. **Test Coverage**
   - Aim for 80%+ code coverage
   - Test happy paths and edge cases
   - Test error handling

2. **Test Structure**
   ```typescript
   describe('Component/Service Name', () => {
     describe('Method/Feature Name', () => {
       it('should do something specific', () => {
         // Arrange
         const input = createTestData();
         
         // Act
         const result = functionUnderTest(input);
         
         // Assert
         expect(result).toBe(expected);
       });
     });
   });
   ```

3. **Use Test Helpers**
   ```typescript
   // Backend
   import { createMockMulterFile, flushPromises } from './test/testHelpers';
   
   // Frontend
   import { renderWithProviders, mockGetUserMedia } from './test/testHelpers';
   ```

### Running Tests

```bash
# All tests
npm run test:all

# Backend only
npm run test:backend

# Frontend only
npm run test:frontend

# Watch mode
cd backend && npm run test:watch
cd frontend && npm run test:watch

# With coverage
npm test -- --coverage
```

## 📚 Documentation

### When to Update Documentation

- Adding new features
- Changing APIs
- Modifying configuration
- Fixing bugs that affect usage
- Adding new dependencies

### Documentation Structure

```
docs/
├── README.md                    # Documentation index
├── development/                 # Development guides
├── testing/                     # Testing documentation
├── migration/                   # Migration guides
├── architecture.md              # System architecture
├── deployment.md                # Deployment guide
└── api-reference.md            # API documentation
```

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep it up to date
- Link to related documentation

## 🔀 Pull Request Process

### Before Submitting

1. **Update from develop**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-feature-branch
   git rebase develop
   ```

2. **Run Tests**
   ```bash
   npm run test:all
   ```

3. **Check Linting**
   ```bash
   cd backend && npm run lint
   cd frontend && npm run lint
   ```

4. **Update Documentation**
   - Update relevant docs
   - Add/update tests
   - Update CHANGELOG if applicable

### Submitting PR

1. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Updated documentation
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Linting checks pass
   - Build succeeds

2. **Code Review**
   - At least one approval required
   - Address review comments
   - Update PR as needed

3. **Merge**
   - Squash and merge to develop
   - Delete feature branch
   - Update local repository

## 📁 Project Structure

```
ellie-voice-receptionist/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── test/           # Test utilities
│   └── package.json
├── backend-fastapi/        # Python/FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core configuration
│   │   └── services/      # Business logic
│   └── requirements.txt
├── frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── contexts/      # React contexts
│   │   └── test/          # Test utilities
│   └── package.json
├── docker/                 # Docker configurations
├── docs/                   # Documentation
├── scripts/                # Build/deployment scripts
├── tests/                  # Integration tests
└── package.json           # Root orchestration
```

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test on latest version
4. Gather relevant information

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Node Version: [e.g., 18.0.0]
- Docker Version: [e.g., 20.10.0]

## Additional Context
Screenshots, logs, etc.
```

## 💡 Feature Requests

### Proposing Features

1. Check existing feature requests
2. Describe the problem it solves
3. Propose a solution
4. Consider alternatives
5. Discuss implementation

### Feature Request Template

```markdown
## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
What other approaches were considered?

## Additional Context
Mockups, examples, etc.
```

## 🆘 Getting Help

- **Documentation**: Check [docs/](docs/)
- **Issues**: Search existing issues
- **Discussions**: GitHub Discussions
- **Chat**: Project Slack/Discord

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make this project better for everyone. Thank you for taking the time to contribute!

---

**Questions?** Open an issue or reach out to the maintainers.