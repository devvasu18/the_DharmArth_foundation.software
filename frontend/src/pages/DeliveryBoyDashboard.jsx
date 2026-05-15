import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import {
    Truck, MapPin, Phone, CheckCircle, Package,
    Navigation, CreditCard, ClipboardList, Clock,
    ChevronRight, LogOut, X
} from 'lucide-react';
import './DeliveryBoyDashboard.css';

const DeliveryBoyDashboard = () => {
    const { showAlert, showConfirm } = useConfirm();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Assigned');
    const [imageModalSrc, setImageModalSrc] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Handover Modal State
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [handoverDetails, setHandoverDetails] = useState({
        driverNumber: '',
        actualDepartureTime: new Date().toISOString().slice(0, 16),
        handoverImage: ''
    });
    const [uploading, setUploading] = useState(false);

    const toggleSelection = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedIds.length === 0) return;

        if (status === 'Delivered') {
            // Use the first selected assignment as reference for the bus details
            const refAssignment = assignments.find(a => a._id === selectedIds[0]);
            setSelectedAssignment({ _id: 'BULK', busId: refAssignment?.busId });
            setHandoverDetails({
                driverNumber: refAssignment?.busId?.mobileNumber || '',
                actualDepartureTime: new Date().toISOString().slice(0, 16),
                handoverImage: ''
            });
            setShowHandoverModal(true);
            return;
        }

        const isConfirmed = await showConfirm(
            "Bulk Action",
            `Update ${selectedIds.length} orders to ${status}?`
        );
        if (!isConfirmed) return;

        try {
            await api.patch('/delivery/assignments/bulk-status', { 
                assignmentIds: selectedIds,
                status 
            });
            toast.success('Batch updated successfully');
            setSelectedIds([]);
            fetchAssignments();
        } catch (err) {
            toast.error('Bulk update failed');
        }
    };

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
            toast.success(`Order is now ${status}`);
            fetchAssignments();
        } catch (err) {
            toast.error('Could not sync status with server.');
        }
    };

    const handleOpenHandover = (assignment) => {
        setSelectedAssignment(assignment);
        setHandoverDetails({
            driverNumber: assignment.busId?.mobileNumber || '',
            actualDepartureTime: new Date().toISOString().slice(0, 16),
            handoverImage: ''
        });
        setShowHandoverModal(true);
    };

    const handleCompleteHandover = async () => {
        const isBulk = selectedAssignment._id === 'BULK';
        try {
            if (isBulk) {
                await api.patch('/delivery/assignments/bulk-status', {
                    assignmentIds: selectedIds,
                    status: 'Delivered',
                    ...handoverDetails
                });
                toast.success('Batch handover complete!');
                setSelectedIds([]);
            } else {
                await api.patch(`/delivery/assignments/${selectedAssignment._id}/status`, {
                    status: 'Delivered',
                    ...handoverDetails
                });
                toast.success('Handover complete!');
            }
            setShowHandoverModal(false);
            fetchAssignments();
        } catch (err) {
            toast.error('Failed to complete handover.');
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
                                <h1>{userData?.name || 'Dispatch Partner'}</h1>
                                <p>Medical Dispatch Division (Pharmacy to Bus)</p>
                            </div>
                        </div>
                        <div className="rider-status">
                            {selectedIds.length > 0 ? (
                                <div className="bulk-action-pill">
                                    {selectedIds.length} SELECTED
                                </div>
                            ) : (
                                "ON DUTY"
                            )}
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="bulk-control-bar">
                            {filter === 'Assigned' && (
                                <button className="btn-bulk start" onClick={() => handleBulkStatusUpdate('In Transit')}>
                                    Start Batch ({selectedIds.length})
                                </button>
                            )}
                            {filter === 'In Transit' && (
                                <button className="btn-bulk finish" onClick={() => handleBulkStatusUpdate('Delivered')}>
                                    Bulk Handover ({selectedIds.length})
                                </button>
                            )}
                            <button className="btn-bulk-cancel" onClick={() => setSelectedIds([])}>
                                Clear Selection
                            </button>
                        </div>
                    )}

                    {/* Quick Stats Grid */}
                    <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', textAlign: 'left', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span className="label" style={{ margin: 0, color: '#166534' }}>Today Orders</span>
                                <Package size={20} color="#166534" style={{ opacity: 0.8 }} />
                            </div>
                            <span className="value" style={{ color: '#14532d', fontSize: '1.8rem' }}>{stats.today}</span>
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', textAlign: 'left', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span className="label" style={{ margin: 0, color: '#1e40af' }}>Completed</span>
                                <CheckCircle size={20} color="#1e40af" style={{ opacity: 0.8 }} />
                            </div>
                            <span className="value" style={{ color: '#1e3a8a', fontSize: '1.8rem' }}>{stats.completed}</span>
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
                                <div key={a._id} className={`assignment-card ${selectedIds.includes(a._id) ? 'selected' : ''}`}>
                                    <div className="card-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input 
                                                type="checkbox" 
                                                className="order-checkbox" 
                                                checked={selectedIds.includes(a._id)}
                                                onChange={() => toggleSelection(a._id)}
                                            />
                                            <div className="order-badge">#{a.orderId?._id?.slice(-8).toUpperCase()}</div>
                                        </div>
                                        <div className={`status-indicator ${a.status.toLowerCase().replace(' ', '-')}`}>
                                            <div className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></div>
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
                                                <p style={{ margin: 0, fontWeight: 700 }}>Dispatch Point (Bus Stand)</p>
                                                <p style={{ margin: 0, fontSize: '0.95rem' }}>{a.orderId?.shippingAddress?.street}, {a.orderId?.shippingAddress?.city}</p>
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
                                            <span className="value">{a.vehicleName || a.busId?.busName || 'Express'} ({a.busId?.busNumber || 'N/A'})</span>
                                        </div>
                                    </div>

                                    <div className="logistic-details" style={{ marginTop: '10px', background: '#f0fdf4', borderColor: '#dcfce7' }}>
                                        <div className="pill-info">
                                            <span className="label" style={{ color: '#166534' }}>Receive At</span>
                                            <span className="value" style={{ color: '#166534', fontWeight: '700' }}>{a.pickupStoppage || a.orderId?.dispatchDetails?.pickupStoppage || 'Scheduled Station'}</span>
                                        </div>
                                        <div className="pill-info">
                                            <span className="label" style={{ color: '#166534' }}>Arrival Time</span>
                                            <span className="value" style={{ color: '#166534', fontWeight: '700' }}>{a.estimatedArrivalTime || a.orderId?.dispatchDetails?.estimatedArrivalTime || 'Awaiting Sync'}</span>
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
                                                    : `${API_BASE_URL}${(a.busId?.image || a.orderId?.dispatchDetails?.busImage).startsWith('/') ? '' : '/'}${(a.busId?.image || a.orderId?.dispatchDetails?.busImage)}`
                                                }
                                                alt="Vehicle"
                                            />
                                            <div className="preview-overlay">
                                                <span>IDENTITY PHOTO • CLICK TO ZOOM</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="action-row">
                                        {a.status === 'Assigned' && (
                                            <button className="btn-main start" onClick={() => updateStatus(a._id, 'In Transit')}>
                                                Pick up from Pharmacy <ChevronRight size={20} />
                                            </button>
                                        )}

                                        {a.status === 'In Transit' && (
                                            <button className="btn-main finish" onClick={() => handleOpenHandover(a)}>
                                                Hand over to Bus <CheckCircle size={20} />
                                            </button>
                                        )}

                                        {a.status === 'Delivered' && (
                                            <button className="btn-main" disabled style={{ background: '#f1f5f9', color: '#94a3b8' }}>
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
                            <LogOut size={24} color="white" style={{ transform: 'rotate(180deg)' }} />
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

            {/* Handover Data Modal */}
            {showHandoverModal && selectedAssignment && (
                <div className="handover-modal-overlay">
                    <div className="handover-modal-card">
                        <div className="handover-modal-header">
                            <h3>Bus Handover Details</h3>
                            <button onClick={() => setShowHandoverModal(false)}><X /></button>
                        </div>
                        <div className="handover-modal-body">
                            {/* Fleet Reference Section */}
                            <div className="fleet-reference-box">
                                <label>Target Vehicle Reference</label>
                                <div className="reference-content">
                                    {selectedAssignment.busId?.image ? (
                                        <img
                                            src={selectedAssignment.busId.image.startsWith('http') ? selectedAssignment.busId.image : `${API_BASE_URL}${selectedAssignment.busId.image}`}
                                            alt="Reference"
                                        />
                                    ) : (
                                        <div className="v-ph">🚌</div>
                                    )}
                                    <div className="ref-info">
                                        <p className="v-name">{selectedAssignment.busId?.busName || 'Express Vehicle'}</p>
                                        <p className="v-no">{selectedAssignment.busId?.busNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-input-group">
                                <label>Driver/Conductor Number</label>
                                <input
                                    type="tel"
                                    placeholder="Enter contact number"
                                    value={handoverDetails.driverNumber}
                                    onChange={(e) => setHandoverDetails({ ...handoverDetails, driverNumber: e.target.value })}
                                />
                            </div>


                        </div>
                        <div className="handover-modal-footer">
                            <button className="btn-cancel" onClick={() => setShowHandoverModal(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handleCompleteHandover} disabled={uploading}>
                                Confirm Handover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryBoyDashboard;

