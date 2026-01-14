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
                        "logout": "Logout",
                        "brand": "Dharmarth",
                        "browseDonations": "Browse Donations",
                        "fundraiseFor": "Fundraise For",
                        "howItWorks": "How It Works",
                        "search": "Search",
                        "signIn": "Sign In",
                        "donate": "Donate",
                        "wallet": "Wallet",
                        "userDashboard": "User Dashboard"
                    }
                }
            },
            hi: {
                translation: {
                    "navbar": {
                        "home": "होम",
                        "login": "लॉगिन",
                        "signup": "साइन अप",
                        "dashboard": "डैशबोर्ड",
                        "admin": "एडमिन पैनल",
                        "logout": "लॉग आउट",
                        "brand": "धर्मार्थ",
                        "browseDonations": "दान के अवसर",
                        "fundraiseFor": "फंडरेज़",
                        "howItWorks": "यह कैसे काम करता है",
                        "search": "खोजें",
                        "signIn": "साइन इन",
                        "donate": "दान करें",
                        "wallet": "वॉलेट",
                        "userDashboard": "यूज़र डैशबोर्ड"
                    }
                }
            }
        }
    });

export default i18n;
