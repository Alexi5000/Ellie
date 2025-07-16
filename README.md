# Ellie Voice Receptionist

AI-powered voice assistant for law firms, serving as a digital receptionist to help potential clients get immediate assistance and information about legal services.

## Project Structure

```
ellie-voice-receptionist/
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── Dockerfile           # Frontend container configuration
│   ├── package.json         # Frontend dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   ├── vite.config.ts       # Vite build configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── .env.example         # Environment variables template
├── backend/                 # Node.js backend API
│   ├── src/                 # Source code
│   ├── Dockerfile           # Backend container configuration
│   ├── package.json         # Backend dependencies
│   ├── tsconfig.json        # TypeScript configuration
│   ├── jest.config.js       # Jest testing configuration
│   └── .env.example         # Environment variables template
├── docker/                  # Docker configuration
│   └── nginx.conf           # Nginx reverse proxy configuration
├── docker-compose.yml       # Multi-container orchestration
└── README.md               # Project documentation
```

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- Socket.io client for real-time communication
- Web Audio API for voice recording
- PWA capabilities for mobile app experience

### Backend
- Node.js with Express.js
- TypeScript for type safety
- Socket.io for WebSocket connections
- OpenAI Whisper API for speech-to-text
- OpenAI TTS API for text-to-speech
- Groq API for fast AI inference
- OpenAI GPT API for complex queries

### Infrastructure
- Docker and Docker Compose
- Nginx reverse proxy
- Environment-based configuration

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- OpenAI API key
- Groq API key

### Environment Setup

1. Copy environment templates:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Update the `.env` files with your API keys and configuration.

### Development

1. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

2. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Nginx Proxy: http://localhost:80

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Features

- Voice-enabled AI interaction
- Real-time speech-to-text processing
- AI-powered legal assistance responses
- Text-to-speech synthesis
- Mobile-optimized interface
- PWA capabilities
- Professional landing page
- Legal compliance features

## Development Status

This project is currently in the setup phase. The basic project structure and configuration files have been created. Implementation of core features will follow in subsequent development phases.

## License

MIT License