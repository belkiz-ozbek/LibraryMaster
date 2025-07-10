import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { tr } from './tr';
import { en } from './en';

// Get saved language preference from localStorage
const getSavedLanguage = () => {
  const savedLanguage = localStorage.getItem('preferredLanguage');
  return savedLanguage && ['tr', 'en'].includes(savedLanguage) ? savedLanguage : 'tr';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en }
    },
    lng: getSavedLanguage(),
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    },
    keySeparator: '.'
  });

export default i18n; 