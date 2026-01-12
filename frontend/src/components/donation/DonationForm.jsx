import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConfirm } from '../../context/ConfirmContext';
import { User, Smartphone, Mail, MapPin, CreditCard } from 'lucide-react';
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

    // Form States
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [pan, setPan] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);

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
    }, [motivatorMobile, mobile]);

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
            // Aadhaar is optional in the UI "Aadhaar Number (Optional)", but if entered, must be valid
            if (aadhaar && !validateAadhaar(aadhaar)) {
                newErrors.aadhaar = "Invalid Aadhaar Number (Check for typos)";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        // Referral/Motivator Validation Logic
        if (referralSource) {
            // Valid because referral source is selected
        } else {
            // Must have a valid motivator
            if (!motivatorMobile) {
                await showAlert("Please let us know what motivated you to donate (Motivator Mobile or Referral Source).");
                return;
            }
            // Check for specific errors set during validation
            if (errors.motivator) {
                await showAlert(errors.motivator);
                return;
            }
            // Check if user is trying to submit an invalid/unverified motivator
            if (!motivatorName) {
                await showAlert("Please enter a valid motivator number.");
                return;
            }
        }

        setLoading(true);

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
        }
    };

    return (
        <div className="donation-container">
            <h2 className="donation-title">Donation amount</h2>

            <div className="amount-options">
                {donationConfig.plans.map((planAmount) => (
                    <button
                        key={planAmount}
                        className={`amount-btn ${amount === planAmount ? 'active' : ''} ${donationConfig.popularAmount === planAmount ? 'popular' : ''}`}
                        onClick={() => { setAmount(planAmount); setCustomAmount(''); }}
                    >
                        ₹{planAmount.toLocaleString()}
                    </button>
                ))}
            </div>

            <div className="custom-amount">
                <span>₹</span>
                <input
                    type="number"
                    placeholder="Other amount - ₹1000 or more"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                />
            </div>

            <div className="checkbox-wrap">
                <input type="checkbox" defaultChecked /> I confirm that I am an Indian citizen
            </div>

            <div className="details-card">
                <h3 className="card-title">Your Details</h3>

                <div className="form-group">
                    <label>Full Name*</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="eg. Raghu Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <div className="checkbox-wrap sm">
                        <input type="checkbox" /> Make my donation anonymous
                    </div>
                </div>

                <div className="form-group">
                    <label>Mobile Number*</label>
                    <div className="phone-input">
                        <span className="flag-icon">🇮🇳 +91</span>
                        <input
                            type="text"
                            className="form-input"
                            value={mobile}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) setMobile(val);
                            }}
                        />
                    </div>
                    <small>Payment updates will be sent on this number</small>
                </div>

                <div className="form-group">
                    <label>Email (Optional)</label>
                    <input
                        type="email"
                        className="form-input"
                        placeholder="eg. email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Referral Logic */}
                <div className="referral-section">
                    <div className="form-group">
                        <label>Motivated By (Mobile Number)</label>
                        <input
                            type="text"
                            className={`form-input ${errors.motivator ? 'error-border' : ''}`}
                            placeholder="Enter 10 digit mobile"
                            value={motivatorMobile}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) setMotivatorMobile(val);
                            }}
                            disabled={!!referralSource}
                        />
                        {motivatorName && <span className="success-text">Motivated by: {motivatorName}</span>}
                        {errors.motivator && <small className="error-text" style={{ color: 'red' }}>{errors.motivator}</small>}
                    </div>

                    <div className="text-center text-muted" style={{ textAlign: 'center', margin: '10px 0' }}>OR</div>

                    <div className="form-group">
                        <label>Referred Via</label>
                        <select
                            className="form-input"
                            value={referralSource}
                            onChange={(e) => setReferralSource(e.target.value)}
                            disabled={!!motivatorMobile}
                        >
                            <option value="">Select Option</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Facebook">Facebook</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Website">Website</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="checkbox-wrap">
                    <input type="checkbox" checked={need80G} onChange={(e) => setNeed80G(e.target.checked)} />
                    Need 80G Certificate for Tax Exemption?
                </div>

                {need80G && (
                    <div className="tax-fields">
                        <div className="form-group">
                            <label>PAN Number*</label>
                            <input
                                type="text"
                                className={`form-input ${errors.pan ? 'error-border' : ''}`}
                                placeholder="ABCDE1234F"
                                value={pan}
                                onChange={(e) => {
                                    setPan(e.target.value.toUpperCase());
                                    if (errors.pan) setErrors({ ...errors, pan: null });
                                }}
                                maxLength={10}
                            />
                            {errors.pan && <small className="error-text" style={{ color: 'red' }}>{errors.pan}</small>}
                        </div>
                        <div className="form-group">
                            <label>Aadhaar Number (Optional)</label>
                            <input
                                type="text"
                                className={`form-input ${errors.aadhaar ? 'error-border' : ''}`}
                                value={aadhaar}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val) && val.length <= 12) {
                                        setAadhaar(val);
                                        if (errors.aadhaar) setErrors({ ...errors, aadhaar: null });
                                    }
                                }}
                            />
                            {errors.aadhaar && <small className="error-text" style={{ color: 'red' }}>{errors.aadhaar}</small>}
                        </div>
                    </div>
                )}

                <div className="checkbox-wrap mt-4" style={{ marginTop: '1rem' }}>
                    <input type="checkbox" defaultChecked /> Send me updates and notifications via WhatsApp/SMS
                </div>

                <button
                    className="btn bg-primary text-white full-width mt-4"
                    style={{ padding: '1rem', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}
                    onClick={handleDonate}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Proceed to Pay'}
                </button>

            </div>
        </div>
    );
};

export default DonationForm;
