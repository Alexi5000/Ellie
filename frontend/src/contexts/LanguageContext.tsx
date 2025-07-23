import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { useSocket } from './SocketContext';

// Define the language context type
interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  detectedLanguage: string | null;
  isLanguageDetectionEnabled: boolean;
  toggleLanguageDetection: () => void;
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  changeLanguage: () => {},
  supportedLanguages: SUPPORTED_LANGUAGES,
  detectedLanguage: null,
  isLanguageDetectionEnabled: true,
  toggleLanguageDetection: () => {},
});

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isLanguageDetectionEnabled, setIsLanguageDetectionEnabled] = useState(true);
  const { socket, isConnected } = useSocket();

  // Effect to listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Function to change the language
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    
    // Store the language preference
    localStorage.setItem('userLanguagePreference', lang);
    
    // Update document language attribute for accessibility
    document.documentElement.lang = lang;
    
    // Notify backend about language change if socket is connected
    if (socket && isConnected) {
      socket.emit('change-language', {
        languageCode: lang,
        sessionId: socket.id,
        timestamp: Date.now(),
        autoDetected: false
      });
    }
    
    console.log(`Language changed to: ${lang}`);
  };

  // Toggle automatic language detection
  const toggleLanguageDetection = () => {
    setIsLanguageDetectionEnabled(prev => !prev);
    
    if (!isLanguageDetectionEnabled) {
      // If enabling detection, try to detect language again
      const detectedLng = detectBrowserLanguage();
      if (detectedLng && detectedLng !== currentLanguage) {
        setDetectedLanguage(detectedLng);
      }
    } else {
      // If disabling detection, clear the detected language
      setDetectedLanguage(null);
    }
  };

  // Function to detect browser language
  const detectBrowserLanguage = (): string | null => {
    const browserLang = navigator.language.split('-')[0];
    
    // Check if the browser language is supported
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang);
    
    return isSupported ? browserLang : null;
  };

  // Effect to detect language on mount if enabled
  useEffect(() => {
    if (isLanguageDetectionEnabled) {
      // Check for stored preference first
      const storedPreference = localStorage.getItem('userLanguagePreference');
      
      if (storedPreference) {
        changeLanguage(storedPreference);
      } else {
        // Try to detect from browser
        const detectedLng = detectBrowserLanguage();
        if (detectedLng) {
          setDetectedLanguage(detectedLng);
          // Optionally auto-switch to detected language
          // changeLanguage(detectedLng);
        }
      }
    }
  }, [isLanguageDetectionEnabled]);
  
  // Listen for language detection events from server
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleLanguageDetected = (data: any) => {
      if (isLanguageDetectionEnabled && data.detectedLanguageCode) {
        setDetectedLanguage(data.detectedLanguageCode);
        
        // Auto-switch language if enabled and different from current
        if (data.detectedLanguageCode !== currentLanguage) {
          console.log(`Server detected language: ${data.detectedLanguageCode}`);
        }
      }
    };
    
    const handleLanguageChanged = (data: any) => {
      console.log(`Language changed confirmation: ${data.languageCode}`);
    };
    
    socket.on('language-detected', handleLanguageDetected);
    socket.on('language-changed', handleLanguageChanged);
    
    return () => {
      socket.off('language-detected', handleLanguageDetected);
      socket.off('language-changed', handleLanguageChanged);
    };
  }, [socket, isConnected, isLanguageDetectionEnabled, currentLanguage]);

  // Context value
  const value = {
    currentLanguage,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    detectedLanguage,
    isLanguageDetectionEnabled,
    toggleLanguageDetection,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;