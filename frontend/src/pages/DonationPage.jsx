import React from 'react';
import Navbar from '../components/layout/Navbar';
import DonationForm from '../components/donation/DonationForm';
import AuthFooter from '../components/auth/AuthFooter';

const DonationPage = () => {
    return (
        <div style={{ minHeight: '100vh', background: '#e6fffa', paddingBottom: '2rem' }}>
            <Navbar />
            <DonationForm />
            <AuthFooter />
        </div>
    );
};
export default DonationPage;
