import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../services/api';
import { Wallet, Share2, TrendingUp, Clock, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const UserDashboard = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Only fetch wallet data for normal users
        if (user?.isSuperAdmin || (user?.roles && user.roles.length > 0)) return;

        const fetchData = async () => {
            try {
                const wRes = await api.get('/wallet/my');
                setWallet(wRes.data);

                const tRes = await api.get('/wallet/transactions');
                setTransactions(tRes.data);
            } catch (error) {
                console.error("Error fetching wallet", error);
            }
        };
        fetchData();
    }, [user]);

    const shareLink = `${window.location.origin}/donate?ref=${user?.mobile}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please Login First</div>;

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh' }}>
            <Navbar />

            <div className="container" style={{ padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: '#2d3748' }}>User Dashboard</h1>

                {/* Only show Wallet & Share options to Normal Users (Not Admin/Role-based) */}
                {(!user?.isSuperAdmin && (!user?.roles || user.roles.length === 0)) ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                            {/* WALLET CARD */}
                            <div className="admin-card" style={{ position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                                    <Wallet size={100} />
                                </div>
                                <h3 style={{ color: '#718096', fontSize: '1rem', fontWeight: 600 }}>My Wallet Balance</h3>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2d3748', margin: '10px 0' }}>
                                    ₹ {wallet?.balance?.toLocaleString() || 0}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#38a169' }}>
                                        <TrendingUp size={14} style={{ display: 'inline' }} /> Total Earned: ₹ {wallet?.totalEarned?.toLocaleString() || 0}
                                    </div>
                                </div>
                                <button className="btn bg-primary text-white" style={{ marginTop: '1.5rem', width: '100%' }}>
                                    Request Payout
                                </button>
                            </div>

                            {/* SHARE CARD */}
                            <div className="admin-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Share & Earn</h3>
                                <p style={{ opacity: 0.9, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                    Share this link. When someone donates using your link, you earn 10% commission instantly!
                                </p>

                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                                        {shareLink}
                                    </span>
                                    <button onClick={handleCopy} style={{ background: 'white', color: '#764ba2', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn"
                                        style={{ background: '#25D366', color: 'white', border: 'none', flex: 1, cursor: 'pointer' }}
                                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Check this out! " + shareLink)}`, '_blank')}
                                    >
                                        WhatsApp
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ background: '#1877F2', color: 'white', border: 'none', flex: 1, cursor: 'pointer' }}
                                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
                                    >
                                        Facebook
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', border: 'none', flex: 1, cursor: 'pointer' }}
                                        onClick={() => window.open('https://www.instagram.com/', '_blank')}
                                        title="Open Instagram to share"
                                    >
                                        Instagram
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* TRANSACTIONS */}
                        <div className="admin-card" style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Transaction History</h3>
                            {transactions.length === 0 ? (
                                <p style={{ color: '#aaa', textAlign: 'center', padding: '2rem' }}>No transactions yet.</p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Description</th>
                                            <th>Amount</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(txn => (
                                            <tr key={txn._id}>
                                                <td style={{ fontSize: '0.9rem', color: '#666' }}>
                                                    {new Date(txn.createdAt).toLocaleDateString()}
                                                </td>
                                                <td>{txn.description}</td>
                                                <td style={{ fontWeight: 'bold', color: txn.type === 'credit' ? '#38a169' : '#e53e3e' }}>
                                                    {txn.type === 'credit' ? '+' : '-'} ₹{txn.amount}
                                                </td>
                                                <td>
                                                    <span className={`badge ${txn.type === 'credit' ? 'badge-green' : 'badge-red'}`}>
                                                        {txn.type.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h3 style={{ color: '#718096' }}>Access Restricted</h3>
                        <p>Wallet and Referrals are available for standard user accounts only.</p>
                    </div>
                )}

            </div>
            <Footer />
        </div>
    );
};

export default UserDashboard;
