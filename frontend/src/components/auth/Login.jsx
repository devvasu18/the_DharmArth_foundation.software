import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from '../layout/Navbar';
import AuthFooter from './AuthFooter';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';
import DOMPurify from 'dompurify';

const Login = () => {
    const { i18n } = useTranslation();
    const [loginMethod, setLoginMethod] = useState('password'); // 'otp' or 'password'
    const [bannerData, setBannerData] = useState(null);

    // Form States
    const [identifier, setIdentifier] = useState(''); // Can be email or mobile
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Forgot Password Flow
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Identifier/OTP, 2: New Password
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

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

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        
        const isEmail = identifier.includes('@');
        if (!isEmail && identifier.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number or email address");
            return;
        }

        setOtpLoading(true);
        try {
            const { data } = await api.post('/auth/send-otp', { identifier });
            setOtpSent(true);
            toast.success(data.message || `OTP sent to your ${data.isEmail ? 'Email' : 'WhatsApp'}!`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { identifier, otp });

            // Use context login
            login(data);

            if (data.language) {
                i18n.changeLanguage(data.language);
            }

            toast.success('Welcome back!');
            // Redirect based on role or default
            const roles = data.roles || [];
            const isDeliveryPartner = roles.some(r => {
                const name = typeof r === 'string' ? r : r.name;
                return name && name.toLowerCase().includes('delivery');
            });

            if (data.isSuperAdmin) {
                navigate('/admin');
            } else if (isDeliveryPartner) {
                navigate('/delivery-boy');
            } else {
                navigate('/');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { identifier, password });

            // Use context login
            login(data);

            if (data.language) {
                i18n.changeLanguage(data.language);
            }

            // Redirect based on role or default
            const roles = data.roles || [];
            const isDeliveryPartner = roles.some(r => {
                const name = typeof r === 'string' ? r : r.name;
                return name && name.toLowerCase().includes('delivery');
            });

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

    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', { identifier, otp, newPassword });
            
            // Auto Login logic
            login(data);
            if (data.language) i18n.changeLanguage(data.language);

            toast.success("Password reset successful! Welcome back.");
            
            // Redirect based on role
            const roles = data.roles || [];
            const isDeliveryPartner = roles.some(r => {
                const name = typeof r === 'string' ? r : r.name;
                return name && name.toLowerCase().includes('delivery');
            });

            if (data.isSuperAdmin) navigate('/admin');
            else if (isDeliveryPartner) navigate('/delivery-boy');
            else navigate('/');

            // Reset local states
            setIsForgotPassword(false);
            setResetStep(1);
            setOtp('');
            setOtpSent(false);
            setPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Reset failed");
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

        // If the input is purely numeric and longer than 10 digits, cap it at 10 (standard Indian mobile)
        // Otherwise, allow everything so they can type email addresses freely.
        if (/^\d+$/.test(val) && val.length > 10) {
            setIdentifier(val.slice(0, 10));
        } else {
            setIdentifier(val);
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
                                Email / Mobile Number *
                            </label>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter Email or 10-digit Mobile"
                                    value={identifier}
                                    onChange={handleInputChange}
                                    disabled={otpSent}
                                    style={{ paddingRight: otpSent ? '80px' : '10px' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && loginMethod === 'password') {
                                            handlePasswordLogin();
                                        }
                                    }}
                                />
                                {otpSent && loginMethod === 'otp' && (
                                    <button 
                                        type="button"
                                        style={{ 
                                            position: 'absolute', 
                                            right: '10px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)',
                                            border: 'none', 
                                            background: 'none', 
                                            cursor: 'pointer',
                                            color: 'var(--primary)',
                                            fontWeight: '600',
                                            fontSize: '0.85rem'
                                        }}
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtp('');
                                        }}
                                    >
                                        Change
                                    </button>
                                )}
                            </div>

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
                                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                                        <button 
                                            type="button"
                                            className="text-primary text-sm" 
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                                            onClick={() => {
                                                setIsForgotPassword(true);
                                                setLoginMethod('otp');
                                                setOtpSent(false);
                                                setResetStep(1);
                                            }}
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ACTION BUTTON & OTP FLOW */}
                            {loginMethod === 'otp' ? (
                                !otpSent ? (
                                    <button 
                                        type="button"
                                        className="btn bg-primary text-white full-width" 
                                        style={{ marginTop: '1rem' }}
                                        onClick={handleSendOTP}
                                        disabled={otpLoading}
                                    >
                                        {otpLoading ? 'Sending...' : 'Get OTP'}
                                    </button>
                                ) : (
                                    <>
                                        <div className="form-group" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                            <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Enter 6-digit OTP</label>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {[...Array(6)].map((_, i) => (
                                                    <input
                                                        key={i}
                                                        id={`otp-${i}`}
                                                        type="text"
                                                        maxLength="1"
                                                        value={otp[i] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            const newOtp = otp.split('');
                                                            
                                                            if (val.length > 1) {
                                                                // Handle paste or multi-digit input
                                                                const pastedVal = val.slice(0, 6).split('');
                                                                setOtp(pastedVal.join(''));
                                                                const lastIdx = Math.min(pastedVal.length - 1, 5);
                                                                document.getElementById(`otp-${lastIdx}`).focus();
                                                                return;
                                                            }

                                                            newOtp[i] = val;
                                                            setOtp(newOtp.join(''));
                                                            
                                                            if (val && i < 5) {
                                                                document.getElementById(`otp-${i+1}`).focus();
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Backspace') {
                                                                if (!otp[i] && i > 0) {
                                                                    document.getElementById(`otp-${i-1}`).focus();
                                                                } else {
                                                                    const newOtp = otp.split('');
                                                                    newOtp[i] = '';
                                                                    setOtp(newOtp.join(''));
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            width: '45px',
                                                            height: '50px',
                                                            textAlign: 'center',
                                                            fontSize: '1.25rem',
                                                            fontWeight: 'bold',
                                                            borderRadius: '8px',
                                                            border: '2px solid #e2e8f0',
                                                            outline: 'none',
                                                            transition: 'all 0.2s',
                                                            background: '#f8fafc',
                                                            color: '#1e293b'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            className="btn bg-primary text-white full-width" 
                                            style={{ marginTop: '1rem' }}
                                            onClick={isForgotPassword ? () => setResetStep(2) : handleVerifyOTP}
                                            disabled={loading}
                                        >
                                            {loading ? 'Verifying...' : (isForgotPassword ? 'Verify OTP' : 'Verify & Login')}
                                        </button>
                                    </>
                                )
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
            {/* FORGOT PASSWORD MODAL/OVERLAY */}
            {isForgotPassword && otpSent && resetStep === 2 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="auth-container" style={{ maxWidth: '400px', width: '90%', margin: 0, background: 'white', padding: '2rem', borderRadius: '16px' }}>
                        <h2 className="auth-title">Reset Password</h2>
                        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#64748b' }}>
                            OTP verified! Now set your new password.
                        </p>
                        
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showResetPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="Min 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#64748b'
                                    }}
                                >
                                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showResetPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="Repeat password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#64748b'
                                    }}
                                >
                                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            className="btn bg-primary text-white full-width" 
                            style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                            onClick={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>

                        <button 
                            className="text-sm full-width" 
                            style={{ marginTop: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'block', width: '100%' }}
                            onClick={() => {
                                setIsForgotPassword(false);
                                setOtpSent(false);
                                setOtp('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <AuthFooter />
        </>
    );
};
export default Login;
