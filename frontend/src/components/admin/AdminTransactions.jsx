import React, { useState, useEffect } from 'react';
import { Search, Users, ChevronRight, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, DollarSign, User, Network, Maximize2, Minimize2, X } from 'lucide-react';
import axios from 'axios';
import './AdminTransactions.css';

const AdminTransactions = ({ initialUser, isModal, onClose }) => {
    // Left Panel State
    const [viewMode, setViewMode] = useState('ALL'); // 'ALL' or 'SEARCH'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [referralTree, setReferralTree] = useState(null);

    // Right Panel State
    const [rightPanelMode, setRightPanelMode] = useState('TREE'); // 'TREE' or 'TRANSACTIONS'
    const [userTransactions, setUserTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [transactionBreakdown, setTransactionBreakdown] = useState(null);

    const [userStats, setUserStats] = useState({
        totalDonated: 0,
        totalWithdrawn: 0,
        currentBalance: 0
    });

    // Network View State
    const [networkData, setNetworkData] = useState([]);
    const [networkFilter, setNetworkFilter] = useState('ALL'); // 'ALL', 'DIRECT', 'INDIRECT'
    const [isTreeFullScreen, setIsTreeFullScreen] = useState(false);

    const [loading, setLoading] = useState(false);

    // Fetch paginated users for ALL mode
    useEffect(() => {
        if (viewMode === 'ALL') {
            fetchPaginatedUsers(currentPage);
        }
    }, [viewMode, currentPage]);

    const fetchPaginatedUsers = async (page) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/transactions/users/paginated?page=${page}`);
            setAllUsers(res.data.users);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Search users
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const res = await axios.get(`http://localhost:5000/api/transactions/users/search?query=${query}`);
            setSearchResults(res.data.users);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    // Select a user and fetch their referral tree
    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setLoading(true);

        try {
            const res = await axios.get(`http://localhost:5000/api/transactions/users/${user._id}/referral-tree`);
            setReferralTree(res.data);

            // Also fetch transactions and stats
            const txnRes = await axios.get(`http://localhost:5000/api/transactions/users/${user._id}/transactions`);
            setUserTransactions(txnRes.data.transactions);

            setUserStats({
                totalDonated: txnRes.data.totalDonated || 0,
                totalWithdrawn: txnRes.data.totalWithdrawn || 0,
                currentBalance: txnRes.data.currentBalance || 0
            });

            // Fetch Network Stats
            const netRes = await axios.get(`http://localhost:5000/api/transactions/users/${user._id}/network-stats`);
            setNetworkData(netRes.data.network);

        } catch (error) {
            console.error('Error fetching referral tree:', error);
        } finally {
            setLoading(false);
        }
    };

    // Select a transaction to view breakdown
    const handleTransactionSelect = async (transaction) => {
        setSelectedTransaction(transaction);
        setTransactionBreakdown(null);

        if (transaction.referenceId && transaction.reason.includes('referral_commission')) {
            try {
                const res = await axios.get(`http://localhost:5000/api/transactions/donations/${transaction.referenceId}/breakdown`);
                setTransactionBreakdown(res.data);
            } catch (error) {
                console.error('Error fetching transaction breakdown:', error);
            }
        }
    };

    // Auto-select user if provided via props (Modal Mode)
    useEffect(() => {
        if (initialUser) {
            handleUserSelect(initialUser);
        }
    }, [initialUser]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getFilteredNetworkData = () => {
        if (networkFilter === 'ALL') return networkData;
        if (networkFilter === 'DIRECT') return networkData.filter(d => d.level === 'Level 1');
        if (networkFilter === 'INDIRECT') return networkData.filter(d => d.level === 'Level 2');
        return networkData;
    };

    const renderTreeContainer = (isModal = false) => (
        <div className={`tree-container ${isModal ? 'modal-tree' : ''}`}>
            {/* Root User */}
            <div className="tree-node root-node">
                <div className="node-content">
                    <User size={24} />
                    <div className="node-info">
                        <h4>{referralTree.user.name}</h4>
                        <p>{referralTree.user.mobile}</p>
                        <span className="node-date">{formatDate(referralTree.user.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Level 1 Users */}
            {referralTree.level1Users.length > 0 && (
                <div className="tree-level level-1">
                    <div className="level-label">
                        <span className="badge badge-l1">Level 1 (10%)</span>
                        <span className="count">{referralTree.level1Users.length} users</span>
                    </div>
                    <div className="level-nodes">
                        {referralTree.level1Users.map(l1User => (
                            <div key={l1User._id} className="tree-node level-1-node">
                                <div className="node-content">
                                    <User size={20} />
                                    <div className="node-info">
                                        <h5>{l1User.name}</h5>
                                        <p>{l1User.mobile}</p>
                                        <span className="node-date">{formatDate(l1User.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Level 2 Users */}
            {referralTree.level2Data.some(item => item.level2Users.length > 0) && (
                <div className="tree-level level-2">
                    <div className="level-label">
                        <span className="badge badge-l2">Level 2 (3%)</span>
                        <span className="count">
                            {referralTree.level2Data.reduce((sum, item) => sum + item.level2Users.length, 0)} users
                        </span>
                    </div>
                    <div className="level-groups">
                        {referralTree.level2Data.map((group, idx) => (
                            group.level2Users.length > 0 && (
                                <div key={idx} className="level-2-group">
                                    <div className="group-header">
                                        via {group.level1User.name}
                                    </div>
                                    <div className="level-nodes">
                                        {group.level2Users.map(l2User => (
                                            <div key={l2User._id} className="tree-node level-2-node">
                                                <div className="node-content">
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
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className={`admin-transactions-container ${isModal ? 'modal-container' : ''}`}>
            {/* Creative Background Elements */}
            <div className="bg-shape shape-1"></div>
            <div className="bg-shape shape-2"></div>
            <div className="bg-shape shape-3"></div>



            <div className={`transactions-layout ${isModal ? 'modal-layout' : ''}`}>
                {/* LEFT PANEL - User Selector */}
                {!isModal && (
                    <div className="left-panel">
                        <div className="panel-header">
                            <h2><Users size={20} /> User Explorer</h2>
                        </div>

                        {/* Mode Toggle */}
                        <div className="mode-toggle">
                            <button
                                className={`mode-btn ${viewMode === 'ALL' ? 'active' : ''}`}
                                onClick={() => setViewMode('ALL')}
                            >
                                All Users
                            </button>
                            <button
                                className={`mode-btn ${viewMode === 'SEARCH' ? 'active' : ''}`}
                                onClick={() => setViewMode('SEARCH')}
                            >
                                Search User
                            </button>
                        </div>

                        {/* ALL Mode - Paginated List */}
                        {viewMode === 'ALL' && (
                            <div className="user-list-section">
                                <div className="user-list">
                                    {loading ? (
                                        <div className="loading-state">Loading users...</div>
                                    ) : (
                                        allUsers.map(user => (
                                            <div
                                                key={user._id}
                                                className={`user-card ${selectedUser?._id === user._id ? 'selected' : ''}`}
                                                onClick={() => handleUserSelect(user)}
                                            >
                                                <div className="user-avatar">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-info">
                                                    <h4>{user.name}</h4>
                                                    <p>{user.mobile}</p>
                                                    <span className="user-date">Joined {formatDate(user.createdAt)}</span>
                                                </div>
                                                <ChevronRight size={18} className="user-arrow" />
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Pagination */}
                                <div className="pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SEARCH Mode */}
                        {viewMode === 'SEARCH' && (
                            <div className="search-section">
                                <div className="search-input-wrapper">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or mobile..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </div>

                                <div className="user-list">
                                    {searchResults.map(user => (
                                        <div
                                            key={user._id}
                                            className={`user-card ${selectedUser?._id === user._id ? 'selected' : ''}`}
                                            onClick={() => handleUserSelect(user)}
                                        >
                                            <div className="user-avatar">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="user-info">
                                                <h4>{user.name}</h4>
                                                <p>{user.mobile}</p>
                                                <span className="user-date">Joined {formatDate(user.createdAt)}</span>
                                            </div>
                                            <ChevronRight size={18} className="user-arrow" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                )}

                {/* RIGHT PANEL - Toggle between Tree & Transactions */}
                <div className="right-panel">
                    {selectedUser ? (
                        <>
                            <div className="panel-header selected-user-header">
                                <div className="user-profile-left">
                                    <div className="user-avatar-large">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2>{selectedUser.name}</h2>
                                        <p>{selectedUser.mobile}</p>
                                        <span className="joining-date">Joined {formatDate(selectedUser.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="user-stats-cards">
                                    <div className="stats-card donated">
                                        <span className="card-label">Total Donated</span>
                                        <span className="card-value">{formatCurrency(userStats.totalDonated)}</span>
                                    </div>
                                    <div className="stats-card withdrawn">
                                        <span className="card-label">Total Withdrawn</span>
                                        <span className="card-value">{formatCurrency(userStats.totalWithdrawn)}</span>
                                    </div>
                                    <div className="stats-card balance">
                                        <span className="card-label">Current Balance</span>
                                        <span className="card-value highlight">{formatCurrency(userStats.currentBalance)}</span>
                                    </div>

                                    {/* Referral Stats Added Here */}
                                    {referralTree && (
                                        <>
                                            <div className="stats-card">
                                                <span className="card-label">Direct Referrals</span>
                                                <span className="card-value">{referralTree.level1Users.length}</span>
                                            </div>
                                            <div className="stats-card">
                                                <span className="card-label">Level 2 Referrals</span>
                                                <span className="card-value">
                                                    {referralTree.level2Data.reduce((sum, item) => sum + item.level2Users.length, 0)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Toggle Switcher */}
                            <div className="view-toggle">
                                <button
                                    className={`toggle-btn ${rightPanelMode === 'NETWORK' ? 'active' : ''}`}
                                    onClick={() => setRightPanelMode('NETWORK')}
                                >
                                    <Users size={18} />
                                    Network
                                </button>
                                <button
                                    className={`toggle-btn ${rightPanelMode === 'TREE' ? 'active' : ''}`}
                                    onClick={() => setRightPanelMode('TREE')}
                                >
                                    <Network size={18} />
                                    Tree Structure
                                </button>
                                <button
                                    className={`toggle-btn ${rightPanelMode === 'TRANSACTIONS' ? 'active' : ''}`}
                                    onClick={() => setRightPanelMode('TRANSACTIONS')}
                                >
                                    <Wallet size={18} />
                                    Transactions
                                </button>
                                {isModal && onClose && (
                                    <button
                                        className="toggle-btn"
                                        style={{ marginLeft: 'auto', background: '#fee2e2', color: '#ef4444' }}
                                        onClick={onClose}
                                    >
                                        <X size={18} />
                                        Close
                                    </button>
                                )}
                            </div>

                            {/* NETWORK VIEW */}
                            {rightPanelMode === 'NETWORK' && (
                                <div className="network-view">
                                    <div className="network-filters">
                                        <button
                                            className={`filter-btn ${networkFilter === 'ALL' ? 'active' : ''}`}
                                            onClick={() => setNetworkFilter('ALL')}
                                        >
                                            All
                                        </button>
                                        <button
                                            className={`filter-btn ${networkFilter === 'DIRECT' ? 'active' : ''}`}
                                            onClick={() => setNetworkFilter('DIRECT')}
                                        >
                                            Direct (L1)
                                        </button>
                                        <button
                                            className={`filter-btn ${networkFilter === 'INDIRECT' ? 'active' : ''}`}
                                            onClick={() => setNetworkFilter('INDIRECT')}
                                        >
                                            Indirect (L2)
                                        </button>
                                    </div>

                                    <div className="network-list">
                                        <div className="network-header-row">
                                            <span>User</span>
                                            <span>Level</span>
                                            <span>Total Donated</span>
                                            <span>Earned From</span>
                                            <span>Joined</span>
                                        </div>
                                        {getFilteredNetworkData().length === 0 ? (
                                            <div className="empty-network">No users found in this category.</div>
                                        ) : (
                                            getFilteredNetworkData().map(member => (
                                                <div key={member._id} className="network-row">
                                                    <div className="net-user">
                                                        <div className="net-avatar">{member.avatar}</div>
                                                        <div className="net-meta">
                                                            <h4>{member.name}</h4>
                                                            <p>{member.mobile}</p>
                                                        </div>
                                                    </div>
                                                    <div className="net-level">
                                                        <span className={`badge ${member.level === 'Level 1' ? 'badge-l1' : 'badge-l2'}`}>
                                                            {member.level}
                                                        </span>
                                                    </div>
                                                    <div className="net-amount">{formatCurrency(member.totalDonated)}</div>
                                                    <div className="net-earned">+{formatCurrency(member.totalEarnedFrom)}</div>
                                                    <div className="net-date">{formatDate(member.joinedDate)}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {rightPanelMode === 'TREE' && referralTree && (
                                <div className="tree-view">
                                    {/* Tree Controls */}
                                    <div className="tree-controls">
                                        <button
                                            className="control-btn"
                                            onClick={() => setIsTreeFullScreen(true)}
                                            title="Expand View"
                                        >
                                            <Maximize2 size={20} />
                                            Expand View
                                        </button>
                                    </div>

                                    {renderTreeContainer(false)}
                                </div>
                            )}

                            {/* TRANSACTIONS VIEW */}
                            {rightPanelMode === 'TRANSACTIONS' && (
                                <div className="transactions-view">
                                    {userTransactions.length === 0 ? (
                                        <div className="empty-state">
                                            <Wallet size={48} />
                                            <h3>No Transactions Yet</h3>
                                            <p>This user hasn't earned any commissions</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="transaction-list">
                                                {userTransactions.map((txn, idx) => (
                                                    <div key={idx} className="transaction-wrapper">
                                                        <div
                                                            className={`transaction-card ${selectedTransaction?._id === txn._id ? 'selected' : ''}`}
                                                            onClick={() => handleTransactionSelect(txn)}
                                                        >
                                                            <div className="txn-icon">
                                                                {txn.type === 'credit' ? (
                                                                    <ArrowDownRight className="credit-icon" size={24} />
                                                                ) : (
                                                                    <ArrowUpRight className="debit-icon" size={24} />
                                                                )}
                                                            </div>
                                                            <div className="txn-details">
                                                                <h4>{txn.description || txn.reason}</h4>
                                                                <p className="txn-date">{formatDate(txn.createdAt)}</p>
                                                                {txn.donation && (
                                                                    <div className="txn-meta">
                                                                        <span className="donor-name">From: {txn.donation.donorName}</span>
                                                                        <span className={`commission-badge ${txn.reason === 'referral_commission_l1' ? 'l1' : 'l2'}`}>
                                                                            {txn.reason === 'referral_commission_l1' ? 'L1 - 10%' : 'L2 - 3%'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`txn-amount ${txn.type}`}>
                                                                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                            </div>
                                                        </div>

                                                        {/* Inline Transaction Breakdown */}
                                                        {selectedTransaction?._id === txn._id && transactionBreakdown && (
                                                            <div className="breakdown-panel inline-breakdown">
                                                                <h3>Transaction Breakdown</h3>
                                                                <div className="breakdown-content">
                                                                    <div className="donation-info">
                                                                        <h4>Original Donation</h4>
                                                                        <div className="info-row">
                                                                            <span>Donor:</span>
                                                                            <strong>{transactionBreakdown.donation.donorName}</strong>
                                                                        </div>
                                                                        <div className="info-row">
                                                                            <span>Amount:</span>
                                                                            <strong className="highlight">{formatCurrency(transactionBreakdown.donation.amount)}</strong>
                                                                        </div>
                                                                        <div className="info-row">
                                                                            <span>Date:</span>
                                                                            <strong>{formatDate(transactionBreakdown.donation.date)}</strong>
                                                                        </div>
                                                                    </div>

                                                                    <div className="commission-flow">
                                                                        <h4>Commission Distribution</h4>
                                                                        {transactionBreakdown.commissions.map((comm, cIdx) => (
                                                                            <div key={cIdx} className="commission-item">
                                                                                <div className="comm-header">
                                                                                    <span className={`level-badge ${comm.level === 1 ? 'l1' : 'l2'}`}>
                                                                                        Level {comm.level}
                                                                                    </span>
                                                                                    <span className="percentage">{comm.percentage}%</span>
                                                                                </div>
                                                                                <div className="comm-recipient">
                                                                                    <User size={16} />
                                                                                    <span>{comm.recipient.name}</span>
                                                                                </div>
                                                                                <div className="comm-amount">
                                                                                    {formatCurrency(comm.amount)}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <Users size={64} />
                            <h3>Select a User</h3>
                            <p>Choose a user from the left panel to view their referral tree and transactions</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Full Screen Tree Modal */}
            {isTreeFullScreen && referralTree && (
                <div className="tree-modal-overlay">
                    <button
                        className="close-modal-btn"
                        onClick={() => setIsTreeFullScreen(false)}
                    >
                        <X size={24} />
                    </button>
                    <div className="tree-modal-content">
                        {renderTreeContainer(true)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTransactions;
