import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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
    X
} from 'lucide-react';
import './AdminPharmacyOrders.css';
import { useConfirm } from '../../context/ConfirmContext';

const AdminPharmacyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showAlert } = useConfirm();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Fetch orders failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, newStatus, note) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus, note });
            showAlert('success', 'Status Updated', `Order status changed to ${newStatus}`);
            fetchOrders();
        } catch (error) {
            showAlert('error', 'Failed', 'Could not update order status');
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             o._id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Payment Pending': return { bg: '#fffaf0', text: '#d69e2e', icon: <CreditCard size={14}/> };
            case 'Processing': return { bg: '#ebf8ff', text: '#3182ce', icon: <Package size={14}/> };
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
                                            </div>
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <div className="avatar">{order.user?.name?.charAt(0) || 'U'}</div>
                                                <div className="info">
                                                    <span className="name">{order.user?.name}</span>
                                                    <span className="phone">{order.user?.mobile}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="items-cell">
                                                <span className="count">{order.items.length} Items</span>
                                                <span className="preview">{order.items[0]?.medicineName}{order.items.length > 1 ? '...' : ''}</span>
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
                                                    <span className="ready-tag">Awaiting Dispatch</span>
                                                )}
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
                                <div className={`progress-step ${['Payment Pending', 'Processing', 'Out for Delivery', 'Delivered'].indexOf(selectedOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Pending</span>
                                </div>
                                <div className={`progress-step ${['Processing', 'Out for Delivery', 'Delivered'].indexOf(selectedOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Processing</span>
                                </div>
                                <div className={`progress-step ${['Out for Delivery', 'Delivered'].indexOf(selectedOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Shipping</span>
                                </div>
                                <div className={`progress-step ${selectedOrder.status === 'Delivered' ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Delivered</span>
                                </div>
                            </div>

                            <div className="premium-grid">
                                <section className="customer-info-pane">
                                    <div className="pane-header">
                                        <div className="icon-circle"><CreditCard size={18}/></div>
                                        <h3>Customer Details</h3>
                                    </div>
                                    <div className="pane-content">
                                        <div className="data-row">
                                            <span className="data-label">Full Name</span>
                                            <span className="data-value">{selectedOrder.user?.name}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Phone Number</span>
                                            <span className="data-value">{selectedOrder.user?.mobile}</span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">Shipping Address</span>
                                            <span className="data-value address">
                                                {selectedOrder.shippingAddress?.street},<br/>
                                                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zip}
                                            </span>
                                        </div>
                                    </div>
                                </section>

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
                                                        <span className="name">{item.medicineName}</span>
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
                            <button className="btn-glass-cancel" onClick={() => setIsModalOpen(false)}>Close View</button>
                            {selectedOrder.status === 'Payment Pending' && (
                                <button className="btn-glass-primary" onClick={() => {
                                    handleUpdateStatus(selectedOrder._id, 'Processing', 'Verified from details modal');
                                    setIsModalOpen(false);
                                }}>
                                    <CheckCircle size={18} /> Confirm Payment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPharmacyOrders;
