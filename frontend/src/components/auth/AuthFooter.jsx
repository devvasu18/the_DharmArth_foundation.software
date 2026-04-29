import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const AuthFooter = () => {
    const { t } = useTranslation();
    return (
        <div className="auth-footer">
            <div className="auth-footer-links">
                <Link to="/privacy-policy" className="auth-footer-link">{t('authFooter.privacy')}</Link>
                <span className="divider">•</span>
                <Link to="/terms-conditions" className="auth-footer-link">{t('authFooter.terms')}</Link>

            </div>
            <p className="auth-footer-copy">© {new Date().getFullYear()} {t('navbar.brand')} Foundation. {t('authFooter.rights')}</p>
        </div>
    );
};

export default AuthFooter;
