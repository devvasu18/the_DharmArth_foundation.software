import React from 'react';
import Navbar from '../components/layout/Navbar';
import DonationForm from '../components/donation/DonationForm';
import Footer from '../components/layout/Footer';

const DonationPage = () => {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
            <Navbar />
            <DonationForm />
            <Footer />
        </div>
    );
};
export default DonationPage;
