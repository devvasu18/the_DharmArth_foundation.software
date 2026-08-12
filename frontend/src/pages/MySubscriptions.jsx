import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import SubscriptionList from '../components/donation/SubscriptionList';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './UserDashboard.css'; // Reuse dashboard styles for consistency

const MySubscriptions = () => {
    const { t, i18n } = useTranslation();
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const currentLang = i18n.language || user?.language || localStorage.getItem('i18nextLng') || 'hi';
    const isHindi = currentLang.startsWith('hi');

    useEffect(() => {
        if (!user) {
            window.location.href = '/login';
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="dashboard-wrapper">
            <Navbar />
            <div className="dashboard-container">
                <motion.div
                    className="dashboard-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="dashboard-header-modern">
                        <div className="header-text">
                            <h1>{isHindi ? 'मेरी सदस्यताएँ' : 'My Subscriptions'}</h1>
                            <p>{isHindi ? 'अपने आवर्ती दान और सहायता को प्रबंधित करें।' : 'Manage your recurring donations and support.'}</p>
                        </div>
                    </div>

                    <div className="subscriptions-section" style={{ marginTop: '2rem' }}>
                        <SubscriptionList />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MySubscriptions;
