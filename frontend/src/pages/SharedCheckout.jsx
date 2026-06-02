import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
    FileText,
    CheckCircle,
    Truck,
    CreditCard,
    MapPin,
    Package,
    ArrowLeft,
    Phone,
    Info,
    AlertCircle,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import './SharedCheckout.css';
import SimplifyDosage from '../components/SimplifyDosage';
import { useAuth } from '../context/AuthContext';

const SharedCheckout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [showLocationHelp, setShowLocationHelp] = useState(false);

    const [shippingDetails, setShippingDetails] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        altPhone: ''
    });

    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetecting(true);
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
                        toast.success("Location detected!");
                    } else {
                        toast.error("Failed to fetch address. Please enter manually.");
                    }
                } catch (error) {
                    console.error("Location error:", error);
                    toast.error("Error detecting location");
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                setIsDetecting(false);
                console.error("Location error:", error);
                setShowLocationHelp(true);
            }
        );
    };
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDosageMap, setShowDosageMap] = useState({});
    const [isOrderingForOther, setIsOrderingForOther] = useState(false);

    const { user: authUser } = useAuth();

    useEffect(() => {
        fetchPrescription();
        if (authUser) {
            setIsLoggedIn(true);
            fetchSavedAddresses();
        }
    }, [id, authUser]);

    const fetchSavedAddresses = async () => {
        try {
            const res = await api.get('/users/profile');
            if (res.data.savedAddresses && res.data.savedAddresses.length > 0) {
                setSavedAddresses(res.data.savedAddresses);
                // Pre-fill with first address
                setShippingDetails(res.data.savedAddresses[0]);
            }
        } catch (err) {
            console.error("Failed to fetch saved addresses", err);
        }
    };

    const fetchPrescription = async () => {
        try {
            const res = await api.get(`/prescriptions/${id}/public`);
            setPrescription(res.data);

            if (res.data.status === 'Ordered') {
                setSuccess(true);
            }

            // Prioritize the pre-filled pending shipping address from the prescription
            if (res.data.pendingShippingAddress && res.data.pendingShippingAddress.street) {
                setShippingDetails(res.data.pendingShippingAddress);
            } else if (res.data.user?.savedAddresses && res.data.user.savedAddresses.length > 0) {
                setSavedAddresses(res.data.user.savedAddresses);
                setShippingDetails(res.data.user.savedAddresses[0]);
            }

            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Prescription not found or inaccessible.');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShippingDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressSelect = (addr) => {
        setShippingDetails(addr);
        // If the address has a phone number that is different from the prescription user's main mobile,
        // we automatically show the phone fields.
        if (addr.phone && addr.phone !== prescription.user?.mobile) {
            setIsOrderingForOther(true);
        } else {
            setIsOrderingForOther(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleApproveProvision = async () => {
        setCheckoutLoading(true);
        try {
            await api.post(`/prescriptions/${id}/approve-provision`);
            toast.success("Provision bill approved!");
            fetchPrescription(); // Refresh state
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to approve provision bill");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleSubmitOrder = async (e) => {
        if (e) e.preventDefault();
        setCheckoutLoading(true);

        try {
            // 1. Create Razorpay Order
            const total = calculateTotal();
            const { data: rzpOrder } = await api.post('/payment/create-order', {
                amount: total,
                prescriptionId: id,
                type: 'prescription',
                userId: prescription.user?._id,
                email: prescription.user?.email || 'guest@dharmarth.org',
                contact: shippingDetails.phone || prescription.user?.mobile,
                shippingAddress: shippingDetails
            });

            // 2. Load and Open Razorpay
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                toast.error("Razorpay SDK failed to load. Are you online?");
                setCheckoutLoading(false);
                return;
            }

            const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            const options = {
                key: rzpKey,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "The DharmArth Foundation",
                description: `Medicine Order for ${prescription.user?.name || 'Patient'}`,
                order_id: rzpOrder.order_id,
                handler: async (response) => {
                    try {
                        setCheckoutLoading(true);
                        const { data: verifyData } = await api.post('/payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyData.success) {
                            toast.success("Payment Successful!");
                            setSuccess(true);
                        } else {
                            toast.error("Payment verification failed.");
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        toast.error("Error verifying payment.");
                    } finally {
                        setCheckoutLoading(false);
                    }
                },
                prefill: {
                    name: prescription.user?.name,
                    email: prescription.user?.email,
                    contact: shippingDetails.phone || prescription.user?.mobile
                },
                theme: {
                    color: "#00bfa5"
                },
                modal: {
                    ondismiss: () => {
                        setCheckoutLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment initiation failed:", err);
            setError(err.response?.data?.message || 'Failed to start payment process.');
            setCheckoutLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!prescription) return 0;
        return prescription.verifiedItems
            .reduce((acc, item) => acc + (item.price || 0), 0);
    };

    if (loading) return <div className="loading-state-shared"><div className="spinner"></div><p>Fetching your verified invoice...</p></div>;

    if (error && !success) return (
        <div className="shared-checkout-page">
            <Navbar />
            <div className="error-container-shared">
                <AlertCircle size={64} color="#ef4444" />
                <h2>Verification Error</h2>
                <p>{error}</p>
                <button className="btn-back" onClick={() => navigate('/order-medicine')}>Return to Pharmacy</button>
            </div>
            <Footer />
        </div>
    );

    if (success) return (
        <div className="shared-checkout-page">
            <Navbar />
            <div className="success-container-shared">
                <div className="success-header-wrap">
                    <div className="success-icon-wrap premium">
                        <CheckCircle size={80} color="#10b981" />
                    </div>
                </div>
                <h2>Payment Successful!</h2>
                <div className="order-summary-box-success">
                    <div className="success-row">
                        <span>Paid For</span>
                        <strong>{prescription.user?.name}</strong>
                    </div>
                    <div className="success-row">
                        <span>Total Amount</span>
                        <strong className="success-price">₹{prescription.totalPaid?.toFixed(2) || calculateTotal().toFixed(2)}</strong>
                    </div>
                </div>

                <p className="success-subtext">The order has been finalized and processed. You can monitor the real-time delivery status using the link below.</p>

                <div className="success-actions">
                    <button className="btn-track-p" onClick={() => navigate(`/track/${prescription.orderId}`)}>
                        <Truck size={20} /> Track Your Order
                    </button>
                    <button className="btn-secondary-p" onClick={() => navigate('/')}>Return to Home</button>
                </div>
            </div>
            <Footer />
        </div>
    );

    return (
        <div className="shared-checkout-page">
            <Navbar theme="light" />

            <div className="checkout-banner">
                <div className="container">
                    <div className="banner-content">
                        <h1>Secure Prescription Checkout</h1>
                        <p>Verify your medicines and finalize delivery for Order Identity #{id.slice(-8).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <main className="checkout-main container">
                <form onSubmit={handleSubmitOrder}>
                    <div className="checkout-grid">
                        {/* Left Side: Delivery Details */}
                        <div className="checkout-form-pane">
                            {/* 1. Patient Verification */}
                            <section className="pane-card dosage-instructions">
                                <div className="card-header-p">
                                    <Info size={20} />
                                    <h3>Patient Details</h3>
                                </div>
                                <div className="patient-meta-shared">
                                    <div className="meta-info-shared">
                                        <div className="meta-p">
                                            <span className="label">Prescription Holder</span>
                                            <span className="val">{prescription.user?.name}</span>
                                        </div>
                                        <div className="meta-p">
                                            <span className="label">Contact</span>
                                            <span className="val">{prescription.user?.mobile}</span>
                                        </div>
                                    </div>
                                    {prescription.image ? (
                                        <div className="presc-mini-shared" onClick={() => setImageModalSrc(prescription.image)}>
                                            <img
                                                src={prescription.image.startsWith('http') ? prescription.image : `${API_BASE_URL}${prescription.image.startsWith('/') ? '' : '/'}${prescription.image}`}
                                                alt="Prescription"
                                            />
                                            <div className="mini-overlay">
                                                <Search size={16} />
                                                <span>View</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', width: '80px', height: '80px', cursor: 'default' }}>
                                            <Package size={28} color="#2563eb" style={{ opacity: 0.8 }} />
                                            <span style={{ fontSize: '9px', color: '#1d4ed8', fontWeight: 'bold', marginTop: '4px', textAlign: 'center' }}>Manual Order</span>
                                        </div>
                                    )}
                                </div>
                                {prescription.adminNote && (
                                    <div className="admin-note-shared">
                                        <p><strong>Pharmacist Note:</strong> {prescription.adminNote}</p>
                                    </div>
                                )}
                            </section>                            {/* 2. Shipping Address */}
                            <section className="pane-card form-card" style={{ padding: '24px' }}>
                                <div className="card-header-p" style={{ marginBottom: '15px' }}>
                                    <MapPin size={20} />
                                    <h3>Delivery Address</h3>
                                </div>
                                
                                <div style={{ 
                                    background: '#f8fafc', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '16px', 
                                    padding: '20px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '15px' 
                                }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Street Address</span>
                                        <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600', lineHeight: '1.4' }}>
                                            {shippingDetails.street || 'N/A'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>City</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{shippingDetails.city || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>State</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{shippingDetails.state || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>PIN Code</span>
                                            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700' }}>{shippingDetails.zip || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {(shippingDetails.phone || prescription.user?.mobile) && (
                                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Contact Phone</span>
                                                <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                                    {shippingDetails.phone || prescription.user?.mobile}
                                                </span>
                                            </div>
                                            {shippingDetails.altPhone && (
                                                <div>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Alternate Phone</span>
                                                    <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{shippingDetails.altPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Side: Order Review & Payment Selection (Sticky) */}
                        <aside className="order-review-pane">
                            <div className="sticky-summary">
                                <section className="pane-card items-card">
                                    <div className="card-header-p">
                                        <Package size={20} />
                                        <h3>Medicine List</h3>
                                    </div>
                                     <div className="verified-items-list-shared">
                                         {prescription.verifiedItems.map((item, index) => (
                                             <div key={index} className={`v-item-card ${item.fulfillmentStatus === 'Shortlisted' ? 'shortlisted' : ''}`}>
                                                 <div className="v-item-header">
                                                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                         <span className="med-name">{item.medicineName}</span>
                                                         {item.fulfillmentStatus === 'Shortlisted' && (
                                                             <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                                                                 ⌛ Shortlisted (Arrival in {item.estimatedArrivalDays || 3} days)
                                                             </span>
                                                         )}
                                                     </div>
                                                     <span className="med-price">₹{item.price?.toFixed(2)}</span>
                                                 </div>
                                                 <div className="med-details-shared">
                                                     <button
                                                         type="button"
                                                         className="btn-link-dosage"
                                                         onClick={() => {
                                                             const newShow = { ...showDosageMap };
                                                             newShow[index] = !newShow[index];
                                                             setShowDosageMap(newShow);
                                                         }}
                                                     >
                                                         {showDosageMap[index] ? 'Hide Timing' : 'View Timing'}
                                                     </button>

                                                     {showDosageMap[index] && (
                                                         <div className="dosage-popover-shared">
                                                             <SimplifyDosage
                                                                 frequency={item.frequency}
                                                                 time={item.time}
                                                                 foodRelation={item.foodRelation}
                                                                 intakeMethod={item.intakeMethod}
                                                                 dosage={item.dosage}
                                                             />
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                     <div className="order-summary-footer">
                                         <div className="summary-row">
                                             <span>Subtotal</span>
                                             <span>₹{calculateTotal().toFixed(2)}</span>
                                         </div>
                                         <div className="summary-row">
                                             <span>Delivery Fee</span>
                                             <span className="free">FREE</span>
                                         </div>
                                         <div className="total-row-shared">
                                             <span>Total</span>
                                             <span>₹{calculateTotal().toFixed(2)}</span>
                                         </div>
                                     </div>
                                 </section>

                                 {/* 3. Payment or Approval Selection */}
                                 <section className="pane-card payment-card">
                                     <div className="card-header-p">
                                         {prescription.approvalRequired && !prescription.userApproved ? <AlertCircle size={20} color="#f59e0b" /> : <CreditCard size={20} />}
                                         <h3>{prescription.approvalRequired && !prescription.userApproved ? 'Action Required' : 'Payment Method'}</h3>
                                     </div>
                                     
                                     {prescription.approvalRequired && !prescription.userApproved ? (
                                         <div className="approval-warning-box">
                                             <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '15px', lineHeight: '1.5' }}>
                                                 Some medicines in your order are currently out of stock. By approving this <strong>Provision Bill</strong>, we will pack and reserve your in-stock items while we wait for the remaining medicines to arrive.
                                             </p>
                                             <button 
                                                type="button" 
                                                className="btn-finalize-order" 
                                                style={{ background: '#f59e0b' }} 
                                                onClick={handleApproveProvision}
                                                disabled={checkoutLoading}
                                             >
                                                 {checkoutLoading ? 'Processing...' : 'Approve Provision Bill'}
                                             </button>
                                         </div>
                                     ) : (
                                         <>
                                            <div className="payment-options-shared">
                                                <div className={`pay-opt ${paymentMethod === 'Online' ? 'active' : ''}`} onClick={() => setPaymentMethod('Online')}>
                                                    <div className="check-dot"></div>
                                                    <span>Online (Cards/UPI)</span>
                                                </div>
                                            </div>

                                            <button type="submit" className="btn-finalize-order" disabled={checkoutLoading}>
                                                {checkoutLoading ? 'Processing...' : `Pay ₹${calculateTotal().toFixed(2)} &  Order`}
                                            </button>
                                            <p className="secure-p"><CheckCircle size={12} /> SSL Secure Transaction</p>
                                         </>
                                     )}
                                 </section>
                             </div>
                        </aside>
                    </div>
                </form>
            </main>

            {/* Image Zoom Modal */}
            {imageModalSrc && (
                <div className="image-modal-overlay-p" onClick={() => setImageModalSrc(null)}>
                    <div className="image-modal-content-p" onClick={e => e.stopPropagation()}>
                        <img
                            src={imageModalSrc.startsWith('http') ? imageModalSrc : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`}
                            alt="Full View"
                        />
                        <button className="btn-close-modal-p" onClick={() => setImageModalSrc(null)}>✕</button>
                    </div>
                </div>
            )}

            {/* Location Help Modal */}
            {showLocationHelp && (
                <div className="location-help-overlay" onClick={() => setShowLocationHelp(false)}>
                    <div className="location-help-card" onClick={e => e.stopPropagation()}>
                        <div className="help-header">
                            <div className="help-icon-circle">
                                <MapPin size={28} color="#3182ce" />
                            </div>
                            <h3>How to Enable Location</h3>
                            <button className="close-help" onClick={() => setShowLocationHelp(false)}>✕</button>
                        </div>
                        
                        <div className="help-body">
                            <p className="help-intro">For a faster checkout, please allow location access in your browser settings:</p>
                            
                            <div className="instruction-image">
                                <img src="/assets/images/location_guide.png" alt="Location Guide" />
                            </div>

                            <div className="steps-list">
                                <div className="step-item">
                                    <span className="step-num">1</span>
                                    <p>Click the <strong>Lock</strong> or <strong>Info</strong> icon in the address bar.</p>
                                </div>
                                <div className="step-item">
                                    <span className="step-num">2</span>
                                    <p>Find <strong>Location</strong> and toggle it to <strong>Allow</strong>.</p>
                                </div>
                                <div className="step-item">
                                    <span className="step-num">3</span>
                                    <p>Refresh the page and try again.</p>
                                </div>
                            </div>

                            <div className="help-note">
                                <Info size={16} />
                                <span>Alternatively, you can enter your address manually in the form.</span>
                            </div>
                        </div>

                        <div className="help-footer">
                            <button className="btn-got-it" onClick={() => setShowLocationHelp(false)}>Got It</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer variant="small" />
        </div>
    );
};

export default SharedCheckout;
