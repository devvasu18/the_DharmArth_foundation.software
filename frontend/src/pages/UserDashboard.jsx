import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import AuthFooter from '../components/auth/AuthFooter';
import api from '../services/api';
import { Wallet, Share2, TrendingUp, Clock, Copy, Check, Banknote, Building, User, CreditCard, ShieldCheck, Send, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './UserDashboard.css';
import PayoutModal from './PayoutModal';

const UserDashboard = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [wallet, setWallet] = useState(null);

    // Force login if no token (handles corrupted localStorage from previous bug)
    useEffect(() => {
        if (!user || !user.token) {
            window.location.href = '/login';
        }
    }, [user]);

    const [transactions, setTransactions] = useState([]);
    const [copied, setCopied] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [stats, setStats] = useState({ l1Donors: 0, l2Donors: 0 });
    const [isBecomingMotivator, setIsBecomingMotivator] = useState(false);
    const [payoutMethod, setPayoutMethod] = useState(null); // 'bank' or 'upi'
    const [bankForm, setBankForm] = useState({
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifscCode: '',
        upiId: ''
    });
    const [bankLoading, setBankLoading] = useState(false);

    // Filters (Default to current month/year)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // New Filters
    const [txnTypeFilter, setTxnTypeFilter] = useState('All');
    const [commissionLevelFilter, setCommissionLevelFilter] = useState('All');

    // Fetch initial profile, balance and stats
    useEffect(() => {
        if (!user?.token || user?.isSuperAdmin || (user?.roles && user.roles.length > 0)) return;
        
        const fetchInitialData = async () => {
            try {
                const uRes = await api.get('/users/profile');
                const updatedUser = { ...uRes.data, token: user.token };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                const wRes = await api.get('/wallet/my');
                setWallet(wRes.data);

                const sRes = await api.get('/wallet/stats');
                setStats(sRes.data);
            } catch (error) {
                console.error("Error fetching initial dashboard data", error);
            }
        };
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch transaction history when filters change
    useEffect(() => {
        if (!user?.token || user?.isSuperAdmin || (user?.roles && user.roles.length > 0)) return;

        const fetchTransactions = async () => {
            try {
                const tRes = await api.get(`/wallet/transactions?month=${selectedMonth}&year=${selectedYear}`);
                setTransactions(tRes.data);
            } catch (error) {
                console.error("Error fetching transactions", error);
            }
        };
        fetchTransactions();
    }, [selectedMonth, selectedYear]);

    const handleBecomeMotivator = async (e) => {
        e.preventDefault();
        setBankLoading(true);
        try {
            const { data } = await api.put('/users/become-motivator', bankForm);
            
            const updatedUser = { ...data.user, token: user.token };
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsBecomingMotivator(false);
            
            // Reload to ensure all components (Navbar, etc) have fresh data
            window.location.reload(); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to register as motivator");
        } finally {
            setBankLoading(false);
        }
    };

    const shareLink = user?.referralCode
        ? `${window.location.origin}/donate?ref=${user.referralCode}`
        : `${window.location.origin}/donate?ref=${user?.mobile}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please Login First</div>;

    return (
        <div className="dashboard-page">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">

                    <p className="dashboard-subtitle">Manage your earnings, payouts, and referrals</p>
                    {user?.isMotivator && user?.referralCode && (
                        <div className="motivator-id-badge">
                            Motivator ID: <strong>{user.referralCode}</strong>
                        </div>
                    )}
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
                                    <div className="stat-row">
                                        <TrendingUp size={16} />
                                        <span>Total Earned: ₹ {wallet?.totalEarned?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="stat-row secondary">
                                        <div className="stat-item">
                                            <span className="stat-val">{stats.l1Donors || 0}</span>
                                            <span className="stat-lbl">L1 Donors</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val">{stats.l2Donors || 0}</span>
                                            <span className="stat-lbl">L2 Donors</span>
                                        </div>
                                    </div>
                                </div>


                                <button 
                                    className="payout-btn"
                                    onClick={() => {
                                        const hasPayoutDetails = user?.payoutCredentials && (user?.payoutCredentials.accountNumber || user?.payoutCredentials.upiId);
                                        if (!user?.isMotivator || !hasPayoutDetails) {
                                            // Scroll to onboarding
                                            document.querySelector('.onboarding-section')?.scrollIntoView({ behavior: 'smooth' });
                                            toast.error("Please register your Payout Details (Bank or UPI) below first.");
                                        } else {
                                            setIsPayoutModalOpen(true);
                                        }
                                    }}
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
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Join me in supporting this cause! Donate here: " + shareLink)}`, '_blank')}
                                    >
                                        WhatsApp
                                    </button>
                                    <button
                                        className="share-action-btn btn-facebook"
                                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
                                    >
                                        Facebook
                                    </button>
                                </div>


                            </motion.div>
                        </div>

                        {(!user?.isMotivator || !user?.payoutCredentials || (!user.payoutCredentials.accountNumber && !user.payoutCredentials.upiId)) && (
                            <motion.div 
                                className="onboarding-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="onboarding-card">
                                    <div className="onboarding-header">
                                        <div className="onboarding-badge">Required for Payouts</div>

                                        <p>Complete your profile with bank details to unlock withdrawals and higher commissions.</p>
                                    </div>
                                    <div className="payout-method-selector-label">Select Payout Method</div>
                                    <div className="payout-method-options">
                                        <div
                                            className={`method-option ${payoutMethod === 'bank' ? 'active' : ''}`}
                                            onClick={() => setPayoutMethod('bank')}
                                        >
                                            <div className="option-check"></div>
                                            <Building className="option-icon" size={24} />
                                            <div className="option-info">
                                                <span className="option-title">Bank Transfer</span>
                                                <span className="option-desc">Direct to bank account</span>
                                            </div>
                                        </div>
                                        <div
                                            className={`method-option ${payoutMethod === 'upi' ? 'active' : ''}`}
                                            onClick={() => setPayoutMethod('upi')}
                                        >
                                            <div className="option-check"></div>
                                            <Send className="option-icon" size={24} />
                                            <div className="option-info">
                                                <span className="option-title">UPI / Mobile Pay</span>
                                                <span className="option-desc">Fast & Instant payout</span>
                                            </div>
                                        </div>
                                    </div>
                                    {payoutMethod && (
                                        <form onSubmit={handleBecomeMotivator} className="onboarding-form">
                                            <div className="form-grid">
                                                {payoutMethod === 'bank' ? (
                                                    <>
                                                        <div className="input-group">
                                                            <label>Bank Name</label>
                                                            <div className="input-with-icon">
                                                                <Building className="field-icon" size={18} />
                                                                <input required type="text" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />
                                                            </div>
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Account Holder Name</label>
                                                            <div className="input-with-icon">
                                                                <User className="field-icon" size={18} />
                                                                <input required type="text" value={bankForm.accountHolder} onChange={e => setBankForm({ ...bankForm, accountHolder: e.target.value })} placeholder="Your Name" />
                                                            </div>
                                                        </div>
                                                        <div className="input-group">
                                                            <label>Account Number</label>
                                                            <div className="input-with-icon">
                                                                <CreditCard className="field-icon" size={18} />
                                                                <input required type="text" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} placeholder="Enter Account Number" />
                                                            </div>
                                                        </div>
                                                        <div className="input-group">
                                                            <label>IFSC Code</label>
                                                            <div className="input-with-icon">
                                                                <ShieldCheck className="field-icon" size={18} />
                                                                <input required type="text" value={bankForm.ifscCode} onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })} placeholder="HDFC0001234" />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="input-group">
                                                            <label>Account Holder Name</label>
                                                            <div className="input-with-icon">
                                                                <User className="field-icon" size={18} />
                                                                <input required type="text" value={bankForm.accountHolder} onChange={e => setBankForm({ ...bankForm, accountHolder: e.target.value })} placeholder="Your Name" />
                                                            </div>
                                                        </div>
                                                        <div className="input-group">
                                                            <label>UPI ID or Mobile Number</label>
                                                            <div className="input-with-icon">
                                                                <Send className="field-icon" size={18} />
                                                                <input required type="text" value={bankForm.upiId} onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} placeholder="e.g. 9876543210@paytm" />
                                                            </div>
                                                        </div>

                                                        <div className="upi-compatibility full-width">
                                                            <span className="comp-text">Supports all major apps</span>
                                                            <div className="comp-icons">
                                                                <div className="comp-badge">G-Pay</div>
                                                                <div className="comp-badge">PhonePe</div>
                                                                <div className="comp-badge">Paytm</div>
                                                                <div className="comp-badge">+ UPI</div>
                                                            </div>
                                                        </div>

                                                        <div className="upi-info-banner full-width">
                                                            <ShieldCheck className="info-icon" size={18} />
                                                            <p>Payments will be sent instantly to the UPI app linked to this ID or Mobile Number.</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="form-actions mt-6">
                                                <button type="submit" className="btn-register-modern" disabled={bankLoading}>
                                                    {bankLoading ? 'Registering...' : `Register ${payoutMethod === 'bank' ? 'Bank' : 'UPI'} & Start Earning`}
                                                    {!bankLoading && <ArrowRight size={18} />}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        )}

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
                                        <option value={0}>All Months</option>
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
                                                        <div className="status-cell">
                                                            <span className={`status-badge ${txn.type === 'credit' || txn.isDonation ? 'badge-credit' : 'badge-debit'}`}>
                                                                {txn.type === 'credit' ? 'Commission' : (txn.isDonation ? 'Donation' : txn.type)}
                                                            </span>
                                                            {txn.certificateUrl && (
                                                                <a
                                                                    href={`${api.defaults.baseURL.replace('/api', '')}${txn.certificateUrl}`}
                                                                    target="_blank"
                                                                    className="btn-download-receipt"
                                                                    title="Download 80G Receipt"
                                                                >
                                                                    <Download size={12} /> Receipt
                                                                </a>
                                                            )}
                                                        </div>
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
