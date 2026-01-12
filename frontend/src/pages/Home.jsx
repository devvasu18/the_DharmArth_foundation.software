import React from 'react';
import Navbar from '../components/layout/Navbar';
import HeroSlider from '../components/layout/HeroSlider';
import Footer from '../components/layout/Footer';

const Home = () => {
    return (
        <div>
            <Navbar />
            <HeroSlider />
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>Welcome to The Dharmarth Foundation</h2>
                <p style={{ color: 'var(--text-muted)' }}>Empowering change through your generous contributions.</p>
            </div>
            <Footer />
        </div>
    );
};
export default Home;
