import React from 'react';

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

const HealthCheck: React.FC = () => {
  const healthData: HealthCheckResponse = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px' }}>
      <pre>{JSON.stringify(healthData, null, 2)}</pre>
    </div>
  );
};

export default HealthCheck;