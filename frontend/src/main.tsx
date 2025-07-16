import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { register as registerSW } from './utils/serviceWorker';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerSW({
    onSuccess: () => {
      console.log('App is ready for offline use');
    },
    onUpdate: () => {
      console.log('New content available, please refresh');
    },
  });
}