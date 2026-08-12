import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Phone, Briefcase, Info, MapPin, Camera, Save, Download, Share2, ArrowLeft, Trash2, AlertTriangle, RefreshCw, ExternalLink, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import VolunteerCard from '../components/user/VolunteerCard';
const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';



const UserProfile = () => {
    const { user, setUser, refreshUser, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const isHindi = i18n.language?.startsWith('hi');

    // ── Delete Account State ────────────────────────────────
    const [deleteStep, setDeleteStep] = useState('idle'); // 'idle' | 'warning' | 'otp' | 'deleting'
    const [deleteOtp, setDeleteOtp] = useState('');
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteMasked, setDeleteMasked] = useState('');
    const [deleteWallet, setDeleteWallet] = useState(0);
    const [deleteBlocked, setDeleteBlocked] = useState(null);
    const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(0);
    const deleteTimerRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        work: user?.work || '',
        bio: user?.bio || '',
        city: user?.city || '',
        state: user?.state || '',
        address: user?.address || '',
        profileImage: user?.profileImage || ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                work: user.work || '',
                bio: user.bio || '',
                city: user.city || '',
                state: user.state || '',
                address: user.address || '',
                profileImage: user.profileImage || ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            toast.error("Please select an image smaller than 4MB");
            return;
        }

        const uploadData = new FormData();
        uploadData.append('image', file);

        setIsUploading(true);
        try {
            const { data } = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, profileImage: data.imageUrl }));
            toast.success("Photo uploaded successfully!");
        } catch (error) {
            toast.error("Upload failed. Please try again.");
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data } = await api.put('/users/profile', formData);
            setUser(data.user);
            toast.success(isHindi ? "प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!" : "Profile updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Delete Account Handlers ─────────────────────────────
    const startDeleteCountdown = () => {
        setDeleteCountdown(120);
        deleteTimerRef.current = setInterval(() => {
            setDeleteCountdown(prev => {
                if (prev <= 1) { clearInterval(deleteTimerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendDeleteOtp = async () => {
        setIsSendingDeleteOtp(true);
        setDeleteBlocked(null);
        try {
            const { data } = await api.post('/users/delete-account/send-otp');
            setDeleteMasked(data.maskedMobile || '');
            setDeleteWallet(data.walletBalance || 0);
            setDeleteStep('otp');
            startDeleteCountdown();
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.blocked) {
                setDeleteBlocked(errData.message);
            } else {
                toast.error(errData?.message || 'Failed to send OTP. Please try again.');
            }
        } finally {
            setIsSendingDeleteOtp(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (deleteOtp.length !== 6) { toast.error('Please enter the 6-digit OTP.'); return; }
        if (!window.confirm(
            deleteWallet > 0
                ? `Your wallet balance of ₹${deleteWallet} will be donated to The Dharmarth Medical Foundation.\n\nThis action is PERMANENT. Are you absolutely sure?`
                : 'This action is PERMANENT and cannot be undone. Are you absolutely sure?'
        )) return;

        setIsDeleting(true);
        try {
            await api.delete('/users/delete-account', {
                data: { otp: deleteOtp, reason: deleteReason || 'User requested deletion' }
            });
            toast.success('Account deleted successfully.');
            await logout();
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete account.');
            setIsDeleting(false);
        }
    };

    const downloadRef = useRef(null);

    const downloadCard = async () => {
        if (!downloadRef.current) return;

        const toastId = toast.loading("Generating your high-quality ID Card...");
        try {
            // Give time for images in the hidden card to load if necessary
            // But since it's the same data as the visible one, they should be cached
            const canvas = await html2canvas(downloadRef.current, {
                useCORS: true,
                scale: 3,
                backgroundColor: null,
                width: 950,
                height: 1200,
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is visible for capture
                    const el = clonedDoc.querySelector('.download-capture-area');
                    if (el) el.style.position = 'static';
                }
            });

            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.download = `Volunteer_Card_${user?.referralCode || 'DF'}.png`;
            link.href = image;
            link.click();
            toast.success("ID Card downloaded successfully!", { id: toastId });
        } catch (error) {
            console.error("Card generation failed:", error);
            toast.error("Failed to generate ID Card", { id: toastId });
        }
    };

    const handleShare = () => {
        const publicLink = user?.referralCode
            ? `${window.location.origin}/v/${user.referralCode}`
            : `${window.location.origin}/v/${user?.mobile}`;

        navigator.clipboard.writeText(publicLink);
        toast.success("Public profile link copied!");
    };

    const previewContainerRef = useRef(null);
    const [cardScale, setCardScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (previewContainerRef.current) {
                const containerWidth = previewContainerRef.current.offsetWidth;
                // The card is 1000px wide on desktop, 950px on mobile
                const baselineWidth = window.innerWidth >= 1024 ? 1000 : 950;
                if (containerWidth < baselineWidth) {
                    setCardScale(containerWidth / baselineWidth);
                } else {
                    setCardScale(1);
                }
            }
        };

        const timer = setTimeout(updateScale, 100); // Small delay to ensure layout is ready
        window.addEventListener('resize', updateScale);
        return () => {
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="profile-page" style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <Navbar />

            <div className="profile-container">


                <div className="profile-grid">

                    {/* Left Side: Form */}
                    <div className="form-section">
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 className="section-title">{isHindi ? 'मेरी पहचान प्रोफ़ाइल' : 'My Identity Profile'}</h1>
                            <p className="section-subtitle">{isHindi ? 'अपना आधिकारिक स्वयंसेवक आईडी कार्ड बनाने के लिए अपनी प्रोफ़ाइल पूरी करें।' : 'Complete your profile to generate your official Volunteer ID Card.'}</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="profile-photo-preview">
                                        {formData.profileImage ? (
                                            <img src={formData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <img src={DEFAULT_AVATAR_URL} alt="Default Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                                        )}
                                        {isUploading && (
                                            <div className="upload-overlay">
                                                <div className="animate-spin spinner"></div>
                                            </div>
                                        )}
                                    </div>
                                    <label className="upload-btn">
                                        <Camera size={18} />
                                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label">{isHindi ? 'पूरा नाम' : 'Full Name'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                        <input
                                            name="name" value={formData.name} onChange={handleInputChange}
                                            className="form-control with-icon"
                                            placeholder={isHindi ? "पूरा नाम दर्ज करें" : "Enter full name"}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{isHindi ? 'ईमेल पता' : 'Email Address'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                        <input
                                            name="email" value={formData.email} onChange={handleInputChange}
                                            className="form-control with-icon"
                                            placeholder={isHindi ? "ईमेल दर्ज करें" : "Enter email"}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">{isHindi ? 'कार्य / व्यवसाय' : 'Work / Profession'}</label>
                                <div style={{ position: 'relative' }}>
                                    <Briefcase style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                    <input
                                        name="work" value={formData.work} onChange={handleInputChange}
                                        className="form-control with-icon"
                                        placeholder={isHindi ? "जैसे: सामाजिक कार्यकर्ता, डॉक्टर, इंजीनियर" : "e.g. Software Engineer, Social Worker"}
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">{isHindi ? 'बायो / विचार' : 'Bio / Vision'}</label>
                                <div style={{ position: 'relative' }}>
                                    <Info style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        className="form-control with-icon textarea"
                                        placeholder={isHindi ? "अपने मिशन के बारे में एक संक्षिप्त वाक्य..." : "A short sentence about your mission..."}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '8px',
                                        right: '12px',
                                        fontSize: '11px',
                                        color: formData.bio.length >= 100 ? '#ef4444' : '#94a3b8',
                                        fontWeight: '600'
                                    }}>
                                        {formData.bio.length} / 100
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label className="input-label">{isHindi ? 'शहर' : 'City'}</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                        <input
                                            name="city" value={formData.city} onChange={handleInputChange}
                                            className="form-control with-icon"
                                            placeholder={isHindi ? "शहर दर्ज करें" : "Enter city"}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{isHindi ? 'राज्य' : 'State'}</label>
                                    <input
                                        name="state" value={formData.state} onChange={handleInputChange}
                                        className="form-control"
                                        placeholder={isHindi ? "राज्य दर्ज करें" : "Enter state"}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="submit-btn"
                            >
                                <Save size={20} />
                                {isSaving ? (isHindi ? "सहेजा जा रहा है..." : "Saving...") : (isHindi ? "प्रोफ़ाइल सहेजें" : "Save Profile Details")}
                            </button>
                        </form>

                        {/* Mobile Only: View Full Digital Card (Share & Earn) Button before Danger Zone */}
                        <div className="mobile-view-card-banner">
                            <button
                                className="mobile-view-card-btn"
                                onClick={() => navigate(`/v/${user?.referralCode || user?.mobile}`)}
                            >
                                <span>{isHindi ? 'डिजिटल आईडी कार्ड देखें (Share & Earn)' : 'View Full Digital Card (Share & Earn)'}</span>

                            </button>
                        </div>

                        {/* ─── DANGER ZONE ──────────────────────────── */}
                        <div className="danger-zone-box">
                            <div className="danger-zone-header">
                                <AlertTriangle size={18} color="#e11d48" />
                                <span className="danger-zone-title">{isHindi ? 'खाता हटाएं (Danger Zone)' : 'Danger Zone'}</span>
                            </div>
                            <p className="danger-zone-desc">
                                {isHindi ? 'अपना खाता स्थायी रूप से हटाएं। इस कार्रवाई को पूर्ववत नहीं किया जा सकता।' : 'Permanently delete your account. This action cannot be undone.'}
                            </p>

                            {deleteStep === 'idle' && (
                                <button
                                    type="button"
                                    className="delete-account-trigger-btn"
                                    onClick={() => setDeleteStep('warning')}
                                >
                                    <Trash2 size={16} />
                                    {isHindi ? 'मेरा खाता हटाएं' : 'Delete My Account'}
                                </button>
                            )}

                            {deleteStep === 'warning' && (
                                <div className="delete-warning-panel">
                                    <div className="delete-impact-list">
                                        <div className="delete-impact-col delete-impact-col--red">
                                            <span className="delete-impact-label">{isHindi ? '🗑️ स्थायी रूप से हटाया जाएगा' : '🗑️ Permanently Deleted'}</span>
                                            <ul>
                                                <li>{isHindi ? 'प्रोफ़ाइल एवं लॉगिन एक्सेस' : 'Profile & login access'}</li>
                                                <li>{isHindi ? 'प्रिस्क्रिप्शन एवं मेडिकल रिकॉर्ड्स' : 'Prescriptions & medical records'}</li>
                                                <li>{isHindi ? 'सहेजे गए पते और सूचनाएं' : 'Saved addresses & notifications'}</li>
                                            </ul>
                                        </div>
                                        <div className="delete-impact-col delete-impact-col--amber">
                                            <span className="delete-impact-label">{isHindi ? '📋 कानूनी रिकॉर्ड के लिए रखा जाएगा' : '📋 Kept for Legal Records'}</span>
                                            <ul>
                                                <li>{isHindi ? 'दान इतिहास (80G रसीदें)' : 'Donation history (80G receipts)'}</li>
                                                <li>{isHindi ? 'कमीशन और लेन-देन रिकॉर्ड' : 'Commission & transaction records'}</li>
                                                <li>{isHindi ? 'ऑर्डर इतिहास' : 'Completed order history'}</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {deleteWallet > 0 && (
                                        <div className="delete-wallet-note">
                                            {isHindi ? <>💜 आपकी वॉलेट शेष राशि <strong>₹{deleteWallet}</strong> स्वतः फाउंडेशन को दान कर दी जाएगी।</> : <>💜 Your wallet balance of <strong>₹{deleteWallet}</strong> will be auto-donated to the Foundation.</>}
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label className="input-label">{isHindi ? 'खाता हटाने का कारण (वैकल्पिक)' : 'Reason for leaving (optional)'}</label>
                                        <textarea
                                            className="form-control"
                                            style={{ minHeight: 70, resize: 'vertical', fontSize: '0.9rem' }}
                                            placeholder={isHindi ? "बताएं क्यों..." : "Tell us why..."}
                                            value={deleteReason}
                                            onChange={e => setDeleteReason(e.target.value)}
                                            maxLength={200}
                                        />
                                    </div>

                                    {deleteBlocked && (
                                        <div className="delete-blocked-msg">
                                            <AlertTriangle size={16} /> {deleteBlocked}
                                        </div>
                                    )}

                                    <div className="delete-action-row">
                                        <button
                                            type="button"
                                            className="delete-cancel-btn"
                                            onClick={() => { setDeleteStep('idle'); setDeleteBlocked(null); setDeleteReason(''); }}
                                        >
                                            {isHindi ? 'रद्द करें' : 'Cancel'}
                                        </button>
                                        <button
                                            type="button"
                                            className="delete-otp-btn"
                                            onClick={handleSendDeleteOtp}
                                            disabled={isSendingDeleteOtp}
                                        >
                                            {isSendingDeleteOtp ? (isHindi ? 'भेजा जा रहा है...' : 'Sending...') : (isHindi ? 'पुष्टि के लिए ओटीपी भेजें' : 'Send OTP to Confirm')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {deleteStep === 'otp' && (
                                <div className="delete-otp-panel">
                                    <p className="delete-otp-hint">
                                        {isHindi ? <>ओटीपी <strong>{deleteMasked}</strong> पर व्हाट्सएप द्वारा भेजा गया है।</> : <>OTP sent to <strong>{deleteMasked}</strong> via WhatsApp.</>}
                                    </p>
                                    {deleteWallet > 0 && (
                                        <div className="delete-wallet-note">
                                            {isHindi ? <>⚠️ खाते हटाने पर वॉलेट बैलेंस <strong>₹{deleteWallet}</strong> फाउंडेशन को दान कर दिया जाएगा।</> : <>⚠️ Wallet balance of <strong>₹{deleteWallet}</strong> will be donated to Foundation upon deletion.</>}
                                        </div>
                                    )}
                                    <input
                                        type="number"
                                        className="delete-otp-input"
                                        placeholder={isHindi ? "6-अंकीय ओटीपी दर्ज करें" : "Enter 6-digit OTP"}
                                        value={deleteOtp}
                                        onChange={e => setDeleteOtp(e.target.value.slice(0, 6))}
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <div className="delete-action-row">
                                        <button
                                            type="button"
                                            className="delete-cancel-btn"
                                            onClick={() => { setDeleteStep('warning'); setDeleteOtp(''); }}
                                        >
                                            {isHindi ? '← वापस' : '← Back'}
                                        </button>
                                        <button
                                            type="button"
                                            className="delete-otp-btn"
                                            style={{ background: '#e11d48' }}
                                            onClick={handleConfirmDelete}
                                            disabled={isDeleting || deleteOtp.length !== 6}
                                        >
                                            <Trash2 size={14} />
                                            {isDeleting ? (isHindi ? 'हटाया जा रहा है...' : 'Deleting...') : (isHindi ? 'हां, मेरा खाता हटाएं' : 'Yes, Delete My Account')}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="delete-resend-btn"
                                        onClick={handleSendDeleteOtp}
                                        disabled={deleteCountdown > 0 || isSendingDeleteOtp}
                                    >
                                        <RefreshCw size={13} />
                                        {deleteCountdown > 0 ? (isHindi ? `${deleteCountdown}s में ओटीपी पुनः भेजें` : `Resend OTP in ${deleteCountdown}s`) : (isHindi ? 'ओटीपी पुनः भेजें' : 'Resend OTP')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Card Preview & Actions */}
                    <div className="preview-section" ref={previewContainerRef}>

                        {/* Desktop ID Card Display */}
                        <div className="card-outer-wrapper" style={{ height: `${(window.innerWidth >= 1024 ? 600 : (window.innerWidth < 650 ? 1200 : 1100)) * cardScale}px` }}>
                            <div className="card-inner-scale" style={{ transform: `scale(${cardScale})` }}>
                                <VolunteerCard userData={{ ...formData, mobile: user?.mobile, referralCode: user?.referralCode, createdAt: user?.createdAt }} cardRef={cardRef} />
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Hidden capture area for downloads - FORCED VERTICAL 950x1200 */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={downloadRef} className="download-capture-area" style={{ width: '950px', height: '1200px' }}>
                    <VolunteerCard
                        userData={{ ...formData, mobile: user?.mobile, referralCode: user?.referralCode, createdAt: user?.createdAt }}
                        forceVertical={true}
                    />
                </div>
            </div>

            <style>{`
                .profile-page {
                    width: 100%;
                    overflow-x: hidden;
                }
                .profile-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                    width: 100%;
                    box-sizing: border-box;
                    overflow-x: hidden;
                }
                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: none;
                    color: #64748b;
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 1.5rem;
                }
                .profile-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
                    gap: 2.5rem;
                    align-items: start;
                    width: 100%;
                }
                .form-section {
                    background: white;
                    border-radius: 24px;
                    padding: 2.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                    width: 100%;
                    box-sizing: border-box;
                    min-width: 0;
                }
                .section-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                .section-subtitle {
                    color: #64748b;
                }
                .profile-photo-preview {
                    width: 120px;
                    height: 140px;
                    border-radius: 16px;
                    background-color: #f1f5f9;
                    overflow: hidden;
                    border: 3px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .upload-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(255,255,255,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid #00bfa5;
                    border-top-color: transparent;
                    border-radius: 50%;
                }
                .upload-btn {
                    position: absolute;
                    bottom: -10px;
                    right: -10px;
                    background: #00bfa5;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .input-group {
                    margin-bottom: 1.5rem;
                }
                .input-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 0.5rem;
                }
                .form-control {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    border: 1px solid #cbd5e1;
                    outline: none;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .form-control.with-icon {
                    padding-left: 2.5rem;
                }
                .form-control.textarea {
                    min-height: 80px;
                }
                .form-control:focus {
                    border-color: #00bfa5 !important;
                    box-shadow: 0 0 0 4px rgba(0, 191, 165, 0.1);
                }
                .submit-btn {
                    width: 100%;
                    background: #00bfa5;
                    color: white;
                    padding: 1rem;
                    border-radius: 12px;
                    border: none;
                    font-size: 1rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.2s;
                }
                .submit-btn:active {
                    transform: scale(0.98);
                }

                .preview-section {
                    position: sticky;
                    top: 2rem;
                    width: 100%;
                    box-sizing: border-box;
                    min-width: 0;
                    overflow: hidden;
                }
                .preview-header {
                    margin-bottom: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .preview-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                }
                .preview-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .action-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .action-btn.download {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #00bfa5;
                }
                .action-btn.share {
                    background: #f0fdfa;
                    border: 1px solid #00bfa5;
                    color: #00bfa5;
                }
                
                .public-link-box {
                    width: 100%;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1.5rem;
                }
                .link-label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .link-display {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .link-url {
                    font-size: 0.85rem;
                    color: #1e293b;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .copy-icon-btn {
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 4px;
                    border-radius: 6px;
                    color: #00bfa5;
                    cursor: pointer;
                    display: flex;
                }
                .copy-icon-btn:hover {
                    background: #f0fdfa;
                }
                
                .card-outer-wrapper {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }
                .card-inner-scale {
                    transform-origin: top center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    border-radius: 24px;
                    width: 950px;
                    flex-shrink: 0;
                    transform: scale(1);
                }

                .guidelines-box {
                    background: #fffbeb;
                    border: 1px solid #fcd34d;
                    border-radius: 16px;
                    padding: 1.25rem;
                    margin-top: 1rem;
                }
                .guide-title {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #92400e;
                    margin-bottom: 4px;
                }
                .guide-text {
                    font-size: 0.85rem;
                    color: #b45309;
                    line-height: 1.4;
                    margin: 0;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                /* Responsive Logic */
                @media (max-width: 992px) {
                    .profile-grid {
                        grid-template-columns: minmax(0, 1fr);
                    }
                    .preview-section {
                        position: static;
                        order: -1; 
                        margin-bottom: 2rem;
                        background: white;
                        padding: 1.5rem;
                        border-radius: 24px;
                        border: 1px solid #e2e8f0;
                        overflow-x: hidden;
                    }
                }

                @media (max-width: 640px) {
                    .profile-container {
                        padding: 0.5rem;
                    }
                    .form-section {
                        padding: 1.25rem;
                        border-radius: 16px;
                    }
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    .preview-section {
                        padding: 1.25rem;
                        border-radius: 16px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                    }
                    .preview-header {
                        width: 100%;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 1rem;
                    }
                    .preview-actions {
                        width: 100%;
                        justify-content: center;
                        gap: 0.5rem;
                    }
                    .action-btn {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.8rem;
                    }
                    .section-title {
                        font-size: 1.3rem;
                    }
                    .submit-btn {
                        margin-bottom: 2rem;
                    }
                }

                @media (max-width: 480px) {
                    .profile-container {
                        padding: 0.25rem;
                    }
                    .preview-section {
                        padding: 0.5rem;
                    }
                    .guidelines-box {
                        padding: 1rem;
                    }
                }

                /* ── Danger Zone ─────────────────────────────── */
                .danger-zone-box {
                    margin-top: 2rem;
                    background: #fff5f5;
                    border: 1.5px solid #fecdd3;
                    border-radius: 16px;
                    padding: 1.5rem;
                }
                .danger-zone-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }
                .danger-zone-title {
                    font-size: 1rem;
                    font-weight: 800;
                    color: #e11d48;
                }
                .danger-zone-desc {
                    font-size: 0.875rem;
                    color: #9f1239;
                    margin: 0 0 1rem 0;
                    line-height: 1.5;
                }
                .delete-account-trigger-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0.6rem 1.25rem;
                    background: white;
                    border: 1.5px solid #e11d48;
                    border-radius: 10px;
                    color: #e11d48;
                    font-size: 0.875rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.18s ease;
                }
                .delete-account-trigger-btn:hover {
                    background: #fff0f3;
                }
                .delete-warning-panel, .delete-otp-panel {
                    margin-top: 0.5rem;
                }
                .delete-impact-list {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 1rem;
                }
                @media (max-width: 640px) {
                    .delete-impact-list { grid-template-columns: 1fr; }
                }
                .delete-impact-col {
                    border-radius: 10px;
                    padding: 12px;
                    font-size: 0.8rem;
                }
                .delete-impact-col--red {
                    background: #fff0f3;
                    border: 1px solid #fecdd3;
                }
                .delete-impact-col--amber {
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                }
                .delete-impact-label {
                    display: block;
                    font-weight: 700;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    margin-bottom: 8px;
                    color: #475569;
                }
                .delete-impact-col ul {
                    padding-left: 16px;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .delete-impact-col li {
                    color: #64748b;
                    line-height: 1.5;
                }
                .delete-wallet-note {
                    background: #f5f3ff;
                    border: 1px solid #ddd6fe;
                    border-radius: 10px;
                    padding: 10px 14px;
                    font-size: 0.85rem;
                    color: #5b21b6;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }
                .delete-blocked-msg {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    background: #fff0f3;
                    border: 1px solid #fecdd3;
                    border-radius: 10px;
                    padding: 10px 14px;
                    font-size: 0.85rem;
                    color: #9f1239;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }
                .delete-action-row {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 1rem;
                }
                .delete-cancel-btn {
                    padding: 0.6rem 1.25rem;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    color: #64748b;
                    font-size: 0.875rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .delete-cancel-btn:hover { background: #e2e8f0; }
                .delete-otp-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0.6rem 1.25rem;
                    background: #dc2626;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s;
                    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
                }
                .delete-otp-btn:hover:not(:disabled) { background: #b91c1c; }
                .delete-otp-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
                .delete-otp-hint {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0 0 1rem 0;
                    line-height: 1.6;
                }
                .delete-otp-input {
                    width: 100%;
                    padding: 0.85rem 1rem;
                    border: 2px solid #e11d48;
                    border-radius: 12px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    text-align: center;
                    letter-spacing: 8px;
                    color: #1e293b;
                    outline: none;
                    box-sizing: border-box;
                    margin-bottom: 0.5rem;
                    transition: box-shadow 0.2s;
                }
                .delete-otp-input:focus {
                    box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.1);
                }
                .delete-resend-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    width: 100%;
                    margin-top: 10px;
                    background: none;
                    border: none;
                    color: #00bfa5;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    padding: 8px;
                }
                .delete-resend-btn:disabled { color: #94a3b8; cursor: not-allowed; }

                .mobile-view-card-banner {
                    display: none;
                    margin-top: 24px;
                    margin-bottom: 20px;
                }

                .mobile-view-card-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #00bf9a 0%, #00897b 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 16px;
                    padding: 15px 18px;
                    font-size: 15px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    box-shadow: 0 4px 14px rgba(0, 191, 154, 0.25);
                    transition: transform 0.2s ease;
                }

                .mobile-view-card-btn:hover {
                    transform: translateY(-1px);
                }

                @media (max-width: 768px) {
                    .preview-section {
                        display: none !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .card-outer-wrapper {
                        display: none !important;
                    }
                    .mobile-view-card-banner {
                        display: block !important;
                    }
                }

            `}</style>

        </div>
    );
};

export default UserProfile;
