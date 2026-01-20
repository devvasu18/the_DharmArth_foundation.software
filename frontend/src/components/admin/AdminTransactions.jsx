import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Search, Users, ChevronRight, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, DollarSign, User, Network, Maximize2, Minimize2, X } from 'lucide-react';
import axios from 'axios';
import './AdminTransactions.css';

const AdminTransactions = ({ initialUser, isModal, onClose }) => {
    const location = useLocation();
    // Left Panel State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [viewMode, setViewMode] = useState('ALL'); // 'ALL' or 'SEARCH'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(initialUser || location.state?.selectedUser || null);
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
            const treeData = res.data || {};
            setReferralTree({
                ...treeData,
                level1Users: treeData.level1Users || [],
                level2Data: treeData.level2Data || []
            });

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
            setNetworkData(netRes.data.network || []);

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

    // Auto-select user if provided via props (Modal Mode) or Navigation State
    useEffect(() => {
        if (initialUser) {
            handleUserSelect(initialUser);
        } else if (location.state?.selectedUser) {
            const user = location.state.selectedUser;
            handleUserSelect(user);
            setSearchQuery(user.name);
            setSearchResults([user]);
        } else if (location.state?.searchQuery) {
            // Perform explicit search and auto-select logic for navigation
            const query = location.state.searchQuery;
            setSearchQuery(query);
            axios.get(`http://localhost:5000/api/transactions/users/search?query=${query}`)
                .then(res => {
                    const users = res.data.users;
                    setSearchResults(users);
                    // If we have results, auto-select the first one (most likely match for mobile)
                    if (users.length > 0) {
                        handleUserSelect(users[0]);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [initialUser, location.state]);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateWithTime = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getFilteredNetworkData = () => {
        if (!Array.isArray(networkData)) return [];
        if (networkFilter === 'ALL') return networkData;
        if (networkFilter === 'DIRECT') return networkData.filter(d => d.level === 'Level 1');
        if (networkFilter === 'INDIRECT') return networkData.filter(d => d.level === 'Level 2');
        return networkData;
    };

    // --- SLIDING TREE LOGIC ---
    const treeScrollRef = useRef(null);
    const isAutoScrolling = useRef(false);

    // Date Filter State
    const [dateFilter, setDateFilter] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        preset: 'MONTH'
    });

    // Sorted L1 Users for "Timeline" view
    const sortedL1Users = useMemo(() => {
        if (!referralTree?.level1Users) return [];
        return [...referralTree.level1Users].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [referralTree]);

    // Handle User Scroll -> Update Date Filter
    const handleTreeScroll = () => {
        if (isAutoScrolling.current || !treeScrollRef.current) return;

        const container = treeScrollRef.current;
        const nodes = Array.from(container.querySelectorAll('.level-1-node'));
        if (nodes.length === 0) return;

        // Find center node
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        let closestNode = null;
        let minDiff = Infinity;

        nodes.forEach(node => {
            const nodeRect = node.getBoundingClientRect();
            const nodeCenter = nodeRect.left + nodeRect.width / 2;
            const diff = Math.abs(containerCenter - nodeCenter);
            if (diff < minDiff) {
                minDiff = diff;
                closestNode = node;
            }
        });

        if (closestNode) {
            const dateStr = closestNode.getAttribute('data-date');
            if (dateStr) {
                const date = new Date(dateStr);
                // Update filter to the month of the focused user
                const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

                setDateFilter(prev => {
                    if (prev.start === startOfMonth && prev.end === endOfMonth) return prev;
                    return { start: startOfMonth, end: endOfMonth };
                });
            }
        }
    };

    // Handle Filter Change -> Scroll to User
    const handleDateChange = (e, type) => {
        const newVal = e.target.value;
        const newFilter = { ...dateFilter, [type]: newVal };
        setDateFilter(newFilter);

        // Scroll to first user in new range
        if (sortedL1Users.length > 0 && treeScrollRef.current) {
            const targetDate = new Date(type === 'start' ? newVal : newFilter.start);
            const targetUser = sortedL1Users.find(u => new Date(u.createdAt) >= targetDate);

            if (targetUser) {
                const node = document.getElementById(`node-${targetUser._id}`);
                if (node) {
                    isAutoScrolling.current = true;
                    node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    setTimeout(() => isAutoScrolling.current = false, 1000);
                }
            } else {
                // If no user found after date, maybe scroll to end?
            }
        }
    };

    // Scroll to current month on mount/data load
    useEffect(() => {
        if (referralTree && treeScrollRef.current && sortedL1Users.length > 0) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const targetUser = sortedL1Users.find(u => new Date(u.createdAt) >= startOfMonth);

            if (targetUser) {
                const node = document.getElementById(`node-${targetUser._id}`);
                if (node) {
                    isAutoScrolling.current = true;
                    // A slight timeout to allow rendering
                    setTimeout(() => {
                        node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        setTimeout(() => isAutoScrolling.current = false, 1000);
                    }, 500);
                }
            }
        }
    }, [referralTree, sortedL1Users]);


    // --- DRAG TO SCROLL LOGIC ---
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeftRef = useRef(0);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        const slider = treeScrollRef.current;
        if (!slider) return;

        slider.style.cursor = 'grabbing';
        slider.style.userSelect = 'none'; // Prevent selection while dragging

        startX.current = e.pageX - slider.offsetLeft;
        scrollLeftRef.current = slider.scrollLeft;
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        if (treeScrollRef.current) {
            treeScrollRef.current.style.cursor = 'grab';
            treeScrollRef.current.style.removeProperty('user-select');
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (treeScrollRef.current) {
            treeScrollRef.current.style.cursor = 'grab';
            treeScrollRef.current.style.removeProperty('user-select');
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const slider = treeScrollRef.current;
        if (!slider) return;

        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
        slider.scrollLeft = scrollLeftRef.current - walk;
    };

    const renderTreeContainer = (isModal = false) => (
        <div className={`tree-container sliding-layout ${isModal ? 'modal-tree' : ''}`}>

            {/* Date Filters (Floating) */}
            <div className="tree-date-filter">
                <div className="presets">
                    <button
                        className={dateFilter.preset === 'TODAY' ? 'active' : ''}
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setDateFilter({ start: today, end: today, preset: 'TODAY' });
                        }}
                    >Today</button>
                    <button
                        className={dateFilter.preset === 'WEEK' ? 'active' : ''}
                        onClick={() => {
                            const today = new Date();
                            const weekStart = new Date(today);
                            weekStart.setDate(today.getDate() - 7);
                            setDateFilter({
                                start: weekStart.toISOString().split('T')[0],
                                end: today.toISOString().split('T')[0],
                                preset: 'WEEK'
                            });
                        }}
                    >Week</button>
                    <button
                        className={dateFilter.preset === 'MONTH' ? 'active' : ''}
                        onClick={() => {
                            const today = new Date();
                            const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                            setDateFilter({ start, end, preset: 'MONTH' });
                        }}
                    >Month</button>
                    <button
                        className={!dateFilter.preset ? 'active' : ''}
                        onClick={() => setDateFilter(prev => ({ ...prev, preset: null }))} // Custom
                    >Custom</button>
                </div>
                {(!dateFilter.preset) && (
                    <div className="custom-dates">
                        <div className="date-input-group">
                            <label>From</label>
                            <input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => handleDateChange(e, 'start')}
                            />
                        </div>
                        <div className="filter-separator"></div>
                        <div className="date-input-group">
                            <label>To</label>
                            <input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => handleDateChange(e, 'end')}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Root User - FIXED */}
            <div className="sticky-root-wrapper" style={{ flexDirection: 'column', alignItems: 'center' }}>
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

                {/* Level 1 Label - Moved Sticky */}
                {sortedL1Users.length > 0 && (
                    <div className="level-label" style={{ marginTop: '1.5rem', marginBottom: '0.5rem', zIndex: 51 }}>
                        <span className="badge badge-l1">Level 1 (10%)</span>
                        <span className="count">{sortedL1Users.length} users</span>
                    </div>
                )}
            </div>

            {/* Scrollable Levels - FAMILY COLUMN BASED */}
            <div
                className="scrollable-tree-content"
                ref={treeScrollRef}
                onScroll={handleTreeScroll}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: 'grab' }}
            >

                {/* Family Tracks */}
                <div className="family-track" style={{ display: 'flex', gap: '4rem', padding: '2rem 50vw 0', minWidth: 'max-content' }}>
                    {sortedL1Users.map(l1User => {
                        const l2Group = referralTree.level2Data.find(g => g.level1User._id === l1User._id);
                        const hasL2 = l2Group && l2Group.level2Users.length > 0;

                        return (
                            <div key={l1User._id} className="family-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                                {/* L1 NODE */}
                                <div
                                    id={`node-${l1User._id}`}
                                    className="tree-node level-1-node"
                                    data-date={l1User.createdAt}
                                    style={{ marginBottom: hasL2 ? '4rem' : '0', position: 'relative' }} // Space for L2 connection
                                >
                                    <div className="node-content">
                                        <User size={20} />
                                        <div className="node-info">
                                            <h5>{l1User.name}</h5>
                                            <p>{l1User.mobile}</p>
                                            <span className="node-date">{formatDate(l1User.createdAt)}</span>
                                        </div>
                                    </div>
                                    {/* Connector Down if has L2 */}
                                    {hasL2 && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-4rem',
                                            left: '50%',
                                            width: '2px',
                                            height: '4rem',
                                            background: '#cbd5e1'
                                        }}></div>
                                    )}
                                </div>

                                {/* L2 GROUP */}
                                {hasL2 && (
                                    <div className="level-2-group" style={{ marginTop: 0 }}>
                                        {/* We define marginTop 0 because we handle spacing via L1 margin */}
                                        <div className="group-header">
                                            via {l1User.name}
                                        </div>
                                        <div className="level-nodes" style={{ flexWrap: 'nowrap', gap: '2rem' }}>
                                            {l2Group.level2Users.map(l2User => (
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
                                )}
                            </div>
                        );
                    })}
                </div>
                {/* End of family-track */}

            </div>
            {/* End of scrollable-tree-content */}

            {/* Level 2 Label - Fixed at Bottom to prevent horizontal scrolling */}
            {referralTree.level2Data.some(item => item.level2Users.length > 0) && (
                <div className="level-label" style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 60,
                    pointerEvents: 'none',
                    opacity: 0.9,
                    background: 'rgba(255,255,255,0.8)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <span className="badge badge-l2">Level 2 (3%)</span>
                    <span className="count">
                        {referralTree.level2Data.reduce((sum, item) => sum + item.level2Users.length, 0)} total users
                    </span>
                </div>
            )}
        </div>
    );

    return (
        <div className={`admin-transactions-container ${isModal ? 'modal-container' : ''}`}>
            <div className={`transactions-layout ${isModal ? 'modal-layout' : ''}`}>

                {/* 1. EXPLORER SIDEBAR (Was Left Panel) */}
                {!isModal && (
                    <div className={`explorer-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                        <div className="sidebar-header">
                            <h2><Users size={18} /> User List</h2>
                        </div>

                        {/* 2. SEARCH BAR (Always Visible) */}
                        <div className="admin-transactions-search-wrapper">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* 3. UNIFIED LIST SECTION */}
                        <div className="user-list-section">
                            <div className="user-list">
                                {loading ? (
                                    <div className="loading-state">Loading...</div>
                                ) : (
                                    (searchQuery && (searchQuery.trim().length >= 2 || searchResults.length > 0) ? searchResults : allUsers).length === 0 ? (
                                        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                            No users found
                                        </div>
                                    ) : (
                                        (searchQuery && (searchQuery.trim().length >= 2 || searchResults.length > 0) ? searchResults : allUsers).map(user => (
                                            <div
                                                key={user._id}
                                                className={`user-card ${selectedUser?._id === user._id ? 'selected' : ''}`}
                                                onClick={() => handleUserSelect(user)}
                                            >
                                                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                                                <div className="user-info">
                                                    <h4>{user.name}</h4>
                                                    <p>{user.mobile}</p>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>

                            {/* Pagination (Only show when NOT searching) */}
                            {(!searchQuery || (searchQuery.trim().length < 2 && searchResults.length === 0)) && (
                                <div className="pagination">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                                    <span>{currentPage} / {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* FLOATING TOGGLE BUTTON - Moves with Sidebar */}
                {!isModal && (
                    <div
                        className="sidebar-toggle-wrapper"
                        style={{
                            left: isSidebarCollapsed ? '0' : '320px',
                        }}
                    >
                        <button
                            className="sidebar-toggle-btn"
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                        >
                            {isSidebarCollapsed ? <ChevronRight size={16} /> : <Minimize2 size={16} style={{ transform: 'rotate(90deg)' }} />}
                        </button>
                    </div>
                )}

                {/* 2. MAIN CONTENT (Was Right Panel) */}
                <div className="explorer-content">
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
                                        className="toggle-btn btn-close"
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
                                                        <div className="net-avatar">{member.avatar || member.name?.charAt(0).toUpperCase()}</div>
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
                                                    <div className="net-date">{formatDateWithTime(member.joinedDate)}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {rightPanelMode === 'TREE' && referralTree?.user && (
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
            </div >
            {/* Full Screen Tree Modal */}
            {
                isTreeFullScreen && referralTree && createPortal(
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
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default AdminTransactions;
