import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, Download, Clock, IndianRupee, User, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './PayoutManagement.css';

const PayoutManagement = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Modal state
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [txnId, setTxnId] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/payouts');
            setPayouts(data);
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
            await api.put(`/payouts/${selectedPayout._id}`, {
                status: status === 'completed' ? 'completed' : 'rejected',
                adminNotes,
                transactionId: txnId
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

    const filteredPayouts = payouts.filter(p => {
        const matchesSearch = p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.user?.mobile?.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="payout-badge pending"><Clock size={12} /> Pending</span>;
            case 'completed': return <span className="payout-badge success"><CheckCircle size={12} /> Paid</span>;
            case 'rejected': return <span className="payout-badge error"><XCircle size={12} /> Rejected</span>;
            default: return <span className="payout-badge">{status}</span>;
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
                <div className="filter-group">
                    <Filter size={18} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed (Paid)</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
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
                        ) : filteredPayouts.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>No payout requests found.</td></tr>
                        ) : filteredPayouts.map(p => (
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

            {/* Review Modal */}
            {isModalOpen && selectedPayout && (
                <div className="payout-modal-overlay">
                    <div className="payout-admin-modal">
                        <div className="modal-header">
                            <h3>Review Payout Request</h3>
                            <button onClick={() => setIsModalOpen(false)}><Search size={20} style={{transform: 'rotate(45deg)'}}/></button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="payout-summary">
                                <div className="summary-item">
                                    <label>Request ID</label>
                                    <span>#{selectedPayout._id.toString().slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="summary-item">
                                    <label>Requested Amount</label>
                                    <span className="amount-highlight">₹{selectedPayout.amount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="section-divider">Recipient Details</div>
                            <div className="detail-grid">
                                <div className="detail-row">
                                    <User size={16} />
                                    <span>{selectedPayout.user?.name} ({selectedPayout.user?.mobile})</span>
                                </div>
                                <div className="detail-row">
                                    <IndianRupee size={16} />
                                    <span>{selectedPayout.payoutDetails?.bankName}</span>
                                </div>
                                <div className="bank-details-box">
                                    <div><strong>A/c:</strong> {selectedPayout.payoutDetails?.accountNumber}</div>
                                    <div><strong>IFSC:</strong> {selectedPayout.payoutDetails?.ifscCode}</div>
                                    {selectedPayout.payoutDetails?.upiId && <div><strong>UPI:</strong> {selectedPayout.payoutDetails?.upiId}</div>}
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
