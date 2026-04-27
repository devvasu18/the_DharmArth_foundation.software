import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from '../layout/Navbar';
import AuthFooter from './AuthFooter';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import DOMPurify from 'dompurify';

const Login = () => {
    const { i18n } = useTranslation();
    const [loginMethod, setLoginMethod] = useState('password'); // 'otp' or 'password'
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
            const roles = data.roles || [];
            const isDeliveryPartner = roles.some(r => typeof r === 'string' ? r === 'Delivery boy' : r.name === 'Delivery boy');

            if (data.isSuperAdmin) {
                toast.success('Welcome back, Super Admin!');
                navigate('/admin');
            } else if (isDeliveryPartner) {
                toast.success('Rider Dashboard Loaded');
                navigate('/delivery-boy');
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
        // window.location.href = `${API_BASE_URL}/api/auth/google`;
        toast.info("Google Login Logic initiated! (Requires Google Cloud Credentials setup)");
    };

    const handleInputChange = (e) => {
        let val = e.target.value;

        if (loginMethod === 'password') {
            // Strict Mobile: Clean input and take up to 10 digits
            const numericVal = val.replace(/\D/g, '');
            if (numericVal.length <= 10) {
                setMobile(numericVal);
            }
        } else {
            // OTP (Email/Mobile): If looks like mobile (numeric), clean and restrict.
            // If it has alpha chars, it's likely an email, allow as is.
            if (/^\d*$/.test(val.replace(/\s/g, ''))) {
                const numericVal = val.replace(/\D/g, '');
                if (numericVal.length <= 10) setMobile(numericVal);
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
                                                    <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(part) }}></span>
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
                                            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}></span>
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
                                            <span style={{ color: 'black' }}>Login via Password</span>
                                        </>
                                    ) : (
                                        <>
                                            <Smartphone size={18} />
                                            <span style={{ color: 'black' }}>Login via OTP</span>
                                        </>
                                    )}
                                </button>

                                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Don't have an account? <Link to="/signup" className="link-text" style={{ marginLeft: '4px' }}>Sign Up</Link>
                                </span>
                            </div>




                        </div>


                    </div>

                </div>

            </div>
            <AuthFooter />
        </>
    );
};
export default Login;
