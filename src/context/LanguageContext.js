// src/context/LanguageContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_KEY } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    const changeLanguage = async (lang) => {
        try {
            await i18n.changeLanguage(lang);
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
            setCurrentLanguage(lang);
        } catch (error) {
            console.error('Error changing language:', error);
        }
    };

    useEffect(() => {
        setCurrentLanguage(i18n.language);
    }, [i18n.language]);

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
