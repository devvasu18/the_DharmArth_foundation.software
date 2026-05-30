import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Phone, Mail } from 'lucide-react';
import './Footer.css';

const Footer = ({ variant = 'default' }) => {
    const { t } = useTranslation();

    if (variant === 'small') {
        return (
            <footer className="footer footer-small">
                <div className="container">
                    <div className="footer-small-content">
                        <div className="footer-brand">
                            <h2>Dharmarth</h2>
                            <p>© {new Date().getFullYear()} {t('footer.brand', 'The Dharmarth Foundation')}. {t('footer.allRightsReserved', 'All Rights Reserved.')}</p>
                        </div>
                        <div className="footer-small-links">
                            <Link to="/privacy-policy">{t('footer.privacyPolicy')}</Link>
                            <a href="#">{t('footer.termsOfUse')}</a>
                            <a href="#">{t('footer.contactSupport')}</a>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-container">
                    <div className="footer-brand">
                        <h2>Dharmarth</h2>
                        <div className="footer-social">
                            <span className="social-icon"><Facebook size={18} /></span>
                            <span className="social-icon"><Twitter size={18} /></span>
                            <span className="social-icon"><Linkedin size={18} /></span>
                            <span className="social-icon"><Youtube size={18} /></span>
                            <span className="social-icon"><Instagram size={18} /></span>
                            <span className="social-icon"><Phone size={18} /></span>
                        </div>
                        <div className="footer-stats">
                            <div ><span className="stat-val">{t('footer.followersCount')}</span> {t('footer.followersLabel')}</div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <p>{t('footer.queries')}</p>
                            <p><strong>Email: info@Dharmarth.org</strong></p>
                            <p><strong>Contact No: +91 9900000000</strong></p>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.causes')}</h3>
                        <ul className="footer-links">
                            <li><a href="#">{t('footer.c1')}</a></li>
                            <li><a href="#">{t('footer.c2')}</a></li>
                            <li><a href="#">{t('footer.c3')}</a></li>
                            <li><a href="#">{t('footer.c4')}</a></li>
                            <li><a href="#">{t('footer.c5')}</a></li>
                            <li><a href="#">{t('footer.c6')}</a></li>
                            <li><a href="#">{t('footer.c7')}</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.howItWorks')}</h3>
                        <ul className="footer-links">
                            <li><a href="#">{t('footer.h1')}</a></li>
                            <li><a href="#">{t('footer.h2')}</a></li>
                            <li><a href="#">{t('footer.h3')}</a></li>
                            <li><a href="#">{t('footer.h4')}</a></li>
                            <li><a href="#">{t('footer.h5')}</a></li>
                            <li><a href="#">{t('footer.h6')}</a></li>
                            <li><a href="#">{t('footer.h7')}</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.aboutUs')}</h3>
                        <ul className="footer-links">
                            <li><a href="#">{t('footer.a1')}</a></li>
                            <li><a href="#">{t('footer.a2')}</a></li>
                            <li><a href="#">{t('footer.a3')}</a></li>
                            <li><a href="#">{t('footer.a4')}</a></li>
                            <li><a href="#">{t('footer.a5')}</a></li>
                            <li><a href="#">{t('footer.a6')}</a></li>
                            <li><a href="#">{t('footer.a7')}</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.support')}</h3>
                        <ul className="footer-links">
                            <li><a href="#">{t('footer.s1')}</a></li>
                            <li><a href="#">{t('footer.s2')}</a></li>
                            <li><a href="#">{t('footer.s3')}</a></li>
                            <li><a href="#">{t('footer.s4')}</a></li>
                            <li><a href="#">{t('footer.s5')}</a></li>
                            <li><a href="#">{t('footer.s6')}</a></li>
                            <li><a href="#">{t('footer.s7')}</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="payment-icons">
                        <span className="payment-icon">VISA</span>
                        <span className="payment-icon">MasterCard</span>
                        <span className="payment-icon">RuPay</span>
                        <span className="payment-icon">UPI</span>
                        <span className="payment-icon">100% Secure</span>
                    </div>
                    <div className="copyright">
                        {t('footer.copyright')}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
