import React, { useState, useEffect, useRef } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { 
    ShoppingBag, 
    Search, 
    Filter, 
    Eye, 
    CheckCircle, 
    Clock, 
    XCircle, 
    Truck, 
    CreditCard, 
    MoreVertical,
    ChevronDown,
    Package,
    X,
    Share2
} from 'lucide-react';
import './AdminPharmacyOrders.css';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';

const getStatusIndex = (status) => {
    if (status === 'Awaiting Approval') return 0;
    const order = ['Payment Pending', 'Processing', 'Ready for Packing', 'Ready for Dispatch', 'Out for Delivery', 'Delivered'];
    return order.indexOf(status);
};

const AdminPharmacyOrders = () => {
    const handleCopyTrackLink = (orderId) => {
        const url = `${window.location.origin}/track/${orderId}`;
        navigator.clipboard.writeText(url);
        toast.success('Tracking Link Copied!');
    };
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState(null);
    const { showAlert } = useConfirm();

    const loaderRef = useRef(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
        fetchOrders(1, true);
    }, [statusFilter, debouncedSearchTerm]);

    const fetchOrders = async (pageNum, isInitial = false) => {
        if (isInitial) setLoading(true);
        else setIsFetchingMore(true);

        try {
            const res = await api.get(`/orders?page=${pageNum}&limit=20&status=${statusFilter === 'All' ? '' : statusFilter}&search=${debouncedSearchTerm}`);
            const { orders: newOrders, totalPages: total } = res.data;
            
            if (isInitial) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }
            setTotalPages(total);
        } catch (error) {
            console.error('Fetch orders failed', error);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting && !loading && !isFetchingMore && page < totalPages) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchOrders(nextPage);
            }
        }, { threshold: 0.1 });

        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => {
            if (loaderRef.current) observer.unobserve(loaderRef.current);
        };
    }, [page, totalPages, loading, isFetchingMore]);

    const handleUpdateStatus = async (orderId, newStatus, note) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus, note });
            toast.success(`Order status changed to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            toast.error('Could not update order status');
        }
    };

    // Server handles filtering now, but we keep this for small client-side refinements if needed
    const filteredOrders = orders;

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Payment Pending': return { bg: '#fffaf0', text: '#d69e2e', icon: <CreditCard size={14}/> };
            case 'Processing': return { bg: '#ebf8ff', text: '#3182ce', icon: <Package size={14}/> };
            case 'Ready for Packing': return { bg: '#fef3c7', text: '#d97706', icon: <Package size={14}/> };
            case 'Ready for Dispatch': return { bg: '#ecfdf5', text: '#059669', icon: <Truck size={14}/> };
            case 'Out for Delivery': return { bg: '#faf5ff', text: '#805ad5', icon: <Truck size={14}/> };
            case 'Delivered': return { bg: '#f0fff4', text: '#38a169', icon: <CheckCircle size={14}/> };
            case 'Cancelled': return { bg: '#fff5f5', text: '#e53e3e', icon: <XCircle size={14}/> };
            default: return { bg: '#f7fafc', text: '#4a5568', icon: <Clock size={14}/> };
        }
    };

    return (
        <div className="admin-orders-page">
            <header className="page-header">
                <div>
                    <h1>Pharmacy Order Management</h1>
                    <p>Track fulfillment, verify payments, and manage service delivery</p>
                </div>
                <div className="header-stats">
                    <div className="stat-pill">
                        <span className="label">Total Orders</span>
                        <span className="value">{orders.length}</span>
                    </div>
                </div>
            </header>

            <div className="orders-control-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Order ID or User Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="Payment Pending">Payment Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Ready for Packing">Ready for Packing</option>
                        <option value="Ready for Dispatch">Ready for Dispatch</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="orders-table-wrapper">
                {loading ? (
                    <div className="loading-state">
                        <div className="order-loader"></div>
                        <p>Loading transactions...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <ShoppingBag size={48} />
                        <p>No orders found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <table className="orders-premium-table">
                        <thead>
                            <tr>
                                <th>Order Details</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => {
                                const style = getStatusStyle(order.status);
                                return (
                                    <tr key={order._id}>
                                        <td>
                                            <div className="order-id-cell">
                                                <span className="id-txt">#{order._id.substring(order._id.length-8).toUpperCase()}</span>
                                                <span className="date-txt">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                {order.paymentDetails?.transactionId && (
                                                    <span className="payment-id-tag">RP: {order.paymentDetails.transactionId}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <div className="avatar">{order.user?.name?.charAt(0) || 'G'}</div>
                                                <div className="info">
                                                    <span className="name">{order.user?.name || 'Guest User'}</span>
                                                    <span className="phone">{order.user?.mobile}</span>
                                                    {order.orderSource === 'Created by Medical/Admin' && (
                                                        <span style={{
                                                            fontSize: '9px',
                                                            backgroundColor: '#eff6ff',
                                                            color: '#1d4ed8',
                                                            padding: '1px 6px',
                                                            borderRadius: '8px',
                                                            fontWeight: '600',
                                                            display: 'inline-block',
                                                            marginTop: '2px',
                                                            width: 'fit-content'
                                                        }}>
                                                            Created by Medical/Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="items-cell">
                                                <span className="count">{order.items.length} Items</span>
                                                <span className="preview">{order.items[0]?.name || order.items[0]?.medicineName}{order.items.length > 1 ? '...' : ''}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="total-cell">₹{order.totalAmount.toFixed(2)}</span>
                                        </td>
                                        <td>
                                            <div className="status-cell" style={{ backgroundColor: style.bg, color: style.text }}>
                                                {style.icon}
                                                <span>{order.status}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                {order.status === 'Payment Pending' && (
                                                    <button 
                                                        className="btn-verify" 
                                                        title="Confirm Payment"
                                                        onClick={() => handleUpdateStatus(order._id, 'Processing', 'Payment verified manually by admin')}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                {order.status === 'Processing' && (
                                                    <button 
                                                        className="btn-verify" 
                                                        title="Mark Ready for Packing"
                                                        style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}
                                                        onClick={() => handleUpdateStatus(order._id, 'Ready for Packing', 'Marked as Ready for Packing')}
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                )}
                                                {order.status === 'Ready for Packing' && (
                                                    <button 
                                                        className="btn-verify" 
                                                        title="Mark Ready for Dispatch"
                                                        style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #d1fae5' }}
                                                        onClick={() => handleUpdateStatus(order._id, 'Ready for Dispatch', 'Marked as Ready for Dispatch')}
                                                    >
                                                        <Truck size={16} />
                                                    </button>
                                                )}
                                                {order.status === 'Ready for Dispatch' && (
                                                    <span className="ready-tag" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Awaiting Dispatch</span>
                                                )}
                                                <button 
                                                    className="btn-view" 
                                                    title="Copy Tracking Link"
                                                    style={{ color: '#3b82f6', background: '#eff6ff', border: '1px solid #dbeafe' }}
                                                    onClick={() => handleCopyTrackLink(order._id)}
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                <button 
                                                    className="btn-view" 
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {/* Sentinel for Infinite Scroll */}
                    <div ref={loaderRef} style={{ padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                        {isFetchingMore && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#64748b', fontSize: '14px' }}>
                                <div className="order-loader" style={{ width: '20px', height: '20px', margin: 0 }}></div>
                                <span>Syncing more records...</span>
                            </div>
                        )}
                        {!isFetchingMore && page >= totalPages && orders.length > 0 && (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>All records synchronized ✓</span>
                        )}
                    </div>
                </>
            )}
            </div>
            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="order-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="order-modal-content premium-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-gradient">
                            <div className="header-text">
                                <div className="order-badge">Order ID: #{selectedOrder._id.substring(selectedOrder._id.length-8).toUpperCase()}</div>
                                <h2>Order Summary</h2>
                            </div>
                            <button className="close-btn-light" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body-premium">
                            <div className="status-progress-bar">
                                {(() => {
                                    const currentIdx = getStatusIndex(selectedOrder.status);
                                    const steps = [
                                        { label: 'Pending', idx: 0 },
                                        { label: 'Processing', idx: 1 },
                                        { label: 'Packed', idx: 2 },
                                        { label: 'Ready to Ship', idx: 3 },
                                        { label: 'In Transit', idx: 4 },
                                        { label: 'Delivered', idx: 5 }
                                    ];
                                    return steps.map(step => (
                                        <div key={step.idx} className={`progress-step ${currentIdx >= step.idx ? 'active' : ''}`}>
                                            <div className="step-point"></div>
                                            <span>{step.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>

                            <div className="premium-grid">
                                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                                    <section className="customer-info-pane">
                                        <div className="pane-header">
                                            <div className="icon-circle"><CreditCard size={18}/></div>
                                            <h3>Customer Details</h3>
                                        </div>
                                        <div className="pane-content">
                                            <div className="data-row">
                                                <span className="data-label">Full Name</span>
                                                <span className="data-value">{selectedOrder.user?.name || 'Guest User'}</span>
                                            </div>
                                            <div className="data-row">
                                                <span className="data-label">Phone Number</span>
                                                <span className="data-value">{selectedOrder.user?.mobile}</span>
                                            </div>
                                            {selectedOrder.orderSource === 'Created by Medical/Admin' && (
                                                <div className="data-row" style={{background: '#f0f9ff', padding: '8px', borderRadius: '8px', border: '1px dashed #bae6fd'}}>
                                                    <span className="data-label" style={{color: '#0369a1'}}>Order Source</span>
                                                    <span className="data-value" style={{color: '#0369a1', fontWeight: 'bold'}}>Created by Medical/Admin</span>
                                                </div>
                                            )}
                                            {selectedOrder.paymentDetails?.transactionId && (
                                                <div className="data-row" style={{background: '#f0f9ff', padding: '8px', borderRadius: '8px', border: '1px dashed #bae6fd'}}>
                                                    <span className="data-label" style={{color: '#0369a1'}}>Razorpay ID</span>
                                                    <span className="data-value" style={{fontFamily: 'monospace', color: '#0369a1', fontWeight: 'bold'}}>{selectedOrder.paymentDetails.transactionId}</span>
                                                </div>
                                            )}
                                            <div className="data-row">
                                                <span className="data-label">Shipping Address</span>
                                                <span className="data-value address">
                                                    {selectedOrder.shippingAddress?.street},<br/>
                                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zip}
                                                </span>
                                            </div>
                                        </div>
                                    </section>

                                    {selectedOrder.dispatchDetails && (
                                        <section className="customer-info-pane" style={{borderColor: '#3b82f6', background: '#eff6ff'}}>
                                            <div className="pane-header" style={{background: '#dbeafe', borderBottomColor: '#bfdbfe'}}>
                                                <div className="icon-circle" style={{background: '#3b82f6', color: 'white'}}><Truck size={18}/></div>
                                                <h3>Logistics & Dispatch</h3>
                                            </div>
                                            <div className="pane-content">
                                                <div className="data-row" style={{marginBottom: '10px', background: '#dbeafe', padding: '8px', borderRadius: '8px'}}>
                                                    <span className="data-label" style={{color: '#3b82f6', fontWeight: 'bold'}}>Assigned Courier Partner</span>
                                                    <span className="data-value" style={{color: '#1d4ed8', fontSize: '1.1rem', fontWeight: '800'}}>
                                                        {selectedOrder.dispatchDetails.deliveryBoyName || 'Official Dispatcher'} 
                                                        {selectedOrder.dispatchDetails.deliveryBoyMobile && <span style={{fontSize: '0.85rem', fontWeight: 'normal', color: '#3b82f6', marginLeft: '5px'}}>({selectedOrder.dispatchDetails.deliveryBoyMobile})</span>}
                                                    </span>
                                                </div>
                                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{color: '#3b82f6'}}>Vehicle Name</span>
                                                        <span className="data-value" style={{color: '#1d4ed8'}}>{selectedOrder.dispatchDetails.vehicleName || selectedOrder.dispatchDetails.busName || 'Express'}</span>
                                                    </div>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{color: '#3b82f6'}}>Registration No.</span>
                                                        <span className="data-value" style={{color: '#1d4ed8'}}>{selectedOrder.dispatchDetails.busNumber}</span>
                                                    </div>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label" style={{color: '#3b82f6'}}>Bus Conductor Contact</span>
                                                    <span className="data-value" style={{color: '#1d4ed8'}}>{selectedOrder.dispatchDetails.conductorNumber || 'Not Set'}</span>
                                                </div>
                                                <div className="data-row" style={{marginTop: '10px'}}>
                                                    <span className="data-label" style={{color: '#3b82f6'}}>Vehicle Photo Identity</span>
                                                    <div 
                                                        className="bus-image-preview" 
                                                        style={{
                                                            marginTop: '6px', 
                                                            borderRadius: '12px', 
                                                            overflow: 'hidden', 
                                                            border: '2px solid white',
                                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                                                            background: '#f1f5f9',
                                                            cursor: 'pointer',
                                                            height: '100px'
                                                        }}
                                                        onClick={() => {
                                                            const finalImg = selectedOrder.dispatchDetails.busId?.image || selectedOrder.dispatchDetails.busImage;
                                                            if (finalImg) setImageModalSrc(finalImg);
                                                        }}
                                                    >
                                                        {(() => {
                                                            const liveImage = selectedOrder.dispatchDetails.busId?.image;
                                                            const snapshotImage = selectedOrder.dispatchDetails.busImage;
                                                            const finalImage = liveImage || snapshotImage;
 
                                                            if (!finalImage) return <div style={{padding: '30px', textAlign: 'center', fontSize: '11px', color: '#94a3b8'}}>No Identity Photo Loaded</div>;
 
                                                            const resolvedUrl = finalImage.startsWith('http') 
                                                                ? finalImage 
                                                                : `${API_BASE_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
 
                                                            return (
                                                                <img 
                                                                    src={resolvedUrl} 
                                                                    alt="Bus" 
                                                                    style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                                                                />
                                                            );
                                                        })()}
                                                        <div className="zoom-hint">CLICK TO ZOOM</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </div>

                                <section className="items-info-pane">
                                    <div className="pane-header">
                                        <div className="icon-circle"><ShoppingBag size={18}/></div>
                                        <h3>Medicines Ordered</h3>
                                    </div>
                                    <div className="premium-medicine-list">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="premium-med-card">
                                                <div className="med-main">
                                                    <div className="med-info">
                                                        <span className="name">{item.name || item.medicineName}</span>
                                                        <span className="meta">Qty: {item.quantity || 1} • Unit Price: ₹{Number(item.price || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="med-price-total">₹{(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                                                </div>
                                                {(item.time || item.frequency || item.foodRelation) && (
                                                    <div className="dosage-strip">
                                                        <Clock size={12} />
                                                        <span>{item.frequency}</span>
                                                        <span className="dot">•</span>
                                                        <span>{item.time}</span>
                                                        <span className="dot">•</span>
                                                        <span>{item.foodRelation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <div className="modal-summary-footer">
                                <div className="summary-details">
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Processing Fee</span>
                                        <span className="free">FREE</span>
                                    </div>
                                    <div className="summary-row grand-total">
                                        <span>Grand Total</span>
                                        <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions-premium">
                            <button className="btn-glass-secondary" onClick={() => handleCopyTrackLink(selectedOrder._id)} style={{marginRight: 'auto', display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', color: '#475569'}}>
                                <Share2 size={18} /> Share Tracker
                            </button>
                            <button className="btn-glass-cancel" onClick={() => setIsModalOpen(false)}>Close View</button>
                            {selectedOrder.status === 'Payment Pending' && (
                                <button className="btn-glass-primary" onClick={() => {
                                    handleUpdateStatus(selectedOrder._id, 'Processing', 'Verified from details modal');
                                    setIsModalOpen(false);
                                }}>
                                    <CheckCircle size={18} /> Confirm Payment
                                </button>
                            )}
                            {selectedOrder.status === 'Processing' && (
                                <button className="btn-glass-primary" style={{ background: '#3b82f6', color: '#ffffff' }} onClick={() => {
                                    handleUpdateStatus(selectedOrder._id, 'Ready for Packing', 'Marked as Ready for Packing from details modal');
                                    setIsModalOpen(false);
                                }}>
                                    <Package size={18} /> Mark Packed
                                </button>
                            )}
                            {selectedOrder.status === 'Ready for Packing' && (
                                <button className="btn-glass-primary" style={{ background: '#10b981', color: '#ffffff' }} onClick={() => {
                                    handleUpdateStatus(selectedOrder._id, 'Ready for Dispatch', 'Marked as Ready for Dispatch from details modal');
                                    setIsModalOpen(false);
                                }}>
                                    <Truck size={18} /> Mark Ready for Dispatch
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Image Viewer Modal */}
            {imageModalSrc && (
                <div className="image-viewer-modal-overlay" onClick={() => setImageModalSrc(null)}>
                    <div className="image-viewer-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-viewer" onClick={() => setImageModalSrc(null)}>
                            <X size={24} color="white" />
                        </button>
                        <img 
                            src={imageModalSrc.startsWith('http') 
                                ? imageModalSrc 
                                : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`
                            } 
                            alt="Full View" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPharmacyOrders;
