import React, { useState, useEffect } from 'react';
import { useBlocker, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import DonationForm from '../components/donation/DonationForm';
import DonationExitModal from '../components/donation/DonationExitModal';

const DonationPage = () => {
    const [isDonated, setIsDonated] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const location = useLocation();

    // Block navigation if not donated and trying to leave the page
    const blocker = useBlocker(
        ({ nextLocation }) =>
            !isDonated && location.pathname !== nextLocation.pathname
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

    return (
        <div style={{ minHeight: '100vh', background: '#e6fffa', paddingBottom: '2rem' }}>
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


