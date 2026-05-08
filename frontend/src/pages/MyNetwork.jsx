import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, User, Network, Maximize2, X, ChevronRight, TrendingUp, Wallet, ShieldCheck, Heart } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import './MyNetwork.css';
import { motion, AnimatePresence } from 'framer-motion';

const MyNetwork = () => {
    const [referralTree, setReferralTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTreeFullScreen, setIsTreeFullScreen] = useState(false);

    // Tree Scroll Drag State
    const treeScrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        fetchMyNetwork();
    }, []);

    const fetchMyNetwork = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/transactions/my-referral-tree');
            setReferralTree(data);
        } catch (err) {
            console.error('Error fetching network:', err);
            setError('Failed to load your network structure.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // --- DRAG TO SCROLL HANDLERS ---
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - treeScrollRef.current.offsetLeft);
        setScrollLeft(treeScrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - treeScrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        treeScrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const renderTreeContainer = (isFull = false) => {
        if (!referralTree) return null;

        return (
            <div className={`tree-container ${isFull ? 'modal-tree' : ''}`}>
                <div className="sticky-root-wrapper">
                    {/* MOTIVATOR NODE (UP) */}
                    {referralTree.user.referredBy && (
                        <div className="motivator-node-wrapper">
                            <div className="motivator-label">My Motivator</div>
                            <div className="tree-node root-node motivator-node">
                                <div className="node-content">
                                    <ShieldCheck size={24} className="node-icon" />
                                    <div className="node-info">
                                        <h5>{referralTree.user.referredBy.name}</h5>
                                        <p>{referralTree.user.referredBy.mobile}</p>
                                    </div>
                                </div>
                                <div className="connector-vertical"></div>
                            </div>
                        </div>
                    )}

                    {/* CURRENT USER (YOU) */}
                    <div className="tree-node root-node you-node">
                        <div className="node-content">
                            <User size={24} className="node-icon" />
                            <div className="node-info">
                                <h5>You ({referralTree.user.name})</h5>
                                <p>{referralTree.user.mobile}</p>
                                <span className="node-date">Member since {formatDate(referralTree.user.createdAt)}</span>
                            </div>
                        </div>
                        <div className="connector-vertical"></div>
                    </div>
                </div>

                <div
                    className="scrollable-tree-content"
                    ref={treeScrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    <div className="family-track">
                        {referralTree.level1Users.length === 0 ? (
                            <div className="empty-network-tree">
                                <Users size={48} />
                                <p>No direct referrals yet. Start sharing your link to build your network!</p>
                            </div>
                        ) : (
                            referralTree.level1Users.map(l1User => {
                                const l2Group = referralTree.level2Data.find(g => g.level1User._id === l1User._id);
                                const hasL2 = l2Group && l2Group.level2Users.length > 0;

                                return (
                                    <div key={l1User._id} className="family-column">
                                        {/* L1 NODE */}
                                        <div className="tree-node level-1-node" style={{ marginBottom: hasL2 ? '3rem' : '0' }}>
                                            <div className="node-content">
                                                <div className="level-badge-mini l1">L1</div>
                                                <User size={20} />
                                                <div className="node-info">
                                                    <h5>{l1User.name}</h5>
                                                    <p>{l1User.mobile}</p>
                                                    <span className="node-date">{formatDate(l1User.createdAt)}</span>
                                                </div>
                                            </div>
                                            {hasL2 && <div className="connector-vertical"></div>}
                                        </div>

                                        {/* L2 GROUP */}
                                        {hasL2 && (
                                            <div className="level-2-group">
                                                <div className="level-nodes">
                                                    {l2Group.level2Users.map(l2User => (
                                                        <div key={l2User._id} className="tree-node level-2-node">
                                                            <div className="node-content">
                                                                <div className="level-badge-mini l2">L2</div>
                                                                <User size={18} />
                                                                <div className="node-info">
                                                                    <h6>{l2User.name}</h6>
                                                                    <p>{l2User.mobile}</p>
                                                                    <span className="node-date">{formatDate(l2User.createdAt)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Legend / Info */}
                <div className="tree-legend">
                    <div className="legend-item"><span className="dot l1"></span> Level 1 (Direct - 10%)</div>
                    <div className="legend-item"><span className="dot l2"></span> Level 2 (Indirect - 3%)</div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="my-network-loading">
            <Navbar />
            <div className="loading-spinner-container">
                <div className="spinner"></div>
                <p>Building your network map...</p>
            </div>
        </div>
    );

    return (
        <div className="my-network-page">
            <Navbar />

            <div className="my-network-container">
                <header className="network-header">
                    <div className="header-left">
                        <div className="header-text">
                            <h1>My Referral Network</h1>

                        </div>

                        <div className="network-stats-row">
                            <div className="mini-stat">
                                <Users size={20} />
                                <div>
                                    <span className="val">{referralTree?.level1Users.length || 0}</span>
                                    <span className="lbl">Direct Referrals (L1)</span>
                                </div>
                            </div>
                            <div className="mini-stat">
                                <Network size={20} />
                                <div>
                                    <span className="val">
                                        {referralTree?.level2Data.reduce((sum, g) => sum + g.level2Users.length, 0) || 0}
                                    </span>
                                    <span className="lbl">Indirect Referrals (L2)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="expand-btn" onClick={() => setIsTreeFullScreen(true)}>
                            <Maximize2 size={18} /> Full Screen
                        </button>
                    </div>
                </header>

                <div className="main-tree-viewport">
                    {renderTreeContainer(false)}
                </div>
            </div>

            {/* Full Screen Modal */}
            <AnimatePresence>
                {isTreeFullScreen && (
                    <motion.div
                        className="tree-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <button className="close-modal-btn" onClick={() => setIsTreeFullScreen(false)}>
                            <X size={24} />
                        </button>
                        <div className="tree-modal-content">
                            {renderTreeContainer(true)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyNetwork;
