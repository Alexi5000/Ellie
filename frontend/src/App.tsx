import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MarketingPage } from './pages/MarketingPage';
import HealthCheck from './components/HealthCheck';
import BusinessDashboard from './components/BusinessDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorProvider } from './contexts/ErrorContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import './i18n'; // Import i18n configuration
import './index.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorProvider>
        <SocketProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <PerformanceMonitor />
              <Router>
                <div className="min-h-screen bg-background-primary">
                  <Routes>
                    <Route path="/" element={<MarketingPage />} />
                    <Route path="/health" element={<HealthCheck />} />
                    <Route path="/dashboard" element={<BusinessDashboard />} />
                  </Routes>
                </div>
              </Router>
            </ErrorBoundary>
          </LanguageProvider>
        </SocketProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
};

export default App;