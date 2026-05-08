import React from 'react';
import { Mail, Phone, MapPin, Award, ShieldCheck, QrCode, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';

const VolunteerCard = ({ userData, cardRef }) => {
    const { t } = useTranslation();
    const [isBigScreen, setIsBigScreen] = React.useState(window.innerWidth >= 1024);
    const [cardHeight, setCardHeight] = React.useState(window.innerWidth < 650 ? '1100px' : '1000px');

    React.useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsBigScreen(width >= 1024);
            setCardHeight(width < 650 ? '1100px' : '1000px');
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

    if (isBigScreen) {
        // --- BIG SCREEN DESIGN (Horizontal) ---
        const desktopStyles = {
            container: {
                width: '1000px',
                height: '600px',
                background: 'white',
                borderRadius: '32px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                position: 'relative',
                boxShadow: '0 40px 80px rgba(0,0,0,0.2)',
                border: '1px solid #e2e8f0',
                fontFamily: "'Outfit', 'Inter', sans-serif",
                margin: '0 auto'
            },
            leftCol: {
                width: '40%',
                background: 'linear-gradient(135deg, #00bfa5 0%, #00897b 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'white',
                position: 'relative',
                gap: '30px'
            },
            photoFrame: {
                width: '260px',
                height: '320px',
                borderRadius: '24px',
                border: '6px solid rgba(255,255,255,0.3)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                flexShrink: 0
            },
            brandArea: {
                textAlign: 'center',
                flexShrink: 0
            },
            rightCol: {
                width: '60%',
                padding: '50px 60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'white'
            },
            name: {
                fontSize: '52px',
                fontWeight: 900,
                color: '#1e293b',
                lineHeight: 1.1,
                marginBottom: '8px'
            },
            role: {
                fontSize: '28px',
                fontWeight: 700,
                color: '#00bfa5',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '25px'
            },
            bio: {
                fontSize: '22px',
                color: '#475569',
                lineHeight: 1.5,
                fontStyle: 'italic',
                marginBottom: '35px',
                maxHeight: '100px',
                overflow: 'hidden'
            },
            grid: {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '25px 30px',
                marginBottom: '20px'
            },
            item: {
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
            },
            label: {
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 700,
                textTransform: 'uppercase'
            },
            value: {
                fontSize: '20px',
                color: '#1e293b',
                fontWeight: 800
            },
            footer: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '25px',
                borderTop: '1.5px solid #f1f5f9'
            },
            idLabel: {
                fontSize: '16px',
                fontWeight: 700,
                color: '#94a3b8'
            },
            idValue: {
                fontSize: '28px',
                fontWeight: 900,
                color: '#1e293b'
            }
        };

        return (
            <div ref={cardRef} className="volunteer-card-container" style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                <div style={desktopStyles.container}>
                    <div style={desktopStyles.leftCol}>
                        <div style={desktopStyles.photoFrame}>
                            <img src={profileImage} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={desktopStyles.brandArea}>
                            <div style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1 }}>DharmArth</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '4px' }}>Foundation</div>
                        </div>
                    </div>

                    <div style={desktopStyles.rightCol}>
                        <div>
                            <div style={desktopStyles.name}>{name}</div>
                            <div style={desktopStyles.role}>{work}</div>
                            <div style={desktopStyles.bio}>"{bio}"</div>

                            <div style={desktopStyles.grid}>
                                <div style={desktopStyles.item}>
                                    <Phone size={32} color="#00bfa5" />
                                    <div>
                                        <div style={desktopStyles.label}>Contact</div>
                                        <div style={desktopStyles.value}>{mobile}</div>
                                    </div>
                                </div>
                                <div style={desktopStyles.item}>
                                    <MapPin size={32} color="#00bfa5" />
                                    <div>
                                        <div style={desktopStyles.label}>Location</div>
                                        <div style={desktopStyles.value}>{location}</div>
                                    </div>
                                </div>
                                <div style={desktopStyles.item}>
                                    <ShieldCheck size={32} color="#00bfa5" />
                                    <div>
                                        <div style={desktopStyles.label}>Status</div>
                                        <div style={desktopStyles.value}>Active Member</div>
                                    </div>
                                </div>
                                <div style={desktopStyles.item}>
                                    <Award size={32} color="#00bfa5" />
                                    <div>
                                        <div style={desktopStyles.label}>Verified Since</div>
                                        <div style={desktopStyles.value}>{joinedDate}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={desktopStyles.footer}>
                            <div>
                                <div style={desktopStyles.idLabel}>OFFICIAL VOLUNTEER ID</div>
                                <div style={desktopStyles.idValue}>{referralCode}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>dharmarth.com</div>
                                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Global Humanity Network</div>
                                </div>
                                <QrCode size={70} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- SMALL SCREEN DESIGN (Vertical - Current UI) ---
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
            marginBottom: '25px'
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
            justifyContent: 'flex-start'
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
            fontSize: '32px',
            color: '#000000',
            lineHeight: 1.5,
            marginBottom: '70px',
            fontStyle: 'italic',
            maxHeight: '300px',
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9'
        },
        qrCode: {
            background: 'white',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
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
        <div ref={cardRef} className="volunteer-card-container" style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
            <div style={cardStyles.container}>
                {/* Top Section - Brand & Photo */}
                <div style={cardStyles.leftPane}>
                    <div style={cardStyles.photoWrapper}>
                        <img src={profileImage} alt={name} style={cardStyles.photo} />
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '56px', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-1px' }}>DharmArth</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '4px', marginTop: '4px' }}>Foundation</div>
                    </div>

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
                                <Phone size={36} style={cardStyles.detailIcon} />
                                <div style={cardStyles.detailContent}>
                                    <span style={cardStyles.detailLabel}>Contact</span>
                                    <span style={cardStyles.detailValue}> {mobile}</span>
                                </div>
                            </div>
                            <div style={cardStyles.detailItem}>
                                <MapPin size={36} style={cardStyles.detailIcon} />
                                <div style={cardStyles.detailContent}>
                                    <span style={cardStyles.detailLabel}>Location</span>
                                    <span style={cardStyles.detailValue}>{location}</span>
                                </div>
                            </div>
                            <div style={cardStyles.detailItem}>
                                <Award size={36} style={cardStyles.detailIcon} />
                                <div style={cardStyles.detailContent}>
                                    <span style={cardStyles.detailLabel}>Verified Since</span>
                                    <span style={cardStyles.detailValue}>{joinedDate}</span>
                                </div>
                            </div>
                            <div style={cardStyles.detailItem}>
                                <ShieldCheck size={36} style={cardStyles.detailIcon} />
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

                    <div style={cardStyles.watermark}>
                        <Award size={180} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VolunteerCard;
