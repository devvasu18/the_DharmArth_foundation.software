import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import AuthFooter from './AuthFooter';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
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
    const [isClaiming, setIsClaiming] = useState(false);
    const [verifyingStatus, setVerifyingStatus] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSignup = async () => {
        if (!name || !mobile || !password) {
            setError("Please fill all required fields");
            return;
        }

        if (name.trim().length < 4) {
            setError("Full name must be at least 4 characters");
            return;
        }

        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { name, mobile, email, password });

            // Use context login
            login(data);

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
        toast.info("Google Signup Logic initiated! (Requires Google Cloud Credentials setup)");
    };

    const handleMobileChange = async (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 10) {
            setMobile(val);
            setError('');
            setIsClaiming(false);

            if (val.length === 10) {
                setVerifyingStatus(true);
                try {
                    const { data } = await api.post('/auth/check-status', { mobile: val });
                    if (data.exists) {
                        if (data.hasPassword) {
                            setError('User already exists. Please login.');
                        } else {
                            setIsClaiming(true);
                            if (data.name) setName(data.name);
                        }
                    }
                } catch (err) {
                    console.error("Status check failed", err);
                } finally {
                    setVerifyingStatus(false);
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
                            
                            {isClaiming && (
                                <div style={{ 
                                    background: 'rgba(13, 170, 188, 0.1)', 
                                    padding: '10px', 
                                    borderRadius: '8px', 
                                    marginBottom: '15px', 
                                    fontSize: '0.85rem',
                                    border: '1px solid var(--primary)',
                                    color: '#0d7a8c'
                                }}>
                                    <strong>Account Found!</strong> We found your previous donations. Please create a password to secure your account.
                                </div>
                            )}

                            {verifyingStatus && <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '10px' }}>Checking mobile status...</div>}

                            <label className="input-label" style={{ color: 'black' }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter Full Name"
                                value={name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setName(val);
                                    if (val.trim().length > 0 && val.trim().length < 4) {
                                        setError('Full name must be at least 4 characters');
                                    } else {
                                        setError('');
                                    }
                                }}
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


                            {/* ACTION BUTTON */}
                            <button
                                className="btn bg-primary text-white full-width"
                                style={{ marginTop: '1.5rem' }}
                                onClick={handleSignup}
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : (isClaiming ? 'Claim Account' : 'Sign Up')}
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
                title={isClaiming ? "Account Claimed!" : "Registration Successful!"}
                message={isClaiming 
                    ? `Welcome back ${name}! Your account has been secured and your previous donations are now linked.`
                    : `Welcome ${name}! Your account has been successfully created. You can now start donating or fundraising.`
                }
                buttonText="Go to Dashboard"
            />
        </>
    );
};

export default Signup;
