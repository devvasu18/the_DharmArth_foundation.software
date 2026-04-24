import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../context/ConfirmContext';
import { User, Smartphone, Mail, MapPin, CreditCard, BadgeCheck, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './DonationForm.css';
import { validatePAN, validateAadhaar } from '../../utils/validators';

const DonationForm = ({ onSuccess }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { showAlert } = useConfirm();
    const [amount, setAmount] = useState(1000);
    const [donationConfig, setDonationConfig] = useState({ plans: [600, 1000, 5000], popularAmount: 1000 });
    const [customAmount, setCustomAmount] = useState(1000);
    const [motivatorMobile, setMotivatorMobile] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [motivatorName, setMotivatorName] = useState('');
    const [need80G, setNeed80G] = useState(false);
    const [isMotivatorLocked, setIsMotivatorLocked] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
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
                if (data.donation_config) {
                    const config = typeof data.donation_config === 'string'
                        ? JSON.parse(data.donation_config)
                        : data.donation_config;

                    if (config && config.plans && config.plans.length > 0) {
                        setDonationConfig(config);
                        setAmount(config.popularAmount || config.plans[0]);
                        setCustomAmount(config.popularAmount || config.plans[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to load donation config", error);
            }
        };
        fetchSettings();

        // Auto-fill user details if logged in
        const fetchLatestProfile = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr && userStr !== "null" && userStr !== "undefined") {
                try {
                    // Start with what we have in localStorage
                    let user = JSON.parse(userStr);
                    setFullName(user.name || '');
                    setMobile(user.mobile || '');
                    setEmail(user.email || '');
                    if (user.referredBy) {
                        setMotivatorMobile(user.referredBy.mobile || user.referredBy.referralCode || '');
                        setMotivatorName(user.referredBy.name || '');
                        setIsMotivatorLocked(true);
                    } else if (user.lastMotivatorMobile) {
                        setMotivatorMobile(user.lastMotivatorMobile);
                    }

                    // Then fetch fresh data from server to catch any recent syncs
                    const { data: freshUser } = await api.get('/users/profile');
                    if (freshUser) {
                        setFullName(freshUser.name || '');
                        setMobile(freshUser.mobile || '');
                        setEmail(freshUser.email || '');

                        // Handle populated referredBy
                        if (freshUser.referredBy && typeof freshUser.referredBy === 'object') {
                            const ref = freshUser.referredBy;
                            setMotivatorMobile(ref.mobile || ref.referralCode || '');
                            setMotivatorName(ref.name || '');
                            setIsMotivatorLocked(true);
                        } else if (freshUser.lastMotivatorMobile) {
                            setMotivatorMobile(freshUser.lastMotivatorMobile);
                        }

                        // Sync localStorage while preserving token
                        localStorage.setItem('user', JSON.stringify({ ...freshUser, token: user.token }));
                    }
                } catch (e) {
                    // Handle 401 (Unauthorized) - user session expired
                    if (e.response?.status === 401) {
                        console.warn("Session expired or unauthorized. Using local fallback.");
                        // Optional: logout user if token is invalid
                        // localStorage.removeItem('user');
                    } else {
                        console.error("Error syncing user profile:", e);
                    }
                }
            }
        };

        fetchLatestProfile();
    }, []);

    // Check for referral link
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        if (ref) {
            setMotivatorMobile(ref);
        }
    }, [location]);

    // Debounce motivator check
    useEffect(() => {
        const checkMotivator = async () => {
            // Skip if locked (loaded from user profile)
            if (isMotivatorLocked) return;

            // Prevent self-referral
            if (motivatorMobile && mobile && motivatorMobile === mobile) {
                setMotivatorName("");
                setErrors(prev => ({ ...prev, motivator: "Please fill motivators no. not self" }));
                return;
            }

            if (motivatorMobile.length >= 4) {
                try {
                    const { data } = await api.get(`/donate/validate-motivator/${motivatorMobile}`);
                    if (data.valid) {
                        setMotivatorName(data.name);
                        setErrors(prev => ({ ...prev, motivator: null }));
                    } else {
                        setMotivatorName('');
                        setErrors(prev => ({ ...prev, motivator: "Invalid mobile number or code" }));
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

    const submitDonation = async () => {
        setLoading(true);
        const finalAmount = customAmount ? Number(customAmount) : amount;

        try {
            const payload = {
                amount: finalAmount,
                fullName,
                donorName: fullName,
                donorMobile: mobile,
                donorEmail: email,
                motivatorMobile: motivatorMobile || null,
                referralSource: referralSource || null,
                panNumber: need80G ? pan : null,
                aadhaarNumber: need80G ? aadhaar : null
            };

            const { data } = await api.post('/donate', payload);
            setShowPanModal(false);

            toast.success(`Payment Successful! Donation ID: ${data.donationId}`);
            setDonationSuccess({
                donationId: data.donationId,
                amount: finalAmount,
                isAlreadyRegistered: data.isAlreadyRegistered
            });
            if (onSuccess) onSuccess();
            // Don't navigate, show Success View to allow registration
            // navigate('/');

        } catch (error) {
            setShowPanModal(false);
            console.error("Donation failed:", error);
            toast.error("Donation failed. Please try again.");
        } finally {
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

            localStorage.setItem('user', JSON.stringify(data));
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
        const userStr = localStorage.getItem('user');
        const userObj = userStr && userStr !== 'null' && userStr !== 'undefined' ? JSON.parse(userStr) : null;
        const isLoggedIn = !!(userObj && userObj.token);

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
                                    <p style={{ fontSize: '0.95rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: t('donatePage.claimDesc') }}></p>
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
                            className="form-control"
                            placeholder="Ex. Raghu Kumar"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

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
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val) && val.length <= 10) setMobile(val);
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
                </div>

                <div className="form-section">
                    <h3 className="section-label">
                        <Smartphone size={20} />
                        {t('donatePage.motivatorTitle')}
                    </h3>

                    <div className="referral-box">
                        <div className="donation-input-group mb-0">
                            <label className="input-label">{t('donatePage.motivatedBy')} {isMotivatorLocked ? '' : '(Mobile Number)'}</label>
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
                                                const val = e.target.value.toUpperCase();
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
                                            setPan(e.target.value.toUpperCase());
                                            if (errors.pan) setErrors({ ...errors, pan: null });
                                        }}
                                        maxLength={10}
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
                                            const val = e.target.value;
                                            if (/^\d*$/.test(val) && val.length <= 12) {
                                                setAadhaar(val);
                                                if (errors.aadhaar) setErrors({ ...errors, aadhaar: null });
                                            }
                                        }}
                                        maxLength={12}
                                    />
                                </div>
                                {errors.aadhaar && <small className="error-text">{errors.aadhaar}</small>}
                            </div>
                        </div>
                    )}
                </div>

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
                                    setConfirmPan(e.target.value.toUpperCase());
                                    setConfirmError('');
                                }}
                                maxLength={10}
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
        </React.Fragment>
    );
};

export default DonationForm;
