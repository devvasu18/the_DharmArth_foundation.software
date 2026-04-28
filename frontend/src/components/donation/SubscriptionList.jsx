import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, XCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../context/ConfirmContext';

const SubscriptionList = ({ isAdmin = false }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showConfirm } = useConfirm();

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const url = isAdmin ? '/subscriptions/admin/all' : '/subscriptions/my';
            const { data } = await api.get(url);
            setSubscriptions(data);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleCancel = async (id, subscriptionId) => {
        const confirmed = await showConfirm(
            "Cancel Subscription?",
            `Are you sure you want to cancel this monthly donation (ID: ${subscriptionId})? You won't be charged from the next cycle.`
        );

        if (!confirmed) return;

        try {
            const { data } = await api.post(`/subscriptions/cancel/${id}`);
            toast.success('Subscription cancelled successfully');
            // Update local state
            setSubscriptions(prev => prev.map(s => 
                s._id === id ? { ...s, status: 'cancelled' } : s
            ));
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel subscription');
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="status-badge active"><CheckCircle size={14} /> Active</span>;
            case 'cancelled':
                return <span className="status-badge cancelled"><XCircle size={14} /> Cancelled</span>;
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

    if (loading) {
        return <div className="loading-spinner-container"><div className="spinner"></div></div>;
    }

    if (subscriptions.length === 0) {
        return (
            <div className="empty-state">
                <CreditCard size={48} className="empty-icon" />
                <p>No monthly donations found.</p>
            </div>
        );
    }

    return (
        <div className="subscription-list">
            {subscriptions.map((sub) => (
                <div key={sub._id} className="subscription-card">
                    <div className="subscription-header">
                        <div className="sub-info">
                            <h4 className="sub-amount">₹{sub.amount.toLocaleString()} / month</h4>
                            <p className="sub-id">ID: {sub.subscriptionId}</p>
                        </div>
                        {getStatusBadge(sub.status)}
                    </div>
                    
                    <div className="subscription-details">
                        <div className="detail-item">
                            <Calendar size={16} />
                            <span>Started: {new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                        {sub.nextBillingDate && sub.status === 'active' && (
                            <div className="detail-item">
                                <Clock size={16} />
                                <span>Next Billing: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {isAdmin && (
                            <div className="detail-item">
                                <strong>Donor:</strong> {sub.donorName} ({sub.donorMobile})
                            </div>
                        )}
                    </div>

                    {sub.status === 'active' && (
                        <div className="subscription-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={() => handleCancel(sub._id, sub.subscriptionId)}
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    )}
                    {sub.status === 'failed' && (
                        <div className="subscription-actions" style={{ gap: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn-retry" 
                                onClick={() => handleRetry(sub)}
                            >
                                Retry Payment
                            </button>
                            <button 
                                className="btn-cancel" 
                                onClick={() => handleCancel(sub._id, sub.subscriptionId)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            ))}

            <style>{`
                .subscription-list {
                    display: grid;
                    gap: 1.5rem;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0.25rem 0.6rem;
                    border-radius: 9999px;
                    text-transform: capitalize;
                }
                .status-badge.active {
                    background: #dcfce7;
                    color: #166534;
                }
                .status-badge.cancelled {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .status-badge.created {
                    background: #fef9c3;
                    color: #854d0e;
                }
                .status-badge.failed {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                .status-badge.paused {
                    background: #ffedd5;
                    color: #9a3412;
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
                    background: #fef2f2;
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
                .btn-retry:hover {
                    background: #6d28d9;
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
            `}</style>
        </div>
    );
};

export default SubscriptionList;
