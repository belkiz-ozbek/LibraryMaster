import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { tr } from './tr';
import { en } from './en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en }
    },
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    },
    keySeparator: '.'
  });

export default i18n; 