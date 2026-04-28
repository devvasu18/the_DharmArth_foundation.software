import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import SubscriptionList from '../components/donation/SubscriptionList';
import { motion } from 'framer-motion';
import './UserDashboard.css'; // Reuse dashboard styles for consistency

const MySubscriptions = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')));

    useEffect(() => {
        if (!user || !user.token) {
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
                            <h1>My Subscriptions</h1>
                            <p>Manage your recurring donations and support.</p>
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
