import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Download, Clock, IndianRupee, User, ExternalLink, Image as ImageIcon, Trash2, Building, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './PayoutManagement.css';

const PayoutManagement = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [page, setPage] = useState(1);
    const [metadata, setMetadata] = useState({ total: 0, pages: 1 });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    
    // Modal state
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [txnId, setTxnId] = useState('');
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, [activeTab, page, statusFilter]);

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1);
        setStatusFilter(tab === 'pending' ? 'pending' : 'completed');
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
            const { data } = await api.get('/payouts', {
                params: {
                    page,
                    limit: 20,
                    status: statusFilter, // Backend handles 'processed' too if we sent it, but here we send specific
                    search: searchTerm
                }
            });
            setPayouts(data.payouts);
            setMetadata(data.metadata);
        } catch (error) {
            console.error("Error fetching payouts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (status) => {
        if (!selectedPayout) return;
        if (status === 'completed' && !txnId) {
            toast.error("Please enter Transaction ID for completed payouts.");
            return;
        }

        setProcessing(true);
        try {
            const formData = new FormData();
            formData.append('status', status === 'completed' ? 'completed' : 'rejected');
            formData.append('adminNotes', adminNotes);
            formData.append('transactionId', txnId);
            if (proofFile) {
                formData.append('image', proofFile);
            }

            await api.put(`/payouts/${selectedPayout._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(`Payout ${status} successfully`);
            setIsModalOpen(false);
            setProofFile(null);
            setProofPreview('');
            fetchPayouts();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to process payout");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="payout-badge pending"><Clock size={12} /> PENDING</span>;
            case 'completed': return <span className="payout-badge success"><CheckCircle size={12} /> COMPLETED</span>;
            case 'rejected': return <span className="payout-badge error"><XCircle size={12} /> REJECTED</span>;
            default: return <span className="payout-badge">{status.toUpperCase()}</span>;
        }
    };

    return (
        <div className="payout-mgmt-container">
            <div className="payout-header">
                <div>
                    <h2 className="payout-title">Motivator Payouts</h2>
                    <p className="payout-subtitle">Review and process commission withdrawal requests</p>
                </div>
                <button className="btn-export" onClick={() => {/* TODO: Export Logic */}}>
                    <Download size={18} /> Export List
                </button>
            </div>

            <div className="payout-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => handleTabChange('pending')}
                >
                    <Clock size={16} /> Pending Requests
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'processed' ? 'active' : ''}`}
                    onClick={() => handleTabChange('processed')}
                >
                    <CheckCircle size={16} /> Processed History
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
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>Loading payouts...</td></tr>
                        ) : payouts.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No payout requests found.</td></tr>
                        ) : payouts.map(p => (
                            <tr key={p._id}>
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
                                <td>{getStatusBadge(p.status)}</td>
                                <td>
                                    <button 
                                        className="btn-action-eye" 
                                        onClick={() => {
                                            setSelectedPayout(p);
                                            setAdminNotes(p.adminNotes || '');
                                            setTxnId(p.transactionId || '');
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
                                        {selectedPayout.payoutDetails?.upiId && (
                                            <div className="acc-row">
                                                <label>UPI ID</label>
                                                <strong>{selectedPayout.payoutDetails?.upiId}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedPayout.status === 'pending' ? (
                                <div className="processing-form">
                                    <div className="form-group">
                                        <label>Transaction ID / Reference (Proof of Payment)</label>
                                        <input 
                                            type="text" 
                                            placeholder="UTR Number / Payment Ref" 
                                            value={txnId}
                                            onChange={(e) => setTxnId(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Internal Admin Notes</label>
                                        <textarea 
                                            rows="3" 
                                            placeholder="Reason for rejection or payment notes..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Proof of Payment (Screenshot)</label>
                                        <div className="proof-upload-area">
                                            {proofPreview ? (
                                                <div className="proof-preview-wrapper">
                                                    <img src={proofPreview} alt="Proof" />
                                                    <button className="remove-proof" onClick={() => { setProofFile(null); setProofPreview(''); }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="upload-placeholder">
                                                    <ImageIcon size={24} />
                                                    <span>Click to upload screenshot</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        hidden 
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setProofFile(file);
                                                                setProofPreview(URL.createObjectURL(file));
                                                            }
                                                        }} 
                                                    />
                                                </label>
                                            )}
                                        </div>
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
                                </div>
                            ) : (
                                <div className="payout-history-info">
                                    <div className={`final-status ${selectedPayout.status}`}>
                                        Status: {selectedPayout.status.toUpperCase()}
                                    </div>
                                    {selectedPayout.transactionId && (
                                        <div className="info-row">
                                            <strong>Txn ID:</strong> {selectedPayout.transactionId}
                                        </div>
                                    )}
                                    {selectedPayout.adminNotes && (
                                        <div className="info-row">
                                            <strong>Notes:</strong> {selectedPayout.adminNotes}
                                        </div>
                                    )}
                                    {selectedPayout.proofImage && (
                                        <div className="info-row">
                                            <strong>Proof:</strong> 
                                            <a href={selectedPayout.proofImage} target="_blank" rel="noreferrer" className="proof-link">
                                                <ImageIcon size={14} /> View Screenshot <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
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
