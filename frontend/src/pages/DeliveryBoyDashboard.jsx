import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Truck, MapPin, Phone, CheckCircle, Package, ExternalLink, Navigation } from 'lucide-react';
import './DeliveryBoyDashboard.css';

const DeliveryBoyDashboard = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Assigned'); // Assigned, In Transit, Delivered

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await api.get('/delivery/my-assignments');
            setAssignments(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/delivery/assignments/${id}/status`, { status });
            fetchAssignments();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const openMaps = (address) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${address.street}, ${address.city}, ${address.state}`
        )}`;
        window.open(url, '_blank');
    };

    const filtered = assignments.filter(a => {
        if (filter === 'Delivered') return a.status === 'Delivered';
        if (filter === 'Assigned') return a.status === 'Assigned';
        if (filter === 'In Transit') return a.status === 'In Transit';
        return true;
    });

    return (
        <>
            <Navbar />
            <div className="delivery-dashboard">
                <div className="delivery-container">
                    <header className="delivery-header">
                        <div className="user-profile">
                            <Truck size={32} color="var(--primary)" />
                            <div>
                                <h1>Delivery Partner</h1>
                                <p>Express Medical Delivery</p>
                            </div>
                        </div>
                    </header>

                    <div className="delivery-tabs">
                        <button className={filter === 'Assigned' ? 'active' : ''} onClick={() => setFilter('Assigned')}>To Pick</button>
                        <button className={filter === 'In Transit' ? 'active' : ''} onClick={() => setFilter('In Transit')}>In Transit</button>
                        <button className={filter === 'Delivered' ? 'active' : ''} onClick={() => setFilter('Delivered')}>History</button>
                    </div>

                    <div className="assignment-list">
                        {loading ? (
                            <div className="loading-state">Loading assignments...</div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state">
                                <Package size={48} color="#cbd5e0" />
                                <p>No orders found in this category.</p>
                            </div>
                        ) : (
                            filtered.map(a => (
                                <div key={a._id} className="assignment-card glassmorphism-modern">
                                    <div className="card-top">
                                        <span className="order-id">#{a.orderId?._id?.slice(-6).toUpperCase()}</span>
                                        <span className={`status-pill ${a.status.toLowerCase().replace(' ', '-')}`}>
                                            {a.status}
                                        </span>
                                    </div>

                                    <div className="customer-info">
                                        <h3>{a.orderId?.user?.name}</h3>
                                        <div className="info-row">
                                            <Phone size={16} />
                                            <a href={`tel:${a.orderId?.user?.mobile}`}>{a.orderId?.user?.mobile}</a>
                                        </div>
                                        <div className="info-row align-start">
                                            <MapPin size={16} />
                                            <p>{a.orderId?.shippingAddress?.street}, {a.orderId?.shippingAddress?.city}</p>
                                        </div>
                                    </div>

                                    <div className="transport-chip">
                                        <div className="chip-item">
                                            <span className="label">Bus No:</span>
                                            <span className="value">{a.busId?.busNumber || 'Local'}</span>
                                        </div>
                                        <div className="chip-item">
                                            <span className="label">Route:</span>
                                            <span className="value">{a.routeId?.routeName || 'Direct'}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button className="btn btn-secondary" onClick={() => openMaps(a.orderId?.shippingAddress)}>
                                            <Navigation size={18} /> Location
                                        </button>

                                        {a.status === 'Assigned' && (
                                            <button className="btn btn-primary" onClick={() => updateStatus(a._id, 'In Transit')}>
                                                Start Delivery
                                            </button>
                                        )}

                                        {a.status === 'In Transit' && (
                                            <button className="btn btn-success" onClick={() => updateStatus(a._id, 'Delivered')}>
                                                Mark Delivered
                                            </button>
                                        )}
                                        
                                        {a.status === 'Delivered' && (
                                            <button className="btn btn-disabled" disabled>
                                                <CheckCircle size={18} /> Completed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default DeliveryBoyDashboard;
