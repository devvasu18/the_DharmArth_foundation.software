import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import {
    Clock,
    FileText,
    Share2,
    ChevronRight,
    Package,
    Truck,
    CheckCircle,
    ArrowLeft,
    Search,
    ShieldCheck,
    Zap,
    MapPin,
    Calendar,
    Phone,
    X,
    Clipboard,
    ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import './OrderMedicine.css'; // Reuse existing styles
import { useConfirm } from '../context/ConfirmContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const OrderHistory = () => {
    const navigate = useNavigate();
    const { showAlert } = useConfirm();
    const [historyTab, setHistoryTab] = useState('prescriptions');
    const [prescriptions, setPrescriptions] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTrackerModal, setShowTrackerModal] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [pRes, oRes] = await Promise.all([
                api.get('/prescriptions/my'),
                api.get('/orders/my')
            ]);
            setPrescriptions(pRes.data || []);
            setMyOrders(oRes.data || []);
        } catch (err) {
            console.error('Failed to fetch history', err);
            toast.error('Could not load history');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        await fetchHistory();
        setIsSyncing(false);
        toast.success('History updated!');
    };

    const handleCopyLink = (prescriptionId) => {
        const url = `${window.location.origin}/checkout/${prescriptionId}`;
        navigator.clipboard.writeText(url);
        toast.success('Checkout Link Copied!');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="status-badge pending">Pending Review</span>;
            case 'Verified': return <span className="status-badge verified">Verified & Ready</span>;
            case 'Rejected': return <span className="status-badge rejected">Rejected</span>;
            case 'Ordered': return <span className="status-badge verified">Ordered</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const getOrderStatusBadge = (status) => {
        switch (status) {
            case 'Payment Pending': return <span className="status-badge pending" style={{ background: '#fffbeb', color: '#d97706' }}>Payment Pending</span>;
            case 'Processing': return <span className="status-badge verified" style={{ background: '#eff6ff', color: '#2563eb' }}>Processing</span>;
            case 'Out for Delivery': return <span className="status-badge verified" style={{ background: '#fdf2f8', color: '#db2777' }}>Out for Delivery</span>;
            case 'Delivered': return <span className="status-badge verified" style={{ background: '#f0fdf4', color: '#16a34a' }}>Delivered</span>;
            case 'Cancelled': return <span className="status-badge rejected">Cancelled</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    const getTrackingSteps = (order) => {
        const steps = [
            { id: 'placed', label: 'Order Placed', icon: <Clipboard size={20} />, active: true, done: true },
            { id: 'processing', label: 'Processing', icon: <Package size={20} />, active: order.status === 'Processing', done: ['Processing', 'Out for Delivery', 'Delivered'].includes(order.status) },
            { id: 'out', label: 'Out for Delivery', icon: <Truck size={20} />, active: order.status === 'Out for Delivery', done: ['Out for Delivery', 'Delivered'].includes(order.status) },
            { id: 'delivered', label: 'Delivered', icon: <CheckCircle size={20} />, active: order.status === 'Delivered', done: order.status === 'Delivered' }
        ];
        return steps;
    };

    return (
        <div className="order-medicine-container">
            <Navbar />
            <div className="order-medicine-main order-history-main">
                <div className="page-header history-header">
                    <div className="header-text">

                        <h1>Order History</h1>
                        <p>Track your active orders and previous prescriptions</p>
                    </div>

                </div>

                <div className="history-box glass-card history-page-card">
                    <div className="tab-switcher history-tabs">
                        <button
                            className={`tab-btn ${historyTab === 'prescriptions' ? 'active' : ''}`}
                            onClick={() => setHistoryTab('prescriptions')}
                        >
                            Prescriptions ({prescriptions.length})
                        </button>
                        <button
                            className={`tab-btn ${historyTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setHistoryTab('orders')}
                        >
                            Track Orders ({myOrders.length})
                        </button>
                    </div>

                    <div className="order-list-premium history-list">
                        {loading ? (
                            <div className="empty-state-cool" style={{ padding: '100px 0' }}>
                                <div className="loader" style={{ borderTopColor: '#3182ce', margin: '0 auto 20px' }}></div>
                                <p>Loading your history...</p>
                            </div>
                        ) : historyTab === 'prescriptions' ? (
                            prescriptions.length === 0 ? (
                                <div className="empty-state-cool">
                                    <FileText size={64} strokeWidth={1} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                    <p>No prescriptions found</p>
                                    <span style={{ color: '#94a3b8' }}>Upload a prescription to get started!</span>
                                </div>
                            ) : (
                                prescriptions.map(p => (
                                    <div key={p._id} className="order-card-premium history-item-card">
                                        <div className="presc-thumb" onClick={() => p.image && setImageModalSrc(p.image)} style={{ cursor: p.image ? 'pointer' : 'default' }}>
                                            {p.image ? (
                                                <img src={p.image.startsWith('http') ? p.image : `${API_BASE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt="Presc" />
                                            ) : (
                                                <Package size={48} strokeWidth={1} style={{ opacity: 0.5 }} />
                                            )}
                                        </div>
                                        <div className="order-meta">
                                            <div className="meta-row">
                                                <div className="meta-info">
                                                    <span className="order-date">{new Date(p.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="order-id">ID: #{p._id.slice(-8)}</span>
                                                    {p.orderSource === 'Created by Medical/Admin' && (
                                                        <span style={{
                                                            fontSize: '11px',
                                                            backgroundColor: '#eff6ff',
                                                            color: '#1d4ed8',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontWeight: '600',
                                                            display: 'inline-block',
                                                            marginTop: '4px',
                                                            width: 'fit-content'
                                                        }}>
                                                            Created by Medical/Admin
                                                        </span>
                                                    )}
                                                </div>
                                                {getStatusBadge(p.status)}
                                            </div>

                                            <div className="meta-footer">
                                                {p.status === 'Verified' ? (
                                                    <div className="history-action-row">
                                                        <button
                                                            className="btn-submit-premium"
                                                            onClick={() => navigate(`/checkout/${p._id}`)}
                                                        >
                                                            <Zap size={18} fill="currentColor" /> Checkout Now
                                                        </button>
                                                        <button
                                                            className="btn-action-secondary share-link-btn"
                                                            onClick={() => handleCopyLink(p._id)}
                                                        >
                                                            <Share2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="status-msg-box">
                                                        <p>
                                                            {p.status === 'Pending' ? 'Our pharmacist is currently verifying your prescription. You will receive a notification once it is ready.' :
                                                                p.status === 'Rejected' ? `Sorry, this was rejected: ${p.adminNote || 'Invalid prescription image'}` :
                                                                    p.status === 'Ordered' ? 'This prescription has already been converted into an order.' :
                                                                        'Request is under review.'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            myOrders.length === 0 ? (
                                <div className="empty-state-cool">
                                    <Package size={64} strokeWidth={1} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                    <p>No orders yet</p>
                                    <span style={{ color: '#94a3b8' }}>Once you place an order, you can track it here!</span>
                                </div>
                            ) : (
                                myOrders.map(order => (
                                    <div key={order._id} className="order-card-premium history-item-card">
                                        <div
                                            className={`presc-thumb ${!order.prescription?.image ? 'order-package-icon' : ''}`}
                                            onClick={() => order.prescription?.image && setImageModalSrc(order.prescription.image)}
                                            style={{ cursor: order.prescription?.image ? 'pointer' : 'default' }}
                                        >
                                            {order.prescription?.image ? (
                                                <img src={order.prescription.image.startsWith('http') ? order.prescription.image : `${API_BASE_URL}${order.prescription.image.startsWith('/') ? '' : '/'}${order.prescription.image}`} alt="Order Presc" />
                                            ) : (
                                                <Package size={48} strokeWidth={1} />
                                            )}
                                        </div>
                                        <div className="order-meta">
                                            <div className="meta-row">
                                                <div className="meta-info">
                                                    <span className="order-date">Order #{order._id.slice(-8)}</span>
                                                    <span className="order-id">{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • ₹{order.totalAmount}</span>
                                                    {order.orderSource === 'Created by Medical/Admin' && (
                                                        <span style={{
                                                            fontSize: '11px',
                                                            backgroundColor: '#eff6ff',
                                                            color: '#1d4ed8',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontWeight: '600',
                                                            display: 'inline-block',
                                                            marginTop: '4px',
                                                            width: 'fit-content'
                                                        }}>
                                                            Created by Medical/Admin
                                                        </span>
                                                    )}
                                                </div>
                                                {getOrderStatusBadge(order.status)}
                                            </div>

                                            <div className="meta-footer history-action-row">
                                                <button
                                                    className="btn-action-primary track-btn-full"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowTrackerModal(true);
                                                    }}
                                                >
                                                    view status
                                                </button>
                                                <button
                                                    className="btn-action-secondary external-link-btn"
                                                    onClick={() => navigate(`/track/${order._id}`)}
                                                >
                                                    Track Order  <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Tracker Modal */}
            {showTrackerModal && selectedOrder && (
                <div className="order-modal-overlay" onClick={() => setShowTrackerModal(false)}>
                    <div className="premium-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header-gradient">
                            <div>
                                <span className="order-badge">Order Tracker</span>
                                <h2>Order #{selectedOrder._id.slice(-8)}</h2>
                            </div>
                            <button className="close-btn-light" onClick={() => setShowTrackerModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '32px' }}>
                            <div className="tracker-timeline" style={{ padding: '20px 0' }}>
                                {getTrackingSteps(selectedOrder).map((step, i, arr) => (
                                    <div key={step.id} className={`timeline-item ${step.active ? 'active' : ''} ${step.done ? 'completed' : ''}`} style={{ display: 'flex', gap: '20px', position: 'relative', paddingBottom: i === arr.length - 1 ? 0 : '30px' }}>
                                        {i !== arr.length - 1 && (
                                            <div style={{ position: 'absolute', left: '20px', top: '40px', bottom: '0', width: '2px', background: step.done ? '#10b981' : '#e2e8f0', zIndex: 1 }}></div>
                                        )}
                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: step.done ? '#10b981' : (step.active ? '#3b82f6' : '#f1f5f9'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.done || step.active ? 'white' : '#94a3b8', zIndex: 2 }}>
                                            {step.icon}
                                        </div>
                                        <div style={{ paddingTop: '8px' }}>
                                            <h4 style={{ margin: 0, color: step.done || step.active ? '#1e293b' : '#94a3b8', fontWeight: '700' }}>{step.label}</h4>
                                            {step.done && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>Completed</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#475569' }}>
                                    <MapPin size={18} />
                                    <span style={{ fontWeight: '700' }}>Delivery Address</span>
                                </div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                                    {selectedOrder.shippingAddress?.street},<br />
                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zip}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {imageModalSrc && (
                <div className="image-viewer-modal-overlay" onClick={() => setImageModalSrc(null)}>
                    <div className="image-viewer-modal-card" onClick={e => e.stopPropagation()}>
                        <button className="btn-close-viewer" onClick={() => setImageModalSrc(null)}>
                            <X size={32} color="white" />
                        </button>
                        <img src={imageModalSrc.startsWith('http') ? imageModalSrc : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`} alt="Prescription Full" />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default OrderHistory;
