import React from 'react';
import Navbar from '../components/layout/Navbar';
import HeroSlider from '../components/layout/HeroSlider';
import CrowdfundingSection from '../components/layout/CrowdfundingSection';
import AppDownloadSection from '../components/layout/AppDownloadSection';
import WhyUsSection from '../components/layout/WhyUsSection';
import FAQSection from '../components/layout/FAQSection';
import MonthlyGivingSection from '../components/layout/MonthlyGivingSection';
import Footer from '../components/layout/Footer';

const Home = () => {
    return (
        <div>
            <Navbar />
            <HeroSlider />
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>Welcome to The Dharmarth Foundation</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>Empowering change through your generous contributions.</p>
            </div>
            <CrowdfundingSection />
            <AppDownloadSection />
            <WhyUsSection />
            <FAQSection />
            <MonthlyGivingSection />
            <Footer />
        </div>
    );
};
export default Home;
