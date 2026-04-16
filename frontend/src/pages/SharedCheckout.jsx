import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
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
    AlertCircle
} from 'lucide-react';
import './SharedCheckout.css';
import SimplifyDosage from '../components/SimplifyDosage';

const SharedCheckout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [shippingDetails, setShippingDetails] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        altPhone: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDosageMap, setShowDosageMap] = useState({});
    const [isOrderingForOther, setIsOrderingForOther] = useState(false);

    useEffect(() => {
        fetchPrescription();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setIsLoggedIn(true);
            fetchSavedAddresses();
        }
    }, [id]);

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

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setCheckoutLoading(true);
        try {
            await api.post(`/prescriptions/${id}/approve`, {
                shippingAddress: shippingDetails,
                paymentMethod
            });
            setSuccess(true);
            setCheckoutLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed. Please try again.');
            setCheckoutLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!prescription) return 0;
        return prescription.verifiedItems
            .filter(item => item.isAvailable)
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
                <div className="success-icon-wrap">
                    <CheckCircle size={80} color="#10b981" />
                </div>
                <h2>Order Placed Successfully!</h2>
                <p>The pharmacy team has been notified. You can now track the status of this delivery.</p>
                <div className="success-actions">
                    <button className="btn-main-p" onClick={() => navigate('/order-medicine')}>Track My Orders</button>
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
                                    <div className="meta-p">
                                        <span className="label">Prescription Holder</span>
                                        <span className="val">{prescription.user?.name}</span>
                                    </div>
                                    <div className="meta-p">
                                        <span className="label">Contact</span>
                                        <span className="val">{prescription.user?.mobile}</span>
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
                                                    onClick={() => setShippingDetails(addr)}
                                                >
                                                    <strong>{addr.city}</strong>
                                                    <span className="addr-text-full">{addr.street}</span>
                                                </div>
                                            ))}
                                            <div
                                                className={`addr-pill-shared ${!savedAddresses.some(a => a.street === shippingDetails.street) ? 'active' : ''}`}
                                                onClick={() => setShippingDetails({ street: '', city: '', state: '', zip: '', phone: prescription.user?.mobile || '', altPhone: '' })}
                                            >
                                                <strong>+ New</strong>
                                                <span className="addr-text-full">Custom Address</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-grid-shared">
                                    <div className="input-group-shared full">
                                        <label>Delivery Street Address</label>
                                        <input type="text" name="street" value={shippingDetails.street} onChange={handleInputChange} placeholder="House / Plot Number, Area" required />
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

                                {isOrderingForOther && (
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
                                            <div key={index} className={`v-item-card ${!item.isAvailable ? 'unavailable' : ''}`}>
                                                <div className="v-item-header">
                                                    <span className="med-name">{item.medicineName}</span>
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
                                                {!item.isAvailable && <div className="out-of-stock">Currently Out of Stock</div>}
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

                                {/* 3. Payment Selection */}
                                <section className="pane-card payment-card">
                                    <div className="card-header-p">
                                        <CreditCard size={20} />
                                        <h3>Payment Method</h3>
                                    </div>
                                    <div className="payment-options-shared">
                                        <div className={`pay-opt ${paymentMethod === 'Online' ? 'active' : ''}`} onClick={() => setPaymentMethod('Online')}>
                                            <div className="check-dot"></div>
                                            <span>Online (Cards/UPI)</span>
                                        </div>
                                        <div className={`pay-opt ${paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setPaymentMethod('COD')}>
                                            <div className="check-dot"></div>
                                            <span>Cash on Delivery</span>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-finalize-order" disabled={checkoutLoading}>
                                        {checkoutLoading ? 'Processing...' : `Pay ₹${calculateTotal().toFixed(2)} & Finalize Order`}
                                    </button>
                                    <p className="secure-p"><CheckCircle size={12} /> SSL Secure Transaction</p>
                                </section>
                            </div>
                        </aside>
                    </div>
                </form>
            </main>

            <Footer variant="small" />
        </div>
    );
};

export default SharedCheckout;
