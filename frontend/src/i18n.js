import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    // detect user language
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    .init({
        debug: true,
        fallbackLng: 'hi', // Default to Hindi
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: {
                translation: {
                    "navbar": {
                        "home": "Home",
                        "login": "Login",
                        "signup": "Signup",
                        "dashboard": "Dashboard",
                        "admin": "Admin Panel",
                        "logout": "Logout"
                    }
                }
            },
            hi: {
                translation: {
                    "navbar": {
                        "home": "होम", // Home
                        "login": "लॉगिन", // Login
                        "signup": "साइन अप", // Signup (transliterated usually or account create)
                        "dashboard": "डैशबोर्ड", // Dashboard
                        "admin": "एडमिन पैनल", // Admin Panel
                        "logout": "लॉग आउट" // Logout
                    }
                }
            }
        }
    });

export default i18n;
