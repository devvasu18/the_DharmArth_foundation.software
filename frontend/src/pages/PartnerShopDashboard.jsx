import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';
import {
    Store, Bus, PackageCheck, IndianRupee, KeyRound,
    CheckCircle2, Clock, Phone, AlertTriangle, ShieldCheck
} from 'lucide-react';
import './PartnerShopDashboard.css';

const PartnerShopDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('incoming'); // 'incoming', 'in_shop', 'completed'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [otpInput, setOtpInput] = useState('');
    const [cashCollected, setCashCollected] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/partner-shop/orders');
            setOrders(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load partner shop orders');
        } finally {
            setLoading(false);
        }
    };

    const handleReceiveFromBus = async (orderId) => {
        try {
            await api.post(`/partner-shop/orders/${orderId}/receive-bus`);
            toast.success('Parcel received from bus and safely stored in shop!');
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error('Failed to confirm bus parcel receipt');
        }
    };

    const handleCompleteHandover = async () => {
        if (!selectedOrder) return;
        setSubmitting(true);
        try {
            await api.post(`/partner-shop/orders/${selectedOrder._id}/handover-otp`, {
                otp: otpInput,
                cashCollected
            });
            toast.success('Medicine successfully handed over to patient!');
            setSelectedOrder(null);
            setOtpInput('');
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Handover failed');
        } finally {
            setSubmitting(false);
        }
    };

    const incomingOrders = orders.filter(o => ['In Transit', 'Ready for Dispatch'].includes(o.status));
    const inShopOrders = orders.filter(o => o.status === 'Arrived at Partner Shop');
    const completedOrders = orders.filter(o => o.status === 'Delivered');

    const totalCodCollected = completedOrders.reduce((sum, o) => {
        return sum + (o.partnerShop?.codCollected ? (o.partnerShop?.codAmount || o.totalAmount || 0) : 0);
    }, 0);

    return (
        <div className="partner-shop-layout">
            <Navbar />
            <div className="partner-shop-container">
                {/* Header */}
                <div className="partner-shop-header">
                    <div className="header-title">
                        <Store className="store-icon" />
                        <div>
                            <h1>Village Partner Drop-off Console</h1>
                            <p>Manage incoming transit bus deliveries, verify customer OTPs, and collect Partner Cash-on-Delivery.</p>
                        </div>
                    </div>
                    <div className="cod-summary-badge">
                        <IndianRupee className="rupee-icon" />
                        <div>
                            <span className="label">Total COD Cash in Hand</span>
                            <strong>₹{totalCodCollected}</strong>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="partner-tabs-bar">
                    <button
                        className={`partner-tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('incoming')}
                    >
                        <Bus size={16} /> Incoming via Bus ({incomingOrders.length})
                    </button>
                    <button
                        className={`partner-tab-btn ${activeTab === 'in_shop' ? 'active' : ''}`}
                        onClick={() => setActiveTab('in_shop')}
                    >
                        <PackageCheck size={16} /> Ready in Shop for Pickup ({inShopOrders.length})
                    </button>
                    <button
                        className={`partner-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        <CheckCircle2 size={16} /> Completed Handover ({completedOrders.length})
                    </button>
                </div>

                {/* Tab Views */}
                {loading ? (
                    <div className="loading-card">
                        <Clock className="spin-icon" />
                        <p>Loading village partner assignments...</p>
                    </div>
                ) : (
                    <div className="partner-orders-grid">
                        {activeTab === 'incoming' && (
                            incomingOrders.length === 0 ? (
                                <div className="empty-orders-card">
                                    <Bus size={40} />
                                    <h3>No Incoming Bus Shipments</h3>
                                    <p>All dispatched consignments have already arrived or none are scheduled right now.</p>
                                </div>
                            ) : (
                                incomingOrders.map((order) => (
                                    <div key={order._id} className="partner-order-card incoming">
                                        <div className="card-top">
                                            <span className="order-num">#{order._id.slice(-6).toUpperCase()}</span>
                                            <span className="badge-transit">In Transit</span>
                                        </div>
                                        <div className="bus-details-box">
                                            <strong><Bus size={14} /> Bus No: {order.dispatchDetails?.busNumber || 'Assigned Transit Bus'}</strong>
                                            <p>Conductor: {order.dispatchDetails?.conductorNumber || 'Contact at stand'}</p>
                                            <p>ETA: {order.dispatchDetails?.estimatedArrivalTime || 'On Schedule'}</p>
                                        </div>
                                        <div className="patient-snippet">
                                            <p><strong>Patient:</strong> {order.recipientDetails?.patientName || order.user?.name}</p>
                                            <p><strong>Phone:</strong> {order.recipientDetails?.patientPhone || order.user?.mobile}</p>
                                        </div>
                                        <button
                                            className="btn-receive-bus"
                                            onClick={() => handleReceiveFromBus(order._id)}
                                        >
                                            <PackageCheck size={16} /> Confirm Parcel Received from Conductor
                                        </button>
                                    </div>
                                ))
                            )
                        )}

                        {activeTab === 'in_shop' && (
                            inShopOrders.length === 0 ? (
                                <div className="empty-orders-card">
                                    <PackageCheck size={40} />
                                    <h3>No Parcels Waiting for Pickup</h3>
                                    <p>Incoming shipments received from the bus will appear here for patient collection.</p>
                                </div>
                            ) : (
                                inShopOrders.map((order) => {
                                    const isCod = order.paymentDetails?.method === 'PARTNER_COD';
                                    const amountToCollect = order.advancePaymentDetails?.balanceDue || order.totalAmount;
                                    return (
                                        <div key={order._id} className="partner-order-card in-shop">
                                            <div className="card-top">
                                                <span className="order-num">#{order._id.slice(-6).toUpperCase()}</span>
                                                <span className="badge-in-shop">In Shop</span>
                                            </div>
                                            <div className="patient-snippet">
                                                <h4>{order.recipientDetails?.patientName || order.user?.name}</h4>
                                                <p><Phone size={13} /> {order.recipientDetails?.patientPhone || order.user?.mobile}</p>
                                                <p>Stoppage: {order.shippingAddress?.stoppageName || order.shippingAddress?.villageName}</p>
                                            </div>
                                            <div className={`payment-pill ${isCod ? 'cod-pending' : 'prepaid'}`}>
                                                {isCod ? (
                                                    <span><IndianRupee size={14} /> Collect Cash on Handover: <strong>₹{amountToCollect}</strong></span>
                                                ) : (
                                                    <span><ShieldCheck size={14} /> Fully Paid Online (No Cash)</span>
                                                )}
                                            </div>
                                            <button
                                                className="btn-handover-modal"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setCashCollected(isCod);
                                                }}
                                            >
                                                <KeyRound size={16} /> Verify OTP & Hand Over
                                            </button>
                                        </div>
                                    );
                                })
                            )
                        )}

                        {activeTab === 'completed' && (
                            completedOrders.length === 0 ? (
                                <div className="empty-orders-card">
                                    <CheckCircle2 size={40} />
                                    <h3>No Completed Handover Records</h3>
                                </div>
                            ) : (
                                completedOrders.map((order) => (
                                    <div key={order._id} className="partner-order-card completed">
                                        <div className="card-top">
                                            <span className="order-num">#{order._id.slice(-6).toUpperCase()}</span>
                                            <span className="badge-delivered">Handed Over</span>
                                        </div>
                                        <p><strong>Patient:</strong> {order.recipientDetails?.patientName || order.user?.name}</p>
                                        <p><strong>Date:</strong> {new Date(order.updatedAt).toLocaleString()}</p>
                                        {order.partnerShop?.codCollected && (
                                            <div className="cod-received-banner">
                                                <IndianRupee size={14} /> Cash Collected: ₹{order.partnerShop?.codAmount || order.totalAmount}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}

                {/* Handover OTP Modal */}
                {selectedOrder && (
                    <div className="partner-modal-overlay">
                        <div className="partner-modal-box">
                            <div className="modal-header">
                                <h3>Verify Patient Handover</h3>
                                <button className="btn-close" onClick={() => setSelectedOrder(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <p>Ask the patient for the 4-digit pickup code sent to their phone.</p>
                                <div className="otp-input-group">
                                    <label>Enter Patient OTP</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="e.g. 1234"
                                        value={otpInput}
                                        onChange={(e) => setOtpInput(e.target.value)}
                                    />
                                </div>

                                {selectedOrder.paymentDetails?.method === 'PARTNER_COD' && (
                                    <div className="cod-confirm-checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={cashCollected}
                                                onChange={(e) => setCashCollected(e.target.checked)}
                                            />
                                            I have collected cash ₹{selectedOrder.advancePaymentDetails?.balanceDue || selectedOrder.totalAmount}
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn-confirm-delivery"
                                    disabled={submitting}
                                    onClick={handleCompleteHandover}
                                >
                                    <CheckCircle2 size={16} /> Complete Medicine Handover
                                </button>
                                <button className="btn-cancel" onClick={() => setSelectedOrder(null)}>
                                    Cancel
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

export default PartnerShopDashboard;
