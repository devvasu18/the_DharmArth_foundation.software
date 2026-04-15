import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useConfirm } from '../context/ConfirmContext';
import { 
    Truck, MapPin, Phone, CheckCircle, Package, 
    Navigation, CreditCard, ClipboardList, Clock, 
    ChevronRight, LogOut 
} from 'lucide-react';
import './DeliveryBoyDashboard.css';

const DeliveryBoyDashboard = () => {
    const { showAlert, showConfirm } = useConfirm();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Assigned'); 
    const [userData, setUserData] = useState(null);
    const [imageModalSrc, setImageModalSrc] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUserData(storedUser);
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
        const actionText = status === 'In Transit' ? 'Start this delivery?' : 'Mark as Delivered?';
        const isConfirmed = await showConfirm(
            "Confirm Action",
            `Are you sure you want to ${actionText}`
        );

        if (!isConfirmed) return;

        try {
            await api.patch(`/delivery/assignments/${id}/status`, { status });
            showAlert('success', 'Status Updated', `Order is now ${status}`);
            fetchAssignments();
        } catch (err) {
            showAlert('error', 'Update Failed', 'Could not sync status with server.');
        }
    };

    const openMaps = (address) => {
        if (!address) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${address.street}, ${address.city}, ${address.state}`
        )}`;
        window.open(url, '_blank');
    };

    // Calculate Stats
    const stats = {
        today: assignments.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length,
        completed: assignments.filter(a => a.status === 'Delivered').length
    };

    const filtered = assignments.filter(a => {
        if (filter === 'Delivered') return a.status === 'Delivered';
        if (filter === 'Assigned') return a.status === 'Assigned' || a.status === 'Ready';
        if (filter === 'In Transit') return a.status === 'In Transit';
        return true;
    });

    return (
        <div className="delivery-dashboard-page">
            <Navbar />
            
            <div className="delivery-dashboard">
                <main className="delivery-container">
                    
                    {/* Hero Profile Header */}
                    <div className="delivery-header">
                        <div className="rider-profile">
                            <div className="rider-avatar">
                                <Truck size={35} color="#000000" strokeWidth={2.5} />
                            </div>
                            <div className="rider-info">
                                <h1>{userData?.name || 'Delivery Partner'}</h1>
                                <p>Medical Dispatch Division</p>
                            </div>
                        </div>
                        <div className="rider-status">
                            ON DUTY
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <div className="stat-card">
                            <span className="label">Today Orders</span>
                            <span className="value">{stats.today}</span>
                        </div>
                        <div className="stat-card">
                            <span className="label">Completed</span>
                            <span className="value">{stats.completed}</span>
                        </div>
                    </div>

                    {/* Segmented Navigation */}
                    <div className="delivery-tabs">
                        <button className={filter === 'Assigned' ? 'active' : ''} onClick={() => setFilter('Assigned')}>
                            <Package size={18} /> To Pick
                        </button>
                        <button className={filter === 'In Transit' ? 'active' : ''} onClick={() => setFilter('In Transit')}>
                            <Clock size={18} /> Active
                        </button>
                        <button className={filter === 'Delivered' ? 'active' : ''} onClick={() => setFilter('Delivered')}>
                            <CheckCircle size={18} /> History
                        </button>
                    </div>

                    {/* Orders Feed */}
                    <div className="assignment-feed">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Syncing your schedule...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="empty-state">
                                <Package size={60} strokeWidth={1} />
                                <h3>All Clear!</h3>
                                <p>No {filter.toLowerCase()} deliveries right now.</p>
                            </div>
                        ) : (
                            filtered.map(a => (
                                <div key={a._id} className="assignment-card">
                                    <div className="card-header">
                                        <div className="order-badge">#{a.orderId?._id?.slice(-8).toUpperCase()}</div>
                                        <div className={`status-indicator ${a.status.toLowerCase().replace(' ', '-')}`}>
                                            <div className="dot" style={{width:8, height:8, borderRadius:'50%', background:'currentColor'}}></div>
                                            {a.status}
                                        </div>
                                    </div>

                                    <div className="customer-section">
                                        <h2 className="customer-name">{a.orderId?.user?.name || 'Valued Customer'}</h2>
                                        
                                        <a href={`tel:${a.orderId?.user?.mobile}`} className="phone-strip">
                                            <Phone size={16} /> 
                                            {a.orderId?.user?.mobile}
                                        </a>

                                        <div className="address-box">
                                            <MapPin size={22} className="text-gray-400" />
                                            <div>
                                                <p style={{margin:0, fontWeight:700}}>Destination</p>
                                                <p style={{margin:0, fontSize:'0.95rem'}}>{a.orderId?.shippingAddress?.street}, {a.orderId?.shippingAddress?.city}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="logistic-details">
                                        <div className="pill-info">
                                            <span className="label">Route</span>
                                            <span className="value">{a.routeId?.routeName || 'Direct'}</span>
                                        </div>
                                        <div className="pill-info">
                                            <span className="label">Vehicle</span>
                                            <span className="value">{a.busId?.busName || 'Express'} ({a.busId?.busNumber || 'N/A'})</span>
                                        </div>
                                    </div>

                                    {/* Vehicle Photo Preview */}
                                    {(a.busId?.image || a.orderId?.dispatchDetails?.busImage) && (
                                        <div 
                                            className="rider-bus-preview"
                                            onClick={() => setImageModalSrc(a.busId?.image || a.orderId?.dispatchDetails?.busImage)}
                                        >
                                            <img 
                                                src={(a.busId?.image || a.orderId?.dispatchDetails?.busImage).startsWith('http')
                                                    ? (a.busId?.image || a.orderId?.dispatchDetails?.busImage)
                                                    : `http://localhost:5000${(a.busId?.image || a.orderId?.dispatchDetails?.busImage).startsWith('/') ? '' : '/'}${(a.busId?.image || a.orderId?.dispatchDetails?.busImage)}`
                                                } 
                                                alt="Vehicle" 
                                            />
                                            <div className="preview-overlay">
                                                <span>IDENTITY PHOTO • CLICK TO ZOOM</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="action-row">
                                        <button className="btn-nav" onClick={() => openMaps(a.orderId?.shippingAddress)} title="Navigate">
                                            <Navigation size={22} />
                                        </button>

                                        {a.status === 'Assigned' && (
                                            <button className="btn-main start" onClick={() => updateStatus(a._id, 'In Transit')}>
                                                Start Delivery <ChevronRight size={20} />
                                            </button>
                                        )}

                                        {a.status === 'In Transit' && (
                                            <button className="btn-main finish" onClick={() => updateStatus(a._id, 'Delivered')}>
                                                Mark Delivered <CheckCircle size={20} />
                                            </button>
                                        )}
                                        
                                        {a.status === 'Delivered' && (
                                            <button className="btn-main" disabled style={{background:'#f1f5f9', color:'#94a3b8'}}>
                                                Delivered Successfully
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
            
            {/* Image Viewer Modal */}
            {imageModalSrc && (
                <div className="image-viewer-modal-overlay" onClick={() => setImageModalSrc(null)}>
                    <div className="image-viewer-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-viewer" onClick={() => setImageModalSrc(null)}>
                            <LogOut size={24} color="white" style={{transform: 'rotate(180deg)'}} />
                        </button>
                        <img 
                            src={imageModalSrc.startsWith('http') 
                                ? imageModalSrc 
                                : `http://localhost:5000${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`
                            } 
                            alt="Full View" 
                        />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default DeliveryBoyDashboard;

