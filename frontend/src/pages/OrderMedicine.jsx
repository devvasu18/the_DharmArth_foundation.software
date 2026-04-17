import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Camera, ShieldCheck, Zap, Truck, ArrowRight, X, Info, MapPin, Plus, Edit2, Phone, User, Share2 } from 'lucide-react';
import api, { API_BASE_URL } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SimplifyDosage from '../components/SimplifyDosage';
import { useConfirm } from '../context/ConfirmContext';
import './OrderMedicine.css';

const VerifiedItemRow = ({ item }) => {
    const [showDosage, setShowDosage] = useState(false);
    const hasDosage = item.time || item.frequency || item.foodRelation || item.intakeMethod || item.dosage;

    return (
        <div style={{ marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div className="item-row" style={{ borderBottom: 'none', padding: 0, marginBottom: '8px' }}>
                <div className="item-name" style={{ fontWeight: '600', color: '#2d3748', fontSize: '1.1rem' }}>{item.medicineName} (Qty: {item.quantity || 1})</div>
                <div className="item-price" style={{ fontWeight: 'bold' }}>₹{Number(item.price || 0).toFixed(2)}</div>
            </div>
            {hasDosage ? (
                <div style={{ marginTop: '0px' }}>
                    <button
                        type="button"
                        onClick={() => setShowDosage(!showDosage)}
                        style={{
                            background: 'none', border: 'none', color: '#3182ce', fontSize: '14px',
                            cursor: 'pointer', padding: 0, fontWeight: '500', display: 'flex', alignItems: 'center'
                        }}
                    >
                        {showDosage ? 'Hide Dosage Instructions' : 'View Dosage Instructions'}
                    </button>
                    {showDosage && (
                        <div style={{ marginTop: '12px', animation: 'fadeIn 0.3s ease-in-out' }}>
                            <SimplifyDosage
                                time={item.time}
                                frequency={item.frequency}
                                foodRelation={item.foodRelation}
                                intakeMethod={item.intakeMethod}
                                additionalNotes={item.dosage}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>
                    <Info size={12} style={{ display: 'inline', marginRight: '4px' }} /> No special dosage instructions provided.
                </div>
            )}
        </div>
    );
};

const OrderMedicine = () => {
    const navigate = useNavigate();
    const { showAlert } = useConfirm();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [myPrescriptions, setMyPrescriptions] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [historyTab, setHistoryTab] = useState('prescriptions'); // 'prescriptions' or 'orders'

    // Checkout Modal State
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // Image Viewer Modal State
    const [imageModalSrc, setImageModalSrc] = useState(null);

    // Track Order Modal State
    const [trackModalOpen, setTrackModalOpen] = useState(false);
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);

    const [shippingDetails, setShippingDetails] = useState({
        _id: null,
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        altPhone: ''
    });
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [isOrderingForSomeoneElse, setIsOrderingForSomeoneElse] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Online');

    useEffect(() => {
        fetchHistory();
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/my');
            setMyOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/prescriptions/my');
            setMyPrescriptions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('prescription', file);

        setLoading(true);
        try {
            await api.post('/prescriptions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setFile(null);
            setPreview(null);
            setTimeout(() => setSuccess(false), 5000);
            fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = (prescriptionId) => {
        const url = `${window.location.origin}/checkout/${prescriptionId}`;
        navigator.clipboard.writeText(url);
        showAlert('success', 'Link Copied', 'Shareable checkout link copied! Send this to anyone to pay for your medicines.');
    };

    const getOrderBadge = (status) => {
        switch (status) {
            case 'Payment Pending': return <span className="status-badge pending" style={{ background: '#fff3cd', color: '#856404' }}>Pending Payment</span>;
            case 'Processing': return <span className="status-badge review" style={{ background: '#d1ecf1', color: '#0c5460' }}>Processing</span>;
            case 'Out for Delivery': return <span className="status-badge verified" style={{ background: '#d4edda', color: '#155724' }}>Out for Delivery</span>;
            case 'Delivered': return <span className="status-badge verified"><CheckCircle size={14} /> Delivered</span>;
            case 'Cancelled': return <span className="status-badge rejected"><X size={14} /> Cancelled</span>;
            default: return <span className="status-badge pending">{status}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
            case 'Verified': return <span className="status-badge verified"><CheckCircle size={14} /> Verified</span>;
            case 'Rejected': return <span className="status-badge rejected"><AlertCircle size={14} /> Rejected</span>;
            case 'Under Review': return <span className="status-badge review"><FileText size={14} /> Reviewing</span>;
            case 'Ordered': return <span className="status-badge verified" style={{ background: '#ebf8ff', color: '#2b6cb0' }}><Zap size={14} /> Ordered</span>;
            default: return <span>{status}</span>;
        }
    };

    const fetchSavedAddresses = async () => {
        try {
            const res = await api.get('/users/profile');
            if (res.data.savedAddresses) {
                const sorted = [...res.data.savedAddresses].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setSavedAddresses(sorted);
                // Auto-select latest if not currently editing
                if (sorted.length > 0) {
                    setShippingDetails(sorted[0]);
                    setIsAddingNewAddress(false);
                } else {
                    setIsAddingNewAddress(true);
                }
            } else {
                setIsAddingNewAddress(true);
            }
        } catch (err) {
            console.error('Failed to fetch addresses', err);
            setIsAddingNewAddress(true);
        }
    };

    const openCheckoutModal = (prescription) => {
        const availableItems = prescription.verifiedItems?.filter(i => i.isAvailable) || [];
        if (availableItems.length === 0) {
            showAlert('No verified items are available for checkout.');
            return;
        }
        setSelectedPrescription(prescription);
        setCheckoutSuccess(false);
        setCheckoutError(null);
        fetchSavedAddresses();
        setCheckoutModalOpen(true);
    };

    const calculateTotal = (items) => {
        return items.filter(i => i.isAvailable).reduce((acc, item) => acc + (item.price || 0), 0);
    };

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setCheckoutLoading(true);
        setCheckoutError(null);
        try {
            await api.post(`/prescriptions/${selectedPrescription._id}/approve`, {
                shippingAddress: shippingDetails,
                paymentMethod
            });
            setCheckoutSuccess(true);
            fetchOrders(); // Refresh orders list
            setTimeout(() => {
                setCheckoutModalOpen(false);
                fetchHistory(); // Refresh prescriptions
                setHistoryTab('orders'); // Auto-switch to orders tab to show progress
            }, 2500);
        } catch (err) {
            setCheckoutError(err.response?.data?.message || 'Checkout failed.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const filteredPrescriptions = myPrescriptions.filter(p => p.status !== 'Ordered');

    return (
        <div className="order-medicine-container">
            <Navbar />

            <main className="order-medicine-main">
                {/* Hero Header */}
                <section className="hero-head">
                    <div className="container">

                        <h1>Order Medicines with Ease</h1>
                        <p>Our pharmacists bridge the gap between your prescription and doorstep. Fast, secure, and reliable delivery via our dedicated transport network.</p>
                    </div>
                </section>

                {/* Info Steps */}
                <section className="steps-sec">
                    <div className="container">
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-icon"><Camera size={24} /></div>
                                <h4>1. Upload Photo</h4>
                                <p>Take a clear photo of your doctor's prescription.</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><ShieldCheck size={24} /></div>
                                <h4>2. Verification</h4>
                                <p>Our pharmacist reviews and confirms stock availability.</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><Truck size={24} /></div>
                                <h4>3. Fast Delivery</h4>
                                <p>Get medicines delivered via our express bus routes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="main-features container">
                    <div className="grid-layout">
                        {/* LEFT: Upload Form */}
                        <div className="form-column">
                            <div className="upload-box glass-card">
                                <div className="card-header">
                                    <h3>Send Your Prescription</h3>
                                    <Zap size={20} color="#f6ad55" />
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div
                                        className={`drop-area ${preview ? 'preview-active' : ''}`}
                                        onClick={() => document.getElementById('presc-upload').click()}
                                    >
                                        {preview ? (
                                            <div className="preview-container">
                                                <img src={preview} alt="Upload Preview" />
                                                <div className="change-btn">Change Photo</div>
                                            </div>
                                        ) : (
                                            <div className="placeholder">
                                                <div className="icon-circle">
                                                    <Upload size={32} />
                                                </div>
                                                <p>Drop your prescription image here</p>
                                                <span>Supports JPG, PNG (Max 5MB)</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id="presc-upload"
                                            hidden
                                            onChange={handleFileChange}
                                            accept="image/*"
                                        />
                                    </div>

                                    {error && <div className="alert alert-error">{error}</div>}
                                    {success && <div className="alert alert-success">Successfully uploaded! Review in progress.</div>}

                                    <button className="btn-submit-premium" disabled={loading}>
                                        {loading ? (
                                            <div className="loader"></div>
                                        ) : (
                                            <>
                                                <Zap size={18} fill="currentColor" />
                                                Submit Now
                                            </>
                                        )}
                                    </button>
                                </form>
                                <div className="security-tag">
                                    <ShieldCheck size={14} />
                                    <span>Encrypted & Private</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: History */}
                        <div className="history-column">
                            <div className="history-box glass-card">
                                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <h3>Activity Log</h3>
                                        <button className="refresh-btn" onClick={() => { fetchHistory(); fetchOrders(); }}>
                                            <Clock size={16} /> Sync
                                        </button>
                                    </div>
                                    <div className="tab-switcher" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', width: '100%' }}>
                                        <button
                                            className={`tab-btn ${historyTab === 'prescriptions' ? 'active' : ''}`}
                                            onClick={() => setHistoryTab('prescriptions')}
                                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: historyTab === 'prescriptions' ? '#fff' : 'transparent', fontWeight: historyTab === 'prescriptions' ? '600' : '400', boxShadow: historyTab === 'prescriptions' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', outline: 'none' }}
                                        >
                                            Prescriptions ({filteredPrescriptions.length})
                                        </button>
                                        <button
                                            className={`tab-btn ${historyTab === 'orders' ? 'active' : ''}`}
                                            onClick={() => setHistoryTab('orders')}
                                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: historyTab === 'orders' ? '#fff' : 'transparent', fontWeight: historyTab === 'orders' ? '600' : '400', boxShadow: historyTab === 'orders' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', outline: 'none' }}
                                        >
                                            Track Orders ({myOrders.length})
                                        </button>
                                    </div>
                                </div>

                                <div className="order-list-premium">
                                    {historyTab === 'prescriptions' ? (
                                        filteredPrescriptions.length === 0 ? (
                                            <div className="empty-state-cool">
                                                <FileText size={48} strokeWidth={1} />
                                                <p>No prescriptions</p>
                                            </div>
                                        ) : (
                                            filteredPrescriptions.map(p => (
                                                <div key={p._id} className="order-card-premium">
                                                    <div className="presc-thumb" onClick={() => setImageModalSrc(p.image)} style={{ cursor: 'pointer' }}>
                                                        <img src={p.image.startsWith('http') ? p.image : `${API_BASE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt="Presc" />
                                                    </div>
                                                    <div className="order-meta">
                                                        <div className="meta-row">
                                                            <span className="order-date">{new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            {getStatusBadge(p.status)}
                                                        </div>
                                                        <div className="meta-footer">
                                                            {p.status === 'Verified' ? (
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        className="btn-action-primary"
                                                                        onClick={() => navigate(`/checkout/${p._id}`)}
                                                                        style={{ flex: 1 }}
                                                                    >
                                                                        Review & Checkout
                                                                    </button>
                                                                    <button
                                                                        className="btn-action-secondary"
                                                                        onClick={() => handleCopyLink(p._id)}
                                                                        title="Share Payment Link"
                                                                        style={{ width: '40px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                                    >
                                                                        <Share2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : p.status === 'Ordered' ? (
                                                                <button
                                                                    className="btn-action-secondary"
                                                                    style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid #90cdf4', cursor: 'pointer', outline: 'none' }}
                                                                    onClick={() => {
                                                                        setSelectedPrescription(p);
                                                                        setCheckoutModalOpen(true);
                                                                    }}
                                                                >
                                                                    <FileText size={16} /> View Dosage Instructions
                                                                </button>
                                                            ) : (
                                                                <div className="status-msg">
                                                                    {p.status === 'Pending' ? 'Pharmacist is looking at it' : p.status === 'Rejected' ? 'Verification failed' : 'Being reviewed'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        myOrders.length === 0 ? (
                                            <div className="empty-state-cool">
                                                <Truck size={48} strokeWidth={1} />
                                                <p>No active orders</p>
                                            </div>
                                        ) : (
                                            myOrders.map(order => (
                                                <div
                                                    key={order._id}
                                                    className="order-card-premium"
                                                    style={{ padding: '15px', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setSelectedTrackOrder(order);
                                                        setTrackModalOpen(true);
                                                    }}
                                                >
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontWeight: '700', color: '#1a202c' }}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                                                            {getOrderBadge(order.status)}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '10px' }}>
                                                            {order.items.length} Medicines • ₹{order.totalAmount.toFixed(2)}
                                                        </div>
                                                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#718096', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                                {order.shippingAddress?.city}
                                                            </div>
                                                            <span style={{ color: '#3182ce', fontWeight: 'bold' }}>View Details →</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            {/* Checkout Modal */}
            {checkoutModalOpen && selectedPrescription && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card">
                        <div className="checkout-header">
                            <h2>{selectedPrescription.status === 'Ordered' ? 'Order Details & Dosage' : 'Review & Checkout'}</h2>
                            <button className="btn-close" onClick={() => setCheckoutModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="verified-items-list">
                            <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>Verified Items Available</h4>
                            {selectedPrescription.verifiedItems.filter(i => i.isAvailable).map((item, idx) => (
                                <VerifiedItemRow key={idx} item={item} />
                            ))}
                            <div className="checkout-total">
                                <span>Grand Total</span>
                                <span>₹{calculateTotal(selectedPrescription.verifiedItems).toFixed(2)}</span>
                            </div>
                        </div>
                        {checkoutSuccess ? (
                            <div className="checkout-alert alert-success">
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Order placed successfully! Check your dashboard.
                            </div>
                        ) : selectedPrescription.status === 'Ordered' ? (
                            <div className="checkout-alert alert-success" style={{ marginTop: '20px' }}>
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                This order has already been placed. Follow the dosage instructions above.
                            </div>
                        ) : (
                            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                                <div className="shipping-address-section" style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, color: '#4a5568' }}>Shipping Address</h4>
                                        {savedAddresses.length > 0 && (
                                            <button
                                                type="button"
                                                className="btn-add-new-addr"
                                                onClick={() => {
                                                    setIsAddingNewAddress(true);
                                                    setIsOrderingForSomeoneElse(false);
                                                    setShippingDetails({ _id: null, street: '', city: '', state: '', zip: '', phone: '', altPhone: '' });
                                                }}
                                                style={{ fontSize: '12px', background: '#f7fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={14} /> Add New
                                            </button>
                                        )}
                                    </div>

                                    {!isAddingNewAddress && savedAddresses.length > 0 ? (
                                        <div className="saved-addresses-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '2px' }}>
                                            {savedAddresses.map(addr => (
                                                <div
                                                    key={addr._id}
                                                    className={`saved-addr-card ${shippingDetails._id === addr._id ? 'active' : ''}`}
                                                    onClick={() => setShippingDetails(addr)}
                                                    style={{
                                                        padding: '12px', borderRadius: '8px', border: shippingDetails._id === addr._id ? '2px solid #3182ce' : '1px solid #e2e8f0',
                                                        cursor: 'pointer', backgroundColor: shippingDetails._id === addr._id ? '#ebf8ff' : '#fff',
                                                        position: 'relative', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <MapPin size={18} color={shippingDetails._id === addr._id ? '#3182ce' : '#a0aec0'} style={{ marginTop: '2px' }} />
                                                        <div style={{ fontSize: '14px', flex: 1 }}>
                                                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>{addr.label || 'Home'}</div>
                                                            <div style={{ color: '#4a5568' }}>{addr.street}, {addr.city}, {addr.zip}</div>
                                                            <div style={{ color: '#718096', fontSize: '12px', marginTop: '4px' }}>
                                                                Phone: {addr.phone} {addr.altPhone && `| Alt: ${addr.altPhone}`}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            title="Edit"
                                                            onClick={(e) => { e.stopPropagation(); setIsAddingNewAddress(true); setShippingDetails(addr); }}
                                                            style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '4px' }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="new-address-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label>Street Address</label>
                                                <input type="text" required value={shippingDetails.street} onChange={e => setShippingDetails({ ...shippingDetails, street: e.target.value })} placeholder="House No, Building, Street" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>City</label>
                                                    <input type="text" required value={shippingDetails.city} onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })} placeholder="City" />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>PIN Code</label>
                                                    <input type="text" required value={shippingDetails.zip} onChange={e => setShippingDetails({ ...shippingDetails, zip: e.target.value })} placeholder="Pin Code" />
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label>State</label>
                                                <input type="text" required value={shippingDetails.state} onChange={e => setShippingDetails({ ...shippingDetails, state: e.target.value })} placeholder="State" />
                                            </div>
                                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'flex-start' }} onClick={() => setIsOrderingForSomeoneElse(!isOrderingForSomeoneElse)}>
                                                <input
                                                    type="checkbox"
                                                    id="someone-else"
                                                    checked={isOrderingForSomeoneElse}
                                                    onChange={e => {
                                                        e.stopPropagation();
                                                        setIsOrderingForSomeoneElse(e.target.checked);
                                                    }}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                                                />
                                                <label htmlFor="someone-else" style={{ margin: 0, cursor: 'pointer', fontWeight: '500', color: '#3182ce', fontSize: '14px' }}>Ordering for someone else?</label>
                                            </div>

                                            {isOrderingForSomeoneElse && (
                                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                    <div className="form-group" style={{ flex: 1 }}>
                                                        <label>Receiver's Phone Number</label>
                                                        <input type="text" required value={shippingDetails.phone} onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })} placeholder="Mobile Number" />
                                                    </div>
                                                    <div className="form-group" style={{ flex: 1 }}>
                                                        <label>Alternative Mob. No. (Optional)</label>
                                                        <input type="text" value={shippingDetails.altPhone || ''} onChange={e => setShippingDetails({ ...shippingDetails, altPhone: e.target.value })} placeholder="Emergency contact" />
                                                    </div>
                                                </div>
                                            )}
                                            {savedAddresses.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingNewAddress(false);
                                                        if (savedAddresses.length > 0) setShippingDetails(savedAddresses[0]);
                                                    }}
                                                    style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid #cbd5e0', borderRadius: '6px', color: '#4a5568', fontSize: '13px', cursor: 'pointer' }}
                                                >
                                                    Cancel and pick saved address
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="Online">Online / Card / UPI</option>
                                        <option value="COD">Cash on Delivery (COD)</option>
                                        <option value="Wallet">Digital Wallet</option>
                                    </select>
                                </div>

                                {checkoutError && <div className="alert alert-error" style={{ padding: '10px', marginTop: 0 }}>{checkoutError}</div>}

                                <button type="submit" className="btn-pay-now" disabled={checkoutLoading}>
                                    {checkoutLoading ? 'Processing...' : `Confirm & Pay ₹${calculateTotal(selectedPrescription.verifiedItems).toFixed(2)}`}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Track Order Detail Modal */}
            {trackModalOpen && selectedTrackOrder && (
                <div className="order-modal-overlay">
                    <div className="premium-modal">
                        <div className="modal-header-gradient">
                            <div className="header-text">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="order-badge color-white">ORDER ID: #{selectedTrackOrder._id.substring(selectedTrackOrder._id.length - 8).toUpperCase()}</div>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/track/${selectedTrackOrder._id}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success('Tracking link copied!');
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', color: '#cbd5e1', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Share2 size={12} /> Copy Link
                                    </button>
                                </div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>Order Tracker</h2>
                            </div>
                            <button className="close-btn-light" onClick={() => setTrackModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-premium">
                            {/* Progress Bar */}
                            <div className="status-progress-bar">
                                {['Pending', 'Processing', 'Shipping', 'Delivered'].map((step, idx) => {
                                    const statuses = {
                                        'Pending': ['Payment Pending', 'Awaiting Approval'],
                                        'Processing': ['Processing'],
                                        'Shipping': ['Out for Delivery'],
                                        'Delivered': ['Delivered']
                                    };

                                    const currentStatus = selectedTrackOrder.status;
                                    const stepIndex = ['Pending', 'Processing', 'Shipping', 'Delivered'].indexOf(step);

                                    let isActive = false;
                                    // Logic to determine if step is reached
                                    if (currentStatus === 'Delivered') isActive = true;
                                    else if (currentStatus === 'Out for Delivery' && step !== 'Delivered') isActive = true;
                                    else if (currentStatus === 'Processing' && (step === 'Pending' || step === 'Processing')) isActive = true;
                                    else if (statuses[step].includes(currentStatus)) isActive = true;

                                    return (
                                        <div key={step} className={`progress-step ${isActive ? 'active' : ''}`}>
                                            <div className="step-point"></div>
                                            <span>{step}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="premium-grid">
                                {/* Left: Info Panes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="customer-info-pane">
                                        <div className="pane-header">
                                            <div className="icon-circle"><MapPin size={18} /></div>
                                            <h3>Your Pickup Station</h3>
                                        </div>
                                        <div className="pane-content">
                                            <div className="pill-info">
                                                <span className="label">Vehicle</span>
                                                <span className="value">{selectedTrackOrder.dispatchDetails?.vehicleName || selectedTrackOrder.dispatchDetails?.busId?.busName || 'Express'} ({selectedTrackOrder.dispatchDetails?.busId?.busNumber || 'N/A'})</span>
                                            </div>

                                            <div className="data-row">
                                                <span className="data-label">Contact Number</span>
                                                <span className="data-value">{selectedTrackOrder.shippingAddress?.phone}</span>
                                            </div>
                                            <div className="data-row">
                                                <span className="data-label">Shipping Address</span>
                                                <span className="data-value address">
                                                    {selectedTrackOrder.shippingAddress?.street},<br />
                                                    {selectedTrackOrder.shippingAddress?.city}, {selectedTrackOrder.shippingAddress?.zip}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedTrackOrder.dispatchDetails && (
                                        <div className="customer-info-pane" style={{ borderColor: '#3b82f6', background: '#eff6ff' }}>
                                            <div className="pane-header" style={{ background: '#dbeafe', borderBottomColor: '#bfdbfe' }}>
                                                <div className="icon-circle" style={{ background: '#3b82f6', color: 'white' }}><Truck size={18} /></div>
                                                <h3>Dispatch & Logistics</h3>
                                            </div>
                                            <div className="pane-content">
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ color: '#3b82f6' }}>Vehicle Name</span>
                                                        <span className="data-value" style={{ color: '#1d4ed8' }}>{selectedTrackOrder.dispatchDetails.vehicleName || selectedTrackOrder.dispatchDetails.busName || 'Express Bus'}</span>
                                                    </div>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ color: '#3b82f6' }}>Bus Number</span>
                                                        <span className="data-value" style={{ color: '#1d4ed8' }}>{selectedTrackOrder.dispatchDetails.busNumber}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ color: '#3b82f6' }}>Meet Bus At</span>
                                                        <span className="data-value" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>{selectedTrackOrder.dispatchDetails?.pickupStoppage || 'Fetching...'}</span>
                                                    </div>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ color: '#3b82f6' }}>Be Ready At</span>
                                                        <span className="data-value" style={{ color: '#059669', fontWeight: 'bold' }}>{selectedTrackOrder.dispatchDetails?.estimatedArrivalTime || 'TBD'}</span>
                                                    </div>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ color: '#3b82f6' }}>Conductor Contact</span>
                                                    <a href={`tel:${selectedTrackOrder.dispatchDetails.conductorNumber}`} className="data-value" style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                                                        <Phone size={16} /> {selectedTrackOrder.dispatchDetails.conductorNumber}
                                                    </a>
                                                </div>
                                                {/* Fetch live image from the Bus document via populated busId */}
                                                <div className="data-row" style={{ marginTop: '10px' }}>
                                                    <span className="data-label" style={{ color: '#3b82f6' }}>Vehicle Photo</span>
                                                    <div
                                                        className="bus-image-preview"
                                                        style={{
                                                            marginTop: '8px',
                                                            borderRadius: '12px',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            border: '2px solid white',
                                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                                                            background: '#f1f5f9'
                                                        }}
                                                        onClick={() => {
                                                            const finalImg = selectedTrackOrder.dispatchDetails.busId?.image || selectedTrackOrder.dispatchDetails.busImage;
                                                            if (finalImg) setImageModalSrc(finalImg);
                                                        }}
                                                    >
                                                        {(() => {
                                                            const liveImage = selectedTrackOrder.dispatchDetails.busId?.image;
                                                            const snapshotImage = selectedTrackOrder.dispatchDetails.busImage;
                                                            const finalImage = liveImage || snapshotImage;

                                                            if (!finalImage) return <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>No Photo Available</div>;

                                                            const resolvedUrl = finalImage.startsWith('http')
                                                                ? finalImage
                                                                : `${API_BASE_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;

                                                            return (
                                                                <img
                                                                    src={resolvedUrl}
                                                                    alt="Bus"
                                                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                                                />
                                                            );
                                                        })()}
                                                        <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                            CLICK TO ZOOM
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '15px', padding: '12px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '11px', color: '#92400e', lineHeight: '1.4' }}>
                                                    <strong>Station Pickup Note:</strong> Please reach the station 5 minutes before the "Be Ready" time. Keep your phone handy to coordinate with the bus conductor in case of minor delay.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Items Pane */}
                                <div className="items-info-pane">
                                    <div className="pane-header">
                                        <div className="icon-circle"><CheckCircle size={18} /></div>
                                        <h3>Medicines Packet</h3>
                                    </div>
                                    <div className="premium-medicine-list">
                                        {selectedTrackOrder.items.map((item, idx) => (
                                            <div key={idx} className="premium-med-card">
                                                <div className="med-main">
                                                    <div className="med-info">
                                                        <span className="name">{item.name}</span>
                                                        <span className="meta">Qty: {item.quantity} units</span>
                                                    </div>
                                                    <div className="med-price-total">₹{item.price?.toFixed(2)}</div>
                                                </div>
                                                {(item.frequency || item.time || item.foodRelation) && (
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

                                        <div className="modal-summary-footer" style={{ marginTop: '10px' }}>
                                            <div className="summary-details">
                                                <div className="summary-row">
                                                    <span>Order Total</span>
                                                    <span>₹{selectedTrackOrder.totalAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="summary-row grand-total">
                                                    <span>Total Paid</span>
                                                    <span>₹{selectedTrackOrder.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                : `http://localhost:5000${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`
                            }
                            alt="Full View"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderMedicine;
