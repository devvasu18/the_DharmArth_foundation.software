import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import VolunteerCard from '../components/user/VolunteerCard';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Share2, Heart, ArrowLeft, ShieldCheck, ExternalLink, Info, Award, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicVolunteerCard = () => {
    const { referralCode } = useParams();
    const navigate = useNavigate();
    const [volunteer, setVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cardScale, setCardScale] = useState(1);

    useEffect(() => {
        const fetchVolunteer = async () => {
            try {
                const { data } = await api.get(`/users/v/${referralCode}`);
                setVolunteer(data);
            } catch (err) {
                toast.error("Volunteer profile not found");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchVolunteer();
    }, [referralCode, navigate]);

    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            // Accounting for content-container padding and glass-container padding with extra breathing room
            const horizontalPadding = width < 640 ? 100 : 120;
            if (width >= 1024) {
                setCardScale(Math.min(1, (width - horizontalPadding) / 1000));
            } else if (width < 980) {
                setCardScale((width - horizontalPadding) / 850);
            } else {
                setCardScale(1);
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    if (loading) return <LoadingSpinner />;
    if (!volunteer) return null;

    const shareUrl = window.location.href;

    return (
        <div className="public-profile-page">
            <Navbar />

            <div className="main-content">
                {/* Hero Section */}
                <div className="hero-bg"></div>

                <div className="content-container">
                    {/* Header Info */}
                    <div className="profile-header">


                        <p className="foundation-mission">
                            Official Volunteer at <strong>The DharmArth Foundation</strong>
                        </p>
                    </div>

                    {/* ID Card Card */}
                    <div className="card-section">
                        <div className="glass-container">
                            <div style={{
                                width: `${(window.innerWidth >= 1024 ? 1000 : 850) * cardScale}px`,
                                height: `${(window.innerWidth >= 1024 ? 600 : (window.innerWidth < 650 ? 1100 : 1000)) * cardScale}px`,
                                position: 'relative'
                            }}>
                                <div className="card-wrapper" style={{
                                    width: window.innerWidth >= 1024 ? '1000px' : '850px',
                                    height: window.innerWidth >= 1024 ? '600px' : (window.innerWidth < 650 ? '1100px' : '1000px'),
                                    transform: `scale(${cardScale})`,
                                    transformOrigin: 'top left'
                                }}>
                                    <VolunteerCard userData={volunteer} />
                                </div>
                            </div>
                        </div>

                        <div className="trust-badges">
                            <div className="trust-item">
                                <Award size={20} />
                                <span>Official ID</span>
                            </div>
                            <div className="trust-item">
                                <ShieldCheck size={20} />
                                <span>Secured Portal</span>
                            </div>
                            <div className="trust-item">
                                <Users size={20} />
                                <span>Community Trust</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="action-card">
                        <div className="action-content">
                            <Heart size={40} className="heart-icon" />
                            <h2>Support My Cause</h2>
                            <p>
                                I am volunteering to help The DharmArth Foundation raise funds for healthcare, education, and social welfare. Every contribution matters.
                            </p>

                            <button
                                onClick={() => navigate(`/donate?ref=${volunteer.referralCode || volunteer.mobile}`)}
                                className="donate-primary-btn"
                            >
                                <Heart size={20} fill="white" />
                                <span>Donate Now via My Link</span>
                            </button>

                            <div className="social-actions">
                                <button
                                    className="secondary-action-btn"
                                    onClick={() => {
                                        navigator.share({
                                            title: `Verified Volunteer: ${volunteer.name}`,
                                            text: `Support The DharmArth Foundation through ${volunteer.name}'s verified profile.`,
                                            url: shareUrl
                                        }).catch(() => {
                                            navigator.clipboard.writeText(shareUrl);
                                            toast.success("Profile link copied!");
                                        });
                                    }}
                                >
                                    <Share2 size={18} />
                                    <span>Share Profile</span>
                                </button>
                                <button className="secondary-action-btn" onClick={() => navigate('/')}>
                                    <ExternalLink size={18} />
                                    <span>Foundation Home</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Foundation Info */}
                    <div className="foundation-info-box">
                        <div className="info-header">
                            <Info size={20} />
                            <h3>About The DharmArth Foundation</h3>
                        </div>
                        <p>
                            The DharmArth Foundation is dedicated to empowering communities through transparent and impactful social initiatives. By donating through this verified volunteer, you ensure that your contribution goes directly towards our ongoing humanitarian projects.
                        </p>
                        <div className="back-link">
                            <button onClick={() => navigate('/')}>
                                <ArrowLeft size={16} /> Back to main website
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .public-profile-page {
                    background: #f8fafc;
                    min-height: 100vh;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                .main-content {
                    position: relative;
                    padding-bottom: 5rem;
                }
                .hero-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 400px;
                    background: linear-gradient(135deg, #00bfa5 0%, #00897b 100%);
                    z-index: 0;
                }
                .content-container {
                    position: relative;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 4rem 1.5rem;
                    z-index: 1;
                    transition: max-width 0.3s ease;
                }
                @media (min-width: 1024px) {
                    .content-container {
                        max-width: 1250px;
                    }
                }
                .profile-header {
                    text-align: center;
                    color: white;
                    margin-bottom: 3rem;
                }
                .verified-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(8px);
                    padding: 8px 16px;
                    border-radius: 99px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .volunteer-name {
                    font-size: 3rem;
                    font-weight: 900;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }
                .foundation-mission {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                
                .card-section {
                    margin-bottom: 3rem;
                }
                .glass-container {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    padding: 3rem 2.5rem;
                    border-radius: 32px;
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                .card-wrapper {
                    width: 650px;
                    flex-shrink: 0;
                }
                
                .trust-badges {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    flex-wrap: wrap;
                }
                .trust-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #475569;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .trust-item svg {
                    color: #00bfa5;
                }

                .action-card {
                    background: white;
                    border-radius: 32px;
                    padding: 3rem 2rem;
                    text-align: center;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e2e8f0;
                    margin-bottom: 3rem;
                }
                .heart-icon {
                    color: #f43f5e;
                    margin-bottom: 1rem;
                }
                .action-card h2 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 1rem;
                }
                .action-card p {
                    color: #64748b;
                    line-height: 1.6;
                    max-width: 500px;
                    margin: 0 auto 2.5rem;
                }
                .donate-primary-btn {
                    background: #00bfa5;
                    color: white;
                    width: 100%;
                    max-width: 400px;
                    padding: 1.25rem;
                    border-radius: 20px;
                    border: none;
                    font-size: 1.25rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 191, 165, 0.3);
                    transition: all 0.3s ease;
                    margin: 0 auto 2rem;
                }
                .donate-primary-btn:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 25px 30px -5px rgba(0, 191, 165, 0.4);
                }
                .social-actions {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .secondary-action-btn {
                    background: #f8fafc;
                    color: #1e293b;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .secondary-action-btn:hover {
                    background: #f1f5f9;
                }

                .foundation-info-box {
                    padding: 2rem;
                    background: #f1f5f9;
                    border-radius: 24px;
                }
                .info-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 1rem;
                    color: #334155;
                }
                .info-header h3 {
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin: 0;
                }
                .foundation-info-box p {
                    font-size: 0.95rem;
                    color: #475569;
                    line-height: 1.7;
                    margin-bottom: 2rem;
                }
                .back-link button {
                    background: none;
                    border: none;
                    color: #00bfa5;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                @media (max-width: 640px) {
                    .volunteer-name {
                        font-size: 2.25rem;
                    }
                    .hero-bg {
                        height: 350px;
                    }
                    .glass-container {
                        padding: 3rem 1.5rem;
                        border-radius: 24px;
                    }
                    .action-card {
                        padding: 2rem 1rem;
                    }
                    .trust-badges {
                        gap: 1rem;
                    }
                }

                @media (min-width: 1024px) {
                    .glass-container {
                        padding: 4rem 5rem;
                        border-radius: 40px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PublicVolunteerCard;
