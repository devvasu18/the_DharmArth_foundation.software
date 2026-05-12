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
                toast.error("Location access failed. Please enter address manually.");
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

            // If the patient has saved addresses, show them to the payer (relative)
            if (res.data.user?.savedAddresses && res.data.user.savedAddresses.length > 0) {
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
                                </div>
                                {prescription.adminNote && (
                                    <div className="admin-note-shared">
                                        <p><strong>Pharmacist Note:</strong> {prescription.adminNote}</p>
                                    </div>
                                )}
                            </section>

                            {/* 2. Shipping Address */}
                            <section className="pane-card form-card">
                                <div className="card-header-p">
                                    <MapPin size={20} />
                                    <h3>Shipping Address</h3>
                                </div>
                                <p className="address-hint-shared">Select the patient's delivery location or enter a new one</p>

                                {savedAddresses.length > 0 && (
                                    <div className="saved-addresses-selector-shared">
                                        <div className="address-pills-row-shared">
                                            {savedAddresses.map((addr, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`addr-pill-shared ${shippingDetails.street === addr.street ? 'active' : ''}`}
                                                    onClick={() => handleAddressSelect(addr)}
                                                >
                                                    <strong>{addr.city}</strong>
                                                    <span className="addr-text-full">{addr.street}</span>
                                                </div>
                                            ))}
                                            <div
                                                className={`addr-pill-shared ${!savedAddresses.some(a => a.street === shippingDetails.street) ? 'active' : ''}`}
                                                onClick={() => {
                                                    setShippingDetails({ street: '', city: '', state: '', zip: '', phone: prescription.user?.mobile || '', altPhone: '' });
                                                    setIsOrderingForOther(false);
                                                }}
                                            >
                                                <strong>+ New</strong>
                                                <span className="addr-text-full">Custom Address</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid-shared">
                                    <div className="input-group-shared full" style={{ position: 'relative' }}>
                                        <label>Delivery Street Address</label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={shippingDetails.street}
                                            onChange={handleInputChange}
                                            placeholder={isDetecting ? "Detecting address..." : "House / Plot Number, Area"}
                                            required
                                            style={{ paddingRight: '100px' }}
                                        />
                                        <button
                                            type="button"
                                            className="detect-location-btn-shared"
                                            onClick={detectLocation}
                                            disabled={isDetecting}
                                        >
                                            <MapPin size={14} />
                                            <span>{isDetecting ? '...' : 'Detect'}</span>
                                        </button>
                                    </div>
                                    <div className="input-group-shared">
                                        <label>State</label>
                                        <input type="text" name="state" value={shippingDetails.state} onChange={handleInputChange} placeholder="e.g. Rajasthan" required />
                                    </div>
                                    <div className="input-group-shared">
                                        <label>City</label>
                                        <input type="text" name="city" value={shippingDetails.city} onChange={handleInputChange} placeholder="e.g. Nagaur" required />
                                    </div>
                                    <div className="input-group-shared">
                                        <label>PIN Code</label>
                                        <input type="text" name="zip" value={shippingDetails.zip} onChange={handleInputChange} placeholder="341001" required />
                                    </div>
                                    {/* Only show the checkbox if the current phone is NOT a custom saved number */}
                                    {(!(shippingDetails.phone && shippingDetails.phone !== prescription.user?.mobile)) && (
                                        <div className="checkbox-group-shared">
                                            <label className="checkbox-wrap-p">
                                                <input
                                                    type="checkbox"
                                                    checked={isOrderingForOther}
                                                    onChange={(e) => setIsOrderingForOther(e.target.checked)}
                                                />
                                                <span className="check-text">Ordering for someone else?</span>
                                            </label>
                                        </div>
                                    )}

                                    {(isOrderingForOther || (shippingDetails.phone && shippingDetails.phone !== prescription.user?.mobile)) && (
                                        <div className="form-grid-shared phone-grid-p">
                                            <div className="input-group-shared">
                                                <label>Primary Phone</label>
                                                <input type="tel" name="phone" value={shippingDetails.phone} onChange={handleInputChange} placeholder="10 Digit Number" required />
                                            </div>
                                            <div className="input-group-shared">
                                                <label>Alternate Phone</label>
                                                <input type="tel" name="altPhone" value={shippingDetails.altPhone} onChange={handleInputChange} placeholder="Optional" />
                                            </div>
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
                         </aside>  </aside>
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

            <Footer variant="small" />
        </div>
    );
};

export default SharedCheckout;
