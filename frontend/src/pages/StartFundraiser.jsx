import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/common/SEO';

const StartFundraiser = () => {
    const fundraiserSchema = {
        "@context": "https://schema.org",
        "@type": "Action",
        "name": "Start a Fundraiser",
        "description": "Start a crowdfunding campaign for medical emergencies and social welfare causes with The DharmArth Foundation.",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://thedharmarth.com/start-fundraiser"
        }
    };

    return (
        <>
            <SEO 
                title="Start a Medical Fundraiser & Crowdfunding Campaign"
                description="Raise funds for medical emergencies, diagnostic tests, surgeries, or social welfare projects. Start a free crowdfunding campaign with The DharmArth Foundation in India."
                keywords="Start Fundraiser, Medical Crowdfunding, Raise money India, NGO fundraising, crowdfunding campaign, emergency medical funds"
                jsonLd={fundraiserSchema}
            />
            <Navbar />
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', minHeight: '60vh' }}>
                <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Start Your Medical Fundraiser & Crowdfunding Campaign</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                    Join thousands of others who have successfully raised funds for medical emergencies and social causes with zero platform fee.
                </p>
                <div style={{ marginTop: '2rem' }}>
                    <button className="btn bg-primary text-white" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                        Create Campaign
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
};
export default StartFundraiser;
