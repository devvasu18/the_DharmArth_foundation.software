import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import AuthFooter from './AuthFooter';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import { Eye, EyeOff, User, BadgeCheck } from 'lucide-react';
import SuccessModal from './SuccessModal';

const Signup = () => {
    // Form States
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [referrerName, setReferrerName] = useState('');
    const [referralError, setReferralError] = useState('');
    const [verifyingReferral, setVerifyingReferral] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async () => {
        if (!name || !mobile || !password) {
            setError("Please fill all required fields");
            return;
        }

        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { name, mobile, email, password, referralCode });

            // Automatically login or redirect
            // For now, let's login (save token)
            localStorage.setItem('user', JSON.stringify(data));

            // Show Success Modal instead of alert
            setShowSuccessModal(true);

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/');
    };

    const handleGoogleSignup = () => {
        alert("Google Signup Logic initiated! (Requires Google Cloud Credentials setup)");
    };

    const handleMobileChange = (e) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 10) {
            setMobile(val);
        }
    };

    const handleReferralChange = async (e) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 10) {
            setReferralCode(val);
            setReferrerName('');
            setReferralError('');

            if (val.length === 10) {
                setVerifyingReferral(true);
                try {
                    const { data } = await api.post('/auth/check-referral', { referralCode: val });
                    if (data.isValid) {
                        setReferrerName(data.name);
                        setReferralError('');
                    }
                } catch (err) {
                    setReferralError('Referral code invalid or user not found');
                    setReferrerName('');
                } finally {
                    setVerifyingReferral(false);
                }
            }
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-page">
                <div className="auth-container">
                    <h2 className="auth-title">Create Account</h2>

                    {/* Reuse auth-content structure */}
                    <div className="auth-content">
                        {/* LEFT SIDE */}
                        <div className="auth-left">

                            {/* ERROR MESSAGE */}
                            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}

                            <label className="input-label" style={{ color: 'black' }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <label className="input-label" style={{ color: 'black', marginTop: '1rem' }}>
                                Mobile Number *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter 10-digit Mobile"
                                value={mobile}
                                onChange={handleMobileChange}
                            />

                            <label className="input-label" style={{ color: 'black', marginTop: '1rem' }}>
                                Email Address (Optional)
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Enter Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label className="input-label" style={{ color: 'black', marginTop: '1rem' }}>
                                Password *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field"
                                    placeholder="Create Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <label className="input-label" style={{ color: 'black', marginTop: '1rem' }}>
                                Referral Code (Optional)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter Referrer Mobile"
                                value={referralCode}
                                onChange={handleReferralChange}
                            />
                            {verifyingReferral && <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '-15px', marginBottom: '10px' }}>Verifying...</div>}
                            {referrerName && (
                                <div className="motivator-profile-chip verified">
                                    <div className="motivator-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="motivator-info">
                                        <span className="motivator-name">{referrerName}</span>
                                        <span className="motivator-status">
                                            <BadgeCheck size={16} fill="currentColor" color="white" className="text-primary" /> Verified Referrer
                                        </span>
                                    </div>
                                </div>
                            )}
                            {referralError && <span className="error-text">{referralError}</span>}

                            {/* ACTION BUTTON */}
                            <button
                                className="btn bg-primary text-white full-width"
                                style={{ marginTop: '1.5rem' }}
                                onClick={handleSignup}
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>

                            {/* TOGGLE TO LOGIN */}
                            <div className="justify-center flex mt-4" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                                <span style={{ color: '#666' }}>Already have an account? </span>
                                <Link to="/login" className="link-text" style={{ marginLeft: '5px' }}>
                                    Login here
                                </Link>
                            </div>
                        </div>


                    </div>

                </div>
            </div>
            <AuthFooter />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccessModal}
                title="Registration Successful!"
                message={`Welcome ${name}! Your account has been successfully created. You can now start donating or fundraising.`}
                buttonText="Go to Dashboard"
            />
        </>
    );
};

export default Signup;
