import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import {
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    ChevronLeft,
    Box,
    ShoppingBag,
    Phone,
    User,
    Shield,
    FileText
} from 'lucide-react';
import './OrderMedicine.css'; // Reuse styles

const SharedTracker = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageModalSrc, setImageModalSrc] = useState(null);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/public/${orderId}`);
            setOrder(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Order Details Not Found');
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div className="order-loader" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '15px', color: '#64748b', fontWeight: '600' }}>Securing Tracker Channel...</p>
        </div>
    );

    if (error) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '20px', borderRadius: '20px', maxWidth: '400px' }}>
                <Shield size={48} style={{ marginBottom: '15px' }} />
                <h2>Link Expired or Invalid</h2>
                <p>{error}</p>
            </div>
            <button onClick={() => window.location.href = '/'} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '12px', border: 'non', background: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Go to Home</button>
        </div>
    );

    return (
        <div className="shared-tracker-page" style={{ minHeight: '100vh', background: '#f1f5f9', padding: '20px 10px' }}>
            <div className="premium-modal" style={{ margin: '0 auto', maxWidth: '1500px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderRadius: '24px', overflow: 'hidden' }}>
                <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Order Tracker</h2>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '13px' }}>Real-time Pharmacy Logistics Trace</p>
                    </div>
                    <div className="order-badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ORDER ID: <span style={{ marginLeft: '5px', opacity: 1, color: '#60a5fa' }}>#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                    </div>
                </div>

                <div className="modal-body-premium" style={{ padding: '30px' }}>
                    {/* Progress Bar */}
                    <div className="status-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
                        {/* Progress Line Fill */}
                        <div className="progress-line-fill" style={{
                            position: 'absolute',
                            top: '8px',
                            left: '10px',
                            width: `${(['Pending', 'Processing', 'Out for Delivery', 'Delivered'].indexOf(order.status) / 3) * 100}%`,
                            height: '2px',
                            background: '#38a169',
                            zIndex: 1,
                            transition: 'width 0.4s ease'
                        }}></div>

                        <div className={`progress-step ${['Pending', 'Processing', 'Out for Delivery', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                            <div className="step-point"></div>
                            <span>Pending</span>
                        </div>
                        <div className={`progress-step ${['Processing', 'Out for Delivery', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                            <div className="step-point"></div>
                            <span>Processing</span>
                        </div>
                        <div className={`progress-step ${['Out for Delivery', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                            <div className="step-point"></div>
                            <span>Shipping</span>
                        </div>
                        <div className={`progress-step ${order.status === 'Delivered' ? 'active' : ''}`}>
                            <div className="step-point"></div>
                            <span>Delivered</span>
                        </div>
                    </div>

                    <div className="premium-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: (order.status === 'Out for Delivery' || order.status === 'Delivered') ? '1.1fr 0.9fr' : '1fr',
                        gap: '30px',
                        maxWidth: (order.status === 'Out for Delivery' || order.status === 'Delivered') ? '100%' : '600px',
                        margin: '0 auto'
                    }}>
                        {/* Box 1: Dispatch & Logistics (Conditionally Shown) */}
                        {(order.status === 'Out for Delivery' || order.status === 'Delivered') && (
                            <section className="customer-info-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '550px', background: 'white', borderRadius: '20px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                                <div className="pane-header" style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="icon-circle" style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Truck size={18} /></div>
                                    <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Dispatch & Logistics</h3>
                                </div>
                                <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="pill-info" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="data-row">
                                                <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Vehicle Name</span>
                                                <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{order.dispatchDetails?.vehicleName || 'N/A'}</span>
                                            </div>
                                            <div className="data-row">
                                                <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Bus Number</span>
                                                <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{order.dispatchDetails?.busNumber || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="data-row">
                                            <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Meet Bus At</span>
                                            <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{order.dispatchDetails?.pickupStoppage || 'Finalizing Station...'}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Contact Number</span>
                                            <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{order.dispatchDetails?.conductorNumber || order.shippingAddress?.phone}</span>
                                        </div>
                                    </div>

                                    <div className="data-row" style={{ marginTop: '5px' }}>
                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Estimated Arrival</span>
                                        <span className="data-value" style={{ display: 'block', fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{order.dispatchDetails?.estimatedArrivalTime || 'Awaiting Schedule'}</span>
                                    </div>

                                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', height: '140px', marginTop: 'auto' }} onClick={() => {
                                        const img = order.dispatchDetails?.busId?.image || order.dispatchDetails?.busImage;
                                        if (img) setImageModalSrc(img);
                                    }}>
                                        {(() => {
                                            const finalImage = order.dispatchDetails?.busId?.image || order.dispatchDetails?.busImage;
                                            if (!finalImage) return <div style={{ padding: '50px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>Identity Photo Pending</div>;
                                            const resolvedUrl = finalImage.startsWith('http')
                                                ? finalImage
                                                : `${API_BASE_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
                                            return <img src={resolvedUrl} alt="Bus" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                        })()}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Box 2: Order Summary */}
                        <section className="items-info-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '550px', background: 'white', borderRadius: '24px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div className="pane-header" style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="icon-circle" style={{ width: '36px', height: '36px', background: '#38a169', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><ShoppingBag size={20} /></div>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#1e293b' }}>Order Summary</h3>
                                </div>
                                <div style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' }}>Verified Packet</div>
                            </div>

                            <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div className="medicine-items-scroll" style={{ flex: 1, marginBottom: '20px' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: '16px' }}>💊</span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', lineHeight: '1.2' }}>{item.name || item.medicineName}</span>
                                                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>₹{item.price?.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</span>
                                                    {item.frequency && (
                                                        <span style={{ width: '3px', height: '3px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                                                    )}
                                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{item.frequency}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="receipt-footer" style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Deliver To</div>
                                        <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
                                            {order.shippingAddress?.street},<br />
                                            {order.shippingAddress?.city} - {order.shippingAddress?.zip}
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px dashed #e2e8f0', margin: '15px 0', paddingTop: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Items Total</span>
                                            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>₹{order.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>Amount Paid</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', lineHeight: '1' }}>₹{order.totalAmount.toFixed(2)}</div>
                                                <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>✓ Transaction Success</div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => window.open(`${API_BASE_URL}/api/orders/public/${order._id}/invoice`, '_blank')}
                                            style={{ 
                                                width: '100%', 
                                                marginTop: '20px', 
                                                padding: '12px', 
                                                borderRadius: '12px', 
                                                background: '#fff', 
                                                border: '1px solid #e2e8f0', 
                                                color: '#475569', 
                                                fontWeight: '700', 
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                                            onMouseOut={(e) => e.target.style.background = '#fff'}
                                        >
                                            <FileText size={16} />
                                            Download Digital Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="modal-actions-premium" style={{ padding: '20px', background: '#f8fafc', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                    <p>© 2026 The DharmArth Foundation. Secure Health Logistics.</p>
                </div>
            </div>

            {/* Image Viewer Overlay */}
            {imageModalSrc && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setImageModalSrc(null)}>
                    <img
                        src={imageModalSrc.startsWith('http') ? imageModalSrc : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`}
                        alt="Zoom"
                        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    />
                </div>
            )}
        </div>
    );
};

export default SharedTracker;
