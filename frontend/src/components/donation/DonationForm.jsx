import React, { useState, useEffect } from 'react';
import { User, Smartphone, Mail, MapPin, CreditCard } from 'lucide-react';
import api from '../../services/api';
import './DonationForm.css';

const DonationForm = () => {
    const [amount, setAmount] = useState(1000);
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

    const [loading, setLoading] = useState(false);

    // Debounce motivator check
    useEffect(() => {
        const checkMotivator = async () => {
            if (motivatorMobile.length === 10) {
                try {
                    const { data } = await api.get(`/donate/validate-motivator/${motivatorMobile}`);
                    if (data.valid) {
                        setMotivatorName(data.name);
                    } else {
                        setMotivatorName('');
                    }
                } catch (error) {
                    console.error("Error validating motivator:", error);
                    setMotivatorName('');
                }
            } else {
                setMotivatorName('');
            }
        };

        const timer = setTimeout(() => {
            checkMotivator();
        }, 500);

        return () => clearTimeout(timer);
    }, [motivatorMobile]);

    const handleDonate = async () => {
        const finalAmount = customAmount ? Number(customAmount) : amount;

        if (!fullName || !mobile || !finalAmount) {
            alert("Please fill in required fields.");
            return;
        }

        if (!referralSource && !motivatorMobile) {
            alert("Please let us know what motivated you to donate (Motivator Mobile or Referral Source).");
            return;
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
            alert(`Payment Successful! Donation ID: ${data.donationId}`);
            // Reset form or redirect
            window.location.href = '/';

        } catch (error) {
            console.error("Donation failed:", error);
            alert("Donation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="donation-container">
            <h2 className="donation-title">Donation amount</h2>

            <div className="amount-options">
                <button className={`amount-btn ${amount === 600 ? 'active' : ''}`} onClick={() => { setAmount(600); setCustomAmount(''); }}>₹600</button>
                <button className={`amount-btn ${amount === 1000 ? 'active' : ''}`} onClick={() => { setAmount(1000); setCustomAmount(''); }}>₹1,000</button>
                <button className={`amount-btn ${amount === 5000 ? 'active' : ''}`} onClick={() => { setAmount(5000); setCustomAmount(''); }}>₹5,000</button>
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
                            className="form-input"
                            placeholder="Enter 10 digit mobile"
                            value={motivatorMobile}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) setMotivatorMobile(val);
                            }}
                            disabled={!!referralSource}
                        />
                        {motivatorName && <span className="success-text">Motivated by: {motivatorName}</span>}
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
                                className="form-input"
                                placeholder="ABCDE1234F"
                                value={pan}
                                onChange={(e) => setPan(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Aadhaar Number (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={aadhaar}
                                onChange={(e) => setAadhaar(e.target.value)}
                            />
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
