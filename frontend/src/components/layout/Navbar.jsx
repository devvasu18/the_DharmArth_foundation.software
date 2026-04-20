import React, { useState } from 'react';
import { Search, ChevronDown, Menu, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import './Navbar.css';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Check auth status on mount
    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.language) {
                i18n.changeLanguage(parsedUser.language);
            }
        }
    }, []);

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

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const isDeliveryPartner = user?.roles?.some(r => (typeof r === 'string' ? r === 'Delivery boy' : r.name === 'Delivery boy'));

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
                            <NavLink to="/donate" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('navbar.browseDonations')}</NavLink>
                            <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('navbar.fundraiseFor')}</NavLink>
                            <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('navbar.doctorAvailability')}</NavLink>
                            <NavLink to="/order-medicine" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Order Medicine</NavLink>
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
                    <div
                        onClick={() => {
                            const currentLang = i18n.language || 'hi';
                            const newLang = currentLang.startsWith('en') ? 'hi' : 'en';
                            i18n.changeLanguage(newLang);
                            if (user) {
                                const updatedUser = { ...user, language: newLang };
                                setUser(updatedUser);
                                localStorage.setItem('user', JSON.stringify(updatedUser));
                                api.put('/users/language', { language: newLang }).catch(console.error);
                            }
                        }}
                        style={{
                            cursor: 'pointer',
                            marginRight: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }}
                    >
                        <span style={{
                            color: (i18n.language && i18n.language.startsWith('hi')) ? 'var(--primary)' : '#888',
                            fontWeight: (i18n.language && i18n.language.startsWith('hi')) ? '800' : '400'
                        }}>हिंदी</span>

                        <span style={{ margin: '0 6px', color: '#ccc' }}>|</span>

                        <span style={{
                            color: (i18n.language && i18n.language.startsWith('en')) ? 'var(--primary)' : '#888',
                            fontWeight: (i18n.language && i18n.language.startsWith('en')) ? '800' : '400'
                        }}>EN</span>
                    </div>

                    <Link to="/donate" className="btn btn-outline">{t('navbar.donate')}</Link>
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
                                        <Link to="/dashboard" style={{ display: 'block', padding: '8px', color: '#333' }} onClick={() => setIsProfileOpen(false)}>{t('navbar.wallet')}</Link>
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
                    {!isDeliveryPartner && (
                        <>
                            <NavLink to="/donate" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.browseDonations')}</NavLink>
                            <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.fundraiseFor')}</NavLink>
                            <NavLink to="/doctors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.doctorAvailability')}</NavLink>
                            <NavLink to="/order-medicine" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Order Medicine</NavLink>
                            <NavLink to="/how-it-works" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.howItWorks')}</NavLink>
                        </>
                    )}
                    
                    {user && user.isSuperAdmin && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.admin')}</NavLink>}
                    {user && !user.isSuperAdmin && !isDeliveryPartner && <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>{t('navbar.userDashboard')}</NavLink>}
                    
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
        </nav>
    );
};

export default Navbar;
