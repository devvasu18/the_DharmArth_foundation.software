import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Camera, ShieldCheck, Zap, Truck, ArrowRight, X, Info, MapPin, Plus, Edit2, Phone, User, Share2, ShoppingBag } from 'lucide-react';
import api, { API_BASE_URL } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SimplifyDosage from '../components/SimplifyDosage';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './OrderMedicine.css';

const VerifiedItemRow = ({ item }) => {
    const { t } = useTranslation();
    const [showDosage, setShowDosage] = useState(false);
    const hasDosage = item.time || item.frequency || item.foodRelation || item.intakeMethod || item.dosage;

    return (
        <div style={{ marginBottom: '15px', borderBottom: '2px solid #cbd5e0', paddingBottom: '10px' }}>
            <div className="item-row" style={{ borderBottom: 'none', padding: 0, marginBottom: '8px' }}>
                <div className="item-name" style={{ fontWeight: '600', color: '#2d3748', fontSize: '1.1rem' }}>
                    {item.medicineName} ({t('pharmacy.unit')}: {item.quantity || 1})
                </div>
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
                        {showDosage ? t('pharmacy.hideDosage') : t('pharmacy.viewDosage')}
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
                    <Info size={12} style={{ display: 'inline', marginRight: '4px' }} /> {t('pharmacy.noDosage')}
                </div>
            )}
        </div>
    );
};

const OrderMedicine = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
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
    const [faqAnswers, setFaqAnswers] = useState({});

    const getContactTiming = () => {
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 8) {
            return {
                text: i18n.language === 'hi'
                    ? (pharmacyConfig?.nightTimeContactTextHi || pharmacyConfig?.nightTimeContactText || "फाउंडेशन आपसे सुबह 8:30 बजे संपर्क करेगा")
                    : (pharmacyConfig?.nightTimeContactText || "Foundation will contact you at 8:30 AM"),
                icon: <Clock size={14} />,
                type: 'night'
            };
        } else {
            return {
                text: i18n.language === 'hi'
                    ? (pharmacyConfig?.dayTimeContactTextHi || pharmacyConfig?.dayTimeContactText || "फार्मासिस्ट आपसे 10-20 मिनट में संपर्क करेगा")
                    : (pharmacyConfig?.dayTimeContactText || "Pharmacist will contact you in 10-20 minutes"),
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
            toast.success(t('pharmacy.logUpdated'));
        } catch (err) {
            toast.error(t('pharmacy.syncFailed'));
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    }

    const [isDetecting, setIsDetecting] = useState(false);
    const [showLocationHelp, setShowLocationHelp] = useState(false);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetecting(true);
        toast.loading(t('pharmacy.detectingLocation') || "Detecting location...", { id: 'detect-location' });
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                    const data = await response.json();

                    if (data.status === 'OK' && data.results[0]) {
                        const components = data.results[0].address_components;
                        let street = data.results[0].formatted_address;
                        let city = '';
                        let state = '';
                        let zip = '';

                        components.forEach(c => {
                            if (c.types.includes('locality')) city = c.long_name;
                            if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                            if (c.types.includes('postal_code')) zip = c.long_name;
                        });

                        setShippingDetails(prev => ({
                            ...prev,
                            street,
                            city: city || prev.city,
                            state: state || prev.state,
                            zip: zip || prev.zip
                        }));
                        toast.success(t('pharmacy.locationDetected') || "Location detected!", { id: 'detect-location' });
                    } else {
                        toast.error("Failed to fetch address. Please enter manually.", { id: 'detect-location' });
                    }
                } catch (error) {
                    console.error("Location error:", error);
                    toast.error("Error detecting location", { id: 'detect-location' });
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                setIsDetecting(false);
                toast.dismiss('detect-location');
                console.error("Location error:", error);
                setShowLocationHelp(true);
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
        if (localStorage.getItem('user')) {
            fetchSavedAddresses();
        }
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
                toast.error(t('pharmacy.maxSizeError'));
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

        // Validate Address details first
        if (!shippingDetails.street || !shippingDetails.city || !shippingDetails.state || !shippingDetails.zip) {
            toast.error(t('pharmacy.fillAddress') || "Please fill in all delivery address fields.");
            setError(t('pharmacy.fillAddress') || "Please fill in all delivery address fields.");
            return;
        }

        // Phone is required for delivery
        const deliveryPhone = shippingDetails.phone || guestMobile || (user ? user.mobile : '');
        if (!deliveryPhone) {
            toast.error(t('pharmacy.phoneRequired') || "A contact number is required for delivery.");
            setError(t('pharmacy.phoneRequired') || "A contact number is required for delivery.");
            return;
        }

        // Validate Pincode serviceability
        const userPincode = shippingDetails.zip.trim();
        if (pharmacyConfig?.acceptedPincodes && pharmacyConfig.acceptedPincodes.trim() !== '') {
            const allowedPincodes = pharmacyConfig.acceptedPincodes.split(',').map(pin => pin.trim());
            if (!allowedPincodes.includes(userPincode)) {
                const errMsg = `${t('pharmacy.unserviceablePin') || "Sorry, we do not deliver to this pin code. Serviceable pin codes are"}: ${allowedPincodes.join(', ')}`;
                toast.error(errMsg);
                setError(errMsg);
                return;
            }
        }

        if (!file) {
            setError(t('pharmacy.selectFile'));
            return;
        }

        if (pharmacyConfig?.faqs && pharmacyConfig.faqs.length > 0) {
            const missingAnswers = pharmacyConfig.faqs.filter(faq => !faqAnswers[faq.id] || faqAnswers[faq.id].trim() === '');
            if (missingAnswers.length > 0) {
                toast.error(`${t('pharmacy.yourAnswer')}: ${missingAnswers[0].question}`);
                setError(t('pharmacy.answerRequired'));
                return;
            }
        }

        const formData = new FormData();
        formData.append('prescription', file);
        if (notes) formData.append('notes', notes);
        
        const answerArray = (pharmacyConfig?.faqs || [])
            .filter(faq => faqAnswers[faq.id])
            .map(faq => ({ question: faq.question, answer: faqAnswers[faq.id] }));
        
        if (answerArray.length > 0) {
            formData.append('faqAnswers', JSON.stringify(answerArray));
        }
        
        if (isGuest) {
            formData.append('guestName', guestName);
            formData.append('guestMobile', guestMobile);
        }

        formData.append('shippingAddress', JSON.stringify({
            ...shippingDetails,
            phone: deliveryPhone
        }));

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
            toast.error(t('pharmacy.fillGuest'));
            return;
        }
        if (guestMobile.length < 10) {
            toast.error(t('pharmacy.validMobile'));
            return;
        }
        handleSubmit(null, true);
    };

    const handleCopyLink = (prescriptionId) => {
        const url = `${window.location.origin}/checkout/${prescriptionId}`;
        navigator.clipboard.writeText(url);
        toast.success(t('pharmacy.linkCopied'));
    };

    const getOrderBadge = (status) => {
        switch (status) {
            case 'Payment Pending': return <span className="status-badge pending" style={{ background: '#fff3cd', color: '#856404' }}>{t('pharmacy.badges.pendingPayment')}</span>;
            case 'Processing': return <span className="status-badge review" style={{ background: '#d1ecf1', color: '#0c5460' }}>{t('pharmacy.badges.processing')}</span>;
            case 'Out for Delivery': return <span className="status-badge verified" style={{ background: '#d4edda', color: '#155724' }}>{t('pharmacy.badges.outForDelivery')}</span>;
            case 'Delivered': return <span className="status-badge verified"><CheckCircle size={14} /> {t('pharmacy.badges.delivered')}</span>;
            case 'Cancelled': return <span className="status-badge rejected"><X size={14} /> {t('pharmacy.badges.cancelled')}</span>;
            default: return <span className="status-badge pending">{status}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="status-badge pending"><Clock size={14} /> {t('pharmacy.badges.pending')}</span>;
            case 'Verified': return <span className="status-badge verified"><CheckCircle size={14} /> {t('pharmacy.badges.verified')}</span>;
            case 'Rejected': return <span className="status-badge rejected"><AlertCircle size={14} /> {t('pharmacy.badges.rejected')}</span>;
            case 'Under Review': return <span className="status-badge review"><FileText size={14} /> {t('pharmacy.badges.reviewing')}</span>;
            case 'Ordered': return <span className="status-badge verified" style={{ background: '#ebf8ff', color: '#2b6cb0' }}><Zap size={14} /> {t('pharmacy.badges.ordered')}</span>;
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
            toast.loading(t('pharmacy.checkingStock'), { id: 'stock-check' });
            const res = await api.post('/marg/check-stock-bulk', { pids });
            const availability = res.data.availability || {};

            // 3. Determine if everything is in stock
            const allInStock = pids.every(pid => availability[pid] === true);

            if (allInStock) {
                toast.success(t('pharmacy.allInStock'), { id: 'stock-check' });
                setShowRecentModal(false);
                openCheckoutModal(prescription, true);
            } else {
                // 4. If any item is out of stock, re-submit as prescription request
                toast(t('pharmacy.outOfStockResubmit'), { id: 'stock-check', icon: '⏳' });

                await api.post(`/prescriptions/${prescription._id}/re-submit`);

                setShowRecentModal(false);
                showAlert({
                    title: t('pharmacy.stockUpdateTitle'),
                    message: t('pharmacy.stockUpdateMsg'),
                    confirmText: t('pharmacy.gotIt'),
                    showCancel: false
                });

                // Refresh data to show the new pending prescription
                fetchHistory();
                fetchOrders();
            }
        } catch (err) {
            console.error('Reorder failed', err);
            toast.error('Could not verify stock. Please try again.', { id: 'stock-check' });
        }
    };

    const openCheckoutModal = (prescription, isReorder = false) => {
        const availableItems = prescription.verifiedItems?.filter(i => i.isAvailable) || [];
        if (availableItems.length === 0) {
            toast.error(t('pharmacy.noVerifiedItems'));
            return;
        }
        setIsReorderFlow(isReorder);
        setSelectedPrescription(prescription);
        setCheckoutSuccess(false);
        setCheckoutError(null);
        
        // Pre-fill shipping address from prescription's pendingShippingAddress if present
        if (prescription.pendingShippingAddress && prescription.pendingShippingAddress.street) {
            setShippingDetails(prescription.pendingShippingAddress);
            setIsAddingNewAddress(false);
        } else {
            fetchSavedAddresses();
        }
        
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
            setCheckoutError(err.response?.data?.message || t('pharmacy.checkoutFailed'));
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
                    <div className="badge-pill">{t('pharmacy.premiumService')}</div>
                    <h1>{t('pharmacy.orderMedicine')}</h1>
                    <p>{t('pharmacy.heroSubtitle')}</p>
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                        <button 
                            className="refresh-btn" 
                            onClick={() => navigate('/order-history')}
                            style={{ background: '#3182ce', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '15px' }}
                        >
                            <Clock size={18} /> {t('pharmacy.viewHistory')}
                        </button>
                    </div>
                </div>

                {/* Info Steps */}
                <section className="steps-sec">
                    <div className="container">
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-icon"><Camera size={24} /></div>
                                <h4>{t('pharmacy.steps.uploadTitle')}</h4>
                                <p>{t('pharmacy.steps.uploadDesc')}</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><ShieldCheck size={24} /></div>
                                <h4>{t('pharmacy.steps.verifyTitle')}</h4>
                                <p>{t('pharmacy.steps.verifyDesc')}</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><Truck size={24} /></div>
                                <h4>{t('pharmacy.steps.deliveryTitle')}</h4>
                                <p>{t('pharmacy.steps.deliveryDesc')}</p>
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
                                    <h3>{t('pharmacy.sendPrescription')}</h3>
                                    <Zap size={20} color="#f6ad55" />
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-scroll-fields">
                                        {/* Step 1: Delivery Address */}
                                    <div className="address-section-premium" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #cbd5e1' }}>
                                         <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>
                                             <MapPin size={18} color="#e53e3e" />
                                             1. {t('pharmacy.deliveryAddress') || "Delivery Address"}
                                         </h4>

                                         {savedAddresses.length > 0 && (
                                             <div className="saved-addresses-selector-shared" style={{ marginBottom: '15px' }}>
                                                 <div className="address-pills-row-shared" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                                     {savedAddresses.map((addr, idx) => (
                                                         <button
                                                             key={idx}
                                                             className={`addr-pill-shared ${shippingDetails.street === addr.street ? 'active' : ''}`}
                                                             onClick={() => {
                                                                 setShippingDetails(addr);
                                                                 setIsAddingNewAddress(false);
                                                             }}
                                                             type="button"
                                                             style={{
                                                                 padding: '8px 12px',
                                                                 borderRadius: '8px',
                                                                 border: shippingDetails.street === addr.street ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                                                                 background: shippingDetails.street === addr.street ? '#eff6ff' : '#f8fafc',
                                                                 cursor: 'pointer',
                                                                 whiteSpace: 'nowrap',
                                                                 fontSize: '12px'
                                                             }}
                                                         >
                                                             <strong>{addr.city}</strong>: <span style={{ fontSize: '11px', color: '#64748b' }}>{addr.street.substring(0, 20)}...</span>
                                                         </button>
                                                     ))}
                                                     <button
                                                         className={`addr-pill-shared ${isAddingNewAddress ? 'active' : ''}`}
                                                         onClick={() => {
                                                             setShippingDetails({ _id: null, street: '', city: '', state: '', zip: '', phone: user?.mobile || '', altPhone: '' });
                                                             setIsAddingNewAddress(true);
                                                         }}
                                                         type="button"
                                                         style={{
                                                             padding: '8px 12px',
                                                             borderRadius: '8px',
                                                             border: isAddingNewAddress ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                                                             background: isAddingNewAddress ? '#eff6ff' : '#f8fafc',
                                                             cursor: 'pointer',
                                                             whiteSpace: 'nowrap',
                                                             fontSize: '12px',
                                                             fontWeight: '600'
                                                         }}
                                                     >
                                                         + {t('pharmacy.addNewAddress') || "New Address"}
                                                     </button>
                                                 </div>
                                             </div>
                                         )}

                                         {(isAddingNewAddress || savedAddresses.length === 0) && (
                                             <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                                 <div style={{ position: 'relative' }}>
                                                     <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pharmacy.streetAddress') || "Street Address"}</label>
                                                     <input
                                                         type="text"
                                                         value={shippingDetails.street}
                                                         onChange={(e) => setShippingDetails(prev => ({ ...prev, street: e.target.value }))}
                                                         placeholder={isDetecting ? "Detecting location..." : "House/Plot No, Apartment, Street"}
                                                         required
                                                         style={{ width: '100%', padding: '10px 90px 10px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                     />
                                                     <button
                                                         type="button"
                                                         onClick={handleDetectLocation}
                                                         disabled={isDetecting}
                                                         style={{
                                                             position: 'absolute',
                                                             right: '6px',
                                                             bottom: '6px',
                                                             padding: '5px 10px',
                                                             borderRadius: '6px',
                                                             background: '#3b82f6',
                                                             color: '#fff',
                                                             border: 'none',
                                                             fontSize: '11px',
                                                             fontWeight: '600',
                                                             cursor: 'pointer',
                                                             display: 'flex',
                                                             alignItems: 'center',
                                                             gap: '4px'
                                                         }}
                                                     >
                                                         <MapPin size={11} />
                                                         {isDetecting ? '...' : t('pharmacy.detect') || 'Detect'}
                                                     </button>
                                                 </div>

                                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                     <div>
                                                         <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pharmacy.city') || "City"}</label>
                                                         <input
                                                             type="text"
                                                             value={shippingDetails.city}
                                                             onChange={(e) => setShippingDetails(prev => ({ ...prev, city: e.target.value }))}
                                                             placeholder="e.g. Nagaur"
                                                             required
                                                             style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                         />
                                                     </div>
                                                     <div>
                                                         <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pharmacy.state') || "State"}</label>
                                                         <input
                                                             type="text"
                                                             value={shippingDetails.state}
                                                             onChange={(e) => setShippingDetails(prev => ({ ...prev, state: e.target.value }))}
                                                             placeholder="e.g. Rajasthan"
                                                             required
                                                             style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                         />
                                                     </div>
                                                     <div>
                                                         <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pharmacy.pinCode') || "Pin Code"}</label>
                                                         <input
                                                             type="text"
                                                             value={shippingDetails.zip}
                                                             onChange={(e) => setShippingDetails(prev => ({ ...prev, zip: e.target.value }))}
                                                             placeholder="341001"
                                                             required
                                                             style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                         />
                                                     </div>
                                                 </div>

                                                 {user && (
                                                     <div style={{ marginTop: '5px' }}>
                                                         <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                                                             <input
                                                                 type="checkbox"
                                                                 checked={isOrderingForSomeoneElse}
                                                                 onChange={(e) => {
                                                                     setIsOrderingForSomeoneElse(e.target.checked);
                                                                     if (!e.target.checked) {
                                                                         setShippingDetails(prev => ({ ...prev, phone: user.mobile }));
                                                                     }
                                                                 }}
                                                             />
                                                             {t('pharmacy.someoneElse') || "Ordering for someone else?"}
                                                         </label>
                                                     </div>
                                                 )}

                                                 {(isOrderingForSomeoneElse || !user) && (
                                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                                                         <div>
                                                             <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pharmacy.receiverPhone') || "Receiver's Phone Number"}</label>
                                                             <input
                                                                 type="tel"
                                                                 value={shippingDetails.phone}
                                                                 onChange={(e) => setShippingDetails(prev => ({ ...prev, phone: e.target.value }))}
                                                                 placeholder="10-digit number"
                                                                 required
                                                                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                             />
                                                         </div>
                                                         <div>
                                                             <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>{t('pharmacy.altPhone') || "Alternate Phone"}</label>
                                                             <input
                                                                 type="tel"
                                                                 value={shippingDetails.altPhone}
                                                                 onChange={(e) => setShippingDetails(prev => ({ ...prev, altPhone: e.target.value }))}
                                                                 placeholder="Optional"
                                                                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                             />
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                     </div>

                                     {/* Step 2: Upload Prescription */}
                                     <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>
                                         <FileText size={18} color="#3b82f6" />
                                         2. {t('pharmacy.uploadPrescriptionStep') || "Upload Prescription"}
                                     </h4>

                                     <div
                                         className={`drop-area ${preview ? 'preview-active' : ''}`}
                                         onClick={() => document.getElementById('presc-upload').click()}
                                     >
                                        {preview ? (
                                            <div className="preview-container">
                                                <img src={preview} alt="Upload Preview" />
                                                <div className="change-btn">{t('pharmacy.changePhoto', { defaultValue: 'Change Photo' })}</div>
                                            </div>
                                        ) : (
                                            <div className="placeholder">
                                                <div className="icon-circle">
                                                    <Upload size={32} />
                                                </div>
                                                <p>{t('pharmacy.dropPrescription')}</p>
                                                <span>{t('pharmacy.supports')}</span>
                                                <small className="text-gray-500 mt-2 block">{t('pharmacy.maxSize')}</small>
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

                                    {pharmacyConfig?.faqs?.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>{t('pharmacy.additionalInfo')}</label>
                                            {pharmacyConfig.faqs.map((faq, idx) => (
                                                <div key={idx} style={{ marginBottom: '12px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                                        {(i18n.language === 'hi' && faq.question_hi) ? faq.question_hi : faq.question} <span style={{color: '#ef4444'}}>*</span>
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        value={faqAnswers[faq.id] || ''}
                                                        onChange={(e) => setFaqAnswers(prev => ({...prev, [faq.id]: e.target.value}))}
                                                        placeholder={t('pharmacy.yourAnswer')}
                                                        required
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px' }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '20px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>{t('pharmacy.optionalNotes')}</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder={t('pharmacy.placeholderNotes')}
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
                                    </div>

                                    <button className="btn-submit-premium" disabled={loading} style={{ marginTop: '20px' }}>
                                        {loading ? (
                                            <div className="loader"></div>
                                        ) : (
                                            <>
                                                <Zap size={18} fill="currentColor" />
                                                {t('pharmacy.submitNow')}
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
                                    onClick={() => {
                                        if (!user) {
                                            navigate('/login');
                                        } else {
                                            setShowRecentModal(true);
                                        }
                                    }}
                                >
                                    <Clock size={18} />
                                    {t('pharmacy.selectPrevious')}
                                </button>

                                <div className="security-tag">
                                    <ShieldCheck size={14} />
                                    <span>{t('pharmacy.encryptedPrivate')}</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: History */}
                        <div className="history-column">
                            <div className="history-box glass-card">
                                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <h3 style={{ margin: 0 }}>{t('pharmacy.historyRecent')}</h3>
                                            {!localStorage.getItem('user') && localStorage.getItem('guestMobile') && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: '600', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                                                    <User size={10} /> {t('pharmacy.viewingAsGuest', { mobile: localStorage.getItem('guestMobile') })}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className={`refresh-btn ${isSyncing ? 'syncing' : ''}`}
                                            onClick={handleSync}
                                            disabled={isSyncing}
                                        >
                                            <Clock size={16} style={{ transform: isSyncing ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s ease' }} />
                                            {isSyncing ? t('pharmacy.syncing') : t('pharmacy.refresh')}
                                        </button>
                                    </div>
                                    <div className="tab-switcher" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', width: '100%' }}>
                                        <button
                                            className={`tab-btn ${historyTab === 'prescriptions' ? 'active' : ''}`}
                                            onClick={() => setHistoryTab('prescriptions')}
                                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: historyTab === 'prescriptions' ? '#fff' : 'transparent', fontWeight: historyTab === 'prescriptions' ? '600' : '400', boxShadow: historyTab === 'prescriptions' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', outline: 'none' }}
                                        >
                                            {t('pharmacy.prescriptionsTab', { count: filteredPrescriptions.length })}
                                        </button>
                                        <button
                                            className={`tab-btn ${historyTab === 'orders' ? 'active' : ''}`}
                                            onClick={() => setHistoryTab('orders')}
                                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: historyTab === 'orders' ? '#fff' : 'transparent', fontWeight: historyTab === 'orders' ? '600' : '400', boxShadow: historyTab === 'orders' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s', outline: 'none' }}
                                        >
                                            {t('pharmacy.trackOrdersTab', { count: myOrders.length })}
                                        </button>
                                    </div>
                                </div>

                                <div className="order-list-premium">
                                    {historyTab === 'prescriptions' ? (
                                        filteredPrescriptions.length === 0 ? (
                                            <div className="empty-state-cool">
                                                <FileText size={48} strokeWidth={1} />
                                                <p>{t('pharmacy.noPrescriptions')}</p>
                                                {!localStorage.getItem('user') && !localStorage.getItem('guestMobile') && (
                                                    <button 
                                                        onClick={() => navigate('/login')}
                                                        style={{ marginTop: '10px', fontSize: '12px', color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                                                    >
                                                        {t('pharmacy.loginToSeeHistory')}
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
                                                                        {t('pharmacy.reviewCheckout')}
                                                                    </button>
                                                                    <button
                                                                        className="btn-action-secondary"
                                                                        onClick={() => handleCopyLink(p._id)}
                                                                        title={t('pharmacy.sharePaymentLink')}
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
                                                                    <FileText size={16} /> {t('pharmacy.viewDosageInst')}
                                                                </button>
                                                            ) : (
                                                                <div className="status-msg">
                                                                    {p.status === 'Pending' ? t('pharmacy.statusPending') : p.status === 'Rejected' ? t('pharmacy.statusRejected') : t('pharmacy.statusReviewing')}
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
                                                <p>{t('pharmacy.noActiveOrders')}</p>
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
                                                            <span style={{ fontWeight: '700', color: '#1a202c' }}>{t('pharmacy.orderNum', { id: order._id.substring(order._id.length - 6).toUpperCase() })}</span>
                                                            {getOrderBadge(order.status)}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '10px' }}>
                                                            {t('pharmacy.medicinesCount', { count: order.items.length, price: order.totalAmount.toFixed(2) })}
                                                        </div>
                                                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#718096', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                                {order.shippingAddress?.city}
                                                            </div>
                                                            <span style={{ color: '#3182ce', fontWeight: 'bold' }}>{t('pharmacy.viewDetails')}</span>
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
                                            <Info size={14} /> {t('pharmacy.syncedViaGuest')}
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#3b82f6', margin: 0 }}>{t('pharmacy.syncMsg')}</p>
                                        <button 
                                            onClick={() => navigate('/login')}
                                            style={{ width: '100%', padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}
                                        >
                                            {t('pharmacy.loginRegisterNow')}
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
                            <h2>{selectedPrescription.status === 'Ordered' ? t('pharmacy.orderDetailsDosage') : t('pharmacy.confirmReorder')}</h2>
                            <button className="btn-close" onClick={() => setCheckoutModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="verified-items-list">
                            <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>{t('pharmacy.verifiedItemsAvailable')}</h4>
                            {selectedPrescription.verifiedItems.filter(i => i.isAvailable).map((item, idx) => (
                                <VerifiedItemRow key={idx} item={item} />
                            ))}
                            <div className="checkout-total">
                                <span>{t('pharmacy.grandTotal')}</span>
                                <span>₹{calculateTotal(selectedPrescription.verifiedItems).toFixed(2)}</span>
                            </div>
                        </div>
                        {checkoutSuccess ? (
                            <div className="checkout-alert alert-success">
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                {t('pharmacy.orderPlacedSuccess')}
                            </div>
                        ) : (selectedPrescription.status === 'Ordered' && !isReorderFlow) ? (
                            <div className="checkout-alert alert-success" style={{ marginTop: '20px' }}>
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                {t('pharmacy.orderAlreadyPlaced')}
                            </div>
                        ) : (
                            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                                <div className="shipping-address-section" style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, color: '#4a5568' }}>{t('pharmacy.shippingAddress')}</h4>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                className="btn-add-new-addr"
                                                onClick={handleDetectLocation}
                                                style={{ fontSize: '12px', background: '#ebf8ff', border: '1px solid #90cdf4', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#2b6cb0' }}
                                            >
                                                <MapPin size={14} /> {t('pharmacy.detectLocation')}
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
                                                    <Plus size={14} /> {t('pharmacy.addNew')}
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
                                                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>{addr.label || t('pharmacy.home')}</div>
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
                                                <label>{t('pharmacy.streetAddress')}</label>
                                                <input type="text" required value={shippingDetails.street} onChange={e => setShippingDetails({ ...shippingDetails, street: e.target.value })} placeholder={t('pharmacy.placeholderStreet')} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>{t('pharmacy.city')}</label>
                                                    <input type="text" required value={shippingDetails.city} onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })} placeholder={t('pharmacy.city')} />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>{t('pharmacy.pinCode')}</label>
                                                    <input type="text" required value={shippingDetails.zip} onChange={e => setShippingDetails({ ...shippingDetails, zip: e.target.value })} placeholder={t('pharmacy.placeholderPin')} />
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label>{t('pharmacy.state')}</label>
                                                <input type="text" required value={shippingDetails.state} onChange={e => setShippingDetails({ ...shippingDetails, state: e.target.value })} placeholder={t('pharmacy.state')} />
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
                                                <label htmlFor="someone-else" style={{ margin: 0, cursor: 'pointer', fontWeight: '500', color: '#3182ce', fontSize: '14px' }}>{t('pharmacy.orderingForSomeoneElse')}</label>
                                            </div>

                                            {isOrderingForSomeoneElse && (
                                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                    <div className="form-group" style={{ flex: 1 }}>
                                                        <label>{t('pharmacy.receiverPhone')}</label>
                                                        <input type="text" required value={shippingDetails.phone} onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })} placeholder={t('pharmacy.placeholderMobile')} />
                                                    </div>
                                                    <div className="form-group" style={{ flex: 1 }}>
                                                        <label>{t('pharmacy.altPhoneOptional')}</label>
                                                        <input type="text" value={shippingDetails.altPhone || ''} onChange={e => setShippingDetails({ ...shippingDetails, altPhone: e.target.value })} placeholder={t('pharmacy.placeholderAltPhone')} />
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
                                                    {t('pharmacy.cancelSavedAddress')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>{t('pharmacy.paymentMethod')}</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="Online">{t('pharmacy.onlinePayment')}</option>
                                        <option value="COD">{t('pharmacy.codPayment')}</option>
                                        <option value="Wallet">{t('pharmacy.walletPayment')}</option>
                                    </select>
                                </div>

                                {checkoutError && <div className="alert alert-error" style={{ padding: '10px', marginTop: 0 }}>{checkoutError}</div>}

                                <button type="submit" className="btn-pay-now" disabled={checkoutLoading} style={{ background: '#1e293b' }}>
                                    {checkoutLoading ? <div className="loader" style={{ margin: '0 auto' }}></div> : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            <Zap size={18} fill="currentColor" />
                                            <span>{t('pharmacy.confirmPlaceReorder', { total: calculateTotal(selectedPrescription.verifiedItems).toFixed(2) })}</span>
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
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'white' }}>{t('pharmacy.recentVerifiedPrescriptions')}</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7, color: 'white' }}>{t('pharmacy.selectToReorder')}</p>
                            </div>
                            <button className="close-btn-light" onClick={() => setShowRecentModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-p" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                                {t('pharmacy.reorderLimitInfo')}
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
                                            <p style={{ color: '#a0aec0' }}>{t('pharmacy.noVerifiedLast90')}</p>
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
                                                    {t('pharmacy.verifiedMedicinesCount', { count: p.verifiedItems?.length || 0 })}
                                                </div>
                                            </div>
                                            <button
                                                className="btn-action-primary"
                                                style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}
                                                onClick={() => handleReorder(p)}
                                            >
                                                {t('pharmacy.reorderNow')}
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
                                    <div className="order-badge color-white">{t('pharmacy.orderIdPrefix', { id: selectedTrackOrder._id.substring(selectedTrackOrder._id.length - 8).toUpperCase() })}</div>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/track/${selectedTrackOrder._id}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success(t('pharmacy.trackingLinkCopied'));
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', color: '#cbd5e1', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Share2 size={12} /> {t('pharmacy.copyLink')}
                                    </button>
                                </div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>{t('pharmacy.orderTracker')}</h2>
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
                                    <span>{t('pharmacy.badges.pending')}</span>
                                </div>
                                <div className={`progress-step ${['Processing', 'Out for Delivery', 'Delivered'].indexOf(selectedTrackOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>{t('pharmacy.badges.processing')}</span>
                                </div>
                                <div className={`progress-step ${['Out for Delivery', 'Delivered'].indexOf(selectedTrackOrder.status) >= 0 ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>{t('pharmacy.shipping')}</span>
                                </div>
                                <div className={`progress-step ${selectedTrackOrder.status === 'Delivered' ? 'active' : ''}`}>
                                    <div className="step-point"></div>
                                    <span>{t('pharmacy.badges.delivered')}</span>
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
                                            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{t('pharmacy.dispatchLogistics')}</h3>
                                        </div>
                                        <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="pill-info" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.vehicleName')}</span>
                                                        <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.vehicleName || 'N/A'}</span>
                                                    </div>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.busNumber')}</span>
                                                        <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.busNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.meetBusAt')}</span>
                                                    <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.pickupStoppage || t('pharmacy.finalizingStation')}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.driverNumber')}</span>
                                                    <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.conductorNumber || selectedTrackOrder.shippingAddress?.phone}</span>
                                                </div>
                                            </div>

                                            <div className="data-row" style={{ marginTop: '5px' }}>
                                                <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.estimatedArrival')}</span>
                                                <span className="data-value" style={{ display: 'block', fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{selectedTrackOrder.dispatchDetails?.estimatedArrivalTime || t('pharmacy.awaitingSchedule')}</span>
                                            </div>

                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', height: '140px', marginTop: 'auto' }} onClick={() => {
                                                const img = selectedTrackOrder.dispatchDetails?.busId?.image || selectedTrackOrder.dispatchDetails?.busImage;
                                                if (img) setImageModalSrc(img);
                                            }}>
                                                {(() => {
                                                    const finalImage = selectedTrackOrder.dispatchDetails?.busId?.image || selectedTrackOrder.dispatchDetails?.busImage;
                                                    if (!finalImage) return <div style={{ padding: '50px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>{t('pharmacy.identityPhotoPending')}</div>;
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
                                            <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#1e293b' }}>{t('pharmacy.orderSummary')}</h3>
                                        </div>
                                        <div style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' }}>{t('pharmacy.verifiedPacket')}</div>
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
                                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('pharmacy.unitCount', { count: item.quantity, plural: item.quantity > 1 ? 's' : '' })}</span>
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
                                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{t('pharmacy.deliverTo')}</div>
                                                <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
                                                    {selectedTrackOrder.shippingAddress?.street},<br />
                                                    {selectedTrackOrder.shippingAddress?.city} - {selectedTrackOrder.shippingAddress?.zip}
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px dashed #e2e8f0', margin: '15px 0', paddingTop: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>{t('pharmacy.itemsTotal')}</span>
                                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>₹{selectedTrackOrder.totalAmount.toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                                    <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>{t('pharmacy.amountPaid')}</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', lineHeight: '1' }}>₹{selectedTrackOrder.totalAmount.toFixed(2)}</div>
                                                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>{t('pharmacy.transactionSuccess')}</div>
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
                                                    {t('pharmacy.downloadInvoice')}
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
                        <h2 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '16px' }}>{t('pharmacy.prescriptionSubmitted')}</h2>
                        <div style={{ color: '#718096', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '30px' }}>
                            <p style={{ marginBottom: '15px' }}>{t('pharmacy.uploadedSuccess')}</p>
                            <p style={{ marginBottom: '15px', fontWeight: '600', color: '#4a5568' }}>{t('pharmacy.verifyHours')}</p>
                            <p>{localStorage.getItem('user') ? t('pharmacy.afterVerifyUser') : t('pharmacy.afterVerifyGuest')}</p>
                        </div>
                        <button
                            className="btn-submit-premium"
                            style={{ marginTop: '0' }}
                            onClick={() => setShowPostUploadModal(false)}
                        >
                            {t('pharmacy.gotItThanks')}
                        </button>
                    </div>
                </div>
            )}

            {/* Guest Info Modal */}
            {showGuestModal && (
                <div className="checkout-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="checkout-modal-card" style={{ maxWidth: '450px', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748' }}>{t('pharmacy.guestInfo')}</h2>
                            <button onClick={() => setShowGuestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: '#718096', marginBottom: '24px', fontSize: '0.95rem' }}>
                            {t('pharmacy.guestPrompt')}
                        </p>
                        <form onSubmit={handleGuestSubmit}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>{t('pharmacy.fullName')}</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={guestName} 
                                    onChange={e => setGuestName(e.target.value)} 
                                    placeholder={t('pharmacy.fullNamePlaceholder')} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none' }}
                                  />
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>{t('pharmacy.mobileNumber')}</label>
                                <input 
                                    type="tel" 
                                    required 
                                    maxLength="10"
                                    value={guestMobile} 
                                    onChange={e => setGuestMobile(e.target.value.replace(/\D/g, ''))} 
                                    placeholder={t('pharmacy.mobilePlaceholder')} 
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn-submit-premium" 
                                disabled={loading}
                                style={{ width: '100%', margin: 0 }}
                            >
                                {loading ? <div className="loader"></div> : t('pharmacy.confirmSubmit')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderMedicine;
