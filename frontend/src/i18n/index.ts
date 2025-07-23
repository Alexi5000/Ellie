/**
 * i18n Configuration
 * Implements multi-language support for Ellie Voice Receptionist
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

// Initialize i18next
i18n
  // Load translations from /public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    // Default language
    fallbackLng: 'en',
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Detect language from browser
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    },
    // Namespace configuration
    ns: ['common', 'landing', 'voice', 'legal'],
    defaultNS: 'common',
    // Backend configuration for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // React configuration
    react: {
      useSuspense: true,
    },
    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;