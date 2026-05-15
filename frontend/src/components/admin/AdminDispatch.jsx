import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../../services/api';
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
        pickupStoppage: '',
        estimatedArrivalTime: '',
        vehicleName: '',
        deliveryBoyId: '',
        notes: ''
    });
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);

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

            const filtered = res.data.filter(u => 
                u.roles && u.roles.some(r => 
                    r.name.toLowerCase().includes('delivery') || 
                    r.name.toLowerCase().includes('dispatch')
                )
            );

            setDeliveryBoys(filtered);
        } catch (err) {
            console.error("Failed to fetch delivery personnel", err);
        }
    };

    const openDispatchModal = async (order) => {
        setSelectedOrder(order);
        setAssignPayload({ routeId: '', busId: '', pickupStoppage: '', estimatedArrivalTime: '', deliveryBoyId: '', notes: '' });
        setBuses([]);
    };

    const handleRouteSelect = async (routeId) => {
        setAssignPayload(p => ({ ...p, routeId, busId: '' }));
        if (!routeId) {
            setBuses([]);
            return;
        }
        try {
            const res = await api.get(`/delivery/routes/${routeId}/buses`);
            setBuses(res.data || []);
        } catch (err) {
            console.error("Fetch buses failed", err);
            setBuses([]);
        }
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrderIds(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId) 
                : [...prev, orderId]
        );
    };

    const handleBulkAssign = () => {
        if (selectedOrderIds.length === 0) return;
        // Open modal but set selectedOrder to a placeholder that indicates bulk
        setSelectedOrder({ _id: 'BULK', shippingAddress: { street: 'Multiple Orders', city: `${selectedOrderIds.length} selected` } });
        setAssignPayload({ routeId: '', busId: '', pickupStoppage: '', estimatedArrivalTime: '', deliveryBoyId: '', notes: '' });
        setBuses([]);
    };

    const submitAssignment = async (e) => {
        e.preventDefault();
        const isBulk = selectedOrder._id === 'BULK';
        
        try {
            if (isBulk) {
                await api.post('/delivery/bulk-assign', {
                    orderIds: selectedOrderIds,
                    routeId: assignPayload.routeId,
                    busId: assignPayload.busId,
                    deliveryBoyId: assignPayload.deliveryBoyId,
                    pickupStoppage: assignPayload.pickupStoppage,
                    estimatedArrivalTime: assignPayload.estimatedArrivalTime,
                    vehicleName: assignPayload.vehicleName,
                    notes: assignPayload.notes
                });
                toast.success(`${selectedOrderIds.length} Orders Dispatched!`);
                setSelectedOrderIds([]);
            } else {
                await api.post('/delivery/assign', {
                    orderId: selectedOrder._id,
                    routeId: assignPayload.routeId,
                    busId: assignPayload.busId,
                    deliveryBoyId: assignPayload.deliveryBoyId,
                    pickupStoppage: assignPayload.pickupStoppage,
                    estimatedArrivalTime: assignPayload.estimatedArrivalTime,
                    vehicleName: assignPayload.vehicleName,
                    notes: assignPayload.notes
                });
                toast.success("Order Successfully Dispatched!");
            }
            setSelectedOrder(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to dispatch");
        }
    };

    return (
        <div className="dispatch-container">
            <div className="dispatch-header">
                <div>
                    <h2>Order Dispatch Center</h2>
                    <p>Assign paid transactions and medicine fulfillments to the logistics fleet.</p>
                </div>
                {selectedOrderIds.length > 0 && (
                    <button className="btn-bulk-dispatch" onClick={handleBulkAssign}>
                        Dispatch {selectedOrderIds.length} Selected
                    </button>
                )}
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
                        <div key={order._id} className={`order-card-d ${selectedOrderIds.includes(order._id) ? 'selected' : ''}`}>
                            <div className="o-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                        type="checkbox" 
                                        className="order-checkbox"
                                        checked={selectedOrderIds.includes(order._id)}
                                        onChange={() => toggleOrderSelection(order._id)}
                                    />
                                    <span className="o-id">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                                </div>
                                <span className={`o-badge ${order.paymentDetails?.method === 'COD' ? 'cod' : 'paid'}`}>
                                    {order.paymentDetails?.method === 'COD' ? 'COD' : 'PREPAID'}
                                </span>
                            </div>
                            <div className="o-card-body" onClick={() => toggleOrderSelection(order._id)} style={{ cursor: 'pointer' }}>
                                <div className="o-row" style={{ fontWeight: 600, color: '#1e293b' }}>
                                    {order.orderType || 'General Order'} - ₹{order.totalAmount}
                                </div>
                                <div className="o-row">
                                    <User size={16} /> {order.shippingAddress?.phone || order.user?.mobile || 'No Phone'}
                                </div>
                                <div className="o-row">
                                    <MapPin size={16} />
                                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                    </span>
                                </div>
                            </div>
                            <button className="btn-assign-trigger" onClick={() => openDispatchModal(order)}>
                                <Truck size={18} /> Assign to bus
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
                            <h3><Navigation size={24} color="#3b82f6" /> {selectedOrder._id === 'BULK' ? 'Bulk Dispatch Configuration' : 'Dispatch Configuration'}</h3>
                            <button className="btn-close-dm" onClick={() => setSelectedOrder(null)}><X size={24} /></button>
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
                                    onChange={(e) => {
                                        const bId = e.target.value;
                                        const bus = buses.find(b => b._id.toString() === bId);
                                        setAssignPayload({ 
                                            ...assignPayload, 
                                            busId: bId, 
                                            vehicleName: bus?.busName || '',
                                            pickupStoppage: '', 
                                            estimatedArrivalTime: '' 
                                        });
                                    }}
                                    disabled={!assignPayload.routeId}
                                >
                                    <option value="">-- Select Vehicle --</option>
                                    {buses.map(b => (
                                        <option key={b._id} value={b._id.toString()}>{b.busNumber} ({b.busName || 'Vehicle'})</option>
                                    ))}
                                </select>
                                {assignPayload.busId && buses.find(b => b._id.toString() === assignPayload.busId)?.image && (
                                    <div className="bus-preview-select" style={{marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                                        <img 
                                            src={buses.find(b => b._id.toString() === assignPayload.busId).image.startsWith('http') 
                                                ? buses.find(b => b._id.toString() === assignPayload.busId).image 
                                                : `${API_BASE_URL}${buses.find(b => b._id.toString() === assignPayload.busId).image.startsWith('/') ? '' : '/'}${buses.find(b => b._id.toString() === assignPayload.busId).image}`
                                            } 
                                            alt="Selected Bus" 
                                            style={{width: '100%', height: '80px', objectFit: 'cover'}} 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="assign-form-group">
                                <label>3. Select Pickup Stoppage</label>
                                <select
                                    required
                                    value={assignPayload.pickupStoppage}
                                    onChange={(e) => {
                                        const stop = e.target.value;
                                        const bus = buses.find(b => b._id.toString() === assignPayload.busId);
                                        const timing = bus?.stopTimings?.find(st => st.stopName === stop);
                                        setAssignPayload({ 
                                            ...assignPayload, 
                                            pickupStoppage: stop, 
                                            estimatedArrivalTime: timing?.arrivalTime || 'Not Set' 
                                        });
                                    }}
                                    disabled={!assignPayload.busId}
                                >
                                    <option value="">-- Select Station --</option>
                                    {assignPayload.busId && buses.find(b => b._id.toString() === assignPayload.busId)?.stopTimings?.map((st, i) => (
                                        <option key={i} value={st.stopName}>{st.stopName} (Arrives: {st.arrivalTime || 'TBD'})</option>
                                    ))}
                                </select>
                                {assignPayload.estimatedArrivalTime && (
                                    <div className="timing-badge" style={{marginTop: '10px', background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #d1fae5'}}>
                                        Will arrive at {assignPayload.pickupStoppage} by {assignPayload.estimatedArrivalTime}
                                    </div>
                                )}
                            </div>

                            <div className="assign-form-group">
                                <label>4. Assign Delivery Courier</label>
                                <select
                                    required
                                    value={assignPayload.deliveryBoyId}
                                    onChange={(e) => setAssignPayload({ ...assignPayload, deliveryBoyId: e.target.value })}
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
                                    onChange={(e) => setAssignPayload({ ...assignPayload, notes: e.target.value })}
                                    placeholder="e.g., Handle with care, fragile medicines..."
                                ></textarea>
                            </div>

                            <button type="submit" className="btn-confirm-assign" disabled={!assignPayload.routeId || !assignPayload.busId || !assignPayload.deliveryBoyId || !assignPayload.pickupStoppage}>
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
