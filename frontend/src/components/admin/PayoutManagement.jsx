import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Download, Clock, IndianRupee, User, ExternalLink, Image as ImageIcon, Trash2, Building, X, AlertCircle, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useConfirm } from '../../context/ConfirmContext';
import './PayoutManagement.css';

const PayoutManagement = () => {
    const { showConfirm } = useConfirm();
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [page, setPage] = useState(1);
    const [metadata, setMetadata] = useState({ total: 0, totalAmount: 0, pages: 1, allCounts: { pending: 0, exported: 0, processed: 0, disputed: 0 } });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
    const [bulkStatusToApply, setBulkStatusToApply] = useState('');
    const [bulkAdminNote, setBulkAdminNote] = useState('');
    
    // Modal state
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');

    // Inline edit state
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editedBank, setEditedBank] = useState({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolder: ''
    });

    useEffect(() => {
        fetchPayouts();
    }, [activeTab, page, statusFilter]);

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1);
        setSelectedIds([]);
        if (tab === 'pending') setStatusFilter('pending');
        else if (tab === 'exported') setStatusFilter('exported');
        else if (tab === 'processed') setStatusFilter('processed');
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 1) setPage(1);
            else fetchPayouts();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                search: searchTerm
            };

            if (activeTab === 'disputed') {
                params.isDisputed = 'true';
            } else {
                params.status = statusFilter;
            }

            const { data } = await api.get('/payouts', { params });
            setPayouts(data.payouts);
            setMetadata(data.metadata);
        } catch (error) {
            console.error("Error fetching payouts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const toExport = payouts.filter(p => selectedIds.includes(p._id));

        if (toExport.length === 0) {
            toast.error("Please select at least one payout to export");
            return;
        }

        const confirmed = await showConfirm(
            "Confirm Export", 
            `Are you sure you want to export ${toExport.length} payouts and mark them as 'Exported'?`
        );
        if (!confirmed) return;

        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
            const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
            const fileNameForSheet = `MODY2021${dateStr}`;
            
            const totalAmount = toExport.reduce((sum, p) => sum + p.amount, 0);

            // Row 4 & 5 (Header Data)
            const mainHeaderRow = [
                "File name",
                "Transaction Date",
                "Type of Debit",
                "Transaction Count",
                "Amount",
                "Transaction Type"
            ];
            
            const mainDataRow = [
                fileNameForSheet,
                dateStr,
                "MDMC",
                toExport.length,
                totalAmount.toFixed(2),
                "N06"
            ];

            // Row 10 (Column Headers)
            const columnHeaders = [
                "Transaction Reference",
                "Remitter Account",
                "Remitter Name",
                "Remitter Address",
                "Remitter Address 1",
                "Remitter Address 2",
                "Remitter Address 3",
                "Sender Account Type",
                "Transaction Amount",
                "Charges",
                "Beneficiary Name",
                "Beneficiary Account",
                "Beneficiary IFSC",
                "Beneficiary Bank Name",
                "Beneficiary Address",
                "Beneficiary Address 1",
                "Beneficiary Address 2",
                "Beneficiary Address 3",
                "Mobile Number",
                "Purpose of Remittance (30 Characters)"
            ];

            // Payout Data Rows
            const dataRows = toExport.map((p, index) => [
                `Z-${index + 1}`,
                "10228982563", // Remitter Account
                "S.S.Mody Vidya Vihar", // Remitter Name
                "JHUNJHUNU", // Remitter Address
                "", // Address 1
                "", // Address 2
                "", // Address 3
                "10", // Sender Account Type
                p.amount.toString(),
                "0.00",
                p.payoutDetails?.accountHolderName || p.user?.name || "",
                p.payoutDetails?.accountNumber || "",
                p.payoutDetails?.ifscCode || "",
                p.payoutDetails?.bankName || "",
                "", // Beneficiary Addr
                "", // Beneficiary Addr 1
                "", // Beneficiary Addr 2
                "", // Beneficiary Addr 3
                p.user?.mobile || "",
                "MOTIVATOR PAYOUT"
            ]);

            // Create Workbook
            const wb = XLSX.utils.book_new();
            
            // Build the sheet manually to match the exact row positioning (Row 4, Row 10)
            const wsData = [];
            // Rows 1-3 empty
            wsData.push([], [], []);
            // Row 4
            wsData.push(mainHeaderRow);
            // Row 5
            wsData.push(mainDataRow);
            // Rows 6-9 empty
            wsData.push([], [], [], []);
            // Row 10
            wsData.push(columnHeaders);
            // Row 11 onwards
            dataRows.forEach(row => wsData.push(row));

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Sample file format");

            XLSX.writeFile(wb, `payout-${formattedDate}.xlsx`);

            // After successful file save, update status in backend
            await api.put('/payouts/bulk/status', {
                ids: selectedIds,
                status: 'exported'
            });

            toast.success("Bulk payout file generated and marked as exported");
            setSelectedIds([]);
            fetchPayouts();
        } catch (error) {
            console.error("Export error", error);
            toast.error("Failed to generate export file or update status");
        }
    };
    
    const handleBulkStatusUpdate = async (status) => {
        if (selectedIds.length === 0) return;

        // If status is completed, show custom confirmation
        if (status === 'completed') {
            const confirmed = await showConfirm(
                "Bulk Update Status",
                `Are you sure you want to mark ${selectedIds.length} payouts as SUCCESS?`
            );
            if (!confirmed) return;
        } 
        // For 'failed', the modal itself is the confirmation, so we proceed directly
        
        try {
            await api.put('/payouts/bulk/status', {
                ids: selectedIds,
                status: status,
                adminNotes: status === 'failed' ? bulkAdminNote : ''
            });

            toast.success(`Updated ${selectedIds.length} payouts to ${status}`);
            setSelectedIds([]);
            setIsBulkStatusModalOpen(false);
            setBulkAdminNote('');
            fetchPayouts();
        } catch (error) {
            console.error("Bulk update error", error);
            toast.error("Failed to update payouts status");
        }
    };

    const handleProcess = async (status) => {
        if (!selectedPayout) return;

        const confirmTitle = status === 'completed' ? "Complete Payout" : "Reject Payout";
        const confirmMsg = status === 'completed' 
            ? "Are you sure you want to mark this payout as COMPLETED? This will notify the user."
            : "Are you sure you want to REJECT this payout? The amount will be refunded to the user's wallet.";
        
        const confirmed = await showConfirm(confirmTitle, confirmMsg);
        if (!confirmed) return;

        setProcessing(true);
        try {
            const formData = new FormData();
            formData.append('status', status === 'completed' ? 'completed' : 'rejected');

            await api.put(`/payouts/${selectedPayout._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(`Payout ${status} successfully`);
            setIsModalOpen(false);
            fetchPayouts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to process payout");
        } finally {
            setProcessing(false);
        }
    };

    const handleResolveHelp = async () => {
        if (!resolutionNotes.trim()) {
            toast.error("Please enter resolution comments.");
            return;
        }

        setProcessing(true);
        try {
            await api.put(`/payouts/resolve-dispute/${selectedPayout._id}`, { notes: resolutionNotes });
            toast.success("Help request resolved successfully.");
            setIsModalOpen(false);
            fetchPayouts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resolve help request");
        } finally {
            setProcessing(false);
        }
    };

    const handleResetToPending = async () => {
        if (!selectedPayout) return;
        
        const confirmed = await showConfirm(
            "Reset to Pending",
            "This will move the request back to Pending and refresh the bank details from the motivator's latest profile. Continue?"
        );
        if (!confirmed) return;

        setProcessing(true);
        try {
            await api.put(`/payouts/${selectedPayout._id}/reset`);
            toast.success("Payout reset to pending. You can now re-export it.");
            setIsModalOpen(false);
            fetchPayouts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset payout");
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveManualDetails = async () => {
        if (!editedBank.bankName || !editedBank.accountNumber || !editedBank.ifscCode) {
            toast.error("Please fill all bank details");
            return;
        }

        // IFSC Validation (Standard Indian Format: 4 letters, '0', 6 alphanumeric)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(editedBank.ifscCode)) {
            toast.error("Invalid IFSC Format! Should be 11 chars (e.g. HDFC0001234)");
            return;
        }

        // Account Number Validation (9-18 digits)
        if (editedBank.accountNumber.length < 9 || editedBank.accountNumber.length > 18 || !/^\d+$/.test(editedBank.accountNumber)) {
            toast.error("Account Number must be between 9 and 18 digits");
            return;
        }

        setProcessing(true);
        try {
            await api.put(`/payouts/${selectedPayout._id}/details`, editedBank);
            toast.success("Details updated and payout moved to Pending");
            setIsEditingDetails(false);
            setIsModalOpen(false);
            fetchPayouts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update details");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (p) => {
        if (p.isDisputed) {
            if (p.isHelpResolved) return <span className="payout-badge success" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7' }}><CheckCircle size={12} /> HELP RESOLVED</span>;
            return <span className="payout-badge error" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2' }}><XCircle size={12} /> HELP REQUESTED</span>;
        }
        
        switch (p.status) {
            case 'pending': return <span className="payout-badge pending"><Clock size={12} /> PENDING</span>;
            case 'exported': return <span className="payout-badge exported" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}><Download size={12} /> EXPORTED</span>;
            case 'completed': return <span className="payout-badge success"><CheckCircle size={12} /> COMPLETED</span>;
            case 'failed': 
                if (p.userReply) return <span className="payout-badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}><Send size={12} /> REPLY RECEIVED</span>;
                return <span className="payout-badge error" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}><AlertCircle size={12} /> FAILED</span>;
            default: return <span className="payout-badge">{p.status.toUpperCase()}</span>;
        }
    };

    return (
        <div className="payout-mgmt-container">
            <div className="payout-header">
                <div>
                    <h2 className="payout-title">Motivator Payouts</h2>
                    <p className="payout-subtitle">Review and process commission withdrawal requests</p>
                </div>
                {activeTab === 'pending' && (
                    <button className="btn-export" onClick={handleExport}>
                        <Download size={18} /> Export {selectedIds.length > 0 ? `(${selectedIds.length})` : 'Selected'}
                    </button>
                )}
                {activeTab === 'exported' && selectedIds.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            className="btn-bulk-success" 
                            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleBulkStatusUpdate('completed')}
                        >
                            <CheckCircle size={18} /> Mark Success ({selectedIds.length})
                        </button>
                        <button 
                            className="btn-bulk-fail" 
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => {
                                setBulkStatusToApply('failed');
                                setIsBulkStatusModalOpen(true);
                            }}
                        >
                            <XCircle size={18} /> Mark Failed ({selectedIds.length})
                        </button>
                    </div>
                )}
            </div>

            <div className="payout-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => handleTabChange('pending')}
                >
                    <Clock size={16} /> Pending Requests
                    {metadata.allCounts?.pending > 0 && (
                        <span className="tab-badge">{metadata.allCounts.pending}</span>
                    )}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'exported' ? 'active' : ''}`}
                    onClick={() => handleTabChange('exported')}
                >
                    <Download size={16} /> Exported
                    {metadata.allCounts?.exported > 0 && (
                        <span className="tab-badge grey">{metadata.allCounts.exported}</span>
                    )}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'processed' ? 'active' : ''}`}
                    onClick={() => handleTabChange('processed')}
                >
                    <CheckCircle size={16} /> Processed History
                    {metadata.allCounts?.processed > 0 && (
                        <span className="tab-badge grey">{metadata.allCounts.processed}</span>
                    )}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'disputed' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('disputed');
                        setPage(1);
                        setStatusFilter('all');
                    }}
                >
                    <AlertCircle size={16} /> Needs Attention (Disputes)
                    {metadata.allCounts?.disputed > 0 && (
                        <span className="tab-badge alert-red">{metadata.allCounts.disputed}</span>
                    )}
                </button>
            </div>

            <div className="payout-filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Name or Mobile..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'processed' && (
                    <div className="filter-group">
                        <Filter size={18} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="processed">All Processed</option>
                            <option value="completed">Completed (Paid)</option>
                            <option value="failed">Failed (Action Required)</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="payout-table-wrapper">
                <table className="payout-table">
                    <thead>
                        <tr>
                            {(activeTab === 'pending' || activeTab === 'exported') && (
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={payouts.length > 0 && selectedIds.length === payouts.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(payouts.map(p => p._id));
                                            else setSelectedIds([]);
                                        }}
                                    />
                                </th>
                            )}
                            <th>Date</th>
                            <th>Motivator</th>
                            <th>Amount</th>
                            <th>Bank Details</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={activeTab === 'pending' ? "7" : "6"} style={{textAlign: 'center', padding: '40px'}}>Loading payouts...</td></tr>
                        ) : payouts.length === 0 ? (
                            <tr><td colSpan={activeTab === 'pending' ? "7" : "6"} style={{textAlign: 'center', padding: '40px'}}>No payout requests found.</td></tr>
                        ) : payouts.map(p => (
                            <tr key={p._id}>
                                {(activeTab === 'pending' || activeTab === 'exported') && (
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(p._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds(prev => [...prev, p._id]);
                                                else setSelectedIds(prev => prev.filter(id => id !== p._id));
                                            }}
                                        />
                                    </td>
                                )}
                                <td>{new Date(p.createdAt).toLocaleDateString()}<br/><small>{new Date(p.createdAt).toLocaleTimeString()}</small></td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">{p.user?.name?.charAt(0)}</div>
                                        <div>
                                            <strong>{p.user?.name}</strong><br/>
                                            <small>{p.user?.mobile}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="payout-amount">₹{p.amount.toLocaleString()}</span>
                                </td>
                                <td className="bank-cell">
                                    {p.payoutDetails?.bankName}<br/>
                                    <small>{p.payoutDetails?.accountNumber}</small>
                                </td>
                                <td>{getStatusBadge(p)}</td>
                                <td>
                                    <button 
                                        className="btn-action-eye" 
                                        onClick={() => {
                                            setSelectedPayout(p);
                                            setResolutionNotes(p.helpResolutionNotes || '');
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <Eye size={18} /> Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {activeTab !== 'disputed' && (
                <div className="admin-table-footer">
                    <div className="summary-group">
                        {(activeTab === 'pending' || activeTab === 'exported') && (
                            <div className="total-summary pending">
                                <span className="label">Pending Total:</span>
                                <span className="value">₹{payouts.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</span>
                            </div>
                        )}
                        {activeTab === 'processed' && (
                            <>
                                <div className="total-summary failed">
                                    <span className="label">Failed Total:</span>
                                    <span className="value">₹{payouts.filter(p => p.status === 'failed').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</span>
                                </div>
                                <div className="total-summary active">
                                    <span className="label">Active Total:</span>
                                    <span className="value">₹{payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Pagination Controls - Always Visible */}
            {!loading && metadata.total > 0 && (
                <div className="pagination-footer">
                    <div className="pagination-info">
                        {metadata.total <= 20
                            ? `Showing all ${metadata.total} result${metadata.total !== 1 ? 's' : ''}`
                            : `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, metadata.total)} of ${metadata.total}`
                        }
                    </div>

                    {metadata.pages > 1 && (
                        <div className="pagination-btns">
                            {/* Prev */}
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-btn"
                            >
                                ‹ Prev
                            </button>

                            {/* Smart windowed page numbers */}
                            {(() => {
                                const totalPages = metadata.pages;
                                const delta = 2;
                                const pages = [];
                                let prev = null;

                                for (let i = 1; i <= totalPages; i++) {
                                    if (
                                        i === 1 ||
                                        i === totalPages ||
                                        (i >= page - delta && i <= page + delta)
                                    ) {
                                        if (prev !== null && i - prev > 1) {
                                            pages.push(<span key={`ellipsis-${i}`} className="p-ellipsis">…</span>);
                                        }
                                        pages.push(
                                            <button
                                                key={i}
                                                className={`p-btn ${page === i ? 'active' : ''}`}
                                                onClick={() => setPage(i)}
                                            >
                                                {i}
                                            </button>
                                        );
                                        prev = i;
                                    }
                                }
                                return pages;
                            })()}

                            {/* Next */}
                            <button
                                disabled={page === metadata.pages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-btn"
                            >
                                Next ›
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Review Modal */}
            {isModalOpen && selectedPayout && (
                <div className="payout-modal-overlay">
                    <div className="payout-admin-modal">
                        <div className="modal-header">
                            <h3>Review Payout Request</h3>
                            <button onClick={() => {
                                setIsModalOpen(false);
                                setIsEditingDetails(false);
                            }} className="modal-close-btn"><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="payout-summary-grid">
                                <div className="summary-card">
                                    <label>Request ID</label>
                                    <span className="id-txt">#{selectedPayout._id.toString().slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="summary-card amount">
                                    <label>Requested Amount</label>
                                    <span className="amount-val">₹{selectedPayout.amount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="recipient-profile-card">
                                <div className="profile-main">
                                    <div className="profile-icon">
                                        <User size={20} />
                                    </div>
                                    <div className="profile-info">
                                        <h4>{selectedPayout.user?.name}</h4>
                                        <p>{selectedPayout.user?.mobile}</p>
                                    </div>
                                    {(selectedPayout.status === 'failed' || selectedPayout.status === 'pending' || selectedPayout.status === 'exported') && (
                                        <button 
                                            style={{ marginLeft: 'auto', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', color: '#64748b' }}
                                            onClick={() => {
                                                setIsEditingDetails(!isEditingDetails);
                                                setEditedBank({
                                                    bankName: selectedPayout.payoutDetails?.bankName || '',
                                                    accountNumber: selectedPayout.payoutDetails?.accountNumber || '',
                                                    ifscCode: selectedPayout.payoutDetails?.ifscCode || '',
                                                    accountHolder: selectedPayout.payoutDetails?.accountHolder || selectedPayout.user?.name || ''
                                                });
                                            }}
                                        >
                                            {isEditingDetails ? 'Cancel Edit' : 'Edit Bank Info'}
                                        </button>
                                    )}
                                </div>
                                <div className="bank-info-group">
                                    {isEditingDetails ? (
                                        <div style={{ padding: '10px', display: 'grid', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Bank Name</label>
                                                <input 
                                                    type="text" 
                                                    value={editedBank.bankName} 
                                                    onChange={e => setEditedBank({...editedBank, bankName: e.target.value})}
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Account Number</label>
                                                <input 
                                                    type="text" 
                                                    value={editedBank.accountNumber} 
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 18) setEditedBank({...editedBank, accountNumber: val});
                                                    }}
                                                    placeholder="9-18 digits"
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>IFSC Code</label>
                                                <input 
                                                    type="text" 
                                                    value={editedBank.ifscCode} 
                                                    onChange={e => {
                                                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                        if (val.length <= 11) setEditedBank({...editedBank, ifscCode: val});
                                                    }}
                                                    placeholder="11 chars (e.g. HDFC0001234)"
                                                    style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <button 
                                                onClick={handleSaveManualDetails}
                                                style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, cursor: 'pointer' }}
                                                disabled={processing}
                                            >
                                                {processing ? 'Saving...' : 'Save & Move to Pending'}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bank-name">
                                                <Building size={16} />
                                                <span>{selectedPayout.payoutDetails?.bankName}</span>
                                            </div>
                                            <div className="account-details">
                                                <div className="acc-row">
                                                    <label>Account Number</label>
                                                    <strong>{selectedPayout.payoutDetails?.accountNumber}</strong>
                                                </div>
                                                <div className="acc-row">
                                                    <label>IFSC Code</label>
                                                    <strong>{selectedPayout.payoutDetails?.ifscCode}</strong>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {selectedPayout.status === 'pending' ? (
                                <>
                                    <div className="status-update-info">
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', textAlign: 'center' }}>
                                            Review the details above. To process this payout, please use the 
                                            <strong> Bulk Export & Mark Success</strong> tools on the main dashboard.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                 <div className="payout-history-info">
                                    {selectedPayout.isDisputed && (
                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '12px' }}>
                                            <h4 style={{ color: '#c53030', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <AlertCircle size={18} /> USER REPORTED ISSUE
                                            </h4>
                                            <p style={{ color: '#742a2a', fontStyle: 'italic', fontSize: '0.95rem' }}>
                                                "{selectedPayout.disputeMessage}"
                                            </p>
                                            <small style={{ color: '#9b2c2c', display: 'block', marginTop: '0.5rem' }}>
                                                Reported on: {new Date(selectedPayout.disputedAt).toLocaleString()}
                                            </small>

                                            {selectedPayout.isHelpResolved ? (
                                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #feb2b2' }}>
                                                    <h4 style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <CheckCircle size={18} /> RESOLVED
                                                    </h4>
                                                    <p style={{ color: '#065f46', fontSize: '0.95rem' }}>{selectedPayout.helpResolutionNotes}</p>
                                                    <small style={{ color: '#047857', display: 'block', marginTop: '0.5rem' }}>
                                                        Resolved on: {new Date(selectedPayout.helpResolvedAt).toLocaleString()}
                                                    </small>
                                                </div>
                                            ) : (
                                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #feb2b2' }}>
                                                    <div className="form-group">
                                                        <label>Resolution Comments (Visible to Motivator)</label>
                                                        <textarea 
                                                            rows="3" 
                                                            placeholder="Describe how the issue was resolved..."
                                                            value={resolutionNotes}
                                                            onChange={(e) => setResolutionNotes(e.target.value)}
                                                        ></textarea>
                                                    </div>
                                                    <button 
                                                        className="btn-approve" 
                                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                                        onClick={handleResolveHelp}
                                                        disabled={processing}
                                                    >
                                                        {processing ? 'Processing...' : 'Mark as Resolved'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className={`final-status ${selectedPayout.status}`}>
                                        Status: {selectedPayout.status.toUpperCase()}
                                    </div>
                                    
                                    {selectedPayout.status === 'failed' && selectedPayout.adminNotes && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                            <h4 style={{ color: '#c2410c', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Failure Note:</h4>
                                            <p style={{ color: '#9a3412', fontSize: '0.95rem' }}>"{selectedPayout.adminNotes}"</p>
                                        </div>
                                    )}

                                    {selectedPayout.userReply && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                                            <h4 style={{ color: '#0369a1', marginBottom: '0.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Send size={14} /> Motivator Reply:
                                            </h4>
                                            <p style={{ color: '#075985', fontSize: '0.95rem', fontWeight: 500 }}>"{selectedPayout.userReply}"</p>
                                            <small style={{ color: '#0ea5e9', display: 'block', marginTop: '0.5rem' }}>
                                                Received: {new Date(selectedPayout.userReplyAt).toLocaleString()}
                                            </small>
                                        </div>
                                    )}

                                    {selectedPayout.status === 'failed' && (
                                        <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '1rem' }}>
                                            <button 
                                                className="btn-approve" 
                                                style={{ width: '100%', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
                                                onClick={handleResetToPending}
                                                disabled={processing}
                                            >
                                                {processing ? 'Processing...' : 'Move to Pending for Re-export'}
                                            </button>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>
                                                This will pick up the communicator's latest bank details from their profile.
                                            </p>
                                        </div>
                                    )}
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Bulk Status Modal */}
            {isBulkStatusModalOpen && (
                <div className="payout-modal-overlay">
                    <div className="payout-admin-modal" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>Mark Payouts as Failed</h3>
                            <button onClick={() => setIsBulkStatusModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                                You are marking <strong>{selectedIds.length}</strong> payouts as failed. Please provide a reason that will be visible to the motivators.
                            </p>
                            <div className="form-group">
                                <label>Failure Reason / Notes</label>
                                <textarea 
                                    rows="4" 
                                    placeholder="e.g. Invalid account number, bank server down, etc."
                                    value={bulkAdminNote}
                                    onChange={(e) => setBulkAdminNote(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                ></textarea>
                            </div>
                            <div className="modal-footer-actions" style={{ marginTop: '1.5rem' }}>
                                <button className="btn-cancel" onClick={() => setIsBulkStatusModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button 
                                    className="btn-approve" 
                                    onClick={() => handleBulkStatusUpdate('failed')}
                                    disabled={!bulkAdminNote.trim()}
                                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: bulkAdminNote.trim() ? 1 : 0.5 }}
                                >
                                    Confirm Mark Failed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayoutManagement;
