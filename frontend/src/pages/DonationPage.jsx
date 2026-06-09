import React, { useState, useEffect } from 'react';
import { useBlocker, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DonationForm from '../components/donation/DonationForm';
import DonationExitModal from '../components/donation/DonationExitModal';
import SEO from '../components/common/SEO';

const DonationPage = () => {
    const [isDonated, setIsDonated] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const location = useLocation();

    // Block navigation if not donated and trying to leave the page
    const blocker = useBlocker(
        ({ nextLocation }) =>
            !isDonated && 
            location.pathname !== nextLocation.pathname &&
            nextLocation.pathname !== '/login'
    );



    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowModal(true);
        }
    }, [blocker.state]);

    const handleConfirmNavigation = () => {
        if (blocker.state === "blocked") {
            blocker.proceed();
        }
        setShowModal(false);
    };

    const handleCancelNavigation = () => {
        if (blocker.state === "blocked") {
            blocker.reset();
        }
        setShowModal(false);
    };

    const donationSchema = {
        "@context": "https://schema.org",
        "@type": "DonateAction",
        "name": "Donate to The DharmArth Foundation",
        "description": "Support medical bills, healthcare services, and free medicine deliveries by donating to The DharmArth Foundation. Donations are eligible for 80G tax exemptions.",
        "recipient": {
            "@type": "NGO",
            "name": "The DharmArth Foundation",
            "url": "https://thedharmarth.com"
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#e6fffa', paddingBottom: '2rem' }}>
            <SEO 
                title="Online Donation with 80G Tax Benefits | Donate in India"
                description="Make a secure online donation to The DharmArth Foundation. Get 80G tax exemption benefits instantly for your charitable contribution. Help support healthcare NGO services, free medicines, and diagnostic tests in Rajasthan, India."
                keywords="80G Donation, Tax Saving Donation, Online Donation, Donate in India, Government Approved Donation, Charity Organization India, Medical Donation, Support NGO"
                jsonLd={donationSchema}
            />
            <Navbar />
            <DonationForm onSuccess={() => setIsDonated(true)} />
            
            <DonationExitModal 
                isOpen={showModal} 
                onClose={handleCancelNavigation}
                onConfirmNavigation={handleConfirmNavigation}
            />
        </div>
    );
};
export default DonationPage;


