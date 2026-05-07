import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../context/ConfirmContext';
import { User, Smartphone, Mail, MapPin, CreditCard, BadgeCheck, CheckCircle, Lock, ArrowRight, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './DonationForm.css';
import { validatePAN, validateAadhaar } from '../../utils/validators';
import DOMPurify from 'dompurify';
import { useAuth } from '../../context/AuthContext';

const DonationForm = ({ onSuccess }) => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { showAlert } = useConfirm();
    const { login, user: authUser } = useAuth();
    const [amount, setAmount] = useState(1000);
    const [donationConfig, setDonationConfig] = useState({ plans: [600, 1000, 5000], popularAmount: 1000 });
    const [customAmount, setCustomAmount] = useState(1000);
    const [motivatorMobile, setMotivatorMobile] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [motivatorName, setMotivatorName] = useState('');
    const [need80G, setNeed80G] = useState(false);
    const [isMotivatorLocked, setIsMotivatorLocked] = useState(false);
    const [donationType] = useState('monthly'); // Always monthly now
    const [donationLabel, setDonationLabel] = useState('');
    const [donationLabelHi, setDonationLabelHi] = useState('');
    const [donationLabelLink, setDonationLabelLink] = useState('');
    const [donationLabelBtnText, setDonationLabelBtnText] = useState('');
    const [donationLabelBtnTextHi, setDonationLabelBtnTextHi] = useState('');

    // Form States
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [pan, setPan] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);

    const [showPanModal, setShowPanModal] = useState(false);
    const [confirmPan, setConfirmPan] = useState('');
    const [confirmError, setConfirmError] = useState('');

    // Success & Claim Account State
    const [donationSuccess, setDonationSuccess] = useState(null);
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const isFormValid = useMemo(() => {
        const finalAmount = customAmount ? Number(customAmount) : amount;
        if (!fullName.trim()) return false;
        if (mobile.length !== 10) return false;
        if (!finalAmount || finalAmount <= 0) return false;

        if (need80G) {
            if (!pan || pan.length !== 10) return false;
            if (!aadhaar || aadhaar.length !== 12) return false;
        }

        if (motivatorMobile) {
            if (errors.motivator || !motivatorName) return false;
        }

        return true;
    }, [fullName, mobile, amount, customAmount, need80G, pan, aadhaar, motivatorMobile, motivatorName, errors.motivator]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/content/settings');
                const params = new URLSearchParams(location.search);
                const hasUrlAmount = params.get('amount');

                if (data.donation_config) {
                    const config = typeof data.donation_config === 'string'
                        ? JSON.parse(data.donation_config)
                        : data.donation_config;

                    if (config && config.plans && config.plans.length > 0) {
                        setDonationConfig(config);
                        // Only set default if no amount in URL
                        if (!hasUrlAmount) {
                            setAmount(config.popularAmount || config.plans[0]);
                            setCustomAmount(config.popularAmount || config.plans[0]);
                        }
                    }
                }
                if (data.donation_label) setDonationLabel(data.donation_label);
                if (data.donation_label_hi) setDonationLabelHi(data.donation_label_hi);
                if (data.donation_label_link) setDonationLabelLink(data.donation_label_link);
                if (data.donation_label_btn_text) setDonationLabelBtnText(data.donation_label_btn_text);
                if (data.donation_label_btn_text_hi) setDonationLabelBtnTextHi(data.donation_label_btn_text_hi);
            } catch (error) {
                console.error("Failed to load donation config", error);
            }
        };
        fetchSettings();

        // Auto-fill user details if logged in AND not provided in URL
        if (authUser) {
            const params = new URLSearchParams(location.search);
            if (!params.get('name')) setFullName(authUser.name || '');
            if (!params.get('mobile')) setMobile(authUser.mobile || '');
            if (!params.get('email')) setEmail(authUser.email || '');

            if (authUser.referredBy && !params.get('motivator') && !params.get('ref')) {
                setMotivatorMobile(authUser.referredBy.mobile || authUser.referredBy.referralCode || '');
                setMotivatorName(authUser.referredBy.name || '');
                setIsMotivatorLocked(true);
            } else if (authUser.lastMotivatorMobile && !params.get('motivator') && !params.get('ref')) {
                setMotivatorMobile(authUser.lastMotivatorMobile);
                setIsMotivatorLocked(true);
                // Also fetch name if possible or use a placeholder
                if (authUser.lastMotivatorName) setMotivatorName(authUser.lastMotivatorName);
            }
        }
    }, [authUser, location.search]);

    // Auto-fetch motivator by phone number for non-logged in users
    useEffect(() => {
        const fetchPreviousMotivator = async () => {
            // Only fetch if it's a valid 10-digit mobile and user is NOT logged in 
            // and we don't already have a motivator (like from a ref link)
            if (mobile.length === 10 && !authUser && !motivatorMobile) {
                try {
                    const { data } = await api.get(`/donate/previous-motivator/${mobile}`);
                    if (data.motivatorMobile) {
                        setMotivatorMobile(data.motivatorMobile);
                        if (data.motivatorName) setMotivatorName(data.motivatorName);
                        setIsMotivatorLocked(true);
                        toast.success("Welcome back! Your previous motivator has been auto-selected.", {
                            icon: '👋',
                            duration: 3000
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch previous motivator", error);
                }
            }
        };

        const timer = setTimeout(fetchPreviousMotivator, 800);
        return () => clearTimeout(timer);
    }, [mobile, authUser, motivatorMobile]);

    // Check for referral link and pre-fill data
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        const motivator = params.get('motivator');
        const name = params.get('name');
        const phone = params.get('mobile');
        const amt = params.get('amount');
        const panParam = params.get('pan');
        const aadhaarParam = params.get('aadhaar');
        const g80 = params.get('is80G');

        if (ref || motivator) {
            setMotivatorMobile(ref || motivator);
            setIsMotivatorLocked(true);
        }
        if (name) setFullName(name);
        if (phone) setMobile(phone);
        if (amt) {
            setAmount(Number(amt));
            setCustomAmount(Number(amt));
        }
        if (panParam) setPan(panParam);
        if (aadhaarParam) setAadhaar(aadhaarParam);
        if (g80 === 'true') setNeed80G(true);

    }, [location.search]);

    // Debounce motivator check
    useEffect(() => {
        const checkMotivator = async () => {
            // Skip if locked AND we already have the name
            if (isMotivatorLocked && motivatorName) return;

            // Prevent self-referral
            if (motivatorMobile && mobile && motivatorMobile === mobile) {
                setMotivatorName("");
                setErrors(prev => ({ ...prev, motivator: "Please fill the motivator’s number, not your own" }));
                return;
            }

            if (motivatorMobile.length >= 4) {
                try {
                    const { data } = await api.get(`/donate/validate-motivator/${motivatorMobile}?currentMobile=${mobile}`);
                    if (data.valid) {
                        setMotivatorName(data.name);
                        setErrors(prev => ({ ...prev, motivator: null }));
                    } else {
                        setMotivatorName('');
                        setErrors(prev => ({ ...prev, motivator: data.message || "Motivator not found" }));
                    }
                } catch (error) {
                    console.error("Error validating motivator:", error);
                    setMotivatorName('');
                    setErrors(prev => ({ ...prev, motivator: "Error validating identifier" }));
                }
            } else {
                setMotivatorName('');
                if (motivatorMobile.length > 0) {
                    // Too short to validate yet
                } else {
                    setErrors(prev => ({ ...prev, motivator: null }));
                }
            }
        };

        const timer = setTimeout(() => {
            checkMotivator();
        }, 500);

        return () => clearTimeout(timer);
    }, [motivatorMobile, mobile, isMotivatorLocked]);

    // Auto-detect location on mount
    useEffect(() => {
        detectLocation();
    }, []);

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
                        setAddress(data.results[0].formatted_address);
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
                if (error.code === error.PERMISSION_DENIED) {
                    setShowLocationModal(true);
                } else {
                    toast.error("Location access failed. Please enter address manually.");
                }
            }
        );
    };

    const submitDonation = async () => {
        setLoading(true);
        const finalAmount = customAmount ? Number(customAmount) : amount;

        try {
            const payload = {
                amount: finalAmount,
                donorName: fullName,
                donorMobile: mobile,
                donorEmail: email,
                address: address,
                motivatorMobile: motivatorMobile || null,
                referralSource: referralSource || null,
                panNumber: need80G ? pan : null,
                aadhaarNumber: need80G ? aadhaar : null,
                donationType: donationType
            };

            // 1. Create Order on Backend
            const { data: orderData } = await api.post('/donate', payload);

            // 2. Configure Razorpay Options
            const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!rzpKey) {
                toast.error("Payment Gateway is not configured (Missing Key ID)");
                setLoading(false);
                return;
            }

            const options = {
                key: rzpKey,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "The DharmArth Foundation",
                description: "Monthly Donation Subscription",
                order_id: orderData.order_id || null,
                subscription_id: orderData.subscriptionId || null,
                handler: async (response) => {
                    // 3. Verify Payment on Backend
                    try {
                        setLoading(true);

                        let verifyPayload, verifyUrl;

                        verifyUrl = '/payment/verify-subscription';
                        verifyPayload = {
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        };

                        const { data: verifyData } = await api.post(verifyUrl, verifyPayload);

                        if (verifyData.success) {
                            toast.success("Subscription Activated!");
                            setDonationSuccess({
                                donationId: orderData.subscriptionId || orderData.donationId,
                                amount: finalAmount,
                                isAlreadyRegistered: orderData.isAlreadyRegistered,
                                type: donationType
                            });
                            if (onSuccess) onSuccess();
                        } else {
                            toast.error("Verification failed.");
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        toast.error("Verification failed. Please contact support.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: fullName,
                    email: email,
                    contact: mobile
                },
                notes: {
                    donation_id: orderData.donationId
                },
                theme: {
                    color: "#7c3aed" // Matching your theme color
                },
                modal: {
                    ondismiss: async () => {
                        setLoading(false);
                        toast.error("Payment cancelled.");
                        try {
                            if (orderData.subscriptionId) {
                                await api.post('/payment/mark-failed', { subscription_id: orderData.subscriptionId });
                            }
                        } catch (e) {
                            console.error("Failed to mark payment as failed", e);
                        }
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Donation failed:", error);
            toast.error(error.response?.data?.message || "Donation initiation failed. Please try again.");
            setLoading(false);
        }
    };

    const handleDonate = async () => {
        const finalAmount = customAmount ? Number(customAmount) : amount;

        if (!fullName || !mobile || !finalAmount) {
            toast.error("Please fill in required fields.");
            return;
        }

        const newErrors = {};
        if (need80G) {
            if (!validatePAN(pan)) {
                newErrors.pan = "Invalid PAN Number format (e.g. ABCDE1234F)";
            }
            if (!validateAadhaar(aadhaar)) {
                newErrors.aadhaar = "Invalid Aadhaar Number";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        // Referral/Motivator Validation Logic - OPTIONAL now
        // if (!referralSource && !motivatorMobile) {
        //     await showAlert("Please let us know what motivated you to donate (Motivator Mobile or Referral Source).");
        //     return;
        // }

        // Validate motivator if entered - independant check
        if (motivatorMobile) {
            if (errors.motivator) {
                toast.error(errors.motivator);
                return;
            }
            if (!motivatorName) {
                toast.error("Please enter a valid motivator number.");
                return;
            }
        }

        if (need80G) {
            setConfirmPan('');
            setConfirmError('');
            setShowPanModal(true);
        } else {
            submitDonation();
        }
    };

    const handlePanConfirm = () => {
        if (confirmPan.toUpperCase() !== pan.toUpperCase()) {
            setConfirmError("PAN numbers do not match.");
            return;
        }
        setConfirmError('');
        submitDonation();
    };

    const handleRegister = async () => {
        if (!registerPassword || registerPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (registerPassword !== registerConfirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setIsRegistering(true);
            const { data } = await api.post('/auth/register', {
                name: fullName,
                mobile: mobile,
                email: email,
                password: registerPassword,
                referralCode: motivatorMobile
            });

            login(data);
            toast.success("Account Created Successfully!");
            navigate('/dashboard');
        } catch (error) {
            console.error("Registration failed:", error);
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setIsRegistering(false);
        }
    };

    if (donationSuccess) {
        const isLoggedIn = !!authUser;

        return (
            <div className="donation-container" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CheckCircle size={48} color="#22c55e" strokeWidth={2.5} />
                    </div>
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {t('donatePage.thankYou')}, {fullName.split(' ')[0]}!
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {t('donatePage.successMessage')} <strong>₹{donationSuccess.amount.toLocaleString()}</strong> {t('donatePage.wasSuccessful')}
                </p>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', display: 'inline-block' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{t('donatePage.transactionId')}</p>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>{donationSuccess.donationId}</p>
                </div>

                {!isLoggedIn && (
                    <div style={{
                        border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)',
                        padding: '2rem', marginTop: '1rem', background: '#fff',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        {donationSuccess.isAlreadyRegistered ? (
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                    Welcome Back!
                                </h3>
                                <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                    You already have an account with us. Login to track this donation and access your certificates.
                                </p>
                                <button
                                    className="donate-btn"
                                    onClick={() => navigate('/login')}
                                    style={{ marginTop: 0 }}
                                >
                                    <span className="btn-content">Login to Your Account</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                        {t('donatePage.claimAccount')}
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('donatePage.claimDesc')) }}></p>
                                </div>

                                <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                                    <div className="donation-input-group" style={{ marginBottom: '1rem' }}>
                                        <label className="input-label">{t('donatePage.createPassword')}</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Min. 6 characters"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="donation-input-group" style={{ marginBottom: '1.5rem' }}>
                                        <label className="input-label">{t('donatePage.confirmPassword')}</label>
                                        <div className="input-wrapper">
                                            <Lock size={18} className="input-icon" />
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Re-enter password"
                                                value={registerConfirmPassword}
                                                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        className="donate-btn"
                                        style={{ marginTop: 0 }}
                                        onClick={handleRegister}
                                        disabled={isRegistering}
                                    >
                                        <span className="btn-content">
                                            {isRegistering ? t('donatePage.creatingAccount') : t('donatePage.createAccountBtn')}
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '2rem' }}>
                    <button
                        onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
                        style={{
                            background: 'none', border: 'none', color: 'var(--primary)',
                            fontWeight: 600, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '0.5rem', margin: '0 auto'
                        }}
                    >
                        {isLoggedIn ? 'Go to Dashboard' : 'Skip & Go Home'} <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <React.Fragment>
            <div className="donation-container">
                <h2 className="donation-title">
                    <CreditCard size={28} className="text-primary" />
                    {t('donatePage.title')}
                </h2>

                {(i18n.language === 'hi' ? donationLabelHi : donationLabel) && (
                    <p className="donation-subtitle" style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        marginTop: '-1rem',
                        marginBottom: '2rem',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        padding: '0 1rem'
                    }}>
                        {i18n.language === 'hi' ? donationLabelHi : donationLabel}
                        {donationLabelLink && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <a
                                    href={donationLabelLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 16px',
                                        background: '#f0fdfa',
                                        color: '#00bfa5',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        border: '1px solid rgba(0, 191, 165, 0.2)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#00bfa5';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#f0fdfa';
                                        e.currentTarget.style.color = '#00bfa5';
                                    }}
                                >
                                    {i18n.language === 'hi' ? (donationLabelBtnTextHi || 'अधिक जानें') : (donationLabelBtnText || 'Learn More')}
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        )}
                    </p>
                )}


                <div className="amount-options">
                    {donationConfig.plans.map((planAmount) => (
                        <button
                            key={planAmount}
                            className={`amount-btn ${amount === planAmount ? 'active' : ''}`}
                            onClick={() => { setAmount(planAmount); setCustomAmount(planAmount); }}
                        >
                            {donationConfig.popularAmount === planAmount && (
                                <span className="popular-tag">{t('donatePage.popular')}</span>
                            )}
                            ₹{planAmount.toLocaleString()}
                        </button>
                    ))}
                </div>

                <div className="custom-amount">
                    <span className="currency-symbol">₹</span>
                    <input

                        type="number"
                        placeholder={t('donatePage.customPlaceholder')}
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                    />
                </div>

                <label className="checkbox-item">
                    <input type="checkbox" defaultChecked />
                    <span>{t('donatePage.citizenConfirm')}</span>
                </label>

                <div className="form-section">
                    <h3 className="section-label">
                        <User size={20} />
                        {t('donatePage.personalDetails')}
                    </h3>

                    <label className="input-label">{t('donatePage.fullName')}</label>
                    <div className="input-group-wrapper">

                        <input
                            type="text"
                            className={`form-control ${errors.name ? 'error-border' : ''}`}
                            placeholder="Ex. Raghu Kumar"
                            value={fullName}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFullName(val);
                                if (val.trim().length > 0 && val.trim().length < 4) {
                                    setErrors(prev => ({ ...prev, name: 'Name must be at least 4 characters' }));
                                } else {
                                    setErrors(prev => ({ ...prev, name: '' }));
                                }
                            }}
                        />
                    </div>
                    {errors.name && <small className="error-text" style={{ color: 'red', display: 'block', marginTop: '5px' }}>{errors.name}</small>}

                    <div className="donation-input-group">
                        <label className="input-label">{t('donatePage.mobile')}</label>
                        <div className="phone-wrapper">
                            <div className="flag-addon"> +91</div>
                            <input
                                type="tel"
                                className="phone-field"
                                placeholder="9876543210"
                                value={mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setMobile(val);
                                }}
                                maxLength={10}
                            />
                        </div>
                        <small className="mt-1 text-muted">{t('donatePage.whatsappNote')}</small>
                    </div>

                    <div className="donation-input-group">
                        <label className="input-label">{t('donatePage.email')}</label>
                        <div className="input-group-wrapper">

                            <input
                                type="email"
                                className="form-control"
                                placeholder="mail@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="donation-input-group">
                        <label className="input-label">Address (Optional)</label>
                        <div className="input-group-wrapper" style={{ position: 'relative' }}>
                            <textarea
                                className="form-control"
                                placeholder={isDetecting ? "Detecting address..." : "Ex. H.No 123, Sector 4, New Delhi"}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{ minHeight: '80px', paddingTop: '12px', paddingRight: '100px' }}
                            />
                            <button
                                type="button"
                                className="detect-location-btn"
                                onClick={detectLocation}
                                disabled={isDetecting}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: '#f0fdfa',
                                    color: '#00bfa5',
                                    border: '1px solid rgba(0, 191, 165, 0.2)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    zIndex: 10
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#00bfa5';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#f0fdfa';
                                    e.currentTarget.style.color = '#00bfa5';
                                }}
                            >
                                <MapPin size={14} />
                                <span>{isDetecting ? '...' : 'Detect'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-label">
                        <Smartphone size={20} />
                        {t('donatePage.motivatorTitle')}
                    </h3>

                    <div className="referral-box">
                        <div className="donation-input-group mb-0">
                            <label className="input-label">{t('donatePage.motivatedBy')} {isMotivatorLocked ? '' : '(Mobile Number/id)'}</label>
                            {isMotivatorLocked ? (
                                <div className="motivator-profile-chip verified">
                                    <div className="motivator-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="motivator-info">
                                        <span className="motivator-name">{motivatorName}</span>
                                        <span className="motivator-status">
                                            <BadgeCheck size={14} fill="var(--primary)" color="white" strokeWidth={2.5} /> Verified Motivator
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <React.Fragment>
                                    <div className="phone-wrapper">
                                        <div className="flag-addon">
                                            <Smartphone size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            className={`phone-field ${(errors.motivator) ? 'error-border' : ''}`}
                                            placeholder="Mobile Number or Referral Code"
                                            value={motivatorMobile}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase().replace(/\s/g, '');
                                                if (val.length <= 15) setMotivatorMobile(val);
                                            }}
                                            maxLength={15}
                                        />
                                    </div>
                                    {motivatorName && (
                                        <div className="motivator-profile-chip verified">
                                            <div className="motivator-avatar">
                                                <User size={24} />
                                            </div>
                                            <div className="motivator-info">
                                                <span className="motivator-name">{motivatorName}</span>
                                                <span className="motivator-status">
                                                    <BadgeCheck size={16} fill="var(--primary)" color="white" /> Verified Motivator
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {errors.motivator && <small className="error-text">{errors.motivator}</small>}
                                </React.Fragment>
                            )}
                        </div>

                        <div style={{ margin: '1rem 0' }}></div>

                        <div className="donation-input-group mb-0">
                            <div className="input-group-wrapper">

                                <select
                                    className="form-control"
                                    value={referralSource}
                                    onChange={(e) => setReferralSource(e.target.value)}
                                >
                                    <option value="">{t('donatePage.referralPlaceholder')}</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Website">Website</option>
                                    <option value="Friend">Friend</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tax-section">
                    <label className="checkbox-item" style={{ fontWeight: 600 }}>
                        <input type="checkbox" checked={need80G} onChange={(e) => setNeed80G(e.target.checked)} />
                        <span>{t('donatePage.need80G')}</span>
                    </label>

                    {need80G && (
                        <div className="tax-benefits-box">
                            <span className="tax-badge">{t('donatePage.saveTax')}</span>
                            <div className="donation-input-group">
                                <label className="input-label">PAN Number*</label>
                                <div className="input-group-wrapper">
                                    <div className="input-addon">
                                        <CreditCard size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.pan ? 'error-border' : ''}`}
                                        placeholder="ABCDE1234F"
                                        value={pan}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase().slice(0, 10);
                                            setPan(val);
                                            if (errors.pan) setErrors({ ...errors, pan: null });
                                        }}
                                        maxLength={10}
                                        autoCapitalize="characters"
                                        autoCorrect="off"
                                        spellCheck="false"
                                    />
                                </div>
                                {errors.pan && <small className="error-text">{errors.pan}</small>}
                            </div>
                            <div className="donation-input-group mb-0">
                                <label className="input-label">{t('donatePage.aadhaar')}</label>
                                <div className="input-group-wrapper">
                                    <div className="input-addon">
                                        <CreditCard size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.aadhaar ? 'error-border' : ''}`}
                                        placeholder="1234 5678 9012"
                                        value={aadhaar}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                            setAadhaar(val);
                                            if (errors.aadhaar) setErrors({ ...errors, aadhaar: null });
                                        }}
                                        maxLength={12}
                                        inputMode="numeric"
                                    />
                                </div>
                                {errors.aadhaar && <small className="error-text">{errors.aadhaar}</small>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed-bottom-bar">
                    <button
                        className="donate-btn"
                        onClick={handleDonate}
                        disabled={!isFormValid || loading}
                    >
                        <span className="btn-content">
                            {loading ? t('donatePage.processing') : `${t('donatePage.donateBtn')} ₹${(customAmount ? Number(customAmount) : amount).toLocaleString()}`}
                        </span>
                    </button>

                    <div className="text-center mt-2">
                        <small className="text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <Lock size={12} /> {t('donatePage.securePayment')}
                        </small>
                    </div>
                </div>
            </div>

            {showPanModal && (
                <div className="pan-modal-overlay">
                    <div className="pan-modal-content">
                        <div className="pan-modal-header">
                            <p className="pan-modal-title">{t('donatePage.secureConfirm')}</p>
                            <p className="pan-modal-subtitle">{t('donatePage.verifyDetails')}</p>
                        </div>

                        <div className="pan-user-details">
                            <div className="pan-detail-row">
                                <span className="pan-detail-label">{t('donatePage.donorName')}</span>
                                <span className="pan-detail-value">{fullName}</span>
                            </div>
                            <div className="pan-detail-row" style={{ marginTop: '0.5rem' }}>
                                <span className="pan-detail-label">Mobile:</span>
                                <span className="pan-detail-value">+91 {mobile}</span>
                            </div>
                        </div>

                        <div className="donation-input-group mb-0">
                            <label className="input-label">{t('donatePage.confirmPan')}</label>
                            <input
                                type="text"
                                className={`form-control ${confirmError ? 'error-border' : ''}`}
                                placeholder="Re-enter PAN Number"
                                value={confirmPan}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase().slice(0, 10);
                                    setConfirmPan(val);
                                    setConfirmError('');
                                }}
                                maxLength={10}
                                autoCapitalize="characters"
                                autoCorrect="off"
                                spellCheck="false"
                            />
                            {confirmError && <small className="error-text">{confirmError}</small>}
                        </div>

                        <div className="pan-modal-actions">
                            <button className="btn-secondary" onClick={() => setShowPanModal(false)}>{t('donatePage.cancel')}</button>
                            <button className="btn-confirm" onClick={handlePanConfirm} disabled={loading}>
                                {loading ? t('donatePage.processingShort', 'Processing...') : t('donatePage.confirmDonate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Location Permission Modal */}
            {showLocationModal && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowLocationModal(false)}
                >
                    <div
                        className="location-modal-content"
                        style={{
                            background: 'white',
                            padding: '40px',
                            borderRadius: '24px',
                            maxWidth: '450px',
                            width: '90%',
                            textAlign: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            width: '70px',
                            height: '70px',
                            background: '#f0fdfa',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            color: '#00bfa5'
                        }}>
                            <MapPin size={32} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: '#1e293b' }}>
                            Location Access Denied
                        </h3>
                        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
                            We couldn't detect your location because permissions are turned off.
                            Please enable location access in your browser settings or enter your address manually.
                        </p>

                        <div style={{ textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '16px', fontSize: '13px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontWeight: 700, marginBottom: '8px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', background: '#00bfa5', borderRadius: '50%' }}></div>
                                How to enable in Chrome/Mobile:
                            </p>
                            <ol style={{ paddingLeft: '18px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                                <li style={{ marginBottom: '6px' }}>Click the <b>lock</b> or <b>settings icon</b> (left of URL).</li>
                                <li style={{ marginBottom: '6px' }}>Find <b>Location</b> and switch it to <b>Allow</b>.</li>
                                <li>Refresh the page or click <b>Enable Location</b> below.</li>
                            </ol>
                        </div>
                        <button
                            className="donate-btn"
                            type="button"
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '16px',
                                marginTop: 0
                            }}
                            onClick={() => setShowLocationModal(false)}
                        >
                            <span className="btn-content">Enter Manually</span>
                        </button>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default DonationForm;
