// Application configuration

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    endpoints: {
      voice: '/api/voice',
      synthesize: '/api/voice/synthesize',
    },
  },
  websocket: {
    url: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
  },
  audio: {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    maxRecordingTime: 300000, // 5 minutes in milliseconds
  },
  app: {
    name: 'Ellie Voice Receptionist',
    version: '1.0.0',
    description: 'AI-powered voice legal assistant',
  },
} as const;