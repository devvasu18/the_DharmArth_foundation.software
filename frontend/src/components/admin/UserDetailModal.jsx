import React, { useEffect } from 'react';
import { X, User, Phone, Mail, Wallet, Calendar, Shield, Link as LinkIcon } from 'lucide-react';

const UserDetailModal = ({ user, onClose }) => {
    // Prevent scrolling on background when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            background: '#3182ce', color: 'white',
                            width: '40px', height: '40px',
                            borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#2d3748' }}>{user.name}</h3>
                            <span style={{ fontSize: '0.85rem', color: '#718096' }}>User Details</span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#a0aec0', padding: '5px', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                        onMouseEnter={e => e.target.style.background = '#edf2f7'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '2rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

                        {/* Contact Info Section */}
                        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                            <h5 style={{ marginTop: 0, marginBottom: '1rem', color: '#4a5568', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                Contact Information
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <InfoItem icon={<Phone size={16} />} label="Mobile Number" value={user.mobile} />
                                <InfoItem icon={<Mail size={16} />} label="Email Address" value={user.email || 'Not Provided'} />
                                <InfoItem icon={<Shield size={16} />} label="Language" value={user.language === 'en' ? 'English' : 'Hindi'} />
                            </div>
                        </div>

                        {/* Account Stats Section */}
                        <div style={{ background: '#ebf8ff', borderRadius: '8px', border: '1px solid #bee3f8', padding: '1rem' }}>
                            <h5 style={{ marginTop: 0, marginBottom: '1rem', color: '#2c5282', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                Account Status
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <InfoItem icon={<Wallet size={16} />} label="Wallet Balance" value={`₹${user.walletBalance?.toLocaleString() || 0}`} valueStyle={{ color: '#2b6cb0', fontWeight: 'bold' }} />
                                <InfoItem
                                    icon={<LinkIcon size={16} />}
                                    label="Referred By"
                                    value={
                                        user.referredBy
                                            ? `${user.referredBy.name} (${user.referredBy.mobile})`
                                            : user.lastMotivatorMobile
                                                ? `${user.lastMotivatorName || ''} (${user.lastMotivatorMobile})`.trim()
                                                : 'Direct Join'
                                    }
                                />
                                <InfoItem icon={<Calendar size={16} />} label="Joined On" value={formatDate(user.createdAt)} />
                                <InfoItem icon={<Calendar size={16} />} label="Last Updated" value={formatDate(user.updatedAt)} />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button className="btn bg-primary text-white" onClick={onClose} style={{ padding: '8px 24px' }}>
                        Close
                    </button>
                </div>

            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

const InfoItem = ({ icon, label, value, valueStyle = {} }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#718096', fontSize: '0.85rem' }}>
            {icon}
            <span>{label}</span>
        </div>
        <div style={{ color: '#2d3748', fontWeight: 500, paddingLeft: '22px', ...valueStyle }}>
            {value}
        </div>
    </div>
);

export default UserDetailModal;
