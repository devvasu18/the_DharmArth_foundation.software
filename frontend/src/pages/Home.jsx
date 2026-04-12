import React from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import HeroSlider from '../components/layout/HeroSlider';
import CrowdfundingSection from '../components/layout/CrowdfundingSection';
import AppDownloadSection from '../components/layout/AppDownloadSection';
import WhyUsSection from '../components/layout/WhyUsSection';
import FAQSection from '../components/layout/FAQSection';
import MonthlyGivingSection from '../components/layout/MonthlyGivingSection';
import Footer from '../components/layout/Footer';

const Home = () => {
    const { t } = useTranslation();
    return (
        <div>
            <Navbar />
            <HeroSlider />
            <div className="container home-welcome">
                <h6 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>{t('home.welcomeTitle')}</h6>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>{t('home.welcomeSubtitle')}</p>
            </div>
            <CrowdfundingSection />
            <AppDownloadSection />
            <WhyUsSection />
            <FAQSection />
            <MonthlyGivingSection />
            <Footer />
        </div >
    );
};
export default Home;
