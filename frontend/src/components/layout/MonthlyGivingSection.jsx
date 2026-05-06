import React from 'react';
import { useTranslation } from 'react-i18next';
import './MonthlyGivingSection.css';
import happyKidsImg from '../../assets/happy_kids_illustration.png';
import { ArrowRight } from 'lucide-react';

const MonthlyGivingSection = () => {
    const { t } = useTranslation();
    return (
        <section className="monthly-giving-section">
            <div className="container">
                <div className="monthly-giving-wrapper">
                    {/* Left: Illustration */}
                    <div className="monthly-giving-image-container">
                        <img src={happyKidsImg} alt="Happy Kids" className="monthly-giving-img" />
                    </div>

                    {/* Right: Content */}
                    <div className="monthly-giving-content">
                        <h2 className="monthly-giving-title">{t('monthly.title')}</h2>
                        <p className="monthly-giving-text">
                            <span className="monthly-giving-highlight">{t('monthly.p1')}</span>{t('monthly.p2')}<span className="monthly-giving-highlight">{t('monthly.p3')}</span>{t('monthly.p4')}
                        </p>
                        <button className="monthly-giving-btn" onClick={() => window.location.href = '/p/join-and-earn'}>
                            {t('monthly.cta')} <ArrowRight size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MonthlyGivingSection;
