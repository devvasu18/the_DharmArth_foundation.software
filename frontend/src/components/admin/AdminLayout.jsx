import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Image, Settings, LogOut, Search, Bell, Maximize, Menu, ChevronDown, CheckCheck, TrendingUp, Wallet, Calendar, FileText, MessageSquare, Stethoscope } from 'lucide-react';
import { io } from "socket.io-client";
import toast from 'react-hot-toast';
import axios from 'axios';
import './AdminLayout.css';

// Simple notification sound
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isEventsDropdownOpen, setEventsDropdownOpen] = useState(false);
    const [isReportsDropdownOpen, setReportsDropdownOpen] = useState(false);
    const [isDoctorsDropdownOpen, setDoctorsDropdownOpen] = useState(false);
    const socketRef = useRef(null);
    const notificationRef = useRef(null);
    const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);

        // Basic protection check
        if (!storedUser || !storedUser.token) {
            navigate('/login');
            return;
        } else if (!storedUser.isSuperAdmin && (!storedUser.roles || storedUser.roles.length === 0)) {
            alert("Access Denied: Admins Only");
            navigate('/');
            return;
        }

        // Initialize Socket
        socketRef.current = io('http://localhost:5000', {
            withCredentials: true
        });

        socketRef.current.emit('join_admin_notifications');

        socketRef.current.on('new_donation', (newNotification) => {
            // Play Sound
            audioRef.current.play().catch(e => console.log('Audio play failed', e));

            // Show Toast
            toast.success(
                <div onClick={() => setIsNotificationsOpen(true)} style={{ cursor: 'pointer' }}>
                    <b>New Donation!</b>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{newNotification.message}</p>
                </div>,
                { duration: 5000 }
            );

            // Update State
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        fetchNotifications();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
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
            location.pathname.includes('/admin/availability')) {
            setDoctorsDropdownOpen(true);
        }
    }, [location.pathname]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put('http://localhost:5000/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        if (socketRef.current) socketRef.current.disconnect();
        localStorage.removeItem('user');
        navigate('/login');
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
        // Navigate to transactions and open the breakdown
        // Use referenceId (which typically holds the donation/transaction ID)
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
                    style={{ cursor: 'pointer', title: 'Toggle Sidebar' }}
                >
                    {isSidebarCollapsed ? <Menu size={24} /> : 'Dharmarth'}
                </div>
                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} title={isSidebarCollapsed ? "Dashboard" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} title={isSidebarCollapsed ? "User Management" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>User Management</span>}
                    </NavLink>
                    <NavLink to="/admin/leads" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} title={isSidebarCollapsed ? "Auto Chat Leads" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Chat Leads</span>}
                    </NavLink>
                    <NavLink to="/admin/sliders" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Image size={20} title={isSidebarCollapsed ? "Hero Sliders" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Hero Sliders</span>}
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
                            onClick={() => !isSidebarCollapsed && setEventsDropdownOpen(!isEventsDropdownOpen)}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Calendar size={20} title={isSidebarCollapsed ? "Events" : ""} />
                                {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Events</span>}
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isEventsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {!isSidebarCollapsed && isEventsDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink to="/admin/events" end className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    Blog Pages
                                </NavLink>
                                <NavLink to="/admin/events-header" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    Events Header
                                </NavLink>
                                <NavLink to="/admin/event-videos" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    YouTube Videos
                                </NavLink>
                                <NavLink to="/admin/galleries" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    Galleries
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Doctors Dropdown */}
                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname.includes('/admin/doctors') ||
                                location.pathname.includes('/admin/availability')
                                ? 'active' : ''
                                }`}
                            onClick={() => !isSidebarCollapsed && setDoctorsDropdownOpen(!isDoctorsDropdownOpen)}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Stethoscope size={20} title={isSidebarCollapsed ? "Doctors" : ""} />
                                {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Doctors</span>}
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isDoctorsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {!isSidebarCollapsed && isDoctorsDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink to="/admin/doctors" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    Doctor Management
                                </NavLink>
                                <NavLink to="/admin/availability" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    Availability Management
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Reports Dropdown */}
                    <div className="admin-link-dropdown-container">
                        <div
                            className={`admin-link ${location.pathname.includes('/admin/reports') ? 'active' : ''}`}
                            onClick={() => !isSidebarCollapsed && setReportsDropdownOpen(!isReportsDropdownOpen)}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FileText size={20} title={isSidebarCollapsed ? "Reports" : ""} />
                                {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Reports</span>}
                            </div>
                            {!isSidebarCollapsed && <ChevronDown size={14} style={{ transform: isReportsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />}
                        </div>

                        {!isSidebarCollapsed && isReportsDropdownOpen && (
                            <div className="admin-dropdown-links" style={{ paddingLeft: 35, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 5 }}>
                                <NavLink to="/admin/reports/commission" className={({ isActive }) => `admin-sublink ${isActive ? 'active-sub' : ''}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', padding: '5px 0' }}>
                                    Commission Reports
                                </NavLink>
                            </div>
                        )}
                    </div>
                    <NavLink to="/admin-user-explorer/transactions" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <TrendingUp size={20} title={isSidebarCollapsed ? "User Explorer" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>User Explorer</span>}
                    </NavLink>
                    <NavLink to="/admin/transaction-management" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Wallet size={20} title={isSidebarCollapsed ? "Transactions" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Transactions</span>}
                    </NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Settings size={20} title={isSidebarCollapsed ? "Site Settings" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Site Settings</span>}
                    </NavLink>
                    <NavLink to="/admin/roles" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} title={isSidebarCollapsed ? "Staff & Roles" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Staff & Roles</span>}
                    </NavLink>
                </nav>
            </div>

            <div className="admin-main-wrapper">
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button className="sidebar-toggle mobile-only" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <Menu size={20} />
                        </button>
                        {isSidebarCollapsed && <span className="header-brand">Dharmarth</span>}
                    </div>

                    <div className="topbar-right">
                        <div className="icon-btn" onClick={handleFullScreen} title="Toggle Fullscreen">
                            <Maximize size={20} />
                        </div>

                        {/* Notification Bell */}
                        <div className="icon-btn" ref={notificationRef} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
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
                                                        {notif.type === 'DONATION' ? '💰' : '📢'}
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
