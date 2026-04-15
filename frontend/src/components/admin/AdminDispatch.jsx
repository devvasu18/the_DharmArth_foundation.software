import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Truck, MapPin, Phone, User, CheckCircle, Navigation, X, AlertCircle } from 'lucide-react';
import './AdminDispatch.css';

const AdminDispatch = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [allRoutes, setAllRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [deliveryBoys, setDeliveryBoys] = useState([]);

    const [assignPayload, setAssignPayload] = useState({
        routeId: '',
        busId: '',
        deliveryBoyId: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
        fetchDeliveryBoys();
        fetchAllRoutes();
    }, []);

    const fetchAllRoutes = async () => {
        try {
            const res = await api.get('/delivery/routes');
            // Check if it's paginated response or direct array
            setAllRoutes(res.data.routes || res.data);
        } catch (err) {
            console.error("Failed to load routes", err);
        }
    };

    const fetchData = async () => {
        try {
            const res = await api.get('/delivery/unassigned-orders');
            setOrders(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load orders");
            setLoading(false);
        }
    };

    const fetchDeliveryBoys = async () => {
        try {
            // Use the staff endpoint since delivery boys are staff members
            const res = await api.get('/users/staff'); 
            
            // Filter locally for delivery-related roles
            const filtered = res.data.filter(u => u.roles && u.roles.some(r => 
                r.name === 'DeliveryBoy' || 
                r.name === 'Delivery boy' || 
                r.name === 'Delivery Person' ||
                u.isSuperAdmin
            ));
            
            setDeliveryBoys(filtered);
        } catch (err) {
            console.error("Failed to fetch delivery personnel", err);
        }
    };

    const openDispatchModal = async (order) => {
        setSelectedOrder(order);
        setAssignPayload({ routeId: '', busId: '', deliveryBoyId: '', notes: '' });
        setBuses([]);
    };

    const handleRouteSelect = async (routeId) => {
        setAssignPayload(p => ({ ...p, routeId, busId: '' }));
        if(!routeId) {
            setBuses([]);
            return;
        }
        try {
            const res = await api.get(`/delivery/routes/${routeId}/buses`);
            setBuses(res.data);
        } catch(err) {
            console.error("Fetch buses failed");
        }
    };

    const submitAssignment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delivery/assign', {
                orderId: selectedOrder._id,
                ...assignPayload
            });
            toast.success("Order Successfully Dispatched!");
            setSelectedOrder(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to dispatch order");
        }
    };

    return (
        <div className="dispatch-container">
            <div className="dispatch-header">
                <h2>Order Dispatch Center</h2>
                <p>Assign paid transactions and medicine fulfillments to the logistics fleet.</p>
            </div>

            {loading ? (
                <div>Loading pending orders...</div>
            ) : orders.length === 0 ? (
                <div className="empty-state-d">
                    <CheckCircle size={48} color="#10b981" />
                    <p>All clear! There are no unassigned orders currently.</p>
                </div>
            ) : (
                <div className="order-grid">
                    {orders.map(order => (
                        <div key={order._id} className="order-card-d">
                            <div className="o-card-header">
                                <span className="o-id">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                                <span className={`o-badge ${order.paymentDetails?.method === 'COD' ? 'cod' : 'paid'}`}>
                                    {order.paymentDetails?.method === 'COD' ? 'COD' : 'PREPAID'}
                                </span>
                            </div>
                            <div className="o-card-body">
                                <div className="o-row" style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {order.orderType || 'General Order'} - ₹{order.totalAmount}
                                </div>
                                <div className="o-row">
                                    <User size={16} /> {order.shippingAddress?.phone || order.user?.mobile || 'No Phone'}
                                </div>
                                <div className="o-row">
                                    <MapPin size={16} /> 
                                    <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                        {order.shippingAddress?.street}, {order.shippingAddress?.city} 
                                    </span>
                                </div>
                            </div>
                            <button className="btn-assign-trigger" onClick={() => openDispatchModal(order)}>
                                <Truck size={18} /> Assign to Fleet
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Dispatch Modal */}
            {selectedOrder && (
                <div className="dispatch-modal-overlay">
                    <div className="dispatch-modal-card">
                        <div className="dm-header">
                            <h3><Navigation size={24} color="#3b82f6" /> Dispatch Configuration</h3>
                            <button className="btn-close-dm" onClick={() => setSelectedOrder(null)}><X size={24}/></button>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.9rem' }}>
                                <MapPin size={16} />
                                <strong>Delivery to:</strong>
                                <span>{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}</span>
                            </div>
                        </div>

                        <form onSubmit={submitAssignment}>
                            <div className="assign-form-group">
                                <label>1. Confirm Route</label>
                                <select 
                                    required 
                                    value={assignPayload.routeId} 
                                    onChange={(e) => handleRouteSelect(e.target.value)}
                                >
                                    <option value="">-- Select Destination Route --</option>
                                    {allRoutes.map(r => (
                                        <option key={r._id} value={r._id}>{r.routeName} ({r.stops?.length || 0} stops)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="assign-form-group">
                                <label>2. Select Active Bus / Van</label>
                                <select 
                                    required 
                                    value={assignPayload.busId} 
                                    onChange={(e) => setAssignPayload({...assignPayload, busId: e.target.value})}
                                    disabled={!assignPayload.routeId}
                                >
                                    <option value="">-- Select Vehicle --</option>
                                    {buses.map(b => (
                                        <option key={b._id} value={b._id}>{b.busNumber} (Driver: {b.mobileNumber})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="assign-form-group">
                                <label>3. Assign Personnel (Delivery Boy)</label>
                                <select 
                                    required 
                                    value={assignPayload.deliveryBoyId} 
                                    onChange={(e) => setAssignPayload({...assignPayload, deliveryBoyId: e.target.value})}
                                >
                                    <option value="">-- Select Delivery Agent --</option>
                                    {deliveryBoys.map(db => (
                                        <option key={db._id} value={db._id}>{db.name} ({db.mobile})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="assign-form-group">
                                <label>Additional Dispatch Notes</label>
                                <textarea 
                                    rows="3" 
                                    value={assignPayload.notes}
                                    onChange={(e) => setAssignPayload({...assignPayload, notes: e.target.value})}
                                    placeholder="e.g., Handle with care, fragile medicines..."
                                ></textarea>
                            </div>

                            <button type="submit" className="btn-confirm-assign" disabled={!assignPayload.routeId || !assignPayload.busId || !assignPayload.deliveryBoyId}>
                                Finalize Dispatch
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
};

export default AdminDispatch;
