import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import VolunteerCard from '../components/user/VolunteerCard';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Share2, Download, Heart, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicVolunteerCard = () => {
    const { referralCode } = useParams();
    const navigate = useNavigate();
    const [volunteer, setVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <LoadingSpinner />;
    if (!volunteer) return null;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <Navbar />
            
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1rem', textAlign: 'center' }}>
                
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '8px', 
                        background: '#e6fffa', color: '#00bfa5', padding: '8px 16px', 
                        borderRadius: '99px', fontSize: '0.85rem', fontWeight: 800, 
                        textTransform: 'uppercase', marginBottom: '1.5rem' 
                    }}>
                        <ShieldCheck size={16} /> Verified Volunteer
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>
                        {volunteer.name}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
                        Supporting The DharmArth Foundation in our mission to spread humanity and hope.
                    </p>
                </div>

                {/* Card Display */}
                <div style={{ 
                    display: 'flex', justifyContent: 'center', 
                    marginBottom: '3rem', perspective: '1000px'
                }}>
                    <div style={{ 
                        transform: 'rotateX(5deg) rotateY(-5deg)',
                        transition: 'transform 0.5s ease'
                    }}>
                        <VolunteerCard userData={volunteer} />
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => navigate(`/donate?ref=${volunteer.referralCode}`)}
                        style={{ 
                            background: '#00bfa5', color: 'white', padding: '1rem 2rem', 
                            borderRadius: '16px', border: 'none', fontSize: '1.1rem', 
                            fontWeight: 800, cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(0, 191, 165, 0.4)'
                        }}
                    >
                        <Heart size={20} fill="white" /> Support Through This Volunteer
                    </button>
                    
                    <button 
                        onClick={() => {
                            navigator.share({
                                title: `Meet ${volunteer.name} - Volunteer`,
                                text: `Check out the verified volunteer profile of ${volunteer.name} at The DharmArth Foundation.`,
                                url: window.location.href
                            }).catch(() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Link copied to clipboard!");
                            });
                        }}
                        style={{ 
                            background: 'white', color: '#1e293b', padding: '1rem 2rem', 
                            borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1.1rem', 
                            fontWeight: 700, cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', gap: '10px'
                        }}
                    >
                        <Share2 size={20} /> Share Profile
                    </button>
                </div>

                <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid #e2e8f0' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ 
                            background: 'none', border: 'none', color: '#64748b', 
                            fontWeight: 700, cursor: 'pointer', display: 'flex', 
                            alignItems: 'center', gap: '8px', margin: '0 auto' 
                        }}
                    >
                        <ArrowLeft size={18} /> Back to Foundation Home
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PublicVolunteerCard;
