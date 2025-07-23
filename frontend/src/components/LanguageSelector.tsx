import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'minimal';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'dropdown',
  className = ''
}) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    changeLanguage, 
    supportedLanguages,
    detectedLanguage,
    isLanguageDetectionEnabled,
    toggleLanguageDetection
  } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);

  // Find current language details
  const currentLangDetails = supportedLanguages.find(lang => lang.code === currentLanguage) || 
    { code: 'en', name: 'English', flag: '🇺🇸' };

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Handle language selection
  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Render dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label={t('language.select')}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-lg">{currentLangDetails.flag}</span>
          <span className="text-sm font-medium">{currentLangDetails.name}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div 
            className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
            role="listbox"
            aria-label={t('language.select')}
          >
            <div className="py-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  className={`flex items-center space-x-3 w-full text-left px-4 py-2 text-sm ${
                    currentLanguage === lang.code 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleLanguageChange(lang.code)}
                  role="option"
                  aria-selected={currentLanguage === lang.code}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <svg className="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            {/* Language detection toggle */}
            <div className="border-t border-gray-100 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('language.autoDetect')}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLanguageDetection();
                  }}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                    isLanguageDetectionEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                  aria-pressed={isLanguageDetectionEnabled}
                  aria-label={t('language.toggleAutoDetect')}
                >
                  <span 
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isLanguageDetectionEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`} 
                  />
                </button>
              </div>
              
              {detectedLanguage && detectedLanguage !== currentLanguage && (
                <div className="mt-2 text-xs">
                  <p className="text-gray-500">
                    {t('language.detected')}: 
                    <button 
                      onClick={() => handleLanguageChange(detectedLanguage)}
                      className="ml-1 text-primary-600 hover:underline"
                    >
                      {supportedLanguages.find(l => l.code === detectedLanguage)?.name}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render buttons variant
  if (variant === 'buttons') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center space-x-1 px-3 py-1 rounded ${
              currentLanguage === lang.code
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-200'
            }`}
            aria-pressed={currentLanguage === lang.code}
          >
            <span>{lang.flag}</span>
            <span className="text-sm">{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  }

  // Render minimal variant (just flags)
  return (
    <div className={`flex space-x-1 ${className}`}>
      {supportedLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`text-xl p-1 rounded-full ${
            currentLanguage === lang.code
              ? 'bg-white/20 shadow-inner'
              : 'hover:bg-white/10'
          }`}
          aria-label={lang.name}
          aria-pressed={currentLanguage === lang.code}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;