import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    Search, Filter, Calendar, Download, ChevronDown, X,
    ArrowRight, User, CheckCircle, Wallet, FileText, Save, Upload, Eye, Edit2, Lock
} from 'lucide-react';
import './TransactionManagement.css';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TransactionManagement = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // --- Global State ---
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // --- Filters State ---
    const [filters, setFilters] = useState(() => {
        const initialState = {
            searchUser: null,
            levelFilter: 'ALL',
            specificMotivatorIds: [],
            commissionFilter: 'ALL',
            transactionType: 'ALL',
            is80G: false,
            pending80G: false,
            sort: 'desc',
            limit: 20,
            dateRange: {
                start: '',
                end: ''
            }
        };

        if (location.state?.filters) {
            const { start, end, commissionFilter } = location.state.filters;
            return {
                ...initialState,
                dateRange: {
                    start: start || initialState.dateRange.start,
                    end: end || initialState.dateRange.end
                },
                commissionFilter: commissionFilter || 'ALL'
            };
        }
        return initialState;
    });

    // Pending Filters for Manual Apply
    const [pendingFilters, setPendingFilters] = useState(() => {
        const defaultState = {
            levelFilter: 'ALL',
            specificMotivatorIds: [],
            dateRange: { start: '', end: '' }
        };

        if (location.state?.filters) {
            const { start, end } = location.state.filters;
            return {
                ...defaultState,
                dateRange: { start: start || '', end: end || '' }
            };
        }
        return defaultState;
    });

    const [activeDropdown, setActiveDropdown] = useState(null); // 'USER', 'LEVEL', 'DATE'
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadingTxnId, setUploadingTxnId] = useState(null);

    // --- Search User Dropdown State ---
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);

    // --- Level Dropdown State ---
    const [levelData, setLevelData] = useState({ l1Users: [], l2Users: [] });
    const [loadingLevels, setLoadingLevels] = useState(false);

    // --- Breakdown Modal State ---
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isEditingTax, setIsEditingTax] = useState(false);
    const [editTaxForm, setEditTaxForm] = useState({ panNumber: '', aadhaarNumber: '' });
    const [regenerating, setRegenerating] = useState(false);

    // Load History on Mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('admin_transaction_search_history');
        if (storedHistory) {
            setSearchHistory(JSON.parse(storedHistory));
        }
    }, []);

    useEffect(() => {
        const storedHistory = localStorage.getItem('admin_transaction_search_history');
        if (storedHistory) {
            setSearchHistory(JSON.parse(storedHistory));
        }
    }, [location.state]); // Re-run if location changes just in case, though once is fine


    const handleOpenExplorer = (data) => {
        if (!data) return;
        if (typeof data === 'object' && data._id) {
            navigate('/admin-user-explorer/transactions', { state: { selectedUser: data } });
        } else if (typeof data === 'string') {
            navigate('/admin-user-explorer/transactions', { state: { searchQuery: data } });
        }
    };

    // Handle redirect from Notification (Open Single Transaction)
    // Note: Filter init is handled in useState lazy initializer above
    useEffect(() => {
        if (location.state?.openTransactionId) {
            setLoading(true);
            const txnId = location.state.openTransactionId;
            // Fetch the specific transaction
            api.get('/transactions/dashboard', {
                params: { _id: txnId }
            })
                .then(res => {
                    if (res.data.data && res.data.data.length > 0) {
                        setSelectedTransaction(res.data.data[0]);
                    } else {
                        toast.error("Transaction not found");
                    }
                })
                .catch(err => {
                    console.error(err);
                    toast.error("Failed to open transaction");
                })
                .finally(() => setLoading(false));
        }
    }, [location.state]);

    // Fetch Transactions API
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: filters.limit,
                is80G: filters.is80G,
                pending80G: filters.pending80G,
                startDate: filters.dateRange.start,
                endDate: filters.dateRange.end,
                sort: filters.sort === 'asc' ? 'oldest' : 'newest',
                commissionFilter: filters.commissionFilter
            };

            if (filters.searchUser) {
                // Pass Transaction Type
                params.type = filters.transactionType;

                // If specific motivators selected (via Level checkboxes), use them
                if (filters.specificMotivatorIds.length > 0) {
                    params.specificMotivatorIds = filters.specificMotivatorIds.join(',');
                } else {
                    // Filter by Level Tab if no specific checkboxes
                    // Use a SAFE dummy ID (24 hex chars) if no users found, to avoid Backend Crash
                    const DUMMY_ID = "000000000000000000000000";

                    if (filters.levelFilter === 'L1') {
                        // Level 1: "Direct Motivated by Me"
                        // So I (the Search User) am the Motivator.
                        params.specificMotivatorIds = filters.searchUser._id;
                    } else if (filters.levelFilter === 'L2') {
                        // Level 2: "Indirect Motivated by Me" (My Recruits are Motivators)
                        // So My L1 Recruits are the Motivators.
                        if (levelData.l1Users.length > 0) {
                            params.specificMotivatorIds = levelData.l1Users.map(u => u._id).join(',');
                        } else {
                            params.specificMotivatorIds = DUMMY_ID;
                        }
                    } else {
                        // ALL (Default): Search by Root User ID (Recursive search handled by Backend)
                        params.searchUserId = filters.searchUser._id;
                    }
                }
            }

            const res = await api.get('/transactions/dashboard', { params });
            setTransactions(res.data.data);
            setTotalPages(Number(res.data.totalPages) || 1);
            setTotalRecords(res.data.totalRecords);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    // User Search Logic
    const handleUserSearchInput = async (e) => {
        const query = e.target.value;
        setUserSearchQuery(query);
        if (query.length < 2) {
            setUserSearchResults([]);
            return;
        }
        setIsSearchingUser(true);
        try {
            const res = await api.get(`/transactions/users/search?query=${query}`);
            setUserSearchResults(res.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingUser(false);
        }
    };

    const selectUser = async (user) => {
        setFilters(prev => ({ ...prev, searchUser: user, levelFilter: 'ALL', specificMotivatorIds: [], commissionFilter: 'ALL' }));
        setPage(1); // Reset page
        setActiveDropdown(null); // Close User dropdown

        // Update History
        const newHistory = searchHistory.filter(u => u._id !== user._id);
        newHistory.unshift(user);
        const limitedHistory = newHistory.slice(0, 10);
        setSearchHistory(limitedHistory);
        localStorage.setItem('admin_transaction_search_history', JSON.stringify(limitedHistory));

        // Fetch Level Data for this user immediately to enable Level Filter
        setLoadingLevels(true);
        try {
            const res = await api.get(`/transactions/users/${user._id}/referral-tree`);
            const l1 = res.data.level1Users || [];
            const l2 = [];
            if (res.data.level2Data) {
                res.data.level2Data.forEach(group => {
                    l2.push(...group.level2Users);
                });
            }
            setLevelData({ l1Users: l1, l2Users: l2 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLevels(false);
        }
    };

    // --- Effects ---
    // Initial Load & Refetch on filter change
    useEffect(() => {
        fetchTransactions();
    }, [page, filters.searchUser, filters.specificMotivatorIds, filters.is80G, filters.dateRange, filters.levelFilter, filters.commissionFilter, filters.transactionType, filters.sort, filters.limit, levelData]);

    // Handle clicks outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Handlers ---
    const toggleFilter = (type) => {
        if (activeDropdown === type) {
            setActiveDropdown(null);
        } else {
            // When opening Level dropdown, sync pending state with current applied state
            if (type === 'LEVEL') {
                setPendingFilters(prev => ({
                    ...prev,
                    levelFilter: filters.levelFilter,
                    specificMotivatorIds: filters.specificMotivatorIds
                }));
            }
            if (type === 'DATE') {
                setPendingFilters(prev => ({
                    ...prev,
                    dateRange: filters.dateRange
                }));
            }
            setActiveDropdown(type);
        }
    };

    const handleLevelTab = (tab) => {
        setPendingFilters(prev => ({ ...prev, levelFilter: tab, specificMotivatorIds: [] }));
    };

    const toggleMotivatorSelection = (id) => {
        setPendingFilters(prev => {
            const current = prev.specificMotivatorIds;
            if (current.includes(id)) {
                return { ...prev, specificMotivatorIds: current.filter(x => x !== id) };
            } else {
                return { ...prev, specificMotivatorIds: [...current, id] };
            }
        });
    };

    const applyLevelFilters = () => {
        setFilters(prev => ({
            ...prev,
            levelFilter: pendingFilters.levelFilter,
            specificMotivatorIds: pendingFilters.specificMotivatorIds
        }));
        setActiveDropdown(null);
    };

    const removeFilter = (key) => {
        setPage(1); // Reset page
        if (key === 'user') {
            setFilters(prev => ({ ...prev, searchUser: null, levelFilter: 'ALL', transactionType: 'ALL', specificMotivatorIds: [] }));
            setLevelData({ l1Users: [], l2Users: [] });
        }
        if (key === 'comm') setFilters(prev => ({ ...prev, commissionFilter: 'ALL' }));
        if (key === 'type') setFilters(prev => ({ ...prev, transactionType: 'ALL' }));
        if (key === '80g') setFilters(prev => ({ ...prev, is80G: false }));
        if (key === 'pending80g') setFilters(prev => ({ ...prev, pending80G: false }));
        if (key === 'date') setFilters(prev => ({ ...prev, dateRange: { start: '', end: '' } }));
        if (key === 'level') setFilters(prev => ({ ...prev, levelFilter: 'ALL', specificMotivatorIds: [] }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // --- Export Logic ---
    const getExportData = () => {
        return transactions.map(txn => {
            // Re-calculate Level Label Logic for Export
            let levelLabel = '-';
            if (filters.searchUser) {
                const searchId = filters.searchUser?._id;
                const searchMobile = filters.searchUser?.mobile ? filters.searchUser.mobile.slice(-10) : '';
                if (txn.level1UserId?._id === searchId || (!txn.level1UserId && txn.motivatorMobile && txn.motivatorMobile.includes(searchMobile))) {
                    levelLabel = 'Level 1';
                } else if (txn.level2UserId?._id === searchId) {
                    levelLabel = 'Level 2';
                }
            }

            return {
                Date: formatDate(txn.createdAt),
                "Donor Name": txn.donorName,
                "Donor Mobile": txn.donorMobile,
                Amount: txn.amount,
                Level: levelLabel,
                "Motivated By": txn.level1UserId?.name || (txn.motivatorMobile ? `(Mobile: ${txn.motivatorMobile})` : '-'),
                "L1 Commission": (txn.level1UserId || txn.motivatorMobile) ? (txn.amount * 0.10) : 'No',
                "L2 Commission": txn.level2UserId?.name ? (txn.amount * 0.03) : 'No',
                "80G": txn.is80G ? 'Yes' : 'No',
                Status: txn.status,
                "Payment Method": txn.paymentMethod || 'online'
            };
        });
    };

    const handleUpdateTaxInfo = async (id) => {
        try {
            await api.put(`/donate/update-tax-info/${id}`, editTaxForm);
            toast.success("Tax Info Updated");
            setIsEditingTax(false);
            // Refresh local transaction state
            setSelectedTransaction({ ...selectedTransaction, ...editTaxForm });
            fetchTransactions();
        } catch (err) {
            toast.error("Failed to update tax info");
        }
    };

    const handleRegenerateCertificate = async (id) => {
        setRegenerating(true);
        try {
            const res = await api.post(`/donate/regenerate-certificate/${id}`);
            toast.success("Certificate Regenerated");
            if (res.data.url) {
                window.open(`${api.defaults.baseURL.replace('/api', '')}${res.data.url}`, '_blank');
            }
            fetchTransactions();
        } catch (err) {
            toast.error("Generation failed");
        } finally {
            setRegenerating(false);
        }
    };

    const handleUpload80G = async (id, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('certificate', file);

        setLoading(true);
        try {
            const res = await api.post(`/donate/upload-80g/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("80G Certificate Uploaded!");
            fetchTransactions();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => {
        const data = getExportData();
        const fileName = `Transactions_Report_${new Date().toISOString().split('T')[0]}`;

        if (type === 'JSON') {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (type === 'CSV') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
            const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (type === 'XLSX') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else if (type === 'PDF') {
            const doc = new jsPDF();
            doc.text("Transaction Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

            const tableColumn = ["Date", "Donor", "Amt", "Lvl", "Motivator", "L1 Comm", "L2 Comm", "80G"];
            const tableRows = [];

            data.forEach(item => {
                const row = [
                    item.Date,
                    item["Donor Name"],
                    item.Amount,
                    item.Level,
                    item["Motivated By"],
                    item["L1 Commission"] === 'No' ? '-' : item["L1 Commission"],
                    item["L2 Commission"] === 'No' ? '-' : item["L2 Commission"],
                    item["80G"]
                ];
                tableRows.push(row);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 30,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 66, 66] }
            });

            doc.save(`${fileName}.pdf`);
        }

        setActiveDropdown(null);
        toast.success(`${type} Export Downloaded`);
    };

    // Render Logic
    return (
        <div className="transaction-dashboard">
            {/* Dashboard Header Removed - Actions moved to Filter Bar */}

            {/* Filter Bar */}
            <div className="filter-bar" ref={dropdownRef}>

                {/* 1. Search User */}
                <div className="filter-group">
                    <button
                        className={`filter-btn ${filters.searchUser ? 'active' : ''}`}
                        onClick={() => toggleFilter('USER')}
                    >
                        <User size={16} />
                        {filters.searchUser ? filters.searchUser.name : 'Search User'}
                        <ChevronDown size={14} />
                    </button>

                    {activeDropdown === 'USER' && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <input
                                    type="text"
                                    className="dropdown-search"
                                    placeholder="Search name or mobile..."
                                    value={userSearchQuery}
                                    onChange={handleUserSearchInput}
                                    autoFocus
                                />
                            </div>
                            <div className="dropdown-content">
                                {isSearchingUser ? <div className="p-2 text-sm text-gray-400">Searching...</div> :
                                    userSearchQuery.length < 2 ? (
                                        <>
                                            {searchHistory.length > 0 && <div className="p-2 text-xs font-semibold text-gray-400 bg-gray-50 uppercase tracking-wider">Recent Searches</div>}
                                            {searchHistory.map(user => (
                                                <div key={user._id} className="dropdown-item" onClick={() => selectUser(user)}>
                                                    <div className="item-avatar bg-gray-100 text-gray-600">{user.name.charAt(0)}</div>
                                                    <div className="item-info">
                                                        <h4 className="text-gray-800">{user.name}</h4>
                                                        <p className="text-xs text-gray-400">Recent</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {searchHistory.length === 0 && <div className="p-4 text-center text-sm text-gray-400 italic">Type to search users...</div>}
                                        </>
                                    ) :
                                        userSearchResults.length === 0 ? <div className="p-4 text-center text-sm text-gray-400">No users found</div> :
                                            userSearchResults.map(user => (
                                                <div key={user._id} className="dropdown-item" onClick={() => selectUser(user)}>
                                                    <div className="item-avatar">{user.name.charAt(0)}</div>
                                                    <div className="item-info">
                                                        <h4>{user.name}</h4>
                                                        <p>{user.mobile}</p>
                                                    </div>
                                                </div>
                                            ))
                                }
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Level Filter (Only if User Selected) */}
                {filters.searchUser && (
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${filters.levelFilter !== 'ALL' || filters.specificMotivatorIds.length > 0 ? 'active' : ''}`}
                            onClick={() => toggleFilter('LEVEL')}
                        >
                            <Filter size={16} />
                            {filters.levelFilter === 'ALL' ? 'All Levels' : filters.levelFilter === 'L1' ? 'Level 1' : 'Level 2'}
                            <ChevronDown size={14} />
                        </button>

                        {activeDropdown === 'LEVEL' && (
                            <div className="dropdown-menu" style={{ width: '400px' }}>
                                <div className="level-tabs-header">
                                    {['ALL', 'L1', 'L2'].map(tab => (
                                        <button
                                            key={tab}
                                            className={`level-tab-btn ${pendingFilters.levelFilter === tab ? 'active' : ''}`}
                                            onClick={() => handleLevelTab(tab)}
                                        >
                                            {tab === 'ALL' ? 'All' : tab === 'L1' ? 'Level 1' : 'Level 2'}
                                        </button>
                                    ))}
                                </div>
                                <div className="dropdown-content">
                                    {loadingLevels ? <div className="p-4">Loading tree...</div> : (
                                        <>
                                            {(pendingFilters.levelFilter === 'ALL' || pendingFilters.levelFilter === 'L1') && levelData.l1Users.map(u => (
                                                <div
                                                    key={u._id}
                                                    className={`dropdown-item ${pendingFilters.specificMotivatorIds.includes(u._id) ? 'selected' : ''}`}
                                                    onClick={() => toggleMotivatorSelection(u._id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={pendingFilters.specificMotivatorIds.includes(u._id)}
                                                        readOnly
                                                        className="mr-2"
                                                    />
                                                    <div className="item-info">
                                                        <h4>{u.name} <span className="badge-level-1">Level 1</span></h4>
                                                        <p>{u.mobile}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(pendingFilters.levelFilter === 'ALL' || pendingFilters.levelFilter === 'L2') && levelData.l2Users.map(u => (
                                                <div
                                                    key={u._id}
                                                    className={`dropdown-item ${pendingFilters.specificMotivatorIds.includes(u._id) ? 'selected' : ''}`}
                                                    onClick={() => toggleMotivatorSelection(u._id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={pendingFilters.specificMotivatorIds.includes(u._id)}
                                                        readOnly
                                                        className="mr-2"
                                                    />
                                                    <div className="item-info">
                                                        <h4>{u.name} <span className="badge-level-2">Level 2</span></h4>
                                                        <p>{u.mobile}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="dropdown-footer">
                                    <button className="apply-btn" onClick={applyLevelFilters}>Apply Filter</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* 2.5 Transaction Type Filter (New) */}
                {filters.searchUser && (
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${filters.transactionType !== 'ALL' ? 'active' : ''}`}
                            onClick={() => toggleFilter('TYPE')}
                        >
                            <FileText size={16} />
                            {filters.transactionType === 'ALL' ? 'All Types' : filters.transactionType === 'DONATION' ? 'My Donations' : 'My Commissions'}
                            <ChevronDown size={14} />
                        </button>

                        {activeDropdown === 'TYPE' && (
                            <div className="dropdown-menu w-48 font-medium">
                                <div className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, transactionType: 'ALL' })); setActiveDropdown(null); }}>
                                    All Types
                                </div>
                                <div className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, transactionType: 'DONATION' })); setActiveDropdown(null); }}>
                                    My Donations
                                </div>
                                <div className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, transactionType: 'COMMISSION' })); setActiveDropdown(null); }}>
                                    My Commissions
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2.6 Commission Filter (Global - Only when NO user selected) */}
                {!filters.searchUser && (
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${filters.commissionFilter !== 'ALL' ? 'active' : ''}`}
                            onClick={() => toggleFilter('COMM_FILTER')}
                        >
                            <Wallet size={16} />
                            {filters.commissionFilter === 'ALL' ? 'All Commissions' : filters.commissionFilter === 'L1' ? 'Comm: L1 Only' : 'Comm: L2 Only'}
                            <ChevronDown size={14} />
                        </button>

                        {activeDropdown === 'COMM_FILTER' && (
                            <div className="dropdown-menu w-48 font-medium">
                                <div className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, commissionFilter: 'ALL' })); setActiveDropdown(null); }}>
                                    All
                                </div>
                                <div className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, commissionFilter: 'L1' })); setActiveDropdown(null); }}>
                                    Comm: L1 Only
                                </div>
                                <div className="dropdown-item" onClick={() => { setFilters(prev => ({ ...prev, commissionFilter: 'L2' })); setActiveDropdown(null); }}>
                                    Comm: L2 Only
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. 80G Filter */}
                <button
                    className={`filter-btn ${filters.is80G ? 'active' : ''}`}
                    onClick={() => setFilters(prev => ({ ...prev, is80G: !prev.is80G, pending80G: false }))}
                >
                    <FileText size={16} />
                    80G Donations
                    {filters.is80G && <CheckCircle size={14} />}
                </button>

                <button
                    className={`filter-btn ${filters.pending80G ? 'active' : ''}`}
                    onClick={() => setFilters(prev => ({ ...prev, pending80G: !prev.pending80G, is80G: false }))}
                >
                    <Upload size={16} />
                    Pending 80G
                    {filters.pending80G && <CheckCircle size={14} />}
                </button>

                {/* 4. Date Filter */}
                <div className="filter-group">
                    <button className={`filter-btn ${filters.dateRange.start ? 'active' : ''}`} onClick={() => toggleFilter('DATE')}>
                        <Calendar size={16} /> Date Range
                    </button>
                    {activeDropdown === 'DATE' && (
                        <div className="dropdown-menu date-filter-dropdown" style={{ width: '320px' }}>
                            <div className="presets" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', padding: '0 0.5rem' }}>
                                <button className="preset-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }} onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setPendingFilters(p => ({ ...p, dateRange: { start: today, end: today } }));
                                }}>Today</button>
                                <button className="preset-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }} onClick={() => {
                                    const today = new Date();
                                    const weekStart = new Date(today);
                                    weekStart.setDate(today.getDate() - 7);
                                    setPendingFilters(p => ({ ...p, dateRange: { start: weekStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] } }));
                                }}>This Week</button>
                                <button className="preset-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }} onClick={() => {
                                    const today = new Date();
                                    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                                    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                                    setPendingFilters(p => ({ ...p, dateRange: { start, end } }));
                                }}>This Month</button>
                            </div>
                            <div className="date-inputs-row">
                                <div className="date-field">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        max={new Date().toISOString().split('T')[0]}
                                        className="date-input"
                                        value={pendingFilters.dateRange?.start || ''}
                                        onChange={(e) => setPendingFilters(p => ({ ...p, dateRange: { ...p.dateRange, start: e.target.value } }))}
                                    />
                                </div>
                                <div className="date-field">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={pendingFilters.dateRange?.end || ''}
                                        onChange={(e) => setPendingFilters(p => ({ ...p, dateRange: { ...p.dateRange, end: e.target.value } }))}
                                    />
                                </div>
                            </div>
                            <div className="dropdown-footer">
                                <button className="apply-btn" onClick={() => {
                                    setFilters(prev => ({ ...prev, dateRange: pendingFilters.dateRange }));
                                    setActiveDropdown(null);
                                }}>Apply Date Filter</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="header-actions" style={{ marginLeft: 'auto', position: 'relative' }}>
                    <button className={`filter-btn ${activeDropdown === 'EXPORT' ? 'active' : ''}`} onClick={() => toggleFilter('EXPORT')}>
                        <Download size={16} /> Export <ChevronDown size={14} />
                    </button>
                    {activeDropdown === 'EXPORT' && (
                        <div className="dropdown-menu" style={{ right: 0, left: 'auto', width: '180px' }}>
                            <div className="dropdown-item" onClick={() => handleExport('XLSX')}>
                                <FileText size={16} className="text-green-600" /> Excel (.xlsx)
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('CSV')}>
                                <FileText size={16} className="text-blue-600" /> CSV (.csv)
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('PDF')}>
                                <FileText size={16} className="text-red-600" /> PDF (.pdf)
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('JSON')}>
                                <FileText size={16} className="text-yellow-600" /> JSON (.json)
                            </div>
                        </div>
                    )}

                </div>

                {/* 5. View Options (Sort & Limit) */}
                <div className="filter-group" style={{ marginLeft: '1rem' }}>
                    <button className={`filter-btn ${activeDropdown === 'VIEW' ? 'active' : ''}`} onClick={() => toggleFilter('VIEW')}>
                        <Filter size={16} /> View <ChevronDown size={14} />
                    </button>
                    {activeDropdown === 'VIEW' && (
                        <div className="dropdown-menu" style={{ right: 0, left: 'auto', width: '220px', padding: '1rem' }}>
                            {/* Sorting */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>SORT BY</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            checked={filters.sort === 'desc'}
                                            onChange={() => {
                                                setFilters(prev => ({ ...prev, sort: 'desc' }));
                                                setActiveDropdown(null);
                                                setPage(1);
                                            }}
                                        />
                                        Newest First
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            checked={filters.sort === 'asc'}
                                            onChange={() => {
                                                setFilters(prev => ({ ...prev, sort: 'asc' }));
                                                setActiveDropdown(null);
                                                setPage(1);
                                            }}
                                        />
                                        Oldest First
                                    </label>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0 1rem 0' }} />

                            {/* Limit */}
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>ROWS PER PAGE</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[20, 50, 100].map(limit => (
                                        <button
                                            key={limit}
                                            onClick={() => {
                                                setFilters(prev => ({ ...prev, limit: limit }));
                                                setActiveDropdown(null);
                                                setPage(1);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.4rem',
                                                fontSize: '0.8rem',
                                                borderRadius: '6px',
                                                border: filters.limit === limit ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                background: filters.limit === limit ? '#eff6ff' : 'white',
                                                color: filters.limit === limit ? '#2563eb' : '#475569',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {limit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Chips */}
            {(filters.searchUser || filters.is80G || filters.pending80G || filters.dateRange.start || filters.levelFilter !== 'ALL' || filters.specificMotivatorIds.length > 0) && (
                <div className="filter-chips">
                    {filters.searchUser && (
                        <span className="chip">User: {filters.searchUser.name} <X size={12} className="chip-remove" onClick={() => removeFilter('user')} /></span>
                    )}
                    {filters.transactionType !== 'ALL' && (
                        <span className="chip">Type: {filters.transactionType} <X size={12} className="chip-remove" onClick={() => removeFilter('type')} /></span>
                    )}
                    {filters.commissionFilter !== 'ALL' && (
                        <span className="chip">{filters.commissionFilter === 'L1' ? 'L1 Commission Only' : 'L2 Commission Only'} <X size={12} className="chip-remove" onClick={() => removeFilter('comm')} /></span>
                    )}
                    {(filters.levelFilter !== 'ALL' || filters.specificMotivatorIds.length > 0) && (
                        <span className="chip">
                            {filters.levelFilter === 'ALL'
                                ? `Selected Users (${filters.specificMotivatorIds.length})`
                                : `Level: ${filters.levelFilter === 'L1' ? 'Level 1' : 'Level 2'}${filters.specificMotivatorIds.length > 0 ? ` + ${filters.specificMotivatorIds.length} users` : ''}`
                            }
                            <X size={12} className="chip-remove" onClick={() => removeFilter('level')} />
                        </span>
                    )}
                    {filters.is80G && (
                        <span className="chip">80G Uploaded <X size={12} className="chip-remove" onClick={() => removeFilter('80g')} /></span>
                    )}
                    {filters.pending80G && (
                        <span className="chip">80G Pending <X size={12} className="chip-remove" onClick={() => removeFilter('pending80g')} /></span>
                    )}
                    {filters.dateRange.start && (
                        <span className="chip">Date Filter <X size={12} className="chip-remove" onClick={() => removeFilter('date')} /></span>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="table-container mt-4">
                <table className="transaction-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Donor Name</th>
                            <th>Amount</th>
                            {filters.searchUser && <th>Level</th>}
                            <th>Motivated By</th>
                            <th>L1 Comm (10%)</th>
                            <th>L2 Comm (3%)</th>
                            <th>80G</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && page === 1 ? (
                            <tr><td colSpan={filters.searchUser ? 10 : 9} className="p-8 text-center">Loading transactions...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan={filters.searchUser ? 10 : 9} className="p-8 text-center text-gray-500">No transactions found</td></tr>
                        ) : (
                            transactions.map((txn, idx) => {
                                // Determine Level Label relative to Search User
                                let levelLabel = null;
                                if (filters.searchUser) {
                                    const searchId = filters.searchUser?._id;
                                    const searchMobile = filters.searchUser?.mobile ? filters.searchUser.mobile.slice(-10) : '';

                                    // Case 1: Search User IS the Motivator (Level 1)
                                    if (txn.level1UserId?._id === searchId ||
                                        (!txn.level1UserId && txn.motivatorMobile && txn.motivatorMobile.includes(searchMobile))) {
                                        levelLabel = <span className="badge-level-1">Level 1</span>;
                                    }

                                    // Case 2: Search User IS the Referrer (Level 2) - implies Motivator is their recruit
                                    else if (txn.level2UserId?._id === searchId) {
                                        levelLabel = <span className="badge-level-2">Level 2</span>;
                                    }
                                }

                                return (
                                    <tr key={idx} onClick={() => setSelectedTransaction(txn)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            {txn.paymentMethod === 'wallet' ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                                        Paid By Wallet
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-indigo-600 font-mono tracking-tight" title="Razorpay Payment ID">
                                                        {txn.transactionId || '---'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-mono" title="Razorpay Order ID">
                                                        {txn.orderId || txn._id}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td>{formatDate(txn.createdAt)}</td>
                                        <td><strong>{txn.donorName}</strong></td>
                                        <td><span className="col-amount">{formatCurrency(txn.amount)}</span></td>
                                        {filters.searchUser && <td>{levelLabel || <span className="text-gray-300">-</span>}</td>}
                                        <td>
                                            {txn.level1UserId?.name || (txn.motivatorMobile ? `(Mobile: ${txn.motivatorMobile})` : '-')}
                                        </td>
                                        <td>
                                            {txn.paymentMethod === 'wallet' ? (
                                                <span className="text-xs text-slate-400 italic">Not Applicable</span>
                                            ) : (
                                                (txn.level1UserId || txn.motivatorMobile) ? formatCurrency(txn.amount * 0.10) : <span className="status-badge badge-neutral">No</span>
                                            )}
                                        </td>
                                        <td>
                                            {txn.paymentMethod === 'wallet' ? (
                                                <span className="text-xs text-slate-400 italic">Not Applicable</span>
                                            ) : (
                                                txn.level2UserId ? formatCurrency(txn.amount * 0.03) : <span className="status-badge badge-neutral">No</span>
                                            )}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                {txn.is80G ? (
                                                    <>
                                                        {txn.is80GUploaded ? (
                                                            <div className="flex items-center gap-1">
                                                                <span className="status-badge badge-80g">Uploaded</span>
                                                                <button
                                                                    className="btn-txn-details text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => window.open(`${api.defaults.baseURL.replace('/api', '')}${txn.certificate80GUrl}`, '_blank')}
                                                                    title="View 80G"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <span className="status-badge badge-80g-pending">Pending</span>
                                                                <button
                                                                    className="btn-txn-details text-orange-600 hover:bg-orange-50"
                                                                    onClick={() => {
                                                                        setUploadingTxnId(txn._id);
                                                                        fileInputRef.current.click();
                                                                    }}
                                                                    title="Upload 80G"
                                                                >
                                                                    <Upload size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="status-badge badge-80g-no">No</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${txn.status}`}>
                                                {txn.status === 'success' ? 'Success' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="admin-table-footer">
                <div className="summary-group">
                    <div className="total-summary failed">
                        <span className="label">Failed Total:</span>
                        <span className="value">₹{transactions.filter(txn => txn.status === 'failed').reduce((sum, txn) => sum + (txn.amount || 0), 0).toLocaleString()}</span>
                        <span className="freq">/ month</span>
                    </div>
                    <div className="total-summary active">
                        <span className="label">Active Total:</span>
                        <span className="value">₹{transactions.filter(txn => txn.status === 'success').reduce((sum, txn) => sum + (txn.amount || 0), 0).toLocaleString()}</span>
                        <span className="freq">/ month</span>
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                <span>Page {page} of {totalPages || 1}</span>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => (p < totalPages ? p + 1 : p))}>Next</button>
            </div>

            {/* Breakdown Side Panel */}
            {selectedTransaction && (
                <div className="side-panel-overlay" onClick={() => setSelectedTransaction(null)}>
                    <div className="side-panel" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h3>Transaction Breakdown</h3>
                            <div className="flex gap-2">
                                {selectedTransaction.is80G && (
                                    <button 
                                        className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"
                                        onClick={() => handleRegenerateCertificate(selectedTransaction._id)}
                                        disabled={regenerating}
                                        title="Regenerate 80G Certificate"
                                    >
                                        {regenerating ? '...' : <Download size={20} />}
                                    </button>
                                )}
                                <button className="text-gray-400 hover:text-black" onClick={() => { setSelectedTransaction(null); setIsEditingTax(false); }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="panel-content">
                            <div className="breakdown-card">
                                <div className="breakdown-row"><span>Donation Amount</span> <strong>{formatCurrency(selectedTransaction.amount)}</strong></div>
                                <div className="breakdown-row">
                                    <span>Donor Name</span>
                                    <strong
                                        className="cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={() => handleOpenExplorer(selectedTransaction.userId || selectedTransaction.donorMobile)}
                                        title="View Account"
                                    >
                                        {selectedTransaction.donorName}
                                    </strong>
                                </div>
                                <div className="breakdown-row"><span>Date</span> <strong>{formatDate(selectedTransaction.createdAt)}</strong></div>
                                {selectedTransaction.address && (
                                    <div className="breakdown-row">
                                        <span>Donor Address</span> 
                                        <strong className="text-right text-[11px] leading-tight max-w-[200px]">{selectedTransaction.address}</strong>
                                    </div>
                                )}
                                <div className="breakdown-row">
                                    <span>Mode</span> 
                                    <strong>
                                        {selectedTransaction.paymentMethod === 'wallet' ? 'Wallet Balance' : (selectedTransaction.orderId ? 'One-time' : 'Monthly (AutoPay)')}
                                    </strong>
                                </div>
                                {selectedTransaction.paymentMethod === 'wallet' ? (
                                    <div className="breakdown-row pt-2 border-t border-slate-100 mt-2">
                                        <span className="text-[10px] uppercase font-bold text-teal-600">Payment Source</span> 
                                        <strong className="text-teal-700 font-bold text-[11px] bg-teal-50 px-2 py-0.5 rounded">WALLET BALANCE</strong>
                                    </div>
                                ) : (
                                    <>
                                        <div className="breakdown-row pt-2 border-t border-slate-100 mt-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Razorpay Payment ID</span> 
                                            <strong className="text-indigo-600 font-mono text-[11px]">{selectedTransaction.transactionId || '---'}</strong>
                                        </div>
                                        <div className="breakdown-row">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Razorpay Order ID</span> 
                                            <strong className="text-slate-500 font-mono text-[11px]">{selectedTransaction.orderId || selectedTransaction._id}</strong>
                                        </div>
                                    </>
                                )}
                                <div className="breakdown-row"><span>Mobile</span> <strong>{selectedTransaction.donorMobile}</strong></div>
                                {selectedTransaction.address && (
                                    <div className="breakdown-row" style={{ alignItems: 'flex-start' }}>
                                        <span>Address</span> 
                                        <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                                            <strong>{selectedTransaction.address}</strong>
                                            {(selectedTransaction.city || selectedTransaction.state) && (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                                    {selectedTransaction.city}{selectedTransaction.city && selectedTransaction.state ? ', ' : ''}{selectedTransaction.state}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {selectedTransaction.is80G && (
                                    <>
                                        <div className="breakdown-row pt-2 border-t border-slate-100 mt-2">
                                             <span className="text-green-600 font-bold flex items-center gap-1">
                                                <CheckCircle size={14} /> 80G Benefit
                                            </span> 
                                            {selectedTransaction.is80GUploaded ? (
                                                <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                    <Lock size={10} /> CERTIFICATE ISSUED
                                                </span>
                                            ) : (
                                                <button 
                                                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                                                    onClick={() => {
                                                        setIsEditingTax(!isEditingTax);
                                                        setEditTaxForm({
                                                            panNumber: selectedTransaction.panNumber || '',
                                                            aadhaarNumber: selectedTransaction.aadhaarNumber || ''
                                                        });
                                                    }}
                                                >
                                                    {isEditingTax ? 'Cancel' : <><Edit2 size={12} /> Edit Info</>}
                                                </button>
                                            )}
                                        </div>
                                        
                                        {isEditingTax ? (
                                            <div className="tax-edit-container animate-in">
                                                <div className="tax-edit-header">
                                                    <div className="tax-header-left">
                                                        <div className="tax-icon-wrapper">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="tax-header-info">
                                                            <h5>Tax Information</h5>
                                                            <p>Update KYC Details</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="tax-form-grid">
                                                    <div className="tax-input-field">
                                                        <label className="tax-input-label">PAN Card Number</label>
                                                        <input 
                                                            className="tax-input-control uppercase"
                                                            placeholder="ABCDE1234F"
                                                            value={editTaxForm.panNumber}
                                                            onChange={e => setEditTaxForm({...editTaxForm, panNumber: e.target.value.toUpperCase()})}
                                                            maxLength={10}
                                                        />
                                                    </div>
                                                    <div className="tax-input-field">
                                                        <label className="tax-input-label">Aadhaar Number</label>
                                                        <input 
                                                            className="tax-input-control"
                                                            placeholder="12-digit Aadhaar Number"
                                                            value={editTaxForm.aadhaarNumber}
                                                            onChange={e => setEditTaxForm({...editTaxForm, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                                                            maxLength={12}
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                </div>

                                                <button 
                                                    className="tax-update-btn"
                                                    onClick={() => handleUpdateTaxInfo(selectedTransaction._id)}
                                                >
                                                    <Save size={18} />
                                                    Update Information
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {selectedTransaction.panNumber && <div className="breakdown-row"><span>PAN Number</span> <strong>{selectedTransaction.panNumber}</strong></div>}
                                                {selectedTransaction.aadhaarNumber && <div className="breakdown-row"><span>Aadhaar Number</span> <strong>{selectedTransaction.aadhaarNumber}</strong></div>}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {selectedTransaction.paymentMethod === 'wallet' ? (
                                <div className="breakdown-card bg-teal-50 border-teal-200 mt-4">
                                    <div className="flex items-center gap-2 text-teal-700 font-bold mb-2">
                                        <Wallet size={20} />
                                        <span>Wallet Donation</span>
                                    </div>
                                    <p className="text-sm text-teal-700">This donation was made directly from the user's wallet balance. <strong>Commissions and referral distributions are disabled</strong> for this transaction.</p>
                                </div>
                            ) : (selectedTransaction.level1UserId || selectedTransaction.motivatorMobile) ? (
                                <>
                                    <h4 className="font-bold mb-4 text-slate-800">Commission Distribution</h4>

                                    {/* Level 1 */}
                                    <div className="breakdown-card level-1">
                                        <div className="commission-header">
                                            <span>Level 1 Commission</span>
                                            <span className="text-level-1">10%</span>
                                        </div>
                                        <div
                                            className="commission-user mb-2 cursor-pointer hover:opacity-80"
                                            onClick={() => handleOpenExplorer(selectedTransaction.level1UserId)}
                                            title="View Level 1 Agent"
                                        >
                                            <User size={16} />
                                            <strong className="hover:text-blue-600 hover:underline">
                                                {selectedTransaction.level1UserId
                                                    ? selectedTransaction.level1UserId.name
                                                    : (selectedTransaction.motivatorMobile ? `Agent: ${selectedTransaction.motivatorMobile}` : 'Unknown Agent')
                                                }
                                            </strong>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900 mt-2">
                                            {formatCurrency(selectedTransaction.amount * 0.10)}
                                        </div>
                                    </div>

                                    {/* Level 2 */}
                                    {selectedTransaction.level2UserId && (
                                        <div className="breakdown-card level-2">
                                            <div className="commission-header">
                                                <span>Level 2 Commission</span>
                                                <span className="text-level-2">3%</span>
                                            </div>
                                            <div
                                                className="commission-user mb-2 cursor-pointer hover:opacity-80"
                                                onClick={() => handleOpenExplorer(selectedTransaction.level2UserId)}
                                                title="View Level 2 Agent"
                                            >
                                                <User size={16} />
                                                <strong className="hover:text-blue-600 hover:underline">{selectedTransaction.level2UserId.name || 'L2 Agent'}</strong>
                                            </div>
                                            <div className="text-xl font-bold text-slate-900 mt-2">
                                                {formatCurrency(selectedTransaction.amount * 0.03)}
                                            </div>
                                        </div>
                                    )}

                                    {/* N/A for L2 */}
                                    {!selectedTransaction.level2UserId && (
                                        <div className="text-center text-sm text-gray-400 italic">
                                            No Level 2 Commission (Agent has no referrer)
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="breakdown-card bg-green-50 border-green-200 mt-4">
                                    <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                                        <CheckCircle size={20} />
                                        <span>Direct Donation</span>
                                    </div>
                                    <p className="text-sm text-green-700">This donation was made directly without any agent referral. The full amount goes to the foundation.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
            {/* Hidden File Input for 80G Upload */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="application/pdf"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleUpload80G(uploadingTxnId, e.target.files[0]);
                        e.target.value = null; // Clear for next upload
                    }
                }}
            />
        </div>
    );
};

export default TransactionManagement;
