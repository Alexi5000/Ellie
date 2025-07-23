import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HealthCheck from './components/HealthCheck';
import BusinessDashboard from './components/BusinessDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorProvider } from './contexts/ErrorContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import './i18n'; // Import i18n configuration
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorProvider>
      <SocketProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/health" element={<HealthCheck />} />
                  <Route path="/dashboard" element={<BusinessDashboard />} />
                </Routes>
              </div>
            </Router>
          </ErrorBoundary>
        </LanguageProvider>
      </SocketProvider>
    </ErrorProvider>
  );
};

export default App;