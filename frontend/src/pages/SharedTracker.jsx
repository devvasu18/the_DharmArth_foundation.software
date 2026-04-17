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
    Shield
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
        <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc'}}>
            <div className="order-loader" style={{width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <p style={{marginTop: '15px', color: '#64748b', fontWeight: '600'}}>Securing Tracker Channel...</p>
        </div>
    );

    if (error) return (
        <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', textAlign: 'center'}}>
            <div style={{background: '#fee2e2', color: '#ef4444', padding: '20px', borderRadius: '20px', maxWidth: '400px'}}>
                <Shield size={48} style={{marginBottom: '15px'}}/>
                <h2>Link Expired or Invalid</h2>
                <p>{error}</p>
            </div>
            <button onClick={() => window.location.href = '/'} style={{marginTop: '20px', padding: '10px 20px', borderRadius: '12px', border: 'non', background: '#3b82f6', color: 'white', fontWeight: '600', cursor: 'pointer'}}>Go to Home</button>
        </div>
    );

    return (
        <div className="shared-tracker-page" style={{minHeight: '100vh', background: '#f1f5f9', padding: '20px 10px'}}>
            <div className="premium-modal" style={{margin: '0 auto', maxWidth: '900px', background: 'white', border: '1px solid #e2e8f0'}}>
                <div className="modal-header-gradient" style={{background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'}}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Order Tracker</h2>
                        <p style={{margin: '5px 0 0 0', opacity: 0.7, fontSize: '13px'}}>Real-time Pharmacy Logistics Trace</p>
                    </div>
                    <div className="order-badge" style={{background: 'rgba(255,255,255,0.08)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '1px'}}>
                        ORDER ID: <span style={{marginLeft: '5px', opacity: 1, color: '#60a5fa'}}>#{order._id.substring(order._id.length-8).toUpperCase()}</span>
                    </div>
                </div>

                <div className="modal-body-premium" style={{padding: '30px'}}>
                    {/* Progress Bar */}
                    <div className="status-progress-bar" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative'}}>
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

                    <div className="premium-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px'}}>
                        {/* Column 1: Fulfillment details */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '25px'}}>
                            <section className="customer-info-pane" style={{background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                                <div className="pane-header" style={{background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <div className="icon-circle" style={{width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6'}}><MapPin size={18}/></div>
                                    <h3 style={{fontSize: '13px', fontWeight: '700', textTransform: 'uppercase'}}>Your Pickup Station</h3>
                                </div>
                                <div className="pane-content" style={{padding: '20px'}}>
                                    <div className="pill-info" style={{background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '15px'}}>
                                        <div style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase'}}>Vehicle</div>
                                        <div style={{fontSize: '14px', fontWeight: '700', color: '#1e293b'}}>{order.dispatchDetails?.vehicleName || 'Express Bus'} ({order.dispatchDetails?.busNumber || 'N/A'})</div>
                                    </div>
                                    
                                    <div className="data-row" style={{marginBottom: '15px'}}>
                                        <span className="data-label" style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase'}}>Meet Bus At</span>
                                        <span className="data-value" style={{display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b'}}>{order.dispatchDetails?.pickupStoppage || 'Finalizing Station...'}</span>
                                    </div>

                                    <div className="data-row" style={{marginBottom: '15px'}}>
                                        <span className="data-label" style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase'}}>Contact Number</span>
                                        <span className="data-value" style={{display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b'}}>{order.dispatchDetails?.conductorNumber || order.shippingAddress?.phone}</span>
                                    </div>

                                    <div className="data-row">
                                        <span className="data-label" style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase'}}>Shipping Address</span>
                                        <span className="data-value" style={{display: 'block', fontSize: '14px', color: '#475569', lineHeight: '1.6'}}>
                                            {order.shippingAddress?.street},<br/>
                                            {order.shippingAddress?.city}, {order.shippingAddress?.zip}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="customer-info-pane" style={{background: '#eff6ff', borderRadius: '20px', border: '1px solid #dbeafe', overflow: 'hidden'}}>
                                <div className="pane-header" style={{background: '#dbeafe', padding: '16px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                    <div className="icon-circle" style={{width: '32px', height: '32px', background: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}><Truck size={18}/></div>
                                    <h3 style={{fontSize: '13px', fontWeight: '700', textTransform: 'uppercase'}}>Dispatch & Logistics</h3>
                                </div>
                                <div className="pane-content" style={{padding: '20px'}}>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                        <div className="data-row">
                                            <span className="data-label" style={{fontSize: '10px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase'}}>Vehicle Name</span>
                                            <span className="data-value" style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#1d4ed8'}}>{order.dispatchDetails?.vehicleName || order.dispatchDetails?.busName || 'Express Bus'}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label" style={{fontSize: '10px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase'}}>Bus Number</span>
                                            <span className="data-value" style={{display: 'block', fontSize: '14px', fontWeight: '600', color: '#1d4ed8'}}>{order.dispatchDetails?.busNumber}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="data-row" style={{marginTop: '15px'}}>
                                        <span className="data-label" style={{fontSize: '10px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase'}}>Be Ready At</span>
                                        <span className="data-value" style={{display: 'block', fontSize: '18px', fontWeight: '800', color: '#1d4ed8'}}>{order.dispatchDetails?.estimatedArrivalTime || 'Awaiting Schedule'}</span>
                                    </div>

                                    <div style={{marginTop: '20px', borderRadius: '12px', overflow: 'hidden', border: '2px solid white', background: '#f1f5f9', cursor: 'pointer', height: '120px'}} onClick={() => {
                                        const img = order.dispatchDetails?.busId?.image || order.dispatchDetails?.busImage;
                                        if (img) setImageModalSrc(img);
                                    }}>
                                          {(() => {
                                              const finalImage = order.dispatchDetails?.busId?.image || order.dispatchDetails?.busImage;
                                              if (!finalImage) return <div style={{padding: '40px', textAlign: 'center', fontSize: '11px', color: '#94a3b8'}}>Identity Photo Pending</div>;
                                              const resolvedUrl = finalImage.startsWith('http') 
                                                  ? finalImage 
                                                  : `${API_BASE_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
                                              return <img src={resolvedUrl} alt="Bus" style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
                                          })()}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Column 2: Order Summary */}
                        <section className="items-info-pane" style={{background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                            <div className="pane-header" style={{background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <div className="icon-circle" style={{width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38a169'}}><ShoppingBag size={18}/></div>
                                <h3 style={{fontSize: '13px', fontWeight: '700', textTransform: 'uppercase'}}>Medicines Packet</h3>
                            </div>
                            <div className="premium-medicine-list" style={{padding: '20px'}}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="premium-med-card" style={{background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1px solid #f1f5f9', marginBottom: '10px'}}>
                                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                            <div>
                                                <div style={{fontWeight: '700', color: '#1e293b'}}>{item.name || item.medicineName}</div>
                                                <div style={{fontSize: '12px', color: '#94a3b8'}}>Qty: {item.quantity} units</div>
                                            </div>
                                            <div style={{fontWeight: '700', color: '#3b82f6'}}>₹{item.price?.toFixed(2)}</div>
                                        </div>
                                        {(item.frequency || item.time) && (
                                            <div style={{marginTop: '10px', fontSize: '11px', background: 'white', display: 'inline-block', padding: '4px 8px', borderRadius: '6px', color: '#64748b', border: '1px solid #e2e8f0'}}>
                                                {item.frequency} • {item.time}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div style={{marginTop: '30px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#64748b'}}>
                                        <span>Order Total</span>
                                        <span>₹{order.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '800', color: '#1e293b'}}>
                                        <span>Total Paid</span>
                                        <span style={{color: '#38a169'}}>₹{order.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="modal-actions-premium" style={{padding: '20px', background: '#f8fafc', textAlign: 'center', fontSize: '12px', color: '#94a3b8'}}>
                    <p>© 2026 The DharmArth Foundation. Secure Health Logistics.</p>
                </div>
            </div>

            {/* Image Viewer Overlay */}
            {imageModalSrc && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}} onClick={() => setImageModalSrc(null)}>
                     <img 
                        src={imageModalSrc.startsWith('http') ? imageModalSrc : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`} 
                        alt="Zoom" 
                        style={{maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}
                    />
                </div>
            )}
        </div>
    );
};

export default SharedTracker;
