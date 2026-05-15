import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Camera, ShieldCheck, Zap, Truck, ArrowRight, X, Info, MapPin, Plus, Edit2, Phone, User, Share2, ShoppingBag } from 'lucide-react';
import api, { API_BASE_URL } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SimplifyDosage from '../components/SimplifyDosage';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import './OrderMedicine.css';

const VerifiedItemRow = ({ item }) => {
    const [showDosage, setShowDosage] = useState(false);
    const hasDosage = item.time || item.frequency || item.foodRelation || item.intakeMethod || item.dosage;

    return (
        <div style={{ marginBottom: '15px', borderBottom: '2px solid #cbd5e0', paddingBottom: '10px' }}>
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
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [isSyncing, setIsSyncing] = useState(false);
    const [historyTab, setHistoryTab] = useState('prescriptions'); // 'prescriptions' or 'orders'
    const [showPostUploadModal, setShowPostUploadModal] = useState(false);
    const [showRecentModal, setShowRecentModal] = useState(false);

    // Checkout Modal State
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // Guest Info Modal State
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestMobile, setGuestMobile] = useState('');

    // Image Viewer Modal State
    const [imageModalSrc, setImageModalSrc] = useState(null);

    // Track Order Modal State
    const [trackModalOpen, setTrackModalOpen] = useState(false);
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [isReorderFlow, setIsReorderFlow] = useState(false);
    const [pharmacyConfig, setPharmacyConfig] = useState(null);

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

    const [notes, setNotes] = useState('');

    const getContactTiming = () => {
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 8) {
            return {
                text: pharmacyConfig?.nightTimeContactText || "Foundation will contact you at 8:30 AM",
                icon: <Clock size={14} />,
                type: 'night'
            };
        } else {
            return {
                text: pharmacyConfig?.dayTimeContactText || "Pharmacist will contact you in 10-20 minutes",
                icon: <Zap size={14} />,
                type: 'day'
            };
        }
    };

    const fetchPharmacyConfig = async () => {
        try {
            const res = await api.get('/settings/pharmacy/public');
            setPharmacyConfig(res.data);
        } catch (err) {
            console.error("Failed to fetch pharmacy config", err);
        }
    };

    const fetchOrders = async () => {
        try {
            const isUserLoggedIn = !!localStorage.getItem('user');
            const gMobile = localStorage.getItem('guestMobile');
            
            let res;
            if (isUserLoggedIn) {
                res = await api.get('/orders/my');
            } else if (gMobile) {
                res = await api.get(`/orders/guest-history/${gMobile}`);
                if (res.status === 401) return; // Login required for this mobile
            } else {
                return;
            }
            setMyOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const fetchHistory = async () => {
        try {
            const isUserLoggedIn = !!localStorage.getItem('user');
            const gMobile = localStorage.getItem('guestMobile');

            let res;
            if (isUserLoggedIn) {
                res = await api.get('/prescriptions/my');
            } else if (gMobile) {
                res = await api.get(`/prescriptions/guest-history/${gMobile}`);
                if (res.status === 401) return; // Login required for this mobile
            } else {
                return;
            }
            setMyPrescriptions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    async function handleSync() {
        setIsSyncing(true);
        try {
            await Promise.all([fetchHistory(), fetchOrders()]);
            toast.success('Activity Log updated');
        } catch (err) {
            toast.error('Sync failed');
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    }

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        toast.loading("Detecting location...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Using a free reverse geocoding API (BigDataCloud or similar)
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await res.json();

                    setShippingDetails(prev => ({
                        ...prev,
                        city: data.city || data.locality || '',
                        state: data.principalSubdivision || '',
                        zip: data.postcode || ''
                    }));

                    toast.dismiss();
                    toast.success("Location detected!");
                    if (!data.postcode) {
                        toast("Please verify your PIN code manually", { icon: '📍' });
                    }
                } catch (err) {
                    toast.dismiss();
                    toast.error("Failed to resolve address. Please enter manually.");
                }
            },
            () => {
                toast.dismiss();
                toast.error("Location access denied.");
            }
        );
    };

    useEffect(() => {
        const storedName = localStorage.getItem('guestName');
        const storedMobile = localStorage.getItem('guestMobile');
        if (storedName) setGuestName(storedName);
        if (storedMobile) setGuestMobile(storedMobile);
        fetchHistory();
        fetchOrders();
        fetchPharmacyConfig();
    }, []);

    useEffect(() => {
        const lookupGuestName = async () => {
            if (guestMobile.length === 10 && !guestName) {
                try {
                    const { data } = await api.get(`/users/guest-lookup/${guestMobile}`);
                    if (data.name) {
                        setGuestName(data.name);
                        localStorage.setItem('guestName', data.name);
                    }
                } catch (err) {
                    // Ignore lookup failures
                }
            }
        };
        lookupGuestName();
    }, [guestMobile]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 4 * 1024 * 1024) {
                toast.error("Please select an image smaller than 4MB");
                e.target.value = null;
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async (e, isGuest = false) => {
        if (e) e.preventDefault();
        
        const isUserLoggedIn = !!localStorage.getItem('user');
        
        if (!isUserLoggedIn && !isGuest) {
            if (guestName && guestMobile) {
                return handleSubmit(null, true);
            }
            setShowGuestModal(true);
            return;
        }

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('prescription', file);
        if (notes) formData.append('notes', notes);
        
        if (isGuest) {
            formData.append('guestName', guestName);
            formData.append('guestMobile', guestMobile);
        }

        setLoading(true);
        try {
            await api.post('/prescriptions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowPostUploadModal(true);
            setShowGuestModal(false);
            setFile(null);
            setPreview(null);
            if (isUserLoggedIn) {
                fetchHistory();
                fetchOrders();
            } else if (isGuest) {
                localStorage.setItem('guestMobile', guestMobile);
                localStorage.setItem('guestName', guestName);
                fetchHistory();
                fetchOrders();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        if (!guestName || !guestMobile) {
            toast.error("Please fill all guest details");
            return;
        }
        if (guestMobile.length < 10) {
            toast.error("Please enter a valid mobile number");
            return;
        }
        handleSubmit(null, true);
    };

    const handleCopyLink = (prescriptionId) => {
        const url = `${window.location.origin}/checkout/${prescriptionId}`;
        navigator.clipboard.writeText(url);
        toast.success('Link Copied!');
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

    const handleReorder = async (prescription) => {
        setShowRecentModal(false);
        try {
            // 1. Get PIDs from verified items
            const pids = prescription.verifiedItems
                ?.map(i => i.margPID)
                .filter(pid => pid !== undefined);

            if (!pids || pids.length === 0) {
                // If no MARG mapping exists yet (old data), just proceed to checkout for verification
                openCheckoutModal(prescription, true);
                return;
            }

            // 2. Check stock in bulk
            toast.loading('Checking current stock...', { id: 'stock-check' });
            const res = await api.post('/marg/check-stock-bulk', { pids });
            const availability = res.data.availability || {};

            // 3. Determine if everything is in stock
            const allInStock = pids.every(pid => availability[pid] === true);

            if (allInStock) {
                toast.success('All items in stock!', { id: 'stock-check' });
                setShowRecentModal(false);
                openCheckoutModal(prescription, true);
            } else {
                // 4. If any item is out of stock, re-submit as prescription request
                toast('Some items out of stock. Re-submitting as request...', { id: 'stock-check', icon: '⏳' });

                await api.post(`/prescriptions/${prescription._id}/re-submit`);

                setShowRecentModal(false);
                showAlert({
                    title: 'Stock Update',
                    message: 'Some medicines from your previous order are currently out of stock. We have automatically re-submitted your prescription as a new request. Our pharmacists will verify and notify you once they are available.',
                    confirmText: 'Got it',
                    showCancel: false
                });

                // Refresh data to show the new pending prescription
                fetchTrackingInfo();
            }
        } catch (err) {
            console.error('Reorder failed', err);
            toast.error('Could not verify stock. Please try again.', { id: 'stock-check' });
        }
    };

    const openCheckoutModal = (prescription, isReorder = false) => {
        const availableItems = prescription.verifiedItems?.filter(i => i.isAvailable) || [];
        if (availableItems.length === 0) {
            toast.error('No verified items are available for checkout.');
            return;
        }
        setIsReorderFlow(isReorder);
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
                <div className="hero-head">
                    <div className="badge-pill">Premium Pharmacy Service</div>
                    <h1>Order Medicine</h1>
                    <p>Upload your doctor's receipt and let our certified pharmacists handle the rest. We deliver directly to your doorstep via our trusted network.</p>
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                        <button 
                            className="refresh-btn" 
                            onClick={() => navigate('/order-history')}
                            style={{ background: '#3182ce', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '15px' }}
                        >
                            <Clock size={18} /> View Order History
                        </button>
                    </div>
                </div>

                {/* Info Steps */}
                <section className="steps-sec">
                    <div className="container">
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-icon"><Camera size={24} /></div>
                                <h4>1. Upload Photo</h4>
                                <p>Take a clear photo of your doctor's receipt.</p>
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
                                                <span>Supports JPG, PNG (Max 4MB)</span>
                                                <small className="text-gray-500 mt-2 block">Maximum upload size: 4MB</small>
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

                                    <div style={{ marginTop: '20px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>Optional Notes (Medicines/Quantity)</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Mention specific brand or additional instructions..."
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', minHeight: '80px', resize: 'none' }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '15px', padding: '10px 15px', borderRadius: '10px', background: getContactTiming().type === 'day' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${getContactTiming().type === 'day' ? '#bbf7d0' : '#fef3c7'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ color: getContactTiming().type === 'day' ? '#16a34a' : '#d97706' }}>
                                            {getContactTiming().icon}
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: getContactTiming().type === 'day' ? '#15803d' : '#92400e' }}>
                                            {getContactTiming().text}
                                        </span>
                                    </div>

                                    {error && <div className="alert alert-error">{error}</div>}
                                    {success && <div className="alert alert-success">Successfully uploaded! Review in progress.</div>}

                                    <button className="btn-submit-premium" disabled={loading} style={{ marginTop: '20px' }}>
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

                                <div className="or-divider" style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>OR</span>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                                </div>

                                <button
                                    className="btn-action-secondary"
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#f8fafc', border: '2px dashed #cbd5e1', color: '#475569', fontWeight: '700' }}
                                    onClick={() => setShowRecentModal(true)}
                                >
                                    <Clock size={18} />
                                    Select from Previous (90 Days)
                                </button>

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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <h3 style={{ margin: 0 }}>History/Recent</h3>
                                            {!localStorage.getItem('user') && localStorage.getItem('guestMobile') && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '600', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                                    <User size={10} /> Viewing as Guest ({localStorage.getItem('guestMobile')})
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className={`refresh-btn ${isSyncing ? 'syncing' : ''}`}
                                            onClick={handleSync}
                                            disabled={isSyncing}
                                        >
                                            <Clock size={16} style={{ transform: isSyncing ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s ease' }} />
                                            {isSyncing ? 'Syncing...' : 'Refresh'}
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
                                                {!localStorage.getItem('user') && !localStorage.getItem('guestMobile') && (
                                                    <button 
                                                        onClick={() => navigate('/login')}
                                                        style={{ marginTop: '10px', fontSize: '12px', color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                                                    >
                                                        Login to see your previous history
                                                    </button>
                                                )}
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
                                                                        setIsReorderFlow(false);
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
                                {!localStorage.getItem('user') && localStorage.getItem('guestMobile') && (
                                    <div style={{ marginTop: '15px', padding: '12px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Info size={14} /> Synced via Guest History
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#3b82f6', margin: 0 }}>Create an account to sync your history across all devices permanently.</p>
                                        <button 
                                            onClick={() => navigate('/login')}
                                            style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}
                                        >
                                            Login / Register Now
                                        </button>
                                    </div>
                                )}
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
                            <h2>{selectedPrescription.status === 'Ordered' ? 'Order Details & Dosage' : 'Confirm Your Reorder'}</h2>
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
                        ) : (selectedPrescription.status === 'Ordered' && !isReorderFlow) ? (
                            <div className="checkout-alert alert-success" style={{ marginTop: '20px' }}>
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                This order has already been placed. Follow the dosage instructions above.
                            </div>
                        ) : (
                            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                                <div className="shipping-address-section" style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, color: '#4a5568' }}>Shipping Address</h4>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                className="btn-add-new-addr"
                                                onClick={handleDetectLocation}
                                                style={{ fontSize: '12px', background: '#ebf8ff', border: '1px solid #90cdf4', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#2b6cb0' }}
                                            >
                                                <MapPin size={14} /> Detect Location
                                            </button>
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
                                        <div className="new-address-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '3px solid #cbd5e1' }}>
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

                                <button type="submit" className="btn-pay-now" disabled={checkoutLoading} style={{ background: '#1e293b' }}>
                                    {checkoutLoading ? <div className="loader" style={{ margin: '0 auto' }}></div> : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            <Zap size={18} fill="currentColor" />
                                            <span>Confirm & Place Reorder (₹{calculateTotal(selectedPrescription.verifiedItems).toFixed(2)})</span>
                                        </div>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Prescriptions Modal (90 Days) */}
            {showRecentModal && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card" style={{ maxWidth: '600px' }}>
                        <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px 24px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'white' }}>Recent Verified Prescriptions</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7, color: 'white' }}>Select an item below to quickly reorder</p>
                            </div>
                            <button className="close-btn-light" onClick={() => setShowRecentModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-p" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                                You can select and re-order from any prescription uploaded in the last 90 days that has been verified.
                            </p>

                            {(() => {
                                const ninetyDaysAgo = new Date();
                                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

                                const recentOnes = myPrescriptions.filter(p =>
                                    new Date(p.createdAt) >= ninetyDaysAgo &&
                                    (p.status === 'Verified' || p.status === 'Ordered')
                                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                                if (recentOnes.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <FileText size={48} color="#cbd5e0" style={{ margin: '0 auto 15px' }} />
                                            <p style={{ color: '#a0aec0' }}>No verified prescriptions found in the last 90 days.</p>
                                        </div>
                                    );
                                }

                                return recentOnes.map(p => (
                                    <div
                                        key={p._id}
                                        className="order-card-premium"
                                        style={{ marginBottom: '15px', padding: '15px', border: '1px solid #e2e8f0' }}
                                    >
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                <img
                                                    src={p.image.startsWith('http') ? p.image : `${API_BASE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`}
                                                    alt="Presc"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: '700', color: '#2d3748' }}>
                                                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {getStatusBadge(p.status)}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#718096' }}>
                                                    {p.verifiedItems?.length || 0} Verified Medicines
                                                </div>
                                            </div>
                                            <button
                                                className="btn-action-primary"
                                                style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}
                                                onClick={() => handleReorder(p)}
                                            >
                                                Reorder Now
                                            </button>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
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
                            <div className="status-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
                                {/* Progress Line Fill */}
                                <div className="progress-line-fill" style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '10px',
                                    width: `${(['Pending', 'Processing', 'Out for Delivery', 'Delivered'].indexOf(selectedTrackOrder.status) / 3) * 100}%`,
                                    height: '2px',
                                    background: '#38a169',
                                    zIndex: 1,
                                    transition: 'width 0.4s ease'
                                }}></div>

                                <div className={`progress-step ${['Pending', 'Processing', 'Out for Delivery', 'Delivered'].indexOf(selectedTrackOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Pending</span>
                                </div>
                                <div className={`progress-step ${['Processing', 'Out for Delivery', 'Delivered'].indexOf(selectedTrackOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Processing</span>
                                </div>
                                <div className={`progress-step ${['Out for Delivery', 'Delivered'].indexOf(selectedTrackOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Shipping</span>
                                </div>
                                <div className={`progress-step ${selectedTrackOrder.status === 'Delivered' ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>Delivered</span>
                                </div>
                            </div>

                            <div className="premium-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: (selectedTrackOrder.status === 'Out for Delivery' || selectedTrackOrder.status === 'Delivered') ? '1.1fr 0.9fr' : '1fr',
                                gap: '30px',
                                maxWidth: (selectedTrackOrder.status === 'Out for Delivery' || selectedTrackOrder.status === 'Delivered') ? '100%' : '600px',
                                margin: '0 auto'
                            }}>
                                {/* Box 1: Dispatch & Logistics (Conditionally Shown) */}
                                {(selectedTrackOrder.status === 'Out for Delivery' || selectedTrackOrder.status === 'Delivered') && (
                                    <section className="customer-info-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '550px', background: 'white', borderRadius: '20px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                                        <div className="pane-header" style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="icon-circle" style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Truck size={18} /></div>
                                            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>Dispatch & Logistics</h3>
                                        </div>
                                        <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="pill-info" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Vehicle Name</span>
                                                        <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.vehicleName || 'N/A'}</span>
                                                    </div>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Bus Number</span>
                                                        <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.busNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Meet Bus At</span>
                                                    <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.pickupStoppage || 'Finalizing Station...'}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Driver Number</span>
                                                    <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.conductorNumber || selectedTrackOrder.shippingAddress?.phone}</span>
                                                </div>
                                            </div>

                                            <div className="data-row" style={{ marginTop: '5px' }}>
                                                <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Estimated Arrival</span>
                                                <span className="data-value" style={{ display: 'block', fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{selectedTrackOrder.dispatchDetails?.estimatedArrivalTime || 'Awaiting Schedule'}</span>
                                            </div>

                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', height: '140px', marginTop: 'auto' }} onClick={() => {
                                                const img = selectedTrackOrder.dispatchDetails?.busId?.image || selectedTrackOrder.dispatchDetails?.busImage;
                                                if (img) setImageModalSrc(img);
                                            }}>
                                                {(() => {
                                                    const finalImage = selectedTrackOrder.dispatchDetails?.busId?.image || selectedTrackOrder.dispatchDetails?.busImage;
                                                    if (!finalImage) return <div style={{ padding: '50px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>Identity Photo Pending</div>;
                                                    const resolvedUrl = finalImage.startsWith('http')
                                                        ? finalImage
                                                        : `${API_BASE_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
                                                    return <img src={resolvedUrl} alt="Bus" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                                })()}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Box 2: Order Summary */}
                                <section className="items-info-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '550px', background: 'white', borderRadius: '24px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                    <div className="pane-header" style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="icon-circle" style={{ width: '36px', height: '36px', background: '#38a169', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><ShoppingBag size={20} /></div>
                                            <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#1e293b' }}>Order Summary</h3>
                                        </div>
                                        <div style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' }}>Verified Packet</div>
                                    </div>

                                    <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div className="medicine-items-scroll" style={{ flex: 1, marginBottom: '20px' }}>
                                            {selectedTrackOrder.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontSize: '16px' }}>💊</span>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', lineHeight: '1.2' }}>{item.name || item.medicineName}</span>
                                                            <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>₹{item.price?.toFixed(2)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.quantity} Unit{item.quantity > 1 ? 's' : ''}</span>
                                                            {item.frequency && (
                                                                <span style={{ width: '3px', height: '3px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                                                            )}
                                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{item.frequency}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="receipt-footer" style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Deliver To</div>
                                                <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
                                                    {selectedTrackOrder.shippingAddress?.street},<br />
                                                    {selectedTrackOrder.shippingAddress?.city} - {selectedTrackOrder.shippingAddress?.zip}
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px dashed #e2e8f0', margin: '15px 0', paddingTop: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Items Total</span>
                                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>₹{selectedTrackOrder.totalAmount.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                                    <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>Amount Paid</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', lineHeight: '1' }}>₹{selectedTrackOrder.totalAmount.toFixed(2)}</div>
                                                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>✓ Transaction Success</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => window.open(`${API_BASE_URL}/api/orders/public/${selectedTrackOrder._id}/invoice`, '_blank')}
                                                    style={{
                                                        width: '100%',
                                                        marginTop: '20px',
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: '#fff',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        fontWeight: '700',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                                                    onMouseOut={(e) => e.target.style.background = '#fff'}
                                                >
                                                    <FileText size={16} />
                                                    Download Digital Invoice
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
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
                                : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`
                            }
                            alt="Full View"
                        />
                    </div>
                </div>
            )}
            {/* Post-Upload Success Modal */}
            {showPostUploadModal && (
                <div className="checkout-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="checkout-modal-card" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#f0fff4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#38a169' }}>
                            <CheckCircle size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '16px' }}>Prescription Submitted!</h2>
                        <div style={{ color: '#718096', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '30px' }}>
                            <p style={{ marginBottom: '15px' }}>Your prescription has been securely uploaded and sent for verification.</p>
                            <p style={{ marginBottom: '15px', fontWeight: '600', color: '#4a5568' }}>This will be verified within 24-48 hours.</p>
                            <p>Once verified, you will need to provide your delivery address and confirm the final amount to complete the order. {localStorage.getItem('user') ? 'You can track this process from the Activity Log on this page.' : 'Our pharmacist will contact you on the provided mobile number for further details.'}</p>
                        </div>
                        <button
                            className="btn-submit-premium"
                            style={{ marginTop: '0' }}
                            onClick={() => setShowPostUploadModal(false)}
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            )}

            {/* Guest Info Modal */}
            {showGuestModal && (
                <div className="checkout-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="checkout-modal-card" style={{ maxWidth: '450px', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748' }}>Guest Information</h2>
                            <button onClick={() => setShowGuestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: '#718096', marginBottom: '24px', fontSize: '0.95rem' }}>
                            Please provide your name and mobile number so our pharmacist can contact you regarding your prescription.
                        </p>
                        <form onSubmit={handleGuestSubmit}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>Full Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={guestName} 
                                    onChange={e => setGuestName(e.target.value)} 
                                    placeholder="Enter your full name" 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>Mobile Number</label>
                                <input 
                                    type="tel" 
                                    required 
                                    maxLength="10"
                                    value={guestMobile} 
                                    onChange={e => setGuestMobile(e.target.value.replace(/\D/g, ''))} 
                                    placeholder="Enter 10-digit mobile number" 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn-submit-premium" 
                                disabled={loading}
                                style={{ width: '100%', margin: 0 }}
                            >
                                {loading ? <div className="loader"></div> : 'Confirm and Submit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderMedicine;
