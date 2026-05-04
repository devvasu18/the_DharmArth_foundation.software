import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Download, Clock, IndianRupee, User, ExternalLink, Image as ImageIcon, Trash2, Building, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import './PayoutManagement.css';

const PayoutManagement = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [page, setPage] = useState(1);
    const [metadata, setMetadata] = useState({ total: 0, totalAmount: 0, pages: 1 });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Modal state
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');

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

        if (!window.confirm(`Are you sure you want to export ${toExport.length} payouts and mark them as 'Exported'?`)) {
            return;
        }

        try {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
            const fileName = `MODY${dateStr}Z1`;
            
            const totalAmount = toExport.reduce((sum, p) => sum + p.amount, 0);

            // Row 4 & 5 (Header Data)
            const mainHeaderRow = [
                "File name (28 Characters - Unique for each file)",
                "Transaction date (YYYYMMDD)",
                "Type of Debit (Always in Capital letter)",
                "Transaction Count",
                "Amount",
                "Transaction Type"
            ];
            
            const mainDataRow = [
                fileName,
                dateStr,
                "MDMC",
                toExport.length,
                totalAmount.toFixed(2),
                "N06"
            ];

            // Row 10 (Column Headers)
            const columnHeaders = [
                "Transaction Reference (16 Characters - Unique for each file)",
                "Remitter Account Number (35 Characters)",
                "Remitter Account Name (50 Characters - As per CBS)",
                "Remitter Address 1 (35 Characters)",
                "Remitter Address 2 (35 Characters)",
                "Remitter Address 3 (35 Characters)",
                "Remitter Address 4 (35 Characters)",
                "Sender Account Type (2 Characters)",
                "Transaction Amount (Without Comma Separator)",
                "Charges",
                "Beneficiary Name (50 Characters)",
                "Beneficiary Account (35 Characters)",
                "Beneficiary Account Type (2 Characters)",
                "Beneficiary address line 1 (35 Characters)",
                "Beneficiary address line 2 (35 Characters)",
                "Beneficiary address line 3 (35 Characters)",
                "Beneficiary IFSC (11 Characters - Always capital letter)",
                "Beneficiary Email Id (50 Characters)",
                "Mobile Number (10 Characters)",
                "Purpose of Remittance (30 Characters)"
            ];

            // Payout Data Rows
            const dataRows = toExport.map((p, index) => [
                `Z-${index + 1}`,
                "10228982563", // Remitter Account Number (Placeholder)
                "S.S.Mody Vidya Vihar", // Remitter Account Name (Placeholder)
                "JHUNJHUNU", // Remitter Address
                "", // Address 2
                "", // Address 3
                "", // Address 4
                "10", // Sender Account Type
                p.amount.toString(),
                "0.00",
                p.payoutDetails?.accountHolderName || p.user?.name || "",
                p.payoutDetails?.accountNumber || "",
                "11", // Beneficiary Account Type (Default to Savings/Current)
                "", // Beneficiary Addr 1
                "", // Beneficiary Addr 2
                "", // Beneficiary Addr 3
                p.payoutDetails?.ifscCode || "",
                p.user?.email || "",
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

            XLSX.writeFile(wb, `${fileName}.xlsx`);

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

    const handleProcess = async (status) => {
        if (!selectedPayout) return;

        const confirmMsg = status === 'completed' 
            ? "Are you sure you want to mark this payout as COMPLETED? This will notify the user."
            : "Are you sure you want to REJECT this payout? The amount will be refunded to the user's wallet.";
        
        if (!window.confirm(confirmMsg)) return;

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

    const getStatusBadge = (p) => {
        if (p.isDisputed) {
            if (p.isHelpResolved) return <span className="payout-badge success" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7' }}><CheckCircle size={12} /> HELP RESOLVED</span>;
            return <span className="payout-badge error" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2' }}><XCircle size={12} /> HELP REQUESTED</span>;
        }
        
        switch (p.status) {
            case 'pending': return <span className="payout-badge pending"><Clock size={12} /> PENDING</span>;
            case 'exported': return <span className="payout-badge exported" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}><Download size={12} /> EXPORTED</span>;
            case 'completed': return <span className="payout-badge success"><CheckCircle size={12} /> COMPLETED</span>;
            case 'rejected': return <span className="payout-badge error"><XCircle size={12} /> REJECTED</span>;
            default: return <span className="payout-badge">{p.status.toUpperCase()}</span>;
        }
    };

    return (
        <div className="payout-mgmt-container">
            <div className="payout-header">
                <div>
                    <h2 className="payout-title">Motivator Payouts</h2>
                    <p className="payout-subtitle">Review and process commission withdrawal requests</p>
                    {activeTab === 'pending' && metadata.totalAmount > 0 && (
                        <div className="total-pending-amount" style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '1rem', 
                            fontWeight: 800, 
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <IndianRupee size={16} /> Total Pending: ₹{metadata.totalAmount.toLocaleString()}
                        </div>
                    )}
                </div>
                {activeTab === 'pending' && (
                    <button className="btn-export" onClick={handleExport}>
                        <Download size={18} /> Export {selectedIds.length > 0 ? `(${selectedIds.length})` : 'Selected'}
                    </button>
                )}
            </div>

            <div className="payout-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => handleTabChange('pending')}
                >
                    <Clock size={16} /> Pending Requests
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'exported' ? 'active' : ''}`}
                    onClick={() => handleTabChange('exported')}
                >
                    <Download size={16} /> Exported
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'processed' ? 'active' : ''}`}
                    onClick={() => handleTabChange('processed')}
                >
                    <CheckCircle size={16} /> Processed History
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'disputed' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('disputed');
                        setPage(1);
                        setStatusFilter('all'); // Filter strictly by isDisputed on backend
                    }}
                >
                    <XCircle size={16} color="var(--error)" /> Needs Attention (Disputes)
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
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="payout-table-wrapper">
                <table className="payout-table">
                    <thead>
                        <tr>
                            {activeTab === 'pending' && (
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
                                {activeTab === 'pending' && (
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

            {/* Pagination Controls */}
            {!loading && metadata.pages > 1 && (
                <div className="pagination-footer">
                    <div className="pagination-info">
                        Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, metadata.total)} of {metadata.total}
                    </div>
                    <div className="pagination-btns">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(p => p - 1)}
                            className="p-btn"
                        >
                            Prev
                        </button>
                        {[...Array(metadata.pages)].map((_, i) => (
                            <button 
                                key={i + 1}
                                className={`p-btn ${page === i + 1 ? 'active' : ''}`}
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            disabled={page === metadata.pages} 
                            onClick={() => setPage(p => p + 1)}
                            className="p-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {isModalOpen && selectedPayout && (
                <div className="payout-modal-overlay">
                    <div className="payout-admin-modal">
                        <div className="modal-header">
                            <h3>Review Payout Request</h3>
                            <button onClick={() => setIsModalOpen(false)} className="modal-close-btn"><X size={20} /></button>
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
                                </div>
                                <div className="bank-info-group">
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
                                    </div>
                                </div>

                            {selectedPayout.status === 'pending' ? (
                                <>
                                    <div className="status-update-info">
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', textAlign: 'center' }}>
                                            Review this payout request and mark it as completed or rejected. 
                                            Bulk bank transfer processing will handle the actual fund movement.
                                        </p>
                                    </div>
                                    
                                    <div className="modal-footer-actions">
                                        <button 
                                            className="btn-reject" 
                                            onClick={() => handleProcess('rejected')}
                                            disabled={processing}
                                        >
                                            Reject & Refund
                                        </button>
                                        <button 
                                            className="btn-approve" 
                                            onClick={() => handleProcess('completed')}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Confirm Payment'}
                                        </button>
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
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayoutManagement;
