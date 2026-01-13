import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from '../layout/Navbar';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Login = () => {
    const { i18n } = useTranslation();
    const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
    const [bannerData, setBannerData] = useState(null);

    // Form States
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/content/settings');
                if (data.show_save_life_banner) {
                    setBannerData({
                        text: data.save_life_banner_text || 'Save a life regarding fetched settings',
                        text_hi: data.save_life_banner_text_hi,
                        btnText: data.save_life_banner_btn_text || 'Click Here',
                        btnText_hi: data.save_life_banner_btn_text_hi,
                        link: data.save_life_banner_link || '#'
                    });
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

            if (data.language) {
                i18n.changeLanguage(data.language);
            }

            // Redirect based on role or default
            if (data.isSuperAdmin) {
                toast.success('Welcome back, Super Admin!');
                // navigate('/admin/dashboard'); // Future
                navigate('/');
            } else {
                toast.success('Welcome back!');
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

                    {bannerData && (
                        <div className="auth-banner">
                            {(() => {
                                let { text, btnText, link, text_hi, btnText_hi } = bannerData;

                                if (i18n.language === 'hi') {
                                    text = text_hi || text;
                                    btnText = btnText_hi || btnText;
                                }

                                if (btnText && text.includes(btnText)) {
                                    const parts = text.split(btnText);
                                    return (
                                        <span>
                                            {parts.map((part, index) => (
                                                <React.Fragment key={index}>
                                                    <span dangerouslySetInnerHTML={{ __html: part }}></span>
                                                    {index < parts.length - 1 && (
                                                        <Link
                                                            to={link}
                                                            style={{ fontWeight: 'bold', textDecoration: 'underline', color: 'inherit' }}
                                                        >
                                                            {btnText}
                                                        </Link>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </span>
                                    );
                                } else {
                                    // Fallback if substring not found
                                    return (
                                        <>
                                            <span dangerouslySetInnerHTML={{ __html: text }}></span>
                                            {btnText && (
                                                <Link
                                                    to={link}
                                                    style={{ fontWeight: 'bold', marginLeft: '5px', textDecoration: 'underline', color: 'inherit' }}
                                                >
                                                    {btnText}
                                                </Link>
                                            )}
                                        </>
                                    );
                                }
                            })()}
                        </div>
                    )}

                    <div className="auth-content">
                        {/* LEFT SIDE */}
                        <div className="auth-left">

                            {/* ERROR MESSAGE */}
                            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}

                            <label className="input-label">
                                {loginMethod === 'otp' ? 'Email / Mobile Number *' : 'Mobile Number *'}
                            </label>

                            <input
                                type="text"
                                className="input-field"
                                placeholder={loginMethod === 'otp' ? "Enter Mobile / Email" : "Enter Mobile Number"}
                                value={mobile}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && loginMethod === 'password') {
                                        handlePasswordLogin();
                                    }
                                }}
                            />

                            {loginMethod === 'password' && (
                                <>
                                    <label className="input-label" style={{ marginTop: '1rem' }}>
                                        Password *
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input-field"
                                            placeholder="Enter Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handlePasswordLogin();
                                                }
                                            }}
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
                                                color: '#666',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
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
                            <div className="justify-center flex mt-4" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                <button
                                    type="button"
                                    onClick={() => setLoginMethod(loginMethod === 'otp' ? 'password' : 'otp')}
                                    style={{
                                        background: 'transparent',
                                        border: '2px solid var(--primary)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.5rem 1rem',
                                        color: 'var(--primary)',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                        justifyContent: 'center'
                                    }}
                                    className="login-method-toggle"
                                >
                                    {loginMethod === 'otp' ? (
                                        <>
                                            <Key size={18} />
                                            <span>Login via Password</span>
                                        </>
                                    ) : (
                                        <>
                                            <Smartphone size={18} />
                                            <span>Login via OTP</span>
                                        </>
                                    )}
                                </button>

                                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Don't have an account? <Link to="/signup" className="link-text" style={{ marginLeft: '4px' }}>Sign Up</Link>
                                </span>
                            </div>




                        </div>


                    </div>
                    <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem', color: '#999' }}>
                        By continuing you agree to our<br />
                        <span className="link-text">Terms of Service</span> and <span className="link-text">Privacy Policy</span>
                    </p>
                </div>
            </div>
        </>
    );
};
export default Login;
