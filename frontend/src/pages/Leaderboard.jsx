import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';

import './Leaderboard.css';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState('month'); // today, week, month, all-time
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/donate/leaderboard?period=${period}`);
            setDonors(data);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : '??';
    };

    // Separate top 3
    const topThree = donors.slice(0, 3);
    const others = donors.slice(3);

    // Podium positions for rendering: [2, 1, 3]
    const podiumData = [];
    if (topThree[1]) podiumData.push({ ...topThree[1], rank: 2 });
    if (topThree[0]) podiumData.push({ ...topThree[0], rank: 1 });
    if (topThree[2]) podiumData.push({ ...topThree[2], rank: 3 });

    return (
        <div className="leaderboard-page-wrapper">
            <Navbar />
            <div className="leaderboard-page">
                <div className="leaderboard-container">
                    <div className="leaderboard-header">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft size={22} />
                        </button>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            LEADERBOARD
                        </motion.h1>

                        <div className="period-tabs">
                            {['today', 'week', 'month', 'all-time'].map(p => (
                                <button
                                    key={p}
                                    className={`period-tab ${period === p ? 'active' : ''}`}
                                    onClick={() => setPeriod(p)}
                                >
                                    {p === 'all-time' ? 'ALL TIME' : p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="pulse">FETCHING CHAMPIONS...</div>
                        </div>
                    ) : donors.length > 0 ? (
                        <>
                            {/* Top 3 Podium */}
                            <div className="top-three">
                                {podiumData.map((donor, idx) => (
                                    <motion.div
                                        key={donor.mobile}
                                        className={`podium-item rank-${donor.rank} ${donor.rank === 1 ? 'first' : ''}`}
                                        initial={{ opacity: 0, scale: 0.8, y: 30 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <div className="avatar-wrapper">
                                            {donor.rank === 1 && (
                                                <img
                                                    src="/assets/images/leaderboard/crown.png"
                                                    alt="Crown"
                                                    className="crown-img"
                                                />
                                            )}
                                            <div className="avatar-circle">
                                                {getInitials(donor.name)}
                                            </div>
                                            <div className="rank-badge">{donor.rank}</div>
                                        </div>
                                        <div className="player-name">{donor.name}</div>
                                        <div className="player-score">₹{donor.totalAmount.toLocaleString()}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Remaining List */}
                            <div className="leaderboard-list">
                                {others.map((donor, idx) => (
                                    <motion.div
                                        key={donor.mobile}
                                        className="list-item"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (idx * 0.05) }}
                                    >
                                        <div className="item-rank">
                                            {idx + 4}
                                            <Minus size={12} className="rank-arrow" />
                                        </div>
                                        <div className="item-avatar">
                                            {getInitials(donor.name)}
                                        </div>
                                        <div className="item-name">{donor.name}</div>
                                        <div className="item-score">₹{donor.totalAmount.toLocaleString()}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty-container">
                            <p>No donations recorded for this period yet.</p>
                            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/donate')}>
                                Be the First!
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Leaderboard;
