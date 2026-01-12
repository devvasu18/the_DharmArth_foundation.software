import React, { useState, useEffect } from 'react';
import Navbar from '../layout/Navbar';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
    const [showSaveLifeMessage, setShowSaveLifeMessage] = useState(false);

    // Form States
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/content/settings');
                if (data.show_save_life_banner) {
                    setShowSaveLifeMessage(true);
                }
            } catch (err) {
                console.error("Failed fetching settings", err);
            }
        };
        fetchSettings();
    }, []);

    const handlePasswordLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { mobile, password });

            // Save user & token
            localStorage.setItem('user', JSON.stringify(data));

            // Redirect based on role or default
            if (data.isSuperAdmin) {
                alert('Welcome Super Admin!');
                // navigate('/admin/dashboard'); // Future
                navigate('/');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // In a real app, this would redirect to backend OAuth endpoint
        // window.location.href = 'http://localhost:5000/api/auth/google';
        alert("Google Login Logic initiated! (Requires Google Cloud Credentials setup)");
    };

    const handleInputChange = (e) => {
        const val = e.target.value;

        if (loginMethod === 'password') {
            // Strict Mobile: Numbers only, max 10
            if (/^\d*$/.test(val) && val.length <= 10) {
                setMobile(val);
            }
        } else {
            // OTP (Email/Mobile): If numeric, restrict to 10. If mixed/alpha, allow.
            if (/^\d*$/.test(val)) {
                if (val.length <= 10) setMobile(val);
            } else {
                setMobile(val);
            }
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-page">
                <div className="auth-container">
                    <h2 className="auth-title">Login</h2>

                    {showSaveLifeMessage && (
                        <div className="auth-banner">
                            <span>🎁 Save a life with just ₹10 on the App. <strong>Download Now</strong></span>
                        </div>
                    )}

                    <div className="auth-content">
                        {/* LEFT SIDE */}
                        <div className="auth-left">

                            {/* ERROR MESSAGE */}
                            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}

                            <label className="input-label" style={{ color: '#d9534f' }}>
                                {loginMethod === 'otp' ? 'Email / Mobile Number *' : 'Mobile Number *'}
                            </label>

                            <input
                                type="text"
                                className="input-field"
                                placeholder={loginMethod === 'otp' ? "Enter Mobile / Email" : "Enter Mobile Number"}
                                value={mobile}
                                onChange={handleInputChange}
                            />

                            {/* PASSWORD FIELD (Only in Password Mode) */}
                            {loginMethod === 'password' && (
                                <>
                                    <label className="input-label" style={{ color: '#d9534f', marginTop: '1rem' }}>
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </>
                            )}

                            {/* ACTION BUTTON */}
                            {loginMethod === 'otp' ? (
                                <button className="btn bg-primary text-white full-width" style={{ marginTop: '1rem' }}>
                                    Get OTP
                                </button>
                            ) : (
                                <button
                                    className="btn bg-primary text-white full-width"
                                    style={{ marginTop: '1rem' }}
                                    onClick={handlePasswordLogin}
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                            )}

                            {/* TOGGLE LOGIN METHOD */}
                            <div className="justify-center flex mt-4" style={{ marginTop: '1.5rem' }}>
                                <span
                                    className="link-text"
                                    onClick={() => setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp')}
                                >
                                    {loginMethod === 'otp' ? 'Login via Password' : 'Login via OTP'}
                                </span>
                            </div>

                            <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem', color: '#999' }}>
                                By continuing you agree to our<br />
                                <span className="link-text">Terms of Service</span> and <span className="link-text">Privacy Policy</span>
                            </p>

                            <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                Want to start a fundraiser? <Link to="/start-fundraiser" className="link-text" style={{ fontWeight: 'bold' }}>Click here</Link>
                            </p>
                        </div>

                        {/* DIVIDER */}
                        <div className="auth-divider">
                            <span>OR</span>
                        </div>

                        {/* RIGHT SIDE (GOOGLE) */}
                        <div className="auth-right" style={{ display: 'flex', alignItems: 'center' }}>
                            <button className="btn btn-google full-width" onClick={handleGoogleLogin}>
                                <span style={{ background: 'white', borderRadius: '2px', padding: '2px', display: 'flex' }}>
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" width={18} />
                                </span>
                                <span style={{ flex: 1 }}>Sign in</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default Login;
