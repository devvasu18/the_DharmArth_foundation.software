import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, XCircle, CheckCircle, Clock, AlertTriangle, Search, Trash2, Download, FileText as FilePdf, FileSpreadsheet, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../context/ConfirmContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SubscriptionList = ({ isAdmin = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [amountFilter, setAmountFilter] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [uniqueAmounts, setUniqueAmounts] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showConfirm } = useConfirm();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit, setLimit] = useState(10);

    // Admin Cancel OTP State
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [selectedSub, setSelectedSub] = useState(null);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const fetchSubscriptions = async (page = currentPage) => {
        try {
            setLoading(true);
            const endpoint = isAdmin ? '/subscriptions/admin/all' : '/subscriptions/my';
            const { data } = await api.get(endpoint, {
                params: {
                    search: searchTerm,
                    status: statusFilter,
                    amount: amountFilter === 'custom' ? (minAmount && maxAmount ? `${minAmount}-${maxAmount}` : '') : amountFilter,
                    page: page,
                    limit: limit
                }
            });

            if (data.subscriptions) {
                setSubscriptions(data.subscriptions);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalRecords(data.pagination.totalRecords || 0);
                }
            } else if (Array.isArray(data)) {
                // Fallback for direct array responses
                setSubscriptions(data);
                setTotalPages(1);
                setTotalRecords(data.length);
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchSubscriptions(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const exportExcel = async (exportAll = false) => {
        try {
            let dataToExport = subscriptions;
            const endpoint = isAdmin ? '/subscriptions/admin/all' : '/subscriptions/my';

            if (exportAll) {
                const res = await api.get(endpoint, {
                    params: {
                        status: statusFilter,
                        amount: amountFilter,
                        search: searchTerm,
                        exportAll: true
                    }
                });
                dataToExport = res.data;
            }

            const worksheetData = dataToExport.map(sub => ({
                'Donor': sub.donorName,
                'Mobile': sub.donorMobile,
                'Amount': sub.amount,
                'ID': sub.subscriptionId,
                'Status': sub.status,
                'Started': new Date(sub.createdAt).toLocaleDateString(),
                'Next Billing': sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(worksheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Subscriptions');
            XLSX.writeFile(wb, `Subscriptions_${new Date().toLocaleDateString()}.xlsx`);
            toast.success('Excel exported successfully');
        } catch (err) {
            toast.error('Export failed');
        }
    };

    const exportPDF = async (exportAll = false) => {
        try {
            let dataToExport = subscriptions;
            const endpoint = isAdmin ? '/subscriptions/admin/all' : '/subscriptions/my';

            if (exportAll) {
                const res = await api.get(endpoint, {
                    params: {
                        status: statusFilter,
                        amount: amountFilter,
                        search: searchTerm,
                        exportAll: true
                    }
                });
                dataToExport = res.data;
            }

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Monthly Subscriptions Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            const tableColumn = ["Donor", "Mobile", "Amount", "Status", "Started"];
            const tableRows = dataToExport.map(sub => [
                sub.donorName,
                sub.donorMobile,
                `INR ${sub.amount}`,
                sub.status.toUpperCase(),
                new Date(sub.createdAt).toLocaleDateString()
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [124, 58, 237] }
            });

            doc.save(`Subscriptions_${new Date().toLocaleDateString()}.pdf`);
            toast.success('PDF exported successfully');
        } catch (err) {
            toast.error('Export failed');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on search/filter
            fetchSubscriptions(1);
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, amountFilter, isAdmin]);

    useEffect(() => {
        if (isAdmin) {
            const fetchAmounts = async () => {
                try {
                    const { data } = await api.get('/subscriptions/admin/amounts');
                    setUniqueAmounts(data || []);
                } catch (err) {
                    console.error("Failed to fetch unique amounts", err);
                }
            };
            fetchAmounts();
        }
    }, [isAdmin]);


    const handleCancel = async (sub, otp = null) => {
        if (!otp) {
            const message = isAdmin 
                ? `Are you sure you want to cancel ${sub.donorName}'s monthly donation of ₹${sub.amount}? An OTP will be sent to the donor for confirmation.`
                : `Are you sure you want to cancel this monthly donation (ID: ${sub.subscriptionId})? An OTP will be sent to your mobile for confirmation.`;
            
            const confirmed = await showConfirm("Cancel Subscription?", message);
            if (!confirmed) return;

            try {
                setSendingOtp(true);
                await api.post(`/subscriptions/request-cancel-otp/${sub._id}`);
                setSelectedSub(sub);
                setOtpModalOpen(true);
                toast.success('OTP sent successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to send OTP');
            } finally {
                setSendingOtp(false);
            }
            return;
        }

        try {
            setVerifyingOtp(true);
            const { data } = await api.post(`/subscriptions/cancel/${sub._id}`, { otp });
            toast.success('Subscription cancelled successfully');

            setSubscriptions(prev => prev.map(s =>
                s._id === sub._id ? { ...s, status: 'cancelled', cancelledBy: isAdmin ? 'admin' : 'user' } : s
            ));

            setOtpModalOpen(false);
            setOtpValue('');
            setSelectedSub(null);
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleRetry = async (sub) => {
        try {
            const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!rzpKey) {
                toast.error("Payment Gateway is not configured");
                return;
            }

            const options = {
                key: rzpKey,
                name: "The DharmArth Foundation",
                description: "Retry Subscription Payment",
                subscription_id: sub.subscriptionId,
                handler: async (response) => {
                    try {
                        setLoading(true);
                        const { data } = await api.post('/payment/verify-subscription', {
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (data.success) {
                            toast.success("Payment Successful! Subscription Active.");
                            setSubscriptions(prev => prev.map(s =>
                                s._id === sub._id ? { ...s, status: 'active' } : s
                            ));
                        } else {
                            toast.error("Verification failed.");
                        }
                    } catch (err) {
                        toast.error("Verification error.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: sub.donorName,
                    email: sub.donorEmail,
                    contact: sub.donorMobile
                },
                theme: {
                    color: "#7c3aed"
                },
                modal: {
                    ondismiss: () => {
                        toast.error("Payment cancelled.");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Retry failed:", error);
            toast.error("Could not initiate retry.");
        }
    };

    const getStatusBadge = (sub) => {
        const status = sub.status;
        const isCancelledByAdmin = sub.cancelledBy === 'admin';

        switch (status) {
            case 'active':
                return <span className="status-badge active"><CheckCircle size={14} /> Active</span>;
            case 'cancelled':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className="status-badge cancelled"><XCircle size={14} /> Cancelled</span>
                        {isCancelledByAdmin && (
                            <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                Cancelled by Admin
                            </span>
                        )}
                    </div>
                );
            case 'failed':
                return <span className="status-badge failed"><AlertTriangle size={14} /> Failed</span>;
            case 'created':
                return <span className="status-badge created"><Clock size={14} /> Pending First Payment</span>;
            case 'paused':
                return <span className="status-badge paused"><AlertTriangle size={14} /> Paused</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const activePageTotal = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.amount || 0), 0);

    const failedPageTotal = subscriptions
        .filter(sub => sub.status === 'failed')
        .reduce((sum, sub) => sum + (sub.amount || 0), 0);

    return (
        <div className={`subscription-list ${isAdmin ? 'admin-table-view' : ''}`}>
            {/* Export Controls - Now always at the very top */}
            <div className="list-controls-row">
                <div className="export-tools-unified">
                    <div className="export-group">
                        <span className="export-label">Export All:</span>
                        <button className="export-btn-text excel-text" onClick={() => exportExcel(true)}>Excel</button>
                        <button className="export-btn-text pdf-text" onClick={() => exportPDF(true)}>PDF</button>
                    </div>
                </div>
            </div>

            {/* Admin Filter Controls - Moved here to be below exports but above table */}
            {isAdmin && (
                <div className="admin-controls-card">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by Name, Mobile, User Code or Sub ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="admin-select"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="created">Pending</option>
                        </select>
                    </div>

                    <div className="filter-group" style={{ gap: '10px' }}>
                        <CreditCard size={18} />
                        <select
                            value={amountFilter}
                            onChange={(e) => {
                                setAmountFilter(e.target.value);
                                if (e.target.value !== 'custom') {
                                    setMinAmount('');
                                    setMaxAmount('');
                                }
                            }}
                            className="admin-select"
                            style={{ minWidth: '130px' }}
                        >
                            <option value="">All Amounts</option>
                            <option value="custom">Custom Range</option>
                            {uniqueAmounts.map(amt => (
                                <option key={amt} value={amt}>₹{amt.toLocaleString()}</option>
                            ))}
                        </select>

                        {amountFilter === 'custom' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="admin-input"
                                    style={{ width: '80px', padding: '6px 10px' }}
                                />
                                <span style={{ color: '#64748b' }}>to</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="admin-input"
                                    style={{ width: '80px', padding: '6px 10px' }}
                                />
                                <button
                                    onClick={() => fetchSubscriptions(1)}
                                    className="admin-btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="empty-state">
                    <CreditCard size={48} className="empty-icon" />
                    <p>{searchTerm || statusFilter || amountFilter ? "No subscriptions match your filters." : "No monthly donations found."}</p>
                    {(searchTerm || statusFilter || amountFilter) && (
                        <button 
                            className="btn-link" 
                            style={{ marginTop: '1rem', color: 'var(--primary)', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 600 }}
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                                setAmountFilter('');
                            }}
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {!isAdmin ? (
                // User Table View
                <>
                    <div className="user-table-container hide-mobile">
                        <table className="user-sub-table">
                            <thead>
                                <tr>
                                    <th>Contribution</th>
                                    <th>Reference ID</th>
                                    <th>Started On</th>
                                    <th>Next Billing</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptions.map((sub) => (
                                    <tr key={sub._id}>
                                        <td>
                                            <div className="user-amount-cell">
                                                <strong>₹{sub.amount.toLocaleString()}</strong>
                                                <span className="freq">/ month</span>
                                            </div>
                                        </td>
                                        <td>
                                            <code className="user-sub-id">{sub.subscriptionId}</code>
                                        </td>
                                        <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {sub.nextBillingDate && sub.status === 'active'
                                                ? new Date(sub.nextBillingDate).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td>{getStatusBadge(sub)}</td>
                                        <td>
                                            <div className="user-actions-cell">
                                                {sub.status === 'active' && (
                                                    <button
                                                        className="btn-cancel-small"
                                                        onClick={() => handleCancel(sub)}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                {sub.status === 'failed' && (
                                                    <>
                                                        <button
                                                            className="btn-retry-small"
                                                            onClick={() => handleRetry(sub)}
                                                        >
                                                            Retry
                                                        </button>
                                                        <button
                                                            className="btn-cancel-small"
                                                            onClick={() => handleCancel(sub)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile User Cards */}
                    <div className="subscription-card-grid show-mobile">
                        {subscriptions.map((sub) => (
                            <div className="sub-mobile-card" key={sub._id}>
                                <div className="card-header">
                                    <div className="amount-info">
                                        <span className="amount">₹{sub.amount.toLocaleString()}</span>
                                        <span className="freq">/ monthly</span>
                                    </div>
                                    <div className="status">{getStatusBadge(sub)}</div>
                                </div>
                                <div className="card-body">
                                    <div className="info-row">
                                        <span className="label">ID:</span>
                                        <code className="value">{sub.subscriptionId}</code>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Started:</span>
                                        <span className="value">{new Date(sub.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {sub.status === 'active' && sub.nextBillingDate && (
                                        <div className="info-row">
                                            <span className="label">Next Billing:</span>
                                            <span className="value highlight">{new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer">
                                    {sub.status === 'active' && (
                                        <button className="mobile-action-btn cancel" onClick={() => handleCancel(sub)}>
                                            <XCircle size={16} /> Cancel Subscription
                                        </button>
                                    )}
                                    {sub.status === 'failed' && (
                                        <div className="button-group">
                                            <button className="mobile-action-btn retry" onClick={() => handleRetry(sub)}>
                                                <CreditCard size={16} /> Retry Payment
                                            </button>
                                            <button className="mobile-action-btn cancel" onClick={() => handleCancel(sub)}>
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                // Admin Table View
                <div className="admin-table-container">
                    <table className="admin-sub-table">
                        <thead>
                            <tr>
                                <th>Donor Details</th>
                                <th>Amount</th>
                                <th>ID / Reference</th>
                                <th>Status</th>
                                <th>Started On</th>
                                <th>Next Billing</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((sub) => (
                                <tr key={sub._id}>
                                    <td>
                                        <div className="admin-donor-info">
                                            <span className="d-name">{sub.donorName}</span>
                                            {sub.donorUserId?.referralCode && (
                                                <span className="d-code">User Code: {sub.donorUserId.referralCode}</span>
                                            )}
                                            <span className="d-mobile">{sub.donorMobile}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="admin-amount-cell">
                                            <strong>₹{sub.amount.toLocaleString()}</strong>
                                            <span className="freq">/ month</span>
                                        </div>
                                    </td>
                                    <td>
                                        <code className="admin-sub-id">{sub.subscriptionId}</code>
                                    </td>
                                    <td>{getStatusBadge(sub)}</td>
                                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td>
                                        {sub.status === 'active' && (
                                            <button
                                                className="admin-btn-cancel"
                                                onClick={() => handleCancel(sub)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {isAdmin && (
                        <div className="admin-table-footer">
                            <div className="summary-group">
                                <div className="total-summary failed">
                                    <span className="label">Failed Total:</span>
                                    <span className="value">₹{failedPageTotal.toLocaleString()}</span>
                                    <span className="freq">/ month</span>
                                </div>
                                <div className="total-summary active">
                                    <span className="label">Active Total:</span>
                                    <span className="value">₹{activePageTotal.toLocaleString()}</span>
                                    <span className="freq">/ month</span>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
                    )}
                </>
            )}

            {/* Pagination Controls */}
            {subscriptions.length > 0 && totalPages > 1 && (
                <div className="list-pagination">
                    <div className="pagination-info">
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} {isAdmin ? 'subscriptions' : 'records'}
                    </div>
                    <div className="pagination-buttons">
                        <button
                            className="p-btn"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            if (
                                totalPages <= 7 ||
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                            ) {
                                return (
                                    <button
                                        key={pageNum}
                                        className={`p-btn ${currentPage === pageNum ? 'active' : ''}`}
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            } else if (
                                (pageNum === currentPage - 3 || pageNum === currentPage + 3)
                            ) {
                                return <span key={pageNum} className="p-dots">...</span>;
                            }
                            return null;
                        })}

                        <button
                            className="p-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Admin OTP Modal */}
            {otpModalOpen && (
                <div className="otp-overlay">
                    <div className="otp-modal-box">
                        <h3>Authorize Cancellation</h3>
                        <p>Enter the 6-digit code sent to <strong>{selectedSub?.donorMobile}</strong></p>

                        <input
                            type="text"
                            maxLength="6"

                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                            className="otp-input-field"
                        />

                        <div className="otp-modal-footer">
                            <button className="btn-secondary" onClick={() => setOtpModalOpen(false)}>Cancel</button>
                            <button
                                className="btn-primary"
                                onClick={() => handleCancel(selectedSub, otpValue)}
                                disabled={otpValue.length !== 6 || verifyingOtp}
                            >
                                {verifyingOtp ? 'Verifying...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .subscription-list {
                    width: 100%;
                }

                .list-controls-row {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 1.5rem;
                }
                .export-tools-unified {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                    background: #f8fafc;
                    padding: 8px 16px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }
                .export-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .export-label {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .export-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .export-btn.excel-icon:hover {
                    color: #059669;
                    border-color: #059669;
                    background: #ecfdf5;
                }
                .export-btn.pdf-icon:hover {
                    color: #dc2626;
                    border-color: #dc2626;
                    background: #fef2f2;
                }
                .export-btn-text {
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border: 1px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .export-btn-text.excel-text {
                    background: #ecfdf5;
                    color: #059669;
                    border-color: #bbf7d0;
                }
                .export-btn-text.pdf-text {
                    background: #fef2f2;
                    color: #dc2626;
                    border-color: #fee2e2;
                }
                .export-btn-text:hover {
                    filter: brightness(0.95);
                }

                .list-pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem;
                    margin-bottom: 4rem;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-top: none;
                    border-radius: 0 0 12px 12px;
                }
                .pagination-info {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .pagination-buttons {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }
                .p-btn {
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .p-btn:hover:not(:disabled) {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: #f5f3ff;
                }
                .p-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }
                .p-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .p-dots {
                    padding: 0 4px;
                    color: #94a3b8;
                }

                /* User Table View Styles */
                .user-table-container {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    margin-top: 1rem;
                }
                .user-sub-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .user-sub-table th {
                    background: #f8fafc;
                    padding: 1rem 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e2e8f0;
                }
                .user-sub-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: middle;
                }
                .user-amount-cell strong {
                    font-size: 1.1rem;
                    color: #059669;
                    display: block;
                }
                .user-amount-cell .freq {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .user-sub-id {
                    font-family: monospace;
                    background: #f1f5f9;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    color: #475569;
                }
                .user-actions-cell {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }
                .btn-cancel-small {
                    padding: 4px 12px;
                    background: white;
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-cancel-small:hover {
                    background: #ef4444;
                    color: white;
                }
                .btn-retry-small {
                    padding: 4px 12px;
                    background: #7c3aed;
                    border: 1px solid #7c3aed;
                    color: white;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-retry-small:hover {
                    background: #6d28d9;
                }
                .text-right {
                    text-align: right;
                }
                .subscription-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                }
                .subscription-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .subscription-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1.25rem;
                }
                .sub-amount {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .sub-id {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0.25rem 0 0 0;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 0.25rem 0.6rem;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .status-badge.active {
                    background: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }
                .status-badge.cancelled {
                    background: #f1f5f9;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                }
                .status-badge.created {
                    background: #fffbeb;
                    color: #92400e;
                    border: 1px solid #fef3c7;
                }
                .status-badge.failed {
                    background: #fef2f2;
                    color: #b91c1c;
                    border: 1px solid #fee2e2;
                }
                .status-badge.paused {
                    background: #fff7ed;
                    color: #c2410c;
                    border: 1px solid #ffedd5;
                }
                .subscription-details {
                    display: grid;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 0.9rem;
                    color: #475569;
                }
                .subscription-actions {
                    border-top: 1px solid #f1f5f9;
                    padding-top: 1rem;
                    display: flex;
                    justify-content: flex-end;
                }
                .btn-cancel {
                    background: white;
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    font-size: 0.85rem;
                    font-weight: 600;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-cancel:hover {
                    background: #ef4444;
                    color: white;
                }
                .btn-retry {
                    background: #7c3aed;
                    border: 1px solid #7c3aed;
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                /* Admin Table Styles */
                .admin-table-container {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .admin-sub-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .admin-sub-table th {
                    background: #f8fafc;
                    padding: 1rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 2px solid #e2e8f0;
                }
                .admin-sub-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: middle;
                    font-size: 0.9rem;
                    color: #1e293b;
                }
                .admin-sub-table tr:hover td {
                    background: #f8fafc;
                }
                .admin-donor-info {
                    display: flex;
                    flex-direction: column;
                }
                .admin-donor-info .d-name {
                    font-weight: 700;
                    color: #0f172a;
                }
                .admin-donor-info .d-code {
                    font-size: 0.75rem;
                    color: #3b82f6;
                    font-weight: 600;
                }
                .admin-donor-info .d-mobile {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .admin-amount-cell strong {
                    color: #059669;
                    font-size: 1rem;
                }
                .admin-amount-cell .freq {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-left: 2px;
                }
                .admin-sub-id {
                    background: #f1f5f9;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    color: #475569;
                    font-family: monospace;
                }
                .admin-btn-cancel {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .admin-btn-cancel:hover {
                    background: #ef4444;
                    color: white;
                    border-color: #ef4444;
                }

                /* OTP Modal Styles */
                .otp-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .otp-modal-box {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                .otp-modal-box h3 {
                    margin: 0 0 0.5rem 0;
                    color: #1e293b;
                    font-size: 1.25rem;
                }
                .otp-modal-box p {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                }
                .otp-input-field {
                    width: 100%;
                    padding: 0.75rem;
                    font-size: 1.5rem;
                    text-align: center;
                    letter-spacing: 0.5rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .otp-input-field:focus {
                    border-color: #00bfa5;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(0, 191, 165, 0.1);
                }
                .otp-modal-footer {
                    display: flex;
                    gap: 12px;
                }
                .otp-modal-footer button {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary {
                    background: #f1f5f9;
                    color: #64748b;
                    border: none;
                }
                .btn-secondary:hover {
                    background: #e2e8f0;
                }
                .btn-primary {
                    background: #00bfa5;
                    color: white;
                    border: none;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #00897b;
                }
                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    color: #64748b;
                }
                .empty-icon {
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                /* Admin Control Styles (Moved from AdminSubscriptions) */
                .admin-controls-card {
                    background: white;
                    padding: 1.25rem 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    gap: 1.5rem;
                    margin: 1rem 0 2rem 0;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .search-box {
                    flex: 1;
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .search-box input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 3rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .search-box input:focus {
                    border-color: var(--primary);
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #64748b;
                }
                .admin-select {
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    outline: none;
                    cursor: pointer;
                }
                
                .admin-table-footer {
                    padding: 1.5rem;
                    background: #f8fafc;
                    border-top: 2px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                }
                .summary-group {
                    display: flex;
                    gap: 1rem;
                }
                .total-summary {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    background: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .total-summary.active {
                    border-left: 4px solid #10b981;
                }
                .total-summary.failed {
                    border-left: 4px solid #ef4444;
                }
                .total-summary .label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .total-summary.active .value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #10b981;
                }
                .total-summary.failed .value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #ef4444;
                }
                .total-summary .freq {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    font-weight: 600;
                }

                /* Mobile Optimization */
                .show-mobile { display: none; }
                .hide-mobile { display: block; }

                @media (max-width: 768px) {
                    .hide-mobile { display: none; }
                    .show-mobile { display: block; }

                    .list-controls-row {
                        justify-content: center;
                        margin-bottom: 1rem;
                    }
                    .export-tools-unified {
                        flex-direction: column;
                        width: 100%;
                        gap: 10px;
                    }
                    .export-group { width: 100%; justify-content: space-between; }

                    .subscription-card-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                        width: 100%;
                        margin-top: 1rem;
                    }

                    .sub-mobile-card {
                        background: white;
                        border-radius: 16px;
                        border: 1px solid #e2e8f0;
                        margin-bottom: 1rem;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        overflow: hidden;
                    }
                    .sub-mobile-card .card-header {
                        padding: 1rem;
                        background: #f8fafc;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .amount-info .amount {
                        font-size: 1.2rem;
                        font-weight: 800;
                        color: #00bfa5;
                        display: block;
                    }
                    .amount-info .freq {
                        font-size: 0.7rem;
                        color: #64748b;
                        text-transform: uppercase;
                        font-weight: 700;
                    }
                    .sub-mobile-card .card-body {
                        padding: 1rem;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.85rem;
                    }
                    .info-row .label { color: #94a3b8; font-weight: 600; }
                    .info-row .value { color: #1e293b; font-weight: 700; }
                    .info-row .value.highlight { color: #00bfa5; }
                    
                    .sub-mobile-card .card-footer {
                        padding: 0.75rem 1rem;
                        border-top: 1px solid #f1f5f9;
                    }
                    .mobile-action-btn {
                        width: 100%;
                        padding: 0.75rem;
                        border-radius: 10px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        cursor: pointer;
                        border: 1px solid transparent;
                    }
                    .mobile-action-btn.cancel {
                        background: #fff;
                        border-color: #ef4444;
                        color: #ef4444;
                    }
                    .mobile-action-btn.retry {
                        background: #00bfa5;
                        color: white;
                        margin-bottom: 8px;
                    }
                    .list-pagination {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    .pagination-buttons {
                        width: 100%;
                        justify-content: center;
                    }
                    .admin-controls-card {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default SubscriptionList;
