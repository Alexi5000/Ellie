import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorProvider } from './contexts/ErrorContext';
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </div>
        </Router>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

export default App;