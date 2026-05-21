import React from 'react';
import { useTranslation } from 'react-i18next';
import './AppDownloadSection.css';
import appMockup from '../../assets/app_dashboard_mockup.png';
// Using Lucide icons for features
import { LayoutDashboard, Wallet, Heart, Clock, Play, Apple } from 'lucide-react';

const AppDownloadSection = () => {
    const { t } = useTranslation();
    return (
        <section className="app-download-section">
            <div className="container">
                <div className="app-wrapper">
                    {/* Left: Phone Image */}
                    <div className="app-image-container">
                        <img src={appMockup} alt="Dharmarth App Dashboard" className="app-mockup-img" />
                    </div>

                    {/* Right: Content */}
                    <div className="app-content">
                        <h2 className="app-title">{t('app.title')}</h2>

                        <div className="features-grid">
                            <div className="feature-item">
                                <div className="feature-icon-wrapper">
                                    <LayoutDashboard size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="feature-title">{t('app.f1.title')}</h4>
                                <p className="feature-desc">{t('app.f1.desc')}</p>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon-wrapper">
                                    <Wallet size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="feature-title">{t('app.f2.title')}</h4>
                                <p className="feature-desc">{t('app.f2.desc')}</p>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon-wrapper">
                                    <Clock size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="feature-title">{t('app.f3.title')}</h4>
                                <p className="feature-desc">{t('app.f3.desc')}</p>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon-wrapper">
                                    <Heart size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="feature-title">{t('app.f4.title')}</h4>
                                <p className="feature-desc">{t('app.f4.desc')}</p>
                            </div>
                        </div>

                        <div className="app-store-buttons">
                            {/* Google Play Button */}
                            <a href="#" className="store-btn">
                                <div className="store-icon-wrapper">
                                    <svg viewBox="0 0 32 32" width="28" height="28">
                                        <path d="M4.6,3.6c-0.2,0.4-0.4,0.9-0.4,1.5v21.8c0,0.6,0.1,1.1,0.4,1.5l0.1,0.1L16.2,17L4.7,3.5L4.6,3.6z" fill="#2196F3" />
                                        <path d="M21.6,22.5l-5.4-5.4l-5.4-5.4l-5.4,5.4L21.6,22.5z" fill="#34A853" />
                                        <path d="M21.6,11.5L27,14.6c1.6,0.9,1.6,2.4,0,3.3L21.6,21L16.2,17L21.6,11.5z" fill="#FBBC04" />
                                        <path d="M16.2,17L5.4,27.9c0.7,0.7,1.9,0.8,2.8,0.3l13.5-7.7L16.2,17z" fill="#EA4335" />
                                        <path d="M16.2,17L21.6,11.5L8.1,3.8c-1-0.6-2.1-0.4-2.8,0.3L16.2,17z" fill="#34A853" />
                                    </svg>
                                </div>
                                <div className="store-text-col">
                                    <span className="store-subtitle">{t('app.getItOn')}</span>
                                    <span className="store-title-text">Google Play</span>
                                </div>
                            </a>

                            {/* App Store Button */}
                            <a href="#" className="store-btn">
                                <div className="store-icon-wrapper">
                                    <svg viewBox="0 0 384 512" width="24" height="24" fill="currentColor">
                                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                    </svg>
                                </div>
                                <div className="store-text-col">
                                    <span className="store-subtitle">{t('app.downloadOn')}</span>
                                    <span className="store-title-text">App Store</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppDownloadSection;
