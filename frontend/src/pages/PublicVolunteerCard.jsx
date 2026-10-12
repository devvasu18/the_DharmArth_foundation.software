import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SEO from '../components/common/SEO';
import { ArrowLeft, Copy, Check, Phone, MapPin, Calendar, ShieldCheck, Share2, Info, Heart, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './PublicVolunteerCard.css';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';

const WhatsAppIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.552 4.107 1.517 5.834L0 24l6.326-1.485A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.579-.496-5.074-1.362l-.364-.21-3.766.883.896-3.666-.234-.373A9.957 9.957 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" />
    </svg>
);

const PublicVolunteerCard = () => {
    const { referralCode } = useParams();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const [volunteer, setVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const isHindi = i18n.language?.startsWith('hi');

    useEffect(() => {
        const fetchVolunteer = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/users/v/${referralCode}`);
                setVolunteer(data);
            } catch (err) {
                console.error("Failed to fetch volunteer", err);
                toast.error(isHindi ? "स्वयंसेवक प्रोफ़ाइल नहीं मिली" : "Volunteer profile not found");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchVolunteer();
    }, [referralCode, navigate, isHindi]);

    if (loading) return <LoadingSpinner />;
    if (!volunteer) return null;

    const isOwner = Boolean(
        user && volunteer && (
            (user._id && volunteer._id && String(user._id) === String(volunteer._id)) ||
            (user.referralCode && volunteer.referralCode && user.referralCode.toUpperCase() === volunteer.referralCode.toUpperCase()) ||
            (user.mobile && volunteer.mobile && user.mobile === volunteer.mobile)
        )
    );

    const fullShareUrl = `https://thedharmarth.com/v/${volunteer.referralCode || volunteer.mobile || referralCode}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(fullShareUrl);
        setCopied(true);
        toast.success(isHindi ? 'शेयरिंग लिंक कॉपी हो गया!' : 'Sharing link copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleWhatsAppShare = () => {
        const message = isHindi
            ? `नमस्ते! मैं द धर्मार्थ मेडिकल फाउंडेशन के साथ मिशन पार्टनर के रूप में जुड़ा हूँ। मेरे डिजिटल आईडी कार्ड को देखने और सामाजिक कार्य में सहयोग करने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n${fullShareUrl}`
            : `Hello! I am a Mission Partner with The Dharmarth Medical Foundation. Click the link below to view my verified digital ID card:\n${fullShareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShareMore = () => {
        if (navigator.share) {
            navigator.share({
                title: `${volunteer.name} - Dharmarth Mission Partner`,
                text: `View ${volunteer.name}'s verified volunteer digital card`,
                url: fullShareUrl
            }).catch(() => { });
        } else {
            handleCopyLink();
        }
    };

    const handleDonateClick = () => {
        const motivatorCode = volunteer.referralCode || volunteer.mobile || referralCode;
        navigate(`/donate?motivator=${encodeURIComponent(motivatorCode)}`);
    };

    return (
        <>
            <SEO
                title={`${volunteer.name} - Dharmarth Volunteer Profile`}
                description={`Verified Volunteer Profile of ${volunteer.name} at The Dharmarth Medical Foundation Sujangarh.`}
            />
            <Navbar />
            <div className="share-earn-page">
                {/* Mobile Header Bar */}
                <div className="mobile-share-header-bar">
                    <button className="header-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="header-title-text">
                        {isOwner
                            ? (isHindi ? 'साझा करें और कमाएं' : 'Share & Earn')
                            : (isHindi ? 'स्वयंसेवक प्रोफ़ाइल' : 'Volunteer Profile')}
                    </h2>
                    <div style={{ width: 40 }} />
                </div>

                <div className="container main-share-container">
                    {/* Header Title Section */}
                    <div className="share-page-header">
                        <h1 className="share-title">
                            {isOwner
                                ? (isHindi ? 'आपकी डिजिटल पहचान' : 'Your Digital Identity')
                                : (isHindi ? 'सत्यापित स्वयंसेवक प्रोफ़ाइल' : 'Verified Volunteer Profile')}
                        </h1>
                        <p className="share-subtitle">
                            {isOwner
                                ? (isHindi
                                    ? 'अपने नेटवर्क को बढ़ाने और प्रोत्साहन कमाने के लिए अपनी सत्यापित स्वयंसेवक प्रोफ़ाइल साझा करें।'
                                    : 'Share your verified volunteer profile to grow your network and earn commissions.')
                                : (isHindi
                                    ? `${volunteer.name} द धर्मार्थ मेडिकल फाउंडेशन के साथ सत्यापित मिशन पार्टनर हैं।`
                                    : `${volunteer.name} is a verified Mission Partner with The Dharmarth Medical Foundation.`)}
                        </p>
                    </div>

                    {/* ID Card Box (Image 1 style) */}
                    <div className="share-id-card">
                        {/* Top Teal Header */}
                        <div className="id-card-top-teal">
                            <div className="id-photo-wrapper">
                                <img
                                    src={volunteer.profileImage || DEFAULT_AVATAR}
                                    alt={volunteer.name}
                                    className="id-photo-img"
                                />
                            </div>
                            <div className="id-brand-title-box">
                                <h2 className="id-brand-name">The DharmArth</h2>
                                <span className="id-brand-sub">MEDICAL FOUNDATION</span>
                            </div>
                        </div>

                        {/* Bottom White Details */}
                        <div className="id-card-bottom-white">
                            <div className="id-name-row">
                                <div className="name-role-group">
                                    <h3 className="id-user-name">{volunteer.name}</h3>
                                    <span className="id-user-role">
                                        {volunteer.work ? volunteer.work.toUpperCase() : 'SOCIAL ENTREPRENEURS'}
                                    </span>
                                </div>
                                <div className="volunteer-id-badge">
                                    <span className="vol-id-label">VOLUNTEER ID</span>
                                    <span className="vol-id-value">{volunteer.referralCode || volunteer.mobile}</span>
                                </div>
                            </div>

                            {/* Quote */}
                            <p className="id-user-quote">
                                "{volunteer.bio || (isHindi
                                    ? 'मेरे जीवन का उद्देश्य : कम खर्च में बेहतर दवा, बेहतर जांच, बेहतर परामर्श और बेहतर शिक्षा'
                                    : 'My mission: Affordable medicines, accurate diagnostics, quality care, and healthcare for all.')}"
                            </p>

                            {/* 4 Metadata Grid */}
                            <div className="id-info-grid">
                                <div className="id-info-item">
                                    <Phone size={16} className="info-icon" />
                                    <div className="info-text-group">
                                        <span className="info-label">CONTACT</span>
                                        <span className="info-val">{volunteer.mobile || '8306305569'}</span>
                                    </div>
                                </div>

                                <div className="id-info-item">
                                    <MapPin size={16} className="info-icon" />
                                    <div className="info-text-group">
                                        <span className="info-label">LOCATION</span>
                                        <span className="info-val">
                                            {volunteer.city ? `${volunteer.city}, ${volunteer.state || 'Rajasthan'}` : 'Sujangarh , Rajasthan'}
                                        </span>
                                    </div>
                                </div>

                                <div className="id-info-item">
                                    <Calendar size={16} className="info-icon" />
                                    <div className="info-text-group">
                                        <span className="info-label">VERIFIED</span>
                                        <span className="info-val">
                                            {volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Jul 2026'}
                                        </span>
                                    </div>
                                </div>

                                <div className="id-info-item">
                                    <ShieldCheck size={16} className="info-icon" />
                                    <div className="info-text-group">
                                        <span className="info-label">STATUS</span>
                                        <span className="info-val status-active">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isOwner ? (
                        <>
                            {/* Section 2: Unique Sharing Link */}
                            <div className="share-section-box">
                                <span className="section-label-small">
                                    {isHindi ? 'आपका अनूठा शेयरिंग लिंक' : 'YOUR UNIQUE SHARING LINK'}
                                </span>
                                <div className="share-link-input-wrapper">
                                    <input
                                        type="text"
                                        readOnly
                                        value={fullShareUrl}
                                        className="share-link-input"
                                    />
                                    <button className="copy-icon-btn" onClick={handleCopyLink} title="Copy link">
                                        {copied ? <Check size={18} color="#00bf9a" /> : <Copy size={18} color="#00bf9a" />}
                                    </button>
                                </div>

                                {/* WhatsApp & Share More Buttons */}
                                <div className="share-btns-row">
                                    <button className="btn-share-whatsapp" onClick={handleWhatsAppShare}>
                                        <WhatsAppIcon />
                                        <span>WhatsApp</span>
                                    </button>
                                    <button className="btn-share-more" onClick={handleShareMore}>
                                        <Share2 size={18} />
                                        <span>{isHindi ? 'और साझा करें' : 'Share More'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section 3: Your Impact */}
                            <div className="share-section-box">
                                <span className="section-label-small">
                                    {isHindi ? 'आपका प्रभाव' : 'YOUR IMPACT'}
                                </span>
                                <div className="impact-card-box">
                                    <div className="impact-stat-item">
                                        <h3 className="impact-number">{volunteer.referralCount || 0}</h3>
                                        <span className="impact-label">{isHindi ? 'रेफरल' : 'Referrals'}</span>
                                    </div>
                                    <div className="impact-divider"></div>
                                    <div className="impact-stat-item">
                                        <h3 className="impact-number green">₹{volunteer.totalEarnings || 0}</h3>
                                        <span className="impact-label">{isHindi ? 'कमाए' : 'Earned'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: How it works? */}
                            <div className="how-it-works-box">
                                <div className="how-it-works-icon-circle">
                                    <Info size={18} color="#00bf9a" />
                                </div>
                                <div className="how-it-works-text">
                                    <h4 className="how-title">{isHindi ? 'यह कैसे काम करता है?' : 'How it works?'}</h4>
                                    <p className="how-desc">
                                        {isHindi
                                            ? 'जब कोई आपके लिंक पर क्लिक करता है और दान करता है, तो वे स्वचालित रूप से आपके नेटवर्क में जुड़ जाते हैं। आप अपने लिंक से किए गए प्रत्येक सफल दान पर सेवा प्रोत्साहन राशि कमाते हैं!'
                                            : 'When someone clicks your link and makes a donation, they are automatically added to your network. You earn Service Support Incentive on every successful donation made through your link!'}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="public-visitor-actions">
                            <button className="btn-donate-now-red" onClick={handleDonateClick}>
                                <Heart size={20} className="btn-icon" />
                                <span>{isHindi ? 'अभी दान करें' : 'Donate Now'}</span>
                            </button>
                            <button className="btn-go-home" onClick={() => navigate('/')}>
                                <Home size={20} className="btn-icon" />
                                <span>{isHindi ? 'मुख्य पृष्ठ पर जाएं' : 'Go to Home'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PublicVolunteerCard;

