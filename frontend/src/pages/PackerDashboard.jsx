import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';
import { 
    Package, 
    CheckCircle2, 
    ShieldCheck, 
    Printer, 
    Search, 
    Clock, 
    Truck, 
    X, 
    Calendar, 
    User, 
    Phone, 
    MapPin, 
    AlertTriangle,
    QrCode
} from 'lucide-react';
import './PackerDashboard.css';

const PackerDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'packed'
    const [selectedOrderForSlip, setSelectedOrderForSlip] = useState(null);
    const [verifiedItemsMap, setVerifiedItemsMap] = useState({}); // { [orderId]: { [itemIdx]: boolean } }
    const [sealVerifiedMap, setSealVerifiedMap] = useState({}); // { [orderId]: boolean }
    const [submittingOrderId, setSubmittingOrderId] = useState(null);

    useEffect(() => {
        fetchPackingQueue();
    }, []);

    const fetchPackingQueue = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders/packing-queue');
            setOrders(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching packing queue:', err);
            toast.error('Failed to load packing orders');
            setLoading(false);
        }
    };

    const toggleItemVerified = (orderId, itemIdx) => {
        setVerifiedItemsMap(prev => ({
            ...prev,
            [orderId]: {
                ...(prev[orderId] || {}),
                [itemIdx]: !prev[orderId]?.[itemIdx]
            }
        }));
    };

    const toggleSealVerified = (orderId) => {
        setSealVerifiedMap(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const handleMarkPacked = async (order) => {
        // Verify all items are checked
        const verifiedItems = verifiedItemsMap[order._id] || {};
        const allItemsChecked = order.items?.every((_, idx) => verifiedItems[idx]);
        
        if (!allItemsChecked) {
            toast.error('Please physically verify and check all medicines before sealing');
            return;
        }

        if (!sealVerifiedMap[order._id]) {
            toast.error('Please confirm tamper-evident seal is affixed');
            return;
        }

        setSubmittingOrderId(order._id);
        try {
            await api.post(`/orders/${order._id}/pack`, {
                tamperSealVerified: true,
                packerNotes: `All ${order.items?.length || 0} items verified for ${order.courseDays || 15} days supply.`
            });
            toast.success(`Order #${order._id.slice(-6).toUpperCase()} packed and queued for dispatch!`);
            fetchPackingQueue();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setSubmittingOrderId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.mobile || '').includes(searchTerm) ||
            (order.shippingAddress?.phone || '').includes(searchTerm);

        if (!matchesSearch) return false;

        if (activeTab === 'pending') {
            return order.status === 'Ready for Packing' || order.status === 'Advance Paid' || order.status === 'Processing';
        } else {
            return order.status === 'Ready for Dispatch' || order.status === 'In Transit' || order.status === 'Delivered';
        }
    });

    return (
        <div className="packer-page">
            <Navbar />
            <div className="packer-container">
                {/* Header Banner */}
                <div className="packer-header">
                    <div className="packer-title-wrap">
                        <div className="packer-icon-badge">
                            <Package size={26} />
                        </div>
                        <div>
                            <h1>Medicine Packing & Quality Verification Console</h1>
                            <p>दवाई पैकिंग, बैच/एक्सपायरी सत्यापन एवं बारकोड सील स्टेशन</p>
                        </div>
                    </div>
                    <div className="packer-stats">
                        <div className="packer-stat-pill">
                            Pending Packing: <strong>{orders.filter(o => o.status === 'Ready for Packing' || o.status === 'Advance Paid').length}</strong>
                        </div>
                    </div>
                </div>

                {/* Controls & Search */}
                <div className="packer-controls">
                    <div className="packer-tabs">
                        <button 
                            className={`packer-tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            📦 Orders to Pack ({orders.filter(o => o.status === 'Ready for Packing' || o.status === 'Advance Paid').length})
                        </button>
                        <button 
                            className={`packer-tab ${activeTab === 'packed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('packed')}
                        >
                            ✅ Dispatched / Ready for Runner
                        </button>
                    </div>

                    <div style={{ position: 'relative', width: '300px' }}>
                        <input
                            type="text"
                            placeholder="Search Order ID, Name, Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px 10px 38px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                    </div>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                        <div className="order-loader" style={{ margin: '0 auto 15px', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        Loading packing queue...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                        <Package size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                        <h3>No orders currently in this queue</h3>
                        <p style={{ fontSize: '13px' }}>जब फार्मासिस्ट बिल अप्रूव करेगा, आर्डर यहाँ पैकिंग के लिए स्वतः आ जायेगा।</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const verifiedCount = Object.values(verifiedItemsMap[order._id] || {}).filter(Boolean).length;
                        const totalItems = order.items?.length || 0;
                        const isBusDelivery = !!(order.shippingAddress?.villageName || order.partnerShop?.shopName);

                        return (
                            <div key={order._id} className="packer-card">
                                <div className="packer-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <span className="order-code-badge">
                                            ORD #{order._id.slice(-6).toUpperCase()}
                                        </span>
                                        <span className={`delivery-type-pill ${isBusDelivery ? 'bus' : 'doorstep'}`}>
                                            {isBusDelivery ? '🚌 Bus Route Stoppage Delivery' : '🛵 Doorstep Delivery'}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={13} /> {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            background: order.status === 'Ready for Dispatch' ? '#dcfce7' : '#e0f2fe',
                                            color: order.status === 'Ready for Dispatch' ? '#166534' : '#0369a1'
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="packer-card-body">
                                    {/* Patient & Route Strip */}
                                    <div className="patient-info-strip">
                                        <div className="patient-info-item">
                                            <span>Recipient / Patient</span>
                                            <strong>
                                                {order.recipientDetails?.type === 'Other' && order.recipientDetails?.patientName 
                                                    ? `${order.recipientDetails.patientName} (${order.recipientDetails.relation || 'Relative'})`
                                                    : order.user?.name || 'Self'}
                                            </strong>
                                        </div>
                                        <div className="patient-info-item">
                                            <span>Phone Number</span>
                                            <strong>{order.recipientDetails?.patientPhone || order.shippingAddress?.phone || order.user?.mobile || 'N/A'}</strong>
                                        </div>
                                        <div className="patient-info-item">
                                            <span>Destination Village / Stoppage</span>
                                            <strong>{order.shippingAddress?.villageName || order.partnerShop?.shopName || order.shippingAddress?.city || 'Direct Address'}</strong>
                                        </div>
                                        <div className="patient-info-item">
                                            <span>Course Duration</span>
                                            <strong style={{ color: '#0284c7' }}>{order.courseDays || 15} Days Supply</strong>
                                        </div>
                                    </div>

                                    {/* Medicines Checklist */}
                                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                                            Medicines to Pack & Verify ({verifiedCount}/{totalItems} Checked)
                                        </h4>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            प्रत्येक स्ट्रिप की एक्सपायरी व बैच देखकर टिक करें
                                        </span>
                                    </div>

                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="items-checklist-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}>Verify</th>
                                                    <th>Medicine Name</th>
                                                    <th>Quantity / Strips</th>
                                                    <th>MARG Batch</th>
                                                    <th>Expiry Date</th>
                                                    <th>Dosage / Instructions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items?.map((item, idx) => {
                                                    const isChecked = !!verifiedItemsMap[order._id]?.[idx];
                                                    return (
                                                        <tr key={idx} className={`item-check-row ${isChecked ? 'verified' : ''}`}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => toggleItemVerified(order._id, idx)}
                                                                    disabled={order.status === 'Ready for Dispatch'}
                                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                                                                />
                                                            </td>
                                                            <td style={{ fontWeight: '700', color: '#0f172a' }}>
                                                                {item.name || item.medicineName}
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: '800', color: '#0284c7' }}>
                                                                    {item.quantity || 1} Unit{item.quantity > 1 ? 's' : ''}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="batch-tag">
                                                                    {item.margBatch || 'B-STD2026'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="expiry-tag">
                                                                    {item.margExpiry || '12/2027'}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontSize: '12px', color: '#64748b' }}>
                                                                {item.dosage || `${item.frequency || ''} ${item.foodRelation || ''}`.trim() || 'As directed by physician'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Action Row */}
                                    <div className="packer-actions-row">
                                        <div>
                                            {order.status !== 'Ready for Dispatch' && (
                                                <label className="seal-confirm-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!sealVerifiedMap[order._id]}
                                                        onChange={() => toggleSealVerified(order._id)}
                                                    />
                                                    <span>Tamper-evident sealing tape affixed & packet barcode attached</span>
                                                </label>
                                            )}
                                        </div>

                                        <div className="packer-btn-group">
                                            <button
                                                type="button"
                                                className="btn-print-slip"
                                                onClick={() => setSelectedOrderForSlip(order)}
                                            >
                                                <Printer size={15} /> Print Packing Barcode Slip
                                            </button>

                                            {order.status !== 'Ready for Dispatch' && (
                                                <button
                                                    type="button"
                                                    className="btn-pack-done"
                                                    disabled={submittingOrderId === order._id}
                                                    onClick={() => handleMarkPacked(order)}
                                                >
                                                    <CheckCircle2 size={16} /> 
                                                    {submittingOrderId === order._id ? 'Marking Packed...' : 'Mark Packed & Ready for Dispatch'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Printable Slip Modal */}
                {selectedOrderForSlip && (
                    <div className="slip-modal-overlay" onClick={() => setSelectedOrderForSlip(null)}>
                        <div className="slip-modal" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Parcel Shipping Label & Packing Slip</h3>
                                <button onClick={() => setSelectedOrderForSlip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="slip-printable-area" id="printable-slip">
                                <div className="slip-header">
                                    <h2>The Dharmarth Medical Foundation</h2>
                                    <p>Central Pharmacy & Tele-Medicine Fulfillment Center</p>
                                </div>

                                <div className="barcode-box">
                                    <div style={{ fontSize: '24px', letterSpacing: '8px' }}>
                                        ||||||||| | ||||| ||||||| | |||
                                    </div>
                                    <div style={{ fontSize: '13px', marginTop: '4px', letterSpacing: '1px' }}>
                                        ORD-{selectedOrderForSlip._id.slice(-8).toUpperCase()}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '10px' }}>Patient / Recipient</div>
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                                            {selectedOrderForSlip.recipientDetails?.patientName || selectedOrderForSlip.user?.name || 'Customer'}
                                        </div>
                                        <div style={{ color: '#334155' }}>
                                            Phone: {selectedOrderForSlip.recipientDetails?.patientPhone || selectedOrderForSlip.shippingAddress?.phone || selectedOrderForSlip.user?.mobile}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '10px' }}>Delivery Destination</div>
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                                            {selectedOrderForSlip.shippingAddress?.villageName || selectedOrderForSlip.partnerShop?.shopName || 'Local Delivery'}
                                        </div>
                                        <div style={{ color: '#334155' }}>
                                            {selectedOrderForSlip.shippingAddress?.stoppageName || selectedOrderForSlip.shippingAddress?.street || 'Bus Stoppage'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', color: '#64748b' }}>
                                        <span>Verified Medicine</span>
                                        <span>Batch / Exp</span>
                                        <span>Qty</span>
                                    </div>
                                    {selectedOrderForSlip.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                                            <span style={{ fontWeight: '600' }}>{item.name || item.medicineName}</span>
                                            <span style={{ color: '#64748b' }}>{item.margBatch || 'B-STD'} / {item.margExpiry || 'EXP-27'}</span>
                                            <span style={{ fontWeight: '800' }}>{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #0f172a', paddingTop: '8px' }}>
                                    <div>Duration: {selectedOrderForSlip.courseDays || 15} Days</div>
                                    <div>Payment: {selectedOrderForSlip.paymentDetails?.method || 'Online'}</div>
                                    <div>Packer Seal: VERIFIED ✓</div>
                                </div>
                            </div>

                            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    onClick={() => setSelectedOrderForSlip(null)}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0284c7', color: 'white', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Printer size={15} /> Print Label
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default PackerDashboard;
