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
            <section className="home-welcome" style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', }}>
                        <h7 style={{
                            fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
                            fontWeight: 500,
                            marginBottom: 'var(--spacing-4)',
                            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.1,
                            letterSpacing: '-0.03em'
                        }}>
                            {t('home.welcomeTitle')}
                        </h7>
                        <div style={{
                            width: '80px',
                            height: '5px',
                            background: 'var(--primary)',
                            margin: 'var(--spacing-6) auto',
                            borderRadius: 'var(--radius-full)',
                            opacity: 0.3
                        }}></div>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                            maxWidth: '800px',
                            margin: '0 auto',
                            fontWeight: 500,
                            lineHeight: 1.6
                        }}>
                            {t('home.welcomeSubtitle')}
                        </p>
                    </div>
                </div>
            </section>
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
