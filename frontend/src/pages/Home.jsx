import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import HeroSlider from '../components/layout/HeroSlider';
import CrowdfundingSection from '../components/layout/CrowdfundingSection';
import AppDownloadSection from '../components/layout/AppDownloadSection';
import WhyUsSection from '../components/layout/WhyUsSection';
import FAQSection from '../components/layout/FAQSection';
import MonthlyGivingSection from '../components/layout/MonthlyGivingSection';
import Footer from '../components/layout/Footer';
import SEO from '../components/common/SEO';
import api from '../services/api';

const Home = () => {
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
                console.error("Failed to load contact info in Home page", error);
            }
        };
        fetchContactInfo();
    }, []);
    
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "NGO",
        "name": "The DharmArth Foundation",
        "alternateName": "TDMF",
        "url": "https://thedharmarth.com",
        "logo": "https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778822813/the_dharmarth_foundation/logo.jpg",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": contactInfo.phone,
            "contactType": "customer support",
            "email": contactInfo.email,
            "areaServed": "IN",
            "availableLanguage": ["Hindi", "English"]
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jadaw Marg, Duliya Bypass",
            "addressLocality": "Sujangarh",
            "addressRegion": "Rajasthan",
            "postalCode": "331507",
            "addressCountry": "IN"
        },
        "taxID": "80G Tax Exempted NGO",
        "description": "The DharmArth Foundation is a government-approved charity organization offering 80G tax saving donation options, community healthcare assistance, free medicine service, and doctor availability in Sujangarh, Rajasthan, India."
    };

    return (
        <div>
            <SEO 
                title="The DharmArth Foundation | Government Approved 80G Donation & NGO in India"
                description="Donate online to The DharmArth Foundation, a government-approved NGO providing free medicine services, healthcare assistance, and blood donation support in Sujangarh, Churu District, Rajasthan, and across India. Claim tax exemption with our 80G tax saving donation options."
                keywords="NGO, Donation, Online Donation, Donate in India, Government Approved Donation, 80G Donation, Tax Saving Donation, Charity Organization India, Medical Donation, Medicine Donation, Blood Donation, Healthcare NGO, Free Medicine Service, Medicine Delivery India, Medicine Ordering Rajasthan, Government Hospital Services, Doctor Availability, Health Checkup, Diagnostic Tests, Social Welfare, Community Healthcare, Emergency Medical Support, Sujangarh, Rajasthan, India"
                jsonLd={organizationSchema}
            />
            <Navbar />
            <HeroSlider />
            <section className="home-welcome" style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', }}>
                        <h2 style={{
                            display: 'block',
                            fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
                            fontWeight: 500,
                            paddingTop: 'var(--spacing-16)',
                            marginBottom: 'var(--spacing-4)',
                            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.1,
                            letterSpacing: '-0.03em'
                        }}>
                            {t('home.welcomeTitle')}
                        </h2>
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
