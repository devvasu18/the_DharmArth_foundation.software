import React from 'react';
import { Mail, Phone, MapPin, Award, ShieldCheck, QrCode, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';



const VolunteerCard = ({ userData, cardRef }) => {
    const { t } = useTranslation();
    const [cardHeight, setCardHeight] = React.useState(window.innerWidth < 650 ? '1100px' : '1000px');

    React.useEffect(() => {
        const handleResize = () => {
            setCardHeight(window.innerWidth < 650 ? '1100px' : '1000px');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fallback values
    const name = userData?.name || 'Your Name';
    const mobile = userData?.mobile || '0000000000';
    const work = userData?.work || 'Volunteer';
    const bio = userData?.bio || 'Dedicated to supporting humanity and spreading kindness through The DharmArth Foundation.';
    const location = userData?.city ? `${userData.city}, ${userData.state || ''}` : 'India';
    const referralCode = userData?.referralCode || 'DF0000';
    const profileImage = userData?.profileImage || DEFAULT_AVATAR_URL;
    const joinedDate = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026';

    const isMobileView = cardHeight === '700px';

    const cardStyles = {
        container: {
            width: '850px',
            maxWidth: '850px',
            height: cardHeight,
            background: 'white',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            fontFamily: "'Outfit', 'Inter', sans-serif",
            margin: '0 auto',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased'
        },
        leftPane: {
            width: '100%',
            background: 'linear-gradient(135deg, #00bfa5 0%, #00897b 100%)',
            padding: '30px 40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            position: 'relative'
        },
        photoWrapper: {
            width: '180px',
            height: '220px',
            borderRadius: '16px',
            border: '4px solid rgba(255,255,255,0.4)',
            overflow: 'hidden',
            backgroundColor: '#f1f5f9',
            marginBottom: '0',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        },
        photo: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        },
        badge: {
            background: 'white',
            color: '#000',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        rightPane: {
            width: '100%',
            padding: '40px 50px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            flexGrow: 1
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: isMobileView ? '40px' : '25px'
        },
        logoArea: {
            display: 'flex',
            flexDirection: 'column'
        },
        foundationName: {
            fontSize: '40px',
            fontWeight: 900,
            color: '#00bfa5',
            letterSpacing: '0'
        },
        tagline: {
            fontSize: '22px',
            color: '#64748b',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginTop: '2px'
        },
        userInfo: {
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isMobileView ? 'center' : 'flex-start'
        },
        userName: {
            fontSize: '60px',
            fontWeight: 800,
            color: '#000000',
            marginBottom: '12px',
            lineHeight: 1
        },
        userWork: {
            fontSize: '34px',
            fontWeight: 700,
            color: '#00bfa5',
            marginBottom: '30px',
            textTransform: 'uppercase'
        },
        userBio: {
            fontSize: '26px',
            color: '#000000',
            lineHeight: 1.6,
            marginBottom: '60px',
            fontStyle: 'italic',
            maxHeight: '250px',
            overflow: 'hidden'
        },
        detailsGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px 20px'
        },
        detailItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        detailIcon: {
            color: '#000000',
            flexShrink: 0,
            width: 36,
            height: 36
        },
        detailContent: {
            display: 'flex',
            flexDirection: 'column'
        },
        detailLabel: {
            fontSize: '20px',
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase'
        },
        detailValue: {
            fontSize: '28px',
            color: '#1e293b',
            fontWeight: 800
        },
        footer: {
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        qrCode: {
            width: '50px',
            height: '50px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1e293b'
        },
        watermark: {
            position: 'absolute',
            bottom: '-20px',
            right: '-20px',
            opacity: 0.03,
            transform: 'rotate(-15deg)',
            pointerEvents: 'none'
        }
    };

    return (
        <div ref={cardRef} style={cardStyles.container} className="volunteer-id-card">
            {/* Left Pane - Photo & Brand */}
            <div style={cardStyles.leftPane}>
                <div style={cardStyles.photoWrapper}>
                    <img src={profileImage} alt={name} style={cardStyles.photo} />
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '16px',
                    textTransform: 'uppercase',
                    border: '1.5px solid #000',
                    padding: '6px 16px',
                    borderRadius: '99px'
                }}>
                    <Award size={18} color="#000" /> Official Volunteer
                </div>


                <div style={{ marginTop: '25px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>DharmArth</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Foundation</div>
                </div>

                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
            </div>

            {/* Right Pane - Details */}
            <div style={cardStyles.rightPane}>
                <div style={cardStyles.header}>
                    <div style={cardStyles.logoArea}>
                        <span style={cardStyles.foundationName} className="foundation-name-hi">धर्मार्थ फाउंडेशन</span>
                        <span style={cardStyles.tagline}>Spreading Humanity & Hope</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#94a3b8' }}>VOLUNTEER ID</div>
                        <div style={{ fontSize: '40px', fontWeight: 800, color: '#1e293b' }}>{referralCode}</div>
                    </div>
                </div>

                <div style={cardStyles.userInfo}>
                    <div style={cardStyles.userName}>{name}</div>
                    <div style={cardStyles.userWork}>{work}</div>
                    <div style={cardStyles.userBio}>"{bio}"</div>

                    <div style={cardStyles.detailsGrid}>
                        <div style={cardStyles.detailItem}>
                            <Phone size={isMobileView ? 24 : 18} style={cardStyles.detailIcon} />
                            <div style={cardStyles.detailContent}>
                                <span style={cardStyles.detailLabel}>Contact</span>
                                <span style={cardStyles.detailValue}> {mobile}</span>
                            </div>
                        </div>
                        <div style={cardStyles.detailItem}>
                            <MapPin size={isMobileView ? 24 : 18} style={cardStyles.detailIcon} />
                            <div style={cardStyles.detailContent}>
                                <span style={cardStyles.detailLabel}>Location</span>
                                <span style={cardStyles.detailValue}>{location}</span>
                            </div>
                        </div>
                        <div style={cardStyles.detailItem}>
                            <Award size={isMobileView ? 24 : 18} style={cardStyles.detailIcon} />
                            <div style={cardStyles.detailContent}>
                                <span style={cardStyles.detailLabel}>Verified Since</span>
                                <span style={cardStyles.detailValue}>{joinedDate}</span>
                            </div>
                        </div>
                        <div style={cardStyles.detailItem}>
                            <ShieldCheck size={isMobileView ? 24 : 18} style={cardStyles.detailIcon} />
                            <div style={cardStyles.detailContent}>
                                <span style={cardStyles.detailLabel}>Status</span>
                                <span style={cardStyles.detailValue}>Active Member</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={cardStyles.footer}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Globe size={32} color="#00bfa5" />
                        <span style={{ fontSize: '24px', color: '#64748b', fontWeight: 600 }}>dharmarth.com</span>
                    </div>
                    <div style={cardStyles.qrCode}>
                        <QrCode size={80} />
                    </div>
                </div>

                {/* Watermark Logo */}
                <div style={cardStyles.watermark}>
                    <Award size={180} />
                </div>
            </div>
        </div>
    );
};

export default VolunteerCard;
