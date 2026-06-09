import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Phone, Mail } from 'lucide-react';
import api from '../../services/api';
import './Footer.css';

const Footer = ({ variant = 'default' }) => {
    const { t } = useTranslation();
    const [contactInfo, setContactInfo] = useState({
        email: 'thedharmarth@gmail.com',
        phone: '8306305569'
    });

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const { data } = await api.get('/content/settings');
                if (data) {
                    setContactInfo({
                        email: data.contact_email || 'thedharmarth@gmail.com',
                        phone: data.contact_phone || '8306305569'
                    });
                }
            } catch (error) {
                console.error("Failed to load contact info in Footer", error);
            }
        };
        fetchContactInfo();
    }, []);

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
                            <p><strong>Email: {contactInfo.email}</strong></p>
                            <p><strong>Contact No: {contactInfo.phone}</strong></p>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '1.5rem', lineHeight: '1.6', maxWidth: '300px' }}>
                            The DharmArth Foundation is a government-approved NGO offering online donation options with 80G tax exemption benefits. We specialize in healthcare assistance, doctor availability updates in Sujangarh, blood donation support, and free medicine ordering and delivery across Rajasthan and India.
                        </p>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.causes')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/events">{t('footer.c1')}</Link></li>
                            <li><Link to="/events">{t('footer.c2')}</Link></li>
                            <li><Link to="/events">{t('footer.c3')}</Link></li>
                            <li><Link to="/events">{t('footer.c4')}</Link></li>
                            <li><Link to="/events">{t('footer.c5')}</Link></li>
                            <li><Link to="/events">{t('footer.c6')}</Link></li>
                            <li><Link to="/events">{t('footer.c7')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.howItWorks')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/start-fundraiser">{t('footer.h1')}</Link></li>
                            <li><Link to="/donate">{t('footer.h2')}</Link></li>
                            <li><Link to="/start-fundraiser">{t('footer.h3')}</Link></li>
                            <li><Link to="/events">{t('footer.h4')}</Link></li>
                            <li><Link to="/p/join-and-earn">{t('footer.h5')}</Link></li>
                            <li><Link to="/dashboard">{t('footer.h6')}</Link></li>
                            <li><Link to="/donate">{t('footer.h7')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.aboutUs')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/p/about-us">{t('footer.a1')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.a2')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.a3')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.a4')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.a5')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.a6')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.a7')}</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>{t('footer.support')}</h3>
                        <ul className="footer-links">
                            <li><Link to="/order-medicine">{t('footer.s1')}</Link></li>
                            <li><Link to="/doctors">{t('footer.s2')}</Link></li>
                            <li><Link to="/p/about-us">{t('footer.s3')}</Link></li>
                            <li><Link to="/events">{t('footer.s4')}</Link></li>
                            <li><Link to="/privacy-policy">{t('footer.s5')}</Link></li>
                            <li><Link to="/p/join-and-earn">{t('footer.s6')}</Link></li>
                            <li><Link to="/contact">{t('footer.s7')}</Link></li>
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
                    <div className="copyright" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div>{t('footer.copyright')}</div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                            <Link to="/privacy-policy" style={{ color: '#888', textDecoration: 'none' }}>Privacy Policy</Link>
                            <span style={{ color: '#ccc' }}>|</span>
                            <Link to="/child-safety" style={{ color: '#888', textDecoration: 'none' }}>Child Safety Standards</Link>
                            <span style={{ color: '#ccc' }}>|</span>
                            <Link to="/delete-account" style={{ color: '#888', textDecoration: 'none' }}>Delete Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
