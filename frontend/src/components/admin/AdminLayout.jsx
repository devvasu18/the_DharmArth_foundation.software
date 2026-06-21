import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Image, Settings, LogOut, Search, Bell, Maximize, Menu, ChevronDown, CheckCheck, TrendingUp, Wallet, Calendar, FileText, Stethoscope, MessageSquare, CreditCard, Globe } from 'lucide-react';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import api, { API_BASE_URL } from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

// Simple notification sound
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const AdminLayout = () => {
    const { showAlert } = useConfirm();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isHomeDropdownOpen, setHomeDropdownOpen] = useState(false);
    const [isEventsDropdownOpen, setEventsDropdownOpen] = useState(false);
    const [isReportsDropdownOpen, setReportsDropdownOpen] = useState(false);
    const [isDoctorsDropdownOpen, setDoctorsDropdownOpen] = useState(false);
    const [isPharmacyDropdownOpen, setPharmacyDropdownOpen] = useState(false);
    const [isRinging, setIsRinging] = useState(false);
    const socketRef = useRef(null);
    const notificationRef = useRef(null);
    const audioRef = useRef(null);

    // Initialize audio on mount
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        audioRef.current.loop = true;
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const stopRingtone = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsRinging(false);
    };

    useEffect(() => {
        // Initialize Socket
        socketRef.current = io(API_BASE_URL, {
            withCredentials: true
        });

        socketRef.current.emit('join_admin_notifications');

        const playAlert = () => {
            setIsRinging(true);
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        };

        socketRef.current.on('new_donation', (newNotification) => {
            playAlert();
            toast.success(
                <div onClick={() => { setIsNotificationsOpen(true); stopRingtone(); }} style={{ cursor: 'pointer' }}>
                    <b>New Donation!</b>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{newNotification.message}</p>
                </div>,
                { duration: 5000 }
            );
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        socketRef.current.on('new_payout_request', (newNotification) => {
            playAlert();
            toast.success(
                <div onClick={() => { setIsNotificationsOpen(true); stopRingtone(); }} style={{ cursor: 'pointer' }}>
                    <b>Payout Requested</b>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{newNotification.message}</p>
                </div>,
                { duration: 6000, icon: '💸' }
            );
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        socketRef.current.on('new_prescription_request', (newNotification) => {
            playAlert();
            const isPayment = newNotification.type === 'ORDER_PAID';

            toast.success(
                <div onClick={() => {
                    setIsNotificationsOpen(true);
                    stopRingtone();
                    if (isPayment) navigate('/admin/pharmacy-orders');
                    else navigate('/admin/prescriptions');
                }} style={{ cursor: 'pointer' }}>
                    <b>{isPayment ? '💰 Order Paid!' : '📄 New Prescription!'}</b>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{newNotification.message}</p>
                </div>,
                { duration: 8000, icon: isPayment ? '💰' : '📄' }
            );

            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        fetchNotifications();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [navigate]); // Only run on mount (and if navigate changes, which is stable)

    // Handle Click Outside Notification Panel
    useEffect(() => {
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

    // Auto-expand Events Dropdown if active
    useEffect(() => {
        if (location.pathname === '/admin/events' ||
            location.pathname.includes('/admin/events-header') ||
            location.pathname.includes('/admin/event-videos') ||
            location.pathname.includes('/admin/galleries')) {
            setEventsDropdownOpen(true);
        }

        if (location.pathname.includes('/admin/doctors') ||
            location.pathname.includes('/admin/availability') ||
            location.pathname.includes('/admin/body-tests') ||
            location.pathname.includes('/admin/doctor-faq')) {
            setDoctorsDropdownOpen(true);
        }

        if (location.pathname.includes('/admin/prescriptions') ||
            location.pathname.includes('/admin/order-medicine') ||
            location.pathname.includes('/admin/delivery') ||
            location.pathname.includes('/admin/create-delivery-boy') ||
            location.pathname.includes('/admin/dispatch') ||
            location.pathname.includes('/admin/pharmacy-orders')) {
            setPharmacyDropdownOpen(true);
        }
    }, [location.pathname]);

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        if (socketRef.current) socketRef.current.disconnect();
        logout();
    };

    const handleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleNotificationClick = (notif) => {
        setIsNotificationsOpen(false);

        if (notif.onModel === 'PayoutRequest') {
            navigate('/admin/payouts');
            return;
        }

        if (notif.onModel === 'Order' || notif.type === 'ORDER_PAID') {
            navigate('/admin/pharmacy-orders');
            return;
        }

        if (notif.onModel === 'Prescription') {
            navigate('/admin/prescriptions');
            return;
        }

        if (notif.referenceId) {
            navigate('/admin/transaction-management', {
                state: { openTransactionId: notif.referenceId }
            });
        }
    };

    if (!user) return null;

    return (
        <div className="admin-container">
            <div className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div
                    className="admin-brand"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    style={{ cursor: 'pointer' }}
                >
                    {isSidebarCollapsed ? <Menu size={24} /> : 'Dharmarth'}
                </div>
                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <LayoutDashboard size={20} title={isSidebarCollapsed ? "Dashboard" : ""} />
                        <span className="admin-link-text">Dashboard</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <Users size={20} title={isSidebarCollapsed ? "User Management" : ""} />
                        <span className="admin-link-text">User Management</span>
                    </NavLink>
                    <NavLink to="/admin/leads" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <MessageSquare size={20} title={isSidebarCollapsed ? "Leads & Inquiries" : ""} />
                        <span className="admin-link-text">Leads & Inquiries</span>
                    </NavLink>
                    {/* Home Management Dropdown */}
                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname === '/admin/sliders' ||
                                location.pathname === '/admin/crowdfunding'
                                ? 'active' : ''
                                }`}
                            onClick={() => {
                                setHomeDropdownOpen(!isHomeDropdownOpen);
                                setEventsDropdownOpen(false);
                                setDoctorsDropdownOpen(false);
                                setPharmacyDropdownOpen(false);
                                setReportsDropdownOpen(false);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Image size={20} title={isSidebarCollapsed ? "Home Management" : ""} />
                                <span className="admin-link-text">Home Management</span>
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isHomeDropdownOpen || location.pathname === '/admin/sliders' || location.pathname === '/admin/crowdfunding' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {isHomeDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink to="/admin/sliders" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                                    Hero Sliders
                                </NavLink>
                                <NavLink to="/admin/crowdfunding" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                                    Home crowdfunding
                                </NavLink>
                                <NavLink to="/admin/faqs" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                                    Manage FAQs
                                </NavLink>
                            </div>
                        )}
                    </div>
                    <NavLink to="/admin/cms" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <Globe size={20} title={isSidebarCollapsed ? "Page Management" : ""} />
                        <span className="admin-link-text">Page Management</span>
                    </NavLink>
                    {/* Events Dropdown */}
                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname === '/admin/events' ||
                                location.pathname.includes('/admin/events-header') ||
                                location.pathname.includes('/admin/event-videos') ||
                                location.pathname.includes('/admin/galleries')
                                ? 'active' : ''
                                }`}
                            onClick={() => {
                                setEventsDropdownOpen(!isEventsDropdownOpen);
                                setDoctorsDropdownOpen(false);
                                setPharmacyDropdownOpen(false);
                                setReportsDropdownOpen(false);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Calendar size={20} title={isSidebarCollapsed ? "Event Management" : ""} />
                                <span className="admin-link-text">Events</span>
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isEventsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {isEventsDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink
                                    to="/admin/events" end
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    create event
                                </NavLink>
                                <NavLink
                                    to="/admin/events-header"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Events slider
                                </NavLink>
                                <NavLink
                                    to="/admin/event-videos"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    YouTube Videos
                                </NavLink>
                                {/* <NavLink
                                    to="/admin/galleries"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Galleries
                                </NavLink> */}
                            </div>
                        )}
                    </div>


                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname.includes('/admin/doctors') ||
                                location.pathname.includes('/admin/availability')
                                ? 'active' : ''
                                }`}
                            onClick={() => {
                                setDoctorsDropdownOpen(!isDoctorsDropdownOpen);
                                setEventsDropdownOpen(false);
                                setPharmacyDropdownOpen(false);
                                setReportsDropdownOpen(false);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Stethoscope size={20} title={isSidebarCollapsed ? "Doctors" : ""} />
                                <span className="admin-link-text">Doctors</span>
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isDoctorsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {isDoctorsDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink
                                    to="/admin/doctors"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Doctor Management
                                </NavLink>
                                <NavLink
                                    to="/admin/availability"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Availability Management
                                </NavLink>
                                <NavLink
                                    to="/admin/body-tests"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Body Tests
                                </NavLink>
                                <NavLink
                                    to="/admin/doctor-faq"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Doctor FAQs
                                </NavLink>
                                <NavLink
                                    to="/admin/doctors/reports"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Send Reports
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Medical & Delivery Dropdown commented for now */}
                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname.includes('/admin/prescriptions') ||
                                location.pathname.includes('/admin/order-medicine') ||
                                location.pathname.includes('/admin/delivery') ||
                                location.pathname.includes('/admin/create-delivery-boy') ||
                                location.pathname.includes('/admin/dispatch') ||
                                location.pathname.includes('/admin/pharmacy-orders')
                                ? 'active' : ''
                                }`}
                            onClick={() => {
                                setPharmacyDropdownOpen(!isPharmacyDropdownOpen);
                                setEventsDropdownOpen(false);
                                setDoctorsDropdownOpen(false);
                                setReportsDropdownOpen(false);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FileText size={20} title={isSidebarCollapsed ? "Pharmacy" : ""} />
                                <span className="admin-link-text">Pharmacy & Delivery</span>
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isPharmacyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {isPharmacyDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink
                                    to="/admin/prescriptions"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Prescription Queue
                                </NavLink>
                                <NavLink
                                    to="/admin/order-medicine"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Order Medicine
                                </NavLink>
                                <NavLink
                                    to="/admin/pharmacy-orders"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Order Management
                                </NavLink>
                                <NavLink
                                    to="/admin/dispatch"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Order Dispatch
                                </NavLink>
                                <NavLink
                                    to="/admin/delivery"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Route Management
                                </NavLink>
                                <NavLink
                                    to="/admin/pharmacy-settings"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Pharmacy Settings
                                </NavLink>
                                <NavLink
                                    to="/admin/create-delivery-boy"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Create Delivery Boy
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Reports Dropdown */}
                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname.includes('/admin/reports') ? 'active' : ''}`}
                            onClick={() => {
                                setReportsDropdownOpen(!isReportsDropdownOpen);
                                setEventsDropdownOpen(false);
                                setDoctorsDropdownOpen(false);
                                setPharmacyDropdownOpen(false);
                            }}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FileText size={20} title={isSidebarCollapsed ? "Reports" : ""} />
                                <span className="admin-link-text">Reports</span>
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isReportsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {isReportsDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink
                                    to="/admin/reports/commission"
                                    className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`}
                                    onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}
                                >
                                    Donation Reports
                                </NavLink>
                            </div>
                        )}
                    </div>
                    <NavLink to="/admin-user-explorer/transactions" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <TrendingUp size={20} title={isSidebarCollapsed ? "User Explorer" : ""} />
                        <span className="admin-link-text">User Explorer</span>
                    </NavLink>
                    <NavLink to="/admin/transaction-management" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <Wallet size={20} title={isSidebarCollapsed ? "Transactions" : ""} />
                        <span className="admin-link-text">Donations</span>
                    </NavLink>
                    <NavLink to="/admin/subscriptions" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <CreditCard size={20} title={isSidebarCollapsed ? "Subscriptions" : ""} />
                        <span className="admin-link-text">Monthly Subscriptions</span>
                    </NavLink>
                    <NavLink to="/admin/payouts" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <Wallet size={20} title={isSidebarCollapsed ? "Payouts" : ""} />
                        <span className="admin-link-text">Payouts</span>
                    </NavLink>
                    <NavLink to="/admin/whatsapp" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <MessageSquare size={20} title={isSidebarCollapsed ? "WhatsApp Scanner" : ""} />
                        <span className="admin-link-text">WhatsApp Scanner</span>
                    </NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <Settings size={20} title={isSidebarCollapsed ? "Site Settings" : ""} />
                        <span className="admin-link-text">Site Settings</span>
                    </NavLink>
                    {/* <NavLink to="/admin/roles" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`} onClick={() => window.innerWidth < 992 && setIsSidebarCollapsed(false)}>
                        <Users size={20} title={isSidebarCollapsed ? "Staff & Roles" : ""} />
                        <span className="admin-link-text">Staff & Roles</span>
                    </NavLink> */}
                </nav>
            </div>

            {/* Mobile Overlay */}
            {isSidebarCollapsed && (
                <div
                    className="sidebar-overlay mobile-only"
                    onClick={() => setIsSidebarCollapsed(false)}
                ></div>
            )}

            <div className="admin-main-wrapper">
                <header className="admin-topbar">
                    <div className="topbar-left">

                        <span className="header-brand">Dharmarth</span>
                    </div>

                    <div className="topbar-right">
                        <div className="icon-btn" onClick={handleFullScreen} title="Toggle Fullscreen">
                            <Maximize size={20} />
                        </div>

                        {/* Looping Alert Stopper */}
                        {isRinging && (
                            <button
                                className="ring-stop-btn"
                                onClick={stopRingtone}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    marginRight: '10px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    animation: 'pulse 1s infinite'
                                }}
                            >
                                🔔 STOP ALERT
                            </button>
                        )}

                        {/* Notification Bell */}
                        <div className="icon-btn" ref={notificationRef} onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); stopRingtone(); }}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="badge-dot" title={`${unreadCount} unread`}></span>}

                            {isNotificationsOpen && (
                                <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <div className="notification-header">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button className="text-btn-small" onClick={handleMarkAllRead}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="no-notif">No new notifications</div>
                                        ) : (
                                            notifications.map((notif, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <div className="notif-icon">
                                                        {notif.type === 'PRESCRIPTION_UPLOADED' ? '📄' :
                                                            notif.type === 'ORDER_PAID' ? '💰' :
                                                                notif.onModel === 'PayoutRequest' ? '💸' :
                                                                    notif.type === 'DONATION' ? '💰' :
                                                                        notif.type === 'SUBSCRIPTION_CANCELLED' ? '🛑' : '📢'}
                                                    </div>
                                                    <div className="notif-content">
                                                        <p className="notif-msg">{notif.message}</p>
                                                        <span className="notif-time">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            className="profile-dropdown"
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        >
                            <div className="profile-info">
                                <span className="profile-name">{user.name || 'Admin User'}</span>
                                <span className="profile-role">{user.isSuperAdmin ? 'Super Admin' : 'Staff'}</span>
                            </div>
                            <div className="profile-avatar">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <ChevronDown size={14} style={{ opacity: 0.5 }} />

                            {isProfileDropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
