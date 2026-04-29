import React, { useState } from 'react';
import { Bell, Search, ChevronDown, Menu, X, Heart, Calendar, Stethoscope, User as UserIcon, Home, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io } from "socket.io-client";
import { API_BASE_URL } from '../../services/api';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { user, setUser, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Close dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileOpen]);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = React.useRef(null);
    const notificationRef = React.useRef(null);

    // Notification & Socket Logic
    React.useEffect(() => {
        if (!user || user.isSuperAdmin || (user.roles && user.roles.length > 0)) return;

        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };

        fetchNotifications();

        // Initialize Socket
        socketRef.current = io(API_BASE_URL, {
            withCredentials: true
        });

        socketRef.current.emit('join_user_notifications', user._id);

        socketRef.current.on('payout_processed', (notif) => {
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.success(notif.message, { duration: 6000, icon: '🔔' });
        });

        socketRef.current.on('payout_rejected', (notif) => {
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.error(notif.message, { duration: 8000 });
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user?._id]);

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    // Close notification dropdown on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        if (isNotificationsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationsOpen]);

    const handleLogout = () => {
        logout();
    };

    const isDeliveryPartner = user?.roles?.some(r => (typeof r === 'string' ? r === 'Delivery boy' : r.name === 'Delivery boy'));

    const renderLanguageToggle = (isMobile = false) => (
        <div
            className="nav-link"
            onClick={(e) => {
                e.stopPropagation();
                setIsLangModalOpen(true);
                if (isMobile) setIsOpen(false);
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
            <Languages size={18} />
            <span>{t('navbar.changeLanguage')}</span>
        </div>
    );

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
                    <span className="logo-text">{t('navbar.brand')}</span>
                </Link>

                {/* Desktop Menu */}
                <div className="navbar-links hidden-mobile">
                    {!isDeliveryPartner && (
                        <>

                            <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('navbar.fundraiseFor')}</NavLink>
                            {/* <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('navbar.doctorAvailability')}</NavLink>
                            <NavLink to="/order-medicine" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Order Medicine</NavLink> */}
                        </>
                    )}

                    {user?.isSuperAdmin && (
                        <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('navbar.admin')}</NavLink>
                    )}

                    {isDeliveryPartner && (
                        <NavLink to="/delivery-boy" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Delivery Feed</NavLink>
                    )}
                </div>

                <div className="navbar-actions hidden-mobile">
                    {/* Language Toggle */}
                    {renderLanguageToggle()}

                    <Link to="/donate" className="btn btn-outline">{t('navbar.donate')}</Link>

                    {user && !user.isSuperAdmin && (!user.roles || user.roles.length === 0) && (
                        <div className="notif-bell-container" ref={notificationRef}>
                            <button
                                className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div
                                        className="notif-dropdown"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="notif-header">
                                            <h3>Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllRead}>Mark all read</button>
                                            )}
                                        </div>
                                        <div className="notif-list">
                                            {notifications.length === 0 ? (
                                                <div className="notif-empty">No notifications yet</div>
                                            ) : (
                                                notifications.map((notif, idx) => (
                                                    <div key={idx} className={`notif-item ${!notif.isRead ? 'unread' : ''}`}>
                                                        <div className="notif-icon">
                                                            {notif.onModel === 'PayoutRequest' ? '💸' : notif.type === 'COMMISSION_EARNED' ? '💰' : '📢'}
                                                        </div>
                                                        <div className="notif-body">
                                                            <p>{notif.message}</p>
                                                            <span className="notif-time">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {user ? (
                        <div className="nav-dropdown" ref={dropdownRef} style={{ cursor: 'pointer', position: 'relative' }}>
                            <span
                                className="nav-link"
                                style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <img src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`} alt="Av" style={{ width: 32, borderRadius: '50%' }} />

                            </span>
                            {isProfileOpen && (
                                <div className="dropdown-menu" style={{
                                    position: 'absolute', top: '100%', right: 0,
                                    background: 'white', padding: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    borderRadius: '4px', minWidth: '150px', zIndex: 1000
                                }}>
                                    {!user.isSuperAdmin && !isDeliveryPartner && (
                                        <>
                                            <Link to="/dashboard" style={{ display: 'block', padding: '8px', color: '#333' }} onClick={() => setIsProfileOpen(false)}>{t('navbar.wallet')}</Link>
                                            <Link to="/my-subscriptions" style={{ display: 'block', padding: '8px', color: '#333' }} onClick={() => setIsProfileOpen(false)}>{t('navbar.subscriptions') || 'My Subscriptions'}</Link>
                                        </>
                                    )}
                                    <div onClick={handleLogout} style={{ display: 'block', padding: '8px', color: 'red', cursor: 'pointer' }}>{t('navbar.logout')}</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn-link">{t('navbar.signIn')}</Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="mobile-menu">
                    {renderLanguageToggle(true)}
                    {!isDeliveryPartner && (
                        <>
                            {/* <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.doctorAvailability')}</NavLink> */}
                            <NavLink to="/how-it-works" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.howItWorks')}</NavLink>
                        </>
                    )}

                    {user && user.isSuperAdmin && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.admin')}</NavLink>}

                    {isDeliveryPartner && (
                        <NavLink to="/delivery-boy" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Delivery Feed</NavLink>
                    )}
                    {!user ? (
                        <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.signIn')}</NavLink>
                    ) : (
                        <span className="nav-link" onClick={() => { handleLogout(); setIsOpen(false); }} style={{ color: 'red' }}>{t('navbar.logout')}</span>
                    )}

                    {!isDeliveryPartner && <Link to="/donate" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }} onClick={() => setIsOpen(false)}>{t('navbar.donate')}</Link>}
                </div>
            )}
            {/* Mobile Bottom Navigation */}
            <div className="bottom-navbar show-mobile">
                <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
                    <Home size={20} className="nav-icon" />
                    <span>{t('navbar.home')}</span>
                </NavLink>
                <NavLink to="/donate" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <Heart size={20} className="nav-icon" />
                    <span>{t('navbar.browseDonations')}</span>
                </NavLink>
                <NavLink to="/events" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <Calendar size={20} className="nav-icon" />
                    <span>{t('navbar.fundraiseFor')}</span>
                </NavLink>
                <NavLink to={user ? "/dashboard" : "/login"} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <UserIcon size={20} className="nav-icon" />
                    <span>{user ? t('navbar.userDashboard') : t('navbar.signIn')}</span>
                </NavLink>
            </div>

            {/* Language Selection Modal */}
            <AnimatePresence>
                {isLangModalOpen && (
                    <motion.div
                        className="lang-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsLangModalOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            className="lang-modal-content"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundColor: 'white',
                                padding: '30px',
                                borderRadius: '16px',
                                width: '100%',
                                maxWidth: '400px',
                                textAlign: 'center',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c' }}>
                                {i18n.language.startsWith('hi') ? 'भाषा चुनें' : 'Select Language'}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        i18n.changeLanguage('hi');
                                        if (user) {
                                            setUser({ ...user, language: 'hi' });
                                            api.put('/users/language', { language: 'hi' }).catch(console.error);
                                        }
                                        setIsLangModalOpen(false);
                                    }}
                                    style={{
                                        padding: '15px',
                                        borderRadius: '12px',
                                        border: i18n.language.startsWith('hi') ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                        backgroundColor: i18n.language.startsWith('hi') ? '#f0fdf4' : 'white',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: i18n.language.startsWith('hi') ? 'var(--primary)' : '#4a5568',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    हिंदी {i18n.language.startsWith('hi') && '✓'}
                                </button>

                                <button
                                    onClick={() => {
                                        i18n.changeLanguage('en');
                                        if (user) {
                                            setUser({ ...user, language: 'en' });
                                            api.put('/users/language', { language: 'en' }).catch(console.error);
                                        }
                                        setIsLangModalOpen(false);
                                    }}
                                    style={{
                                        padding: '15px',
                                        borderRadius: '12px',
                                        border: i18n.language.startsWith('en') ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                        backgroundColor: i18n.language.startsWith('en') ? '#f0fdf4' : 'white',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        color: i18n.language.startsWith('en') ? 'var(--primary)' : '#4a5568',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    English {i18n.language.startsWith('en') && '✓'}
                                </button>
                            </div>

                            <button
                                onClick={() => setIsLangModalOpen(false)}
                                style={{ marginTop: '20px', color: '#718096', fontWeight: '500', cursor: 'pointer', background: 'none', border: 'none' }}
                            >
                                {i18n.language.startsWith('hi') ? 'बंद करें' : 'Close'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
