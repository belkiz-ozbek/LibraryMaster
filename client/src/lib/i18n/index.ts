import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { tr } from './tr';
import { en } from './en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en }
    },
    lng: 'tr',
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    },
    keySeparator: '.'
  });

export default i18n; 