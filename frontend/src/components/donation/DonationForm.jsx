import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../context/ConfirmContext';
import { User, Smartphone, Mail, MapPin, CreditCard, BadgeCheck } from 'lucide-react';
import api from '../../services/api';
import './DonationForm.css';
import { validatePAN, validateAadhaar } from '../../utils/validators';

const DonationForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showAlert } = useConfirm();
    const [amount, setAmount] = useState(1000);
    const [donationConfig, setDonationConfig] = useState({ plans: [600, 1000, 5000], popularAmount: 1000 });
    const [customAmount, setCustomAmount] = useState('');
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
                    }
                }
            } catch (error) {
                console.error("Failed to load donation config", error);
            }
        };
        fetchSettings();

        // Auto-fill user details if logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setFullName(user.name || '');
                setMobile(user.mobile || '');
                setEmail(user.email || '');
                if (user.referredBy) {
                    setMotivatorMobile(user.referredBy.mobile);
                    setMotivatorName(user.referredBy.name);
                    setIsMotivatorLocked(true);
                }
            } catch (e) {
                console.error("Error parsing user from localstorage");
            }
        }
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

            if (motivatorMobile.length === 10) {
                try {
                    const { data } = await api.get(`/donate/validate-motivator/${motivatorMobile}`);
                    if (data.valid) {
                        setMotivatorName(data.name);
                        setErrors(prev => ({ ...prev, motivator: null }));
                    } else {
                        setMotivatorName('');
                        setErrors(prev => ({ ...prev, motivator: "Invalid motivator number" }));
                    }
                } catch (error) {
                    console.error("Error validating motivator:", error);
                    setMotivatorName('');
                    setErrors(prev => ({ ...prev, motivator: "Error validating number" }));
                }
            } else {
                setMotivatorName('');
                if (motivatorMobile.length > 0) {
                    // Check length (optional, maybe wait for 10)
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
                donorName: fullName,
                donorMobile: mobile,
                donorEmail: email,
                motivatorMobile: motivatorMobile || null,
                referralSource: referralSource || null,
                panNumber: need80G ? pan : null,
                aadhaarNumber: need80G ? aadhaar : null
            };

            const { data } = await api.post('/donate', payload);
            await showAlert(`Payment Successful! Donation ID: ${data.donationId}`);
            // Reset form or redirect
            navigate('/');

        } catch (error) {
            console.error("Donation failed:", error);
            await showAlert("Donation failed. Please try again.");
        } finally {
            setLoading(false);
            setShowPanModal(false);
        }
    };

    const handleDonate = async () => {
        const finalAmount = customAmount ? Number(customAmount) : amount;

        if (!fullName || !mobile || !finalAmount) {
            await showAlert("Please fill in required fields.");
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

        // Referral/Motivator Validation Logic
        if (!referralSource && !motivatorMobile) {
            await showAlert("Please let us know what motivated you to donate (Motivator Mobile or Referral Source).");
            return;
        }

        // Validate motivator if entered - independant check
        if (motivatorMobile) {
            if (errors.motivator) {
                await showAlert(errors.motivator);
                return;
            }
            if (!motivatorName) {
                await showAlert("Please enter a valid motivator number.");
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

    return (
        <div className="donation-container">
            <h2 className="donation-title">
                <CreditCard size={28} className="text-primary" />
                Select Donation Amount
            </h2>

            <div className="amount-options">
                {donationConfig.plans.map((planAmount) => (
                    <button
                        key={planAmount}
                        className={`amount-btn ${amount === planAmount ? 'active' : ''}`}
                        onClick={() => { setAmount(planAmount); setCustomAmount(''); }}
                    >
                        {donationConfig.popularAmount === planAmount && (
                            <span className="popular-tag">Popular</span>
                        )}
                        ₹{planAmount.toLocaleString()}
                    </button>
                ))}
            </div>

            <div className="custom-amount">
                <span className="currency-symbol">₹</span>
                <input
                    type="number"
                    placeholder="Enter custom amount (Min ₹500)"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                />
            </div>

            <label className="checkbox-item">
                <input type="checkbox" defaultChecked />
                <span>I confirm that I am an Indian citizen</span>
            </label>

            <div className="form-section">
                <h3 className="section-label">
                    <User size={20} />
                    Personal Details
                </h3>

                <div className="input-group">
                    <label className="input-label">Full Name*</label>
                    <div className="input-wrapper">
                        <User size={18} className="input-icon" />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ex. Raghu Kumar"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Mobile Number*</label>
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
                    <small className="mt-1 text-muted">We'll send payment updates via WhatsApp</small>
                </div>

                <div className="input-group">
                    <label className="input-label">Email Address (Optional)</label>
                    <div className="input-wrapper">
                        <Mail size={18} className="input-icon" />
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
                    Motivational Source
                </h3>

                <div className="referral-box">
                    <div className="input-group mb-0">
                        <label className="input-label">Motivated By {isMotivatorLocked ? '' : '(Mobile Number)'}</label>
                        {isMotivatorLocked ? (
                            <div className="motivator-profile-chip verified">
                                <div className="motivator-avatar">
                                    <User size={24} />
                                </div>
                                <div className="motivator-info">
                                    <span className="motivator-name">{motivatorName}</span>
                                    <span className="motivator-status">
                                        <BadgeCheck size={14} fill="currentColor" strokeWidth={2.5} className="text-primary" /> Verified Motivator
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="phone-wrapper">
                                    <div className="flag-addon">
                                        <Smartphone size={16} />
                                    </div>
                                    <input
                                        type="tel"
                                        className={`phone-field ${(errors.motivator) ? 'error-border' : ''}`}
                                        placeholder="Enter 10-digit mobile number"
                                        value={motivatorMobile}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d*$/.test(val) && val.length <= 10) setMotivatorMobile(val);
                                        }}
                                        maxLength={10}
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
                                                <BadgeCheck size={16} fill="currentColor" className="text-primary" /> Verified Motivator
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {errors.motivator && <small className="error-text">{errors.motivator}</small>}
                            </>
                        )}
                    </div>

                    <div style={{ margin: '1rem 0' }}></div>

                    <div className="input-group mb-0">
                        <div className="input-wrapper">
                            <MapPin size={18} className="input-icon" />
                            <select
                                className="form-control"
                                value={referralSource}
                                onChange={(e) => setReferralSource(e.target.value)}
                            >
                                <option value="">Select Referral Source</option>
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
                    <span>Need 80G Certificate for Tax Exemption?</span>
                </label>

                {need80G && (
                    <div className="tax-benefits-box">
                        <span className="tax-badge">Save Tax</span>
                        <div className="input-group">
                            <label className="input-label">PAN Number*</label>
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
                            {errors.pan && <small className="error-text">{errors.pan}</small>}
                        </div>
                        <div className="input-group mb-0">
                            <label className="input-label">Aadhaar Number*</label>
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
                            {errors.aadhaar && <small className="error-text">{errors.aadhaar}</small>}
                        </div>
                    </div>
                )}
            </div>

            <button
                className="donate-btn"
                onClick={handleDonate}
                disabled={loading}
            >
                {loading ? 'Processing Secure Payment...' : `Donate ₹${(customAmount ? Number(customAmount) : amount).toLocaleString()}`}
            </button>

            <div className="text-center mt-3">
                <small className="text-muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <CreditCard size={12} /> 100% Secure Payment
                </small>
            </div>

            {showPanModal && (
                <div className="pan-modal-overlay">
                    <div className="pan-modal-content">
                        <div className="pan-modal-header">
                            <p className="pan-modal-title">Secure Confirmation</p>
                            <p className="pan-modal-subtitle">Verify details for 80G Tax Exemption</p>
                        </div>

                        <div className="pan-user-details">
                            <div className="pan-detail-row">
                                <span className="pan-detail-label">Donor Name:</span>
                                <span className="pan-detail-value">{fullName}</span>
                            </div>
                            <div className="pan-detail-row" style={{ marginTop: '0.5rem' }}>
                                <span className="pan-detail-label">Mobile:</span>
                                <span className="pan-detail-value">+91 {mobile}</span>
                            </div>
                        </div>

                        <div className="input-group mb-0">
                            <label className="input-label">Confirm PAN Number*</label>
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
                            <button className="btn-secondary" onClick={() => setShowPanModal(false)}>Cancel</button>
                            <button className="btn-confirm" onClick={handlePanConfirm} disabled={loading}>
                                {loading ? 'Processing...' : 'Confirm & Donate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DonationForm;
