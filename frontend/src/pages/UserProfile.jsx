import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Phone, Briefcase, Info, MapPin, Camera, Save, Download, Share2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import VolunteerCard from '../components/user/VolunteerCard';
const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';



const UserProfile = () => {
    const { user, setUser, refreshUser } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const cardRef = useRef(null);

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
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
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
                width: window.innerWidth >= 1024 ? 1000 : 850,
                height: window.innerWidth >= 1024 ? 600 : (window.innerWidth < 650 ? 1100 : 1000),
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
                // The card is 1000px wide on desktop, 850px on mobile
                const baselineWidth = window.innerWidth >= 1024 ? 1000 : 850;
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
                            <h1 className="section-title">My Identity Profile</h1>
                            <p className="section-subtitle">Complete your profile to generate your official Volunteer ID Card.</p>
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
                                    <label className="input-label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                        <input
                                            name="name" value={formData.name} onChange={handleInputChange}
                                            className="form-control with-icon"
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                        <input
                                            name="email" value={formData.email} onChange={handleInputChange}
                                            className="form-control with-icon"
                                            placeholder="Enter email"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">Work / Profession</label>
                                <div style={{ position: 'relative' }}>
                                    <Briefcase style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                    <input
                                        name="work" value={formData.work} onChange={handleInputChange}
                                        className="form-control with-icon"
                                        placeholder="e.g. Software Engineer, Social Worker"
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="input-label">Bio / Vision</label>
                                <div style={{ position: 'relative' }}>
                                    <Info style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} size={18} />
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        maxLength={100}
                                        className="form-control with-icon textarea"
                                        placeholder="A short sentence about your mission..."
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
                                    <label className="input-label">City</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                        <input
                                            name="city" value={formData.city} onChange={handleInputChange}
                                            className="form-control with-icon"
                                            placeholder="Enter city"
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">State</label>
                                    <input
                                        name="state" value={formData.state} onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Enter state"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="submit-btn"
                            >
                                <Save size={20} />
                                {isSaving ? "Saving..." : "Save Profile Details"}
                            </button>
                        </form>
                    </div>

                    {/* Right Side: Card Preview & Actions */}
                    <div className="preview-section" ref={previewContainerRef}>
                        <div className="preview-header">

                            <div className="preview-actions">
                                <button onClick={downloadCard} className="action-btn download">
                                    <Download size={16} /> Download
                                </button>

                            </div>
                        </div>

                        <div className="public-link-box">
                            <span className="link-label">Your Public Volunteer Page:</span>
                            <div className="link-display">
                                <span className="link-url">{window.location.origin}/v/{user?.referralCode || user?.mobile}</span>
                                <button className="copy-icon-btn" onClick={handleShare}>
                                    <Share2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* ID Card Display */}
                        <div className="card-outer-wrapper" style={{ height: `${(window.innerWidth >= 1024 ? 600 : (window.innerWidth < 650 ? 1100 : 1000)) * cardScale}px` }}>
                            <div className="card-inner-scale" style={{ transform: `scale(${cardScale})` }}>
                                <VolunteerCard userData={{ ...formData, mobile: user?.mobile, referralCode: user?.referralCode, createdAt: user?.createdAt }} cardRef={cardRef} />
                            </div>
                        </div>

                        <div className="guidelines-box">
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Info style={{ color: '#d97706', flexShrink: 0 }} size={20} />
                                <div>
                                    <p className="guide-title">Digital ID Guidelines</p>
                                    <p className="guide-text">
                                        Use a clear, passport-style photo for better recognition. This ID card can be shared digitally to build trust with donors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Hidden capture area for downloads - NOT scaled, absolute positioned off-screen */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={downloadRef} className="download-capture-area" style={{ 
                    width: window.innerWidth >= 1024 ? '1000px' : '850px', 
                    height: window.innerWidth >= 1024 ? '600px' : (window.innerWidth < 650 ? '1100px' : '1000px') 
                }}>
                    <VolunteerCard userData={{ ...formData, mobile: user?.mobile, referralCode: user?.referralCode, createdAt: user?.createdAt }} />
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
                    width: 1000px;
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

            `}</style>
        </div>
    );
};

export default UserProfile;
