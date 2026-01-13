import React, { useState } from 'react';
import Navbar from '../layout/Navbar';
import AuthFooter from './AuthFooter';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
    // Form States
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            // For now, let's login (save token) and redirect
            localStorage.setItem('user', JSON.stringify(data));

            alert('Registration Successful!');
            navigate('/');

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
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

                            <label className="input-label" style={{ color: '#d9534f' }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <label className="input-label" style={{ color: '#d9534f', marginTop: '1rem' }}>
                                Mobile Number *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter 10-digit Mobile"
                                value={mobile}
                                onChange={handleMobileChange}
                            />

                            <label className="input-label" style={{ color: '#d9534f', marginTop: '1rem' }}>
                                Email Address (Optional)
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Enter Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label className="input-label" style={{ color: '#d9534f', marginTop: '1rem' }}>
                                Password *
                            </label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Create Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <label className="input-label" style={{ color: '#d9534f', marginTop: '1rem' }}>
                                Referral Code (Optional)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter Referrer Mobile"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                            />

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
        </>
    );
};

export default Signup;
