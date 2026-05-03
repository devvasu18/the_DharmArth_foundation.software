import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { Wallet, Share2, TrendingUp, Clock, Copy, Check, Banknote, Building, User, Users, CreditCard, ShieldCheck, Send, ArrowRight, Download, Eye, ExternalLink, Info, X, ChevronDown, FileSpreadsheet, FileText as FilePdf, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './UserDashboard.css';
import PayoutModal from './PayoutModal';
import OnboardingModal from './OnboardingModal';
import SubscriptionList from '../components/donation/SubscriptionList';

const UserDashboard = () => {
    const { user, setUser } = useAuth();
    const [wallet, setWallet] = useState(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(true);


    const [transactions, setTransactions] = useState([]);
    const [copied, setCopied] = useState(false);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
    const [stats, setStats] = useState({ l1Donors: 0, l2Donors: 0 });

    // Filters (Default to current month/year)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedTxnDetails, setSelectedTxnDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // New Filters
    const [txnTypeFilter, setTxnTypeFilter] = useState('All');
    const [commissionLevelFilter, setCommissionLevelFilter] = useState('All');

    const socketRef = React.useRef(null);

    // Dispute Modal States
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeMsg, setDisputeMsg] = useState('');
    const [disputePayoutId, setDisputePayoutId] = useState('');
    const [isDisputeSubmitting, setIsDisputeSubmitting] = useState(false);


    // Infinite Scroll States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observer = React.useRef();

    // L1 Donors List States
    const [isL1ModalOpen, setIsL1ModalOpen] = useState(false);
    const [l1DonorsList, setL1DonorsList] = useState([]);
    const [isLoadingL1, setIsLoadingL1] = useState(false);
    const [l1FilterMonth, setL1FilterMonth] = useState(new Date().getMonth() + 1);
    const [l1FilterYear, setL1FilterYear] = useState(new Date().getFullYear());
    const [l1Summary, setL1Summary] = useState({ lifetimeEarning: 0, prevMonthEarning: 0 });

    const fetchInitialData = async () => {
        try {
            setIsLoadingWallet(true);
            const summaryRes = await api.get('/wallet/summary');
            setWallet(summaryRes.data.wallet);
            setStats(summaryRes.data.stats);
        } catch (error) {
            console.error("Error fetching initial dashboard data", error);
        } finally {
            setIsLoadingWallet(false);
        }
    };

    const refreshAllData = () => {
        fetchInitialData();
        fetchTransactions(1, true);
    };

    // Fetch wallet and stats
    useEffect(() => {
        if (!user || user?.isSuperAdmin || (user?.roles && user.roles.length > 0)) return;
        fetchInitialData();
    }, [user]);

    const fetchTransactions = async (pageNum, isInitial = false) => {
        if (!user) return;
        if (isInitial) {
            setPage(1);
            setHasMore(true);
        }

        setIsLoadingMore(true);
        try {
            const tRes = await api.get(`/wallet/transactions?month=${selectedMonth}&year=${selectedYear}&page=${pageNum}&limit=20`);
            const newTxns = tRes.data.transactions || [];

            setTransactions(prev => isInitial ? newTxns : [...prev, ...newTxns]);
            setHasMore(tRes.data.hasMore);
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Initial fetch when filters change
    useEffect(() => {
        if (user?.isSuperAdmin || (user?.roles && user.roles.length > 0)) return;
        fetchTransactions(1, true);
    }, [selectedMonth, selectedYear, user]);

    const [isExporting, setIsExporting] = useState(false);

    const fetchAllForExport = async () => {
        setIsExporting(true);
        try {
            const res = await api.get(`/wallet/transactions?month=${selectedMonth}&year=${selectedYear}&all=true`);
            // Apply current frontend filters to the exported data as well
            let filtered = res.data.transactions || [];
            if (txnTypeFilter === 'Donation') {
                filtered = filtered.filter(t => t.isDonation);
            } else if (txnTypeFilter === 'Commission') {
                filtered = filtered.filter(t => t.type === 'credit');
                if (commissionLevelFilter === 'Direct') {
                    filtered = filtered.filter(t => !t.description?.toLowerCase().includes('l2'));
                } else if (commissionLevelFilter === 'Indirect') {
                    filtered = filtered.filter(t => t.description?.toLowerCase().includes('l2'));
                }
            }
            return filtered;
        } catch (error) {
            toast.error("Failed to fetch data for export");
            return [];
        } finally {
            setIsExporting(false);
        }
    };

    const exportToExcel = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data.map(t => ({
            Date: new Date(t.createdAt).toLocaleDateString(),
            Time: new Date(t.createdAt).toLocaleTimeString(),
            Description: t.description,
            Amount: `₹${t.amount}`,
            Type: t.type?.toUpperCase(),
            Status: t.status?.toUpperCase()
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        XLSX.writeFile(workbook, `Transactions_${new Date().toLocaleDateString()}.xlsx`);
        toast.success("Excel exported successfully!");
    };

    const exportToPDF = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const doc = new jsPDF();
        doc.text("Transaction History Report", 14, 15);

        const tableColumn = ["Date", "Description", "Amount", "Status"];
        const tableRows = data.map(t => [
            new Date(t.createdAt).toLocaleDateString(),
            t.description,
            `₹${t.amount}`,
            t.status?.toUpperCase()
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`Transactions_${new Date().toLocaleDateString()}.pdf`);
        toast.success("PDF exported successfully!");
    };

    // Intersection Observer for Infinite Scroll
    const lastTxnRef = React.useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    fetchTransactions(nextPage);
                    return nextPage;
                });
            }
        }, { threshold: 0.1, rootMargin: '200px' }); // Pre-fetch when 200px from bottom (should catch around 15th-20th item)

        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore]);



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

    const triggerDispute = (payoutId) => {
        setDisputePayoutId(payoutId);
        setDisputeMsg('');
        setIsDisputeModalOpen(true);
    };

    const handleDisputeSubmit = async () => {
        if (!disputeMsg.trim()) {
            toast.error("Please enter a reason for help.");
            return;
        }

        setIsDisputeSubmitting(true);
        try {
            await api.post(`/payouts/dispute/${disputePayoutId}`, { message: disputeMsg });
            toast.success("Help request sent to Admin successfully.");
            setIsDisputeModalOpen(false);
            setIsDetailsModalOpen(false);

            // Re-fetch transactions to show updated dispute status
            // (Assuming fetchAllData is available, otherwise user might need to refresh)
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send help request");
        } finally {
            setIsDisputeSubmitting(false);
        }
    };

    const fetchL1Donors = async (m = l1FilterMonth, y = l1FilterYear) => {
        setIsLoadingL1(true);
        setIsL1ModalOpen(true);
        try {
            const res = await api.get(`/wallet/l1-donors?month=${m}&year=${y}`);
            setL1DonorsList(res.data.donors);
            setL1Summary(res.data.summary);
        } catch (error) {
            console.error("Error fetching L1 donors", error);
            toast.error("Failed to load L1 donors");
            setIsL1ModalOpen(false);
        } finally {
            setIsLoadingL1(false);
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div className="header-info">
                        <h1 className="dashboard-title">Motivator Dashboard</h1>
                        <p className="dashboard-subtitle">Manage your earnings, payouts, and referrals</p>
                    </div>

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
                                    {isLoadingWallet ? (
                                        <div className="balance-skeleton animate-pulse"></div>
                                    ) : (
                                        `₹ ${wallet?.balance?.toLocaleString() || 0}`
                                    )}
                                </div>

                                <div className="wallet-stats">
                                    <div className="stat-row">
                                        <TrendingUp size={16} />
                                        {isLoadingWallet ? (
                                            <div className="stat-skeleton animate-pulse"></div>
                                        ) : (
                                            <span>Total Earned: ₹ {wallet?.totalEarned?.toLocaleString() || 0}</span>
                                        )}
                                    </div>
                                    <div className="stat-row secondary">
                                        <div className="stat-item">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {isLoadingWallet ? (
                                                    <div className="stat-item-skeleton animate-pulse"></div>
                                                ) : (
                                                    <span className="stat-val">{stats.l1Donors || 0}</span>
                                                )}
                                                <button
                                                    className="btn-view-l1"
                                                    onClick={fetchL1Donors}
                                                    title="View L1 Donors"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                            <span className="stat-lbl">L1 Donors</span>
                                        </div>
                                        <div className="stat-item">
                                            {isLoadingWallet ? (
                                                <div className="stat-item-skeleton animate-pulse"></div>
                                            ) : (
                                                <span className="stat-val">{stats.l2Donors || 0}</span>
                                            )}
                                            <span className="stat-lbl">L2 Donors</span>
                                        </div>
                                    </div>
                                </div>


                                <button
                                    className="payout-btn"
                                    onClick={() => {
                                        const hasPayoutDetails = user?.payoutCredentials && (user?.payoutCredentials.accountNumber || user?.payoutCredentials.upiId);
                                        if (!user?.isMotivator || !hasPayoutDetails) {
                                            setIsOnboardingModalOpen(true);
                                            toast("Please register your Payout Details (Bank or UPI) to continue.", { icon: 'ℹ️' });
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

                                <div className="referral-code-label">
                                    <span>Referral Code: </span>
                                    <strong>{user?.mobile} / {user?.referralCode}</strong>
                                </div>

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




                        <motion.div
                            className="transactions-section"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key="transactions"
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
                                    <div className="export-actions-row">
                                        <button
                                            className="btn-export-icon excel"
                                            onClick={exportToExcel}
                                            disabled={isExporting}
                                            title="Export to Excel"
                                        >
                                            <FileSpreadsheet size={16} />
                                        </button>
                                        <button
                                            className="btn-export-icon pdf"
                                            onClick={exportToPDF}
                                            disabled={isExporting}
                                            title="Export to PDF"
                                        >
                                            <FilePdf size={16} />
                                        </button>
                                    </div>
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
                                                <th>Receipt</th>
                                                <th>80G Status</th>
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
                                            }).map((txn, index) => (
                                                <tr key={txn._id} ref={index === transactions.length - 1 ? lastTxnRef : null}>
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
                                                            <span className={`status-badge ${txn.reason === 'payout' && txn.status === 'pending' ? 'badge-processing' :
                                                                txn.status === 'failed' ? 'badge-rejected' :
                                                                    txn.reason === 'payout' && (txn.status === 'success' || txn.status === 'completed') ? 'badge-completed' :
                                                                        txn.type === 'credit' || txn.isDonation ? 'badge-credit' : 'badge-debit'
                                                                }`}>
                                                                {txn.reason === 'payout' && txn.status === 'pending' ? 'IN PROCESS' :
                                                                    txn.status === 'failed' ? 'REJECTED' :
                                                                        txn.isHelpResolved ? 'HELP RESOLVED' :
                                                                            txn.type === 'credit' ? 'Commission' : (txn.isDonation ? 'Donation' : (txn.reason === 'payout' ? 'COMPLETED' : txn.type))}
                                                            </span>

                                                            {txn.reason === 'payout' && (
                                                                <button
                                                                    className="btn-txn-details"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const res = await api.get(`/payouts/my`);
                                                                            const payout = res.data.find(p => p._id === txn.referenceId || txn.description.includes(p._id.toString().slice(-6).toUpperCase()));
                                                                            if (payout) {
                                                                                setSelectedTxnDetails(payout);
                                                                                setIsDetailsModalOpen(true);
                                                                            } else {
                                                                                toast.error("Payout details not found");
                                                                            }
                                                                        } catch (err) {
                                                                            toast.error("Failed to load details");
                                                                        }
                                                                    }}
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {txn.isDonation && (txn.receiptUrl || txn.certificateUrl) ? (
                                                            <a
                                                                href={`${api.defaults.baseURL.replace('/api', '')}${txn.receiptUrl || txn.certificateUrl}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="btn-download-receipt"
                                                                title="Download Receipt"
                                                            >
                                                                <Download size={12} /> Receipt
                                                            </a>
                                                        ) : (
                                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {txn.isDonation ? (
                                                            <>
                                                                {txn.is80GUploaded && txn.certificate80GUrl ? (
                                                                    <a
                                                                        href={`${api.defaults.baseURL.replace('/api', '')}${txn.certificate80GUrl}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="btn-download-receipt"
                                                                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}
                                                                        title="Download 80G Certificate"
                                                                    >
                                                                        <FilePdf size={12} /> 80G
                                                                    </a>
                                                                ) : txn.is80G ? (
                                                                    <span
                                                                        className="status-badge"
                                                                        style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5', fontSize: '10px', padding: '2px 6px' }}
                                                                    >
                                                                        Pending
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No</span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {isLoadingMore && (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                style={{ display: 'inline-block', marginRight: '8px' }}
                                            >
                                                <Clock size={16} />
                                            </motion.div>
                                            Loading more history...
                                        </div>
                                    )}
                                    {!hasMore && transactions.length > 0 && (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                                            You've reached the end of your history.
                                        </div>
                                    )}
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

            <PayoutModal
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                onSuccess={refreshAllData}
                onEditDetails={() => {
                    setIsPayoutModalOpen(false);
                    setIsOnboardingModalOpen(true);
                }}
                wallet={wallet}
                user={user}
            />

            <OnboardingModal
                isOpen={isOnboardingModalOpen}
                onClose={() => setIsOnboardingModalOpen(false)}
                user={user}
                setUser={setUser}
            />

            {/* Payout Details Modal */}
            {isDetailsModalOpen && selectedTxnDetails && (
                <div className="payout-modal-overlay" onClick={() => setIsDetailsModalOpen(false)}>
                    <motion.div
                        className="payout-modal"
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <button className="payout-modal-close" onClick={() => setIsDetailsModalOpen(false)}><X size={24} /></button>

                        <div className="payout-modal-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                            <h2>Payout Details</h2>
                            <p>Transaction reference and payment proof</p>
                        </div>

                        <div className="conditions-container" style={{ gap: '1.5rem', background: '#ffffff' }}>
                            <div className="payout-status-banner" style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: selectedTxnDetails.status === 'completed' ? '#f0fdf4' : (selectedTxnDetails.status === 'rejected' ? '#fef2f2' : '#fff7ed'),
                                color: selectedTxnDetails.status === 'completed' ? '#15803d' : (selectedTxnDetails.status === 'rejected' ? '#b91c1c' : '#c2410c'),
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                border: '1px solid'
                            }}>
                                STATUS: {selectedTxnDetails.isHelpResolved ? 'HELP RESOLVED' : selectedTxnDetails.status.toUpperCase()}
                            </div>

                            <div className="details-card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Amount Requested</label>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>₹ {selectedTxnDetails.amount.toLocaleString()}</div>
                                </div>

                                {selectedTxnDetails.transactionId && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Transaction ID / Ref</label>
                                        <div style={{ wordBreak: 'break-all', fontWeight: 600 }}>{selectedTxnDetails.transactionId}</div>
                                    </div>
                                )}

                                {selectedTxnDetails.adminNotes && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Admin Message</label>
                                        <div style={{ color: '#475569', fontStyle: 'italic' }}>{selectedTxnDetails.adminNotes}</div>
                                    </div>
                                )}
                            </div>

                            {selectedTxnDetails.proofImage && (
                                <div className="proof-section">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Payment Proof (Screenshot)</label>
                                    <a href={selectedTxnDetails.proofImage} target="_blank" rel="noreferrer" className="proof-image-link">
                                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                                            <img src={selectedTxnDetails.proofImage} alt="Payment Proof" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                                        </div>
                                    </a>
                                </div>
                            )}

                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                                Processed at: {selectedTxnDetails.processedAt ? new Date(selectedTxnDetails.processedAt).toLocaleString() : 'Pending'}
                            </div>

                            {selectedTxnDetails.status === 'completed' && !selectedTxnDetails.isDisputed && (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'center' }}>
                                    <button
                                        style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => triggerDispute(selectedTxnDetails._id)}
                                    >
                                        Payment not received? Need Help
                                    </button>
                                </div>
                            )}

                            {selectedTxnDetails.isDisputed && (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'center', color: selectedTxnDetails.isHelpResolved ? '#059669' : '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {selectedTxnDetails.isHelpResolved ? <CheckCircle size={14} /> : <Clock size={14} />}
                                        {selectedTxnDetails.isHelpResolved ? 'HELP RESOLVED' : 'Help Requested / Dispute Active'}
                                    </div>
                                    {selectedTxnDetails.disputeMessage && (
                                        <div style={{ fontSize: '0.75rem', fontWeight: 400, marginTop: '0.25rem', color: '#64748b' }}>Your Request: "{selectedTxnDetails.disputeMessage}"</div>
                                    )}
                                    {selectedTxnDetails.isHelpResolved && selectedTxnDetails.helpResolutionNotes && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'left' }}>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Resolution Response</label>
                                            <div style={{ color: '#15803d', fontWeight: 500 }}>{selectedTxnDetails.helpResolutionNotes}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9' }}>
                            <button className="btn-proceed" onClick={() => setIsDetailsModalOpen(false)}>Close Details</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Dispute Help Modal */}
            <AnimatePresence>
                {isDisputeModalOpen && (
                    <div className="payout-modal-overlay" onClick={() => setIsDisputeModalOpen(false)}>
                        <motion.div
                            className="payout-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{ maxWidth: '450px' }}
                        >
                            <button className="payout-modal-close" onClick={() => setIsDisputeModalOpen(false)}><X size={24} /></button>

                            <div className="payout-modal-header" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                    <Info size={28} color="white" />
                                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>Need Help?</h2>
                                </div>
                                <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Report an issue with your payout</p>
                            </div>

                            <div className="conditions-container" style={{ padding: '1.5rem', background: '#ffffff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center', lineHeight: '1.5' }}>
                                    If you haven't received your payment or found any discrepancy, please describe it below. Our team will review it immediately.
                                </p>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                        Reason for Help Request
                                    </label>
                                    <textarea
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            border: '2px solid #e2e8f0',
                                            minHeight: '120px',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            resize: 'none',
                                            outline: 'none'
                                        }}
                                        placeholder="e.g. Transaction ID is correct but money not received in my bank account..."
                                        value={disputeMsg}
                                        onChange={(e) => setDisputeMsg(e.target.value)}
                                        autoFocus
                                    ></textarea>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                                    <button
                                        style={{
                                            flex: 1,
                                            border: '1px solid #e2e8f0',
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            fontWeight: 700,
                                            color: '#64748b',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setIsDisputeModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-proceed"
                                        style={{ flex: 1, background: '#ef4444', margin: 0 }}
                                        onClick={handleDisputeSubmit}
                                        disabled={isDisputeSubmitting}
                                    >
                                        {isDisputeSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* L1 Donors Modal */}
            <AnimatePresence>
                {isL1ModalOpen && (
                    <div className="payout-modal-overlay" onClick={() => setIsL1ModalOpen(false)}>
                        <motion.div
                            className="payout-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{ maxWidth: '450px' }}
                        >
                            <button className="payout-modal-close" onClick={() => setIsL1ModalOpen(false)}><X size={24} /></button>

                            <div className="payout-modal-header" style={{ background: 'linear-gradient(135deg, #00bfa5 0%, #00695c 100%)', paddingBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                    <User size={28} color="white" />
                                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>L1 Network</h2>
                                </div>
                                <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Track your direct referrals and earnings</p>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
                                {/* Summary Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '1.25rem' }}>
                                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #00bfa5' }}>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Lifetime L1</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>₹{l1Summary.lifetimeEarning.toFixed(2)}</p>
                                    </div>
                                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #f59e0b' }}>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Last Month</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>₹{l1Summary.prevMonthEarning.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Filters Row */}
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <select
                                            value={l1FilterMonth}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setL1FilterMonth(val);
                                                fetchL1Donors(val, l1FilterYear);
                                            }}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', appearance: 'none', background: 'white' }}
                                        >
                                            <option value={0}>Lifetime View</option>
                                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                                <option key={m} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
                                    </div>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <select
                                            value={l1FilterYear}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setL1FilterYear(val);
                                                fetchL1Donors(l1FilterMonth, val);
                                            }}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', appearance: 'none', background: 'white' }}
                                        >
                                            {[2024, 2025, 2026].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="conditions-container" style={{ padding: '0', background: '#ffffff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                                {isLoadingL1 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            style={{ display: 'inline-block', marginBottom: '1rem' }}
                                        >
                                            <Clock size={32} />
                                        </motion.div>
                                        <p>Loading donors list...</p>
                                    </div>
                                ) : l1DonorsList.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        <User size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p>No L1 donors found yet.</p>
                                    </div>
                                ) : (
                                    <div className="l1-donors-list" style={{ maxHeight: '60vh', overflowY: 'auto', width: '100%' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Donor Name</th>
                                                    <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Your Earning</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {l1DonorsList.map((donor, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px 20px' }}>
                                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{donor.donorName}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, margin: '2px 0' }}>
                                                                {donor.donorMobile}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                Last Donation: {new Date(donor.lastDonation || donor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                                            ₹{(donor.totalEarning || 0).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem' }}>
                                <button className="btn-proceed" style={{ margin: 0, width: '100%' }} onClick={() => setIsL1ModalOpen(false)}>Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDashboard;
