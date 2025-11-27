// src/i18n/index.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

const LANGUAGE_KEY = '@dailyForge:language';

// Detect device language
const getDeviceLanguage = () => {
    const locales = Localization.getLocales();
    const locale = locales && locales[0] ? locales[0].languageCode : 'en';
    // Support only 'es' and 'en', default to 'en'
    return locale === 'es' ? 'es' : 'en';
};

// Initialize i18n
const initI18n = async () => {
    let savedLanguage = null;

    try {
        savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (error) {
        console.warn('Could not load saved language:', error);
    }

    const languageToUse = savedLanguage || getDeviceLanguage();

    i18n
        .use(initReactI18next)
        .init({
            resources: {
                en: { translation: en },
                es: { translation: es },
            },
            lng: languageToUse,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false, // React already escapes
            },
            compatibilityJSON: 'v3', // For i18next v21+
        });

    return i18n;
};

export { initI18n, LANGUAGE_KEY };
export default i18n;
