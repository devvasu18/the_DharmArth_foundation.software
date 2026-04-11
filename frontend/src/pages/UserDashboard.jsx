import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import AuthFooter from '../components/auth/AuthFooter';
import api from '../services/api';
import { Wallet, Share2, TrendingUp, Clock, Copy, Check, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import './UserDashboard.css';
import PayoutModal from './PayoutModal';

const UserDashboard = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [copied, setCopied] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

    // Filters (Default to current month/year)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // New Filters
    const [txnTypeFilter, setTxnTypeFilter] = useState('All');
    const [commissionLevelFilter, setCommissionLevelFilter] = useState('All');

    useEffect(() => {
        // Only fetch data for normal users
        if (user?.isSuperAdmin || (user?.roles && user.roles.length > 0)) return;

        const fetchData = async () => {
            try {
                // Fetch wallet balance
                const wRes = await api.get('/wallet/my');
                setWallet(wRes.data);

                // Fetch transactions with filters
                const tRes = await api.get(`/wallet/transactions?month=${selectedMonth}&year=${selectedYear}`);
                setTransactions(tRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();
    }, [user, selectedMonth, selectedYear]);

    const shareLink = `${window.location.origin}/donate?ref=${user?.mobile}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please Login First</div>;

    return (
        <div className="dashboard-page">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">

                    <p className="dashboard-subtitle">Manage your earnings, payouts, and referrals</p>
                </div>

                {/* Only show Wallet & Share options to Normal Users (Not Admin/Role-based) */}
                {(!user?.isSuperAdmin && (!user?.roles || user.roles.length === 0)) ? (
                    <>
                        <div className="dashboard-grid">

                            {/* WALLET CARD */}
                            <motion.div
                                className="dashboard-card wallet-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="wallet-bg-pattern">
                                    <Wallet className="wallet-float w-icon-1" strokeWidth={1} />
                                    <Wallet className="wallet-float w-icon-2" strokeWidth={1} />
                                    <Wallet className="wallet-float w-icon-3" strokeWidth={1} />
                                    <Wallet className="wallet-float w-icon-4" strokeWidth={1} />
                                </div>

                                <div className="wallet-label">My Wallet Balance</div>
                                <div className="wallet-balance">
                                    ₹ {wallet?.balance?.toLocaleString() || 0}
                                </div>

                                <div className="wallet-stats">
                                    <TrendingUp size={16} />
                                    <span>Total Earned: ₹ {wallet?.totalEarned?.toLocaleString() || 0}</span>
                                </div>

                                <button
                                    className="payout-btn"
                                    onClick={() => setIsPayoutModalOpen(true)}
                                >
                                    Withdraw Now
                                </button>
                            </motion.div>

                            {/* SHARE CARD */}
                            <motion.div
                                className="dashboard-card share-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                <div className="share-bg-pattern">
                                    <svg className="rupee-icon icon-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="12" x="2" y="6" rx="2" />
                                        <path d="M6 12h.01M18 12h.01" />
                                        <text x="50%" y="58%" fontSize="8" textAnchor="middle" fill="currentColor" strokeWidth="0" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>₹</text>
                                    </svg>
                                    <svg className="rupee-icon icon-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="12" x="2" y="6" rx="2" />
                                        <path d="M6 12h.01M18 12h.01" />
                                        <text x="50%" y="58%" fontSize="8" textAnchor="middle" fill="currentColor" strokeWidth="0" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>₹</text>
                                    </svg>
                                    <svg className="rupee-icon icon-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="12" x="2" y="6" rx="2" />
                                        <path d="M6 12h.01M18 12h.01" />
                                        <text x="50%" y="58%" fontSize="8" textAnchor="middle" fill="currentColor" strokeWidth="0" fontWeight="bold" style={{ fontFamily: 'sans-serif' }}>₹</text>
                                    </svg>
                                </div>

                                <div className="share-header">
                                    <Share2 size={24} color="#667eea" />
                                    <h3 className="share-title">Share & Earn</h3>
                                </div>

                                <p className="share-desc ">
                                    Share this personalized link with your network. When someone donates using your link, you receive a <strong>10% commission</strong> instantly in your wallet!
                                </p>

                                <div className="share-input-group">
                                    <span className="share-link">{shareLink}</span>
                                    <button onClick={handleCopy} className="copy-btn">
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>

                                <div className="share-actions">
                                    <button
                                        className="share-action-btn btn-whatsapp"
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Check this out! " + shareLink)}`, '_blank')}
                                    >
                                        WhatsApp
                                    </button>
                                    <button
                                        className="share-action-btn btn-facebook"
                                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
                                    >
                                        Facebook
                                    </button>
                                    <button
                                        className="share-action-btn btn-instagram"
                                        onClick={() => window.open('https://www.instagram.com/', '_blank')}
                                    >
                                        Instagram
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* TRANSACTIONS */}
                        <motion.div
                            className="transactions-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <div className="section-header-row">
                                <h3 className="section-title">Transaction History</h3>
                                <div className="txn-filters">
                                    <select
                                        className="filter-select"
                                        value={txnTypeFilter}
                                        onChange={(e) => {
                                            setTxnTypeFilter(e.target.value);
                                            setCommissionLevelFilter('All');
                                        }}
                                    >
                                        <option value="All">All Transactions</option>
                                        <option value="Donation">Donation by Me</option>
                                        <option value="Commission">Commission</option>
                                    </select>

                                    {txnTypeFilter === 'Commission' && (
                                        <select
                                            className="filter-select"
                                            value={commissionLevelFilter}
                                            onChange={(e) => setCommissionLevelFilter(e.target.value)}
                                        >
                                            <option value="All">All Commissions</option>
                                            <option value="Direct">Direct (L1)</option>
                                            <option value="Indirect">Indirect (L2)</option>
                                        </select>
                                    )}

                                    <select
                                        className="filter-select"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        className="filter-select"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year = new Date().getFullYear() - i;
                                            return <option key={year} value={year}>{year}</option>;
                                        })}
                                    </select>
                                </div>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="empty-state">
                                    <Clock size={40} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.3 }} />
                                    <p>No transactions yet.</p>
                                </div>
                            ) : (
                                <div className="txn-table-container">
                                    <table className="txn-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.filter(txn => {
                                                if (txnTypeFilter === 'Donation') return txn.isDonation;
                                                if (txnTypeFilter === 'Commission') {
                                                    if (txn.type !== 'credit') return false;
                                                    if (commissionLevelFilter === 'Direct') return !txn.description?.toLowerCase().includes('l2');
                                                    if (commissionLevelFilter === 'Indirect') return txn.description?.toLowerCase().includes('l2');
                                                    return true;
                                                }
                                                return true;
                                            }).map(txn => (
                                                <tr key={txn._id}>
                                                    <td style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span>{new Date(txn.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                                                                {new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500 }}>{txn.description}</div>
                                                    </td>
                                                    <td className="amount-positive">
                                                        {txn.type === 'credit' ? '+' : ''} ₹{txn.amount}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${txn.type === 'credit' || txn.isDonation ? 'badge-credit' : 'badge-debit'}`}>
                                                            {txn.type === 'credit' ? 'Commission' : (txn.isDonation ? 'Donation' : txn.type)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    </>
                ) : (
                    <div className="dashboard-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <h3 style={{ color: '#718096' }}>Access Restricted</h3>
                        <p style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Wallet and Referrals are available for standard user accounts only.</p>
                    </div>
                )}

            </div>
            <AuthFooter />

            <PayoutModal
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                wallet={wallet}
                user={user}
            />
        </div>
    );
};

export default UserDashboard;
