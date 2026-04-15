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
    Package
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
                    <div className="order-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order Details</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><ChevronDown size={24} /></button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="detail-section">
                                <h3>Customer & Shipping</h3>
                                <div className="detail-grid">
                                    <div className="info-block">
                                        <span className="label">Customer Name</span>
                                        <span className="value">{selectedOrder.user?.name}</span>
                                    </div>
                                    <div className="info-block">
                                        <span className="label">Mobile</span>
                                        <span className="value">{selectedOrder.user?.mobile}</span>
                                    </div>
                                    <div className="info-block full-width">
                                        <span className="label">Delivery Address</span>
                                        <span className="value">
                                            {selectedOrder.shippingAddress?.street},<br/>
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.zip}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Medicines & Dosage</h3>
                                <div className="medicine-list">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="medicine-item">
                                            <div className="med-header">
                                                <span className="med-name">{item.medicineName}</span>
                                                <span className="med-qty">Qty: {item.quantity || 1}</span>
                                                <span className="med-price">₹{Number(item.price || 0).toFixed(2)}</span>
                                            </div>
                                            {(item.time || item.frequency || item.foodRelation) && (
                                                <div className="med-dosage">
                                                    <span className="dosage-tag">{item.frequency}</span>
                                                    <span className="dosage-tag">{item.time}</span>
                                                    <span className="dosage-tag">{item.foodRelation}</span>
                                                    {item.intakeMethod && <span className="dosage-tag">{item.intakeMethod}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-total">
                                <span>Grand Total</span>
                                <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Close</button>
                            {selectedOrder.status === 'Payment Pending' && (
                                <button className="btn-primary" onClick={() => {
                                    handleUpdateStatus(selectedOrder._id, 'Processing', 'Verified from details modal');
                                    setIsModalOpen(false);
                                }}>Confirm Payment</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPharmacyOrders;
