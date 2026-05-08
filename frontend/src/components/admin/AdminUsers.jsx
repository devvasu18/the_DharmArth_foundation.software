import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import UserDetailModal from './UserDetailModal';
import toast from 'react-hot-toast';
import AdminTransactions from './AdminTransactions';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';
import './TransactionManagement.css';
import { Eye, Ban, CheckCircle, Network, Search, Calendar, Download, ChevronDown, Filter, FileText, ArrowRight, ArrowLeft, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [dropdownUsers, setDropdownUsers] = useState([]); // Separate state for dropdown search
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 20
    });

    // View User State
    const [viewingUser, setViewingUser] = useState(null);
    const [exploreUser, setExploreUser] = useState(null);
    const [canViewDetails, setCanViewDetails] = useState(false);
    const [canSuspend, setCanSuspend] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        userId: null,
        isSuspended: false
    });

    // Alert Modal State
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    // OTP Modal State
    const [otpModal, setOtpModal] = useState({
        isOpen: false,
        userId: null,
        otp: '',
        loading: false
    });

    useEffect(() => {
        checkPermissions();
        fetchUsers();
    }, []);

    // --- SEARCH & FILTER STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [pendingDateRange, setPendingDateRange] = useState({ start: '', end: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [searchPage, setSearchPage] = useState(1);
    const USERS_PER_PAGE_DROPDOWN = 20;

    // Dropdown Pagination
    const [dropdownPage, setDropdownPage] = useState(1);
    const DROPDOWN_LIMIT = 20;
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'

    // Fetch Main Table Data (Replaces local filtering)
    const fetchUsers = async (params = {}) => {
        setLoading(true);
        try {
            const queryParams = {
                page: params.page || pagination.currentPage,
                limit: params.limit || pagination.limit,
                startDate: params.startDate !== undefined ? params.startDate : dateRange.start,
                endDate: params.endDate !== undefined ? params.endDate : dateRange.end,
                specificUserId: params.specificUserId !== undefined ? params.specificUserId : (selectedUser ? selectedUser._id : undefined),
                sort: params.sort || sortOrder
            };

            const { data } = await api.get('/users', { params: queryParams });

            if (data.users && data.pagination) {
                setUsers(data.users);
                setPagination(data.pagination);
            } else {
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Dropdown Data
    const fetchDropdownUsers = async (query, page = 1) => {
        if (!query) {
            setDropdownUsers([]);
            return;
        }
        try {
            const { data } = await api.get('/users', {
                params: { search: query, page: page, limit: DROPDOWN_LIMIT }
            });
            if (data.users) {
                setDropdownUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to search users", error);
        }
    };

    // Alias for JSX compatibility
    const filteredUsers = users;
    const displayedDropdownUsers = dropdownUsers;
    const dropdownTotalPages = 1; // Simplified for now

    // Search History State
    const [searchHistory, setSearchHistory] = useState(() => {
        const history = localStorage.getItem('adminUserSearchHistory');
        return history ? JSON.parse(history) : [];
    });

    const addToSearchHistory = (user) => {
        let newHistory = [user, ...searchHistory.filter(u => u._id !== user._id)];
        if (newHistory.length > 10) {
            newHistory = newHistory.slice(0, 10);
        }
        setSearchHistory(newHistory);
        localStorage.setItem('adminUserSearchHistory', JSON.stringify(newHistory));
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminUserSearchHistory');
    };

    // --- HANDLERS ---
    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setSelectedUser(null);

        if (val) {
            setActiveDropdown('USER');
            fetchDropdownUsers(val, 1);
        } else {
            setActiveDropdown(null);
            setDropdownUsers([]);
            // User cleared search manually, reset table
            fetchUsers({ specificUserId: null, page: 1 });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsers({ page: newPage });
        }
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        setSearchQuery(user.name);
        addToSearchHistory(user); // Add to history
        setActiveDropdown(null);
        fetchUsers({ specificUserId: user._id, page: 1 });
    };

    const clearUserFilter = () => {
        setSelectedUser(null);
        setSearchQuery('');
        setDropdownUsers([]);
        fetchUsers({ specificUserId: null, page: 1 });
    };

    const toggleDateDropdown = () => {
        if (activeDropdown === 'DATE') {
            setActiveDropdown(null);
        } else {
            setPendingDateRange(dateRange);
            setActiveDropdown('DATE');
        }
    };

    const handleDatePreset = (preset) => {
        const today = new Date();
        let start = '', end = '';

        if (preset === 'TODAY') {
            start = today.toISOString().split('T')[0];
            end = today.toISOString().split('T')[0];
        } else if (preset === 'WEEK') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);
            start = weekStart.toISOString().split('T')[0];
            end = today.toISOString().split('T')[0];
        } else if (preset === 'MONTH') { // This Month (1st to Today)
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            start = monthStart.toISOString().split('T')[0];
            end = today.toISOString().split('T')[0];
        }

        setPendingDateRange({ start, end });
    };

    const applyDateFilter = () => {
        setDateRange(pendingDateRange);
        setActiveDropdown(null);
        fetchUsers({ startDate: pendingDateRange.start, endDate: pendingDateRange.end, page: 1 });
    };

    const handleExport = (type) => {
        const data = filteredUsers.map(u => ({
            "Name": u.name,
            "Mobile": u.mobile,
            "Wallet Balance": u.walletBalance || 0,
            "Referred By": u.referredBy
                ? `${u.referredBy.name} (${u.referredBy.mobile})`
                : u.lastMotivatorMobile
                    ? `${u.lastMotivatorName || ''} (${u.lastMotivatorMobile})`.trim()
                    : 'Direct',
            "Email": u.email || '-',
            "Joined Date": new Date(u.createdAt).toLocaleDateString(),
            "Status": u.isSuspended ? 'Suspended' : 'Active'
        }));

        const fileName = `Users_Report_${new Date().toISOString().split('T')[0]}`;

        if (type === 'JSON') {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.json`;
            link.click();
        } else if (type === 'CSV') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
            const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.csv`;
            link.click();
        } else if (type === 'XLSX') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else if (type === 'PDF') {
            const doc = new jsPDF();
            doc.text("User Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

            const tableColumn = ["Name", "Mobile", "Wallet", "Referred By", "Status"];
            const tableRows = [];

            data.forEach(item => {
                const row = [
                    item["Name"],
                    item["Mobile"],
                    item["Wallet Balance"],
                    item["Referred By"],
                    item["Status"]
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
    };

    const checkPermissions = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            if (user.isSuperAdmin) {
                setCanViewDetails(true);
                setCanSuspend(true);
            } else {
                // Check permissions
                const hasView = user.roles?.some(role =>
                    role.permissions?.some(p =>
                        p.module === 'User Management' && p.actions.includes('view')
                    )
                );
                const hasEdit = user.roles?.some(role =>
                    role.permissions?.some(p =>
                        p.module === 'User Management' && p.actions.includes('edit')
                    )
                );
                setCanViewDetails(!!hasView);
                setCanSuspend(!!hasEdit);
            }
        }
    };



    const handleViewUser = async (userId) => {
        try {
            const { data } = await api.get(`/users/${userId}`);
            setViewingUser(data);
        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: "Failed to load user details: " + (error.response?.data?.message || error.message),
                type: 'error'
            });
        }
    };

    const confirmSuspend = (userId, currentStatus) => {
        setConfirmModal({
            isOpen: true,
            userId: userId,
            isSuspended: currentStatus
        });
    };

    // New: Request OTP from Admin
    const handleRequestOtp = async () => {
        const { userId } = confirmModal;
        setConfirmModal({ ...confirmModal, isOpen: false }); // Close confirm modal
        
        try {
            const { data } = await api.post('/users/admin/send-suspension-otp');
            setOtpModal({
                isOpen: true,
                userId: userId,
                otp: '',
                loading: false
            });
            toast.success(data.message);
        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: "Failed to send OTP: " + (error.response?.data?.message || error.message),
                type: 'error'
            });
        }
    };

    const handleSuspendAction = async () => {
        const { userId, otp } = otpModal;
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setOtpModal({ ...otpModal, loading: true });
        try {
            const { data } = await api.put(`/users/${userId}/suspend`, { otp });
            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, isSuspended: data.isSuspended } : u));
            setAlertModal({
                isOpen: true,
                title: 'Success',
                message: data.message,
                type: 'success'
            });
            setOtpModal({ ...otpModal, isOpen: false, loading: false });
        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: "Action failed: " + (error.response?.data?.message || error.message),
                type: 'error'
            });
            setOtpModal({ ...otpModal, loading: false });
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="admin-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                User Management
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>
                    Total Users: {pagination.totalUsers}
                </span>
            </h3>

            {/* --- FILTER BAR --- */}
            <div className="filter-bar mb-6" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>

                {/* 1. Search User */}
                <div className="filter-group" style={{ position: 'relative' }}>
                    <div className={`filter-btn ${activeDropdown === 'USER' || searchQuery ? 'active' : ''}`} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'text' }}>
                        <Search size={16} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search name, mobile or code..."
                            value={searchQuery}
                            onChange={handleSearchInput}
                            onFocus={() => setActiveDropdown('USER')}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', width: '150px' }}
                        />
                        {/* Clear Button */}
                        {searchQuery && (
                            <X size={14} className="text-gray-400 cursor-pointer hover:text-red-500" onClick={clearUserFilter} />
                        )}
                    </div>

                    {/* Search Dropdown */}
                    {activeDropdown === 'USER' && searchQuery && (
                        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '320px', zIndex: 50 }}>
                            <div className="dropdown-content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                                {displayedDropdownUsers.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-400">No users found</div>
                                ) : (
                                    displayedDropdownUsers.map(user => (
                                        <div key={user._id} className="dropdown-item" onClick={() => selectUser(user)} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s' }}>
                                            <div className="item-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="item-info">
                                                <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>{user.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{user.mobile}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination inside Dropdown */}
                            {dropdownTotalPages > 1 && (
                                <div className="dropdown-footer" style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                                        disabled={searchPage === 1}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: searchPage === 1 ? 0.5 : 1 }}
                                    >
                                        <ArrowLeft size={14} />
                                    </button>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{searchPage} / {dropdownTotalPages}</span>
                                    <button
                                        onClick={() => setSearchPage(p => Math.min(dropdownTotalPages, p + 1))}
                                        disabled={searchPage === dropdownTotalPages}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: searchPage === dropdownTotalPages ? 0.5 : 1 }}
                                    >
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search History Dropdown (When input is empty but focused) */}
                    {activeDropdown === 'USER' && !searchQuery && searchHistory.length > 0 && (
                        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '320px', zIndex: 50 }}>
                            <div className="dropdown-header" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                                <span>RECENT SEARCHES</span>
                                <span onClick={clearSearchHistory} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '0.7rem' }}>Clear</span>
                            </div>
                            <div className="dropdown-content" style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                                {searchHistory.map(user => (
                                    <div key={user._id} className="dropdown-item" onClick={() => selectUser(user)} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s' }}>
                                        <div className="item-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.8rem' }}>
                                            <Search size={14} />
                                        </div>
                                        <div className="item-info">
                                            <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>{user.name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{user.mobile}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Date Filter */}
                <div className="filter-group" style={{ position: 'relative' }}>
                    <button className={`filter-btn ${dateRange.start ? 'active' : ''}`} onClick={toggleDateDropdown} style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: dateRange.start ? '#eff6ff' : '#f1f5f9', border: dateRange.start ? '1px solid #bfdbfe' : '1px solid transparent', borderRadius: '8px', fontSize: '0.875rem', color: dateRange.start ? '#2563eb' : '#475569', cursor: 'pointer' }}>
                        <Calendar size={16} /> {dateRange.start ? 'Date Active' : 'Date Range'} <ChevronDown size={14} />
                    </button>

                    {activeDropdown === 'DATE' && (
                        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '320px', zIndex: 50, padding: '1rem' }}>
                            <div className="presets" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <button onClick={() => handleDatePreset('TODAY')} className="preset-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>Today</button>
                                <button onClick={() => handleDatePreset('WEEK')} className="preset-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>This Week</button>
                                <button onClick={() => handleDatePreset('MONTH')} className="preset-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>This Month</button>
                            </div>
                            <div className="date-inputs" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>START DATE</label>
                                    <input type="date" max={new Date().toISOString().split('T')[0]} value={pendingDateRange.start} onChange={e => setPendingDateRange({ ...pendingDateRange, start: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>END DATE</label>
                                    <input type="date" value={pendingDateRange.end} onChange={e => setPendingDateRange({ ...pendingDateRange, end: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>
                            <div className="dropdown-footer" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                                <button onClick={applyDateFilter} style={{ background: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}>Apply</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Export - Moved to Right */}
                <div className="filter-group" style={{ marginLeft: 'auto', position: 'relative' }}>
                    <button className={`filter-btn ${activeDropdown === 'EXPORT' ? 'active' : ''}`} onClick={() => setActiveDropdown(activeDropdown === 'EXPORT' ? null : 'EXPORT')} style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid transparent', borderRadius: '8px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <Download size={16} /> Export <ChevronDown size={14} />
                    </button>
                    {activeDropdown === 'EXPORT' && (
                        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '180px', zIndex: 50 }}>
                            <div className="dropdown-item" onClick={() => handleExport('XLSX')} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <FileText size={16} className="text-green-600" style={{ color: '#16a34a' }} /> Excel (.xlsx)
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('CSV')} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <FileText size={16} className="text-blue-600" style={{ color: '#2563eb' }} /> CSV (.csv)
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('PDF')} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <FileText size={16} className="text-red-600" style={{ color: '#dc2626' }} /> PDF (.pdf)
                            </div>
                            <div className="dropdown-item" onClick={() => handleExport('JSON')} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <FileText size={16} className="text-yellow-600" style={{ color: '#ca8a04' }} /> JSON (.json)
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. View Options (Sort & Limit) */}
                <div className="filter-group" style={{ marginLeft: '1rem', position: 'relative' }}>
                    <button className={`filter-btn ${activeDropdown === 'VIEW' ? 'active' : ''}`} onClick={() => setActiveDropdown(activeDropdown === 'VIEW' ? null : 'VIEW')} style={{ padding: '0.625rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', border: '1px solid transparent', borderRadius: '8px', fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>
                        <Filter size={16} /> View <ChevronDown size={14} />
                    </button>
                    {activeDropdown === 'VIEW' && (
                        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', width: '220px', zIndex: 50, padding: '1rem' }}>

                            {/* Sorting */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>SORT BY</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="sortOrder"
                                            checked={sortOrder === 'desc'}
                                            onChange={() => {
                                                setSortOrder('desc');
                                                fetchUsers({ sort: 'desc', page: 1 });
                                            }}
                                        />
                                        Newest First
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="sortOrder"
                                            checked={sortOrder === 'asc'}
                                            onChange={() => {
                                                setSortOrder('asc');
                                                fetchUsers({ sort: 'asc', page: 1 });
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
                                                fetchUsers({ limit: limit, page: 1 });
                                                setActiveDropdown(null);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.4rem',
                                                fontSize: '0.8rem',
                                                borderRadius: '6px',
                                                border: pagination.limit === limit ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                                background: pagination.limit === limit ? '#eff6ff' : 'white',
                                                color: pagination.limit === limit ? '#2563eb' : '#475569',
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



            {/* --- ACTIVE FILTERS CHIPS --- */}


            {/* --- ACTIVE FILTERS CHIPS --- */}
            {
                (selectedUser || dateRange.start) && (
                    <div className="active-filters mb-4" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {selectedUser && (
                            <div className="filter-chip" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '16px', fontSize: '0.85rem', border: '1px solid #bfdbfe' }}>
                                <span>User: {selectedUser.name}</span>
                                <X size={14} style={{ cursor: 'pointer' }} onClick={clearUserFilter} />
                            </div>
                        )}
                        {dateRange.start && (
                            <div className="filter-chip" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '16px', fontSize: '0.85rem', border: '1px solid #bfdbfe' }}>
                                <span>Date: {new Date(dateRange.start).toLocaleDateString()} - {dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'Now'}</span>
                                <X size={14} style={{ cursor: 'pointer' }} onClick={() => {
                                    setDateRange({ start: '', end: '' });
                                    setPendingDateRange({ start: '', end: '' });
                                    fetchUsers({ startDate: '', endDate: '', page: 1 });
                                }} />
                            </div>
                        )}
                    </div>
                )
            }

            <div className="user-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Wallet</th>
                            <th>Referred By</th>
                            <th>Email</th>
                            <th>Joined Date</th>
                            {(canViewDetails || canSuspend) && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No users found matching filters</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user._id} style={{ opacity: user.isSuspended ? 0.6 : 1, background: user.isSuspended ? '#fff5f5' : 'inherit' }}>
                                    <td>
                                        {user.name}
                                        {user.isSuspended && <span style={{ marginLeft: '5px', fontSize: '0.7rem', color: 'red', fontWeight: 'bold' }}>(SUSPENDED)</span>}
                                    </td>
                                    <td>{user.mobile}</td>
                                    <td style={{ fontWeight: 'bold', color: '#2d3748' }}>₹{user.walletBalance?.toLocaleString() || 0}</td>
                                    <td>
                                        {user.referredBy ? (
                                            <span>
                                                {user.referredBy.name}{' '}
                                                <small style={{ color: '#64748b' }}>({user.referredBy.mobile})</small>
                                            </span>
                                        ) : user.lastMotivatorMobile ? (
                                            <span>
                                                {user.lastMotivatorName || ''}{' '}
                                                <small style={{ color: '#64748b' }}>({user.lastMotivatorMobile})</small>
                                            </span>
                                        ) : (
                                            <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '500', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>Direct Joined</span>
                                        )}
                                    </td>
                                    <td>
                                        {user.email ? (
                                            user.email
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Not Provided</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(user.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).toLowerCase()}
                                        </span>
                                    </td>
                                    {(canViewDetails || canSuspend) && (
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                {canViewDetails && (
                                                    <button
                                                        className="btn-icon"
                                                        style={{
                                                            background: '#ebf8ff', color: '#3182ce', border: 'none',
                                                            padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        onClick={() => handleViewUser(user._id)}
                                                        title="View Full Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                {canViewDetails && (
                                                    <button
                                                        className="btn-icon"
                                                        style={{
                                                            background: '#f3e8ff', color: '#9333ea', border: 'none',
                                                            padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        onClick={() => navigate('/admin-user-explorer/transactions', { state: { selectedUser: user } })}
                                                        title="Explore Network"
                                                    >
                                                        <Network size={18} />
                                                    </button>
                                                )}
                                                {canSuspend && (
                                                    <button
                                                        className="btn-icon"
                                                        style={{
                                                            background: user.isSuspended ? '#f0fff4' : '#fff5f5',
                                                            color: user.isSuspended ? '#38a169' : '#e53e3e',
                                                            border: 'none',
                                                            padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                        onClick={() => confirmSuspend(user._id, user.isSuspended)}
                                                        title={user.isSuspended ? "Activate User" : "Suspend User"}
                                                    >
                                                        {user.isSuspended ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Pagination */}
            {
                pagination.totalPages > 1 && (
                    <div className="table-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Showing {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalUsers)} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} of {pagination.totalUsers} users
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                disabled={pagination.currentPage === 1}
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: pagination.currentPage === 1 ? '#f8fafc' : 'white', cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <ArrowLeft size={16} color={pagination.currentPage === 1 ? '#cbd5e1' : '#475569'} />
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#334155', minWidth: '80px', justifyContent: 'center' }}>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.currentPage === pagination.totalPages}
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: pagination.currentPage === pagination.totalPages ? '#f8fafc' : 'white', cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer' }}
                            >
                                <ArrowRight size={16} color={pagination.currentPage === pagination.totalPages ? '#cbd5e1' : '#475569'} />
                            </button>
                        </div>
                    </div>
                )
            }



            {
                viewingUser && (
                    <UserDetailModal
                        user={viewingUser}
                        onClose={() => setViewingUser(null)}
                    />
                )
            }

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleRequestOtp}
                title={confirmModal.isSuspended ? "Activate User" : "Suspend User"}
                message={`Are you sure you want to ${confirmModal.isSuspended ? 'activate' : 'suspend'} this user? For security, an OTP will be sent to the Admin mobile number for verification.`}
                confirmText="Send OTP"
                confirmColor={confirmModal.isSuspended ? "blue" : "red"}
            />

            {/* OTP Verification Modal */}
            <ConfirmationModal
                isOpen={otpModal.isOpen}
                onClose={() => setOtpModal({ ...otpModal, isOpen: false })}
                onConfirm={handleSuspendAction}
                title="Verify OTP"
                message={
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem' }}>Enter the 6-digit OTP sent to the Admin's registered mobile number.</p>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpModal.otp}
                            onChange={(e) => setOtpModal({ ...otpModal, otp: e.target.value.replace(/\D/g, '') })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '1.25rem',
                                textAlign: 'center',
                                letterSpacing: '4px',
                                borderRadius: '8px',
                                border: '2px solid #e2e8f0',
                                outline: 'none'
                            }}
                        />
                        {otpModal.loading && <p style={{ marginTop: '0.5rem', color: '#00bfa5' }}>Verifying...</p>}
                    </div>
                }
                confirmText={otpModal.loading ? "Verifying..." : "Verify & Proceed"}
                confirmColor="teal"
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div >
    );
};

export default AdminUsers;
