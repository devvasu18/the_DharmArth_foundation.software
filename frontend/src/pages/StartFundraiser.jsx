import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const StartFundraiser = () => {
    return (
        <>
            <Navbar />
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', minHeight: '60vh' }}>
                <h1 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Start Your Fundraiser</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                    Join thousands of others who have successfully raised funds for their causes.
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
