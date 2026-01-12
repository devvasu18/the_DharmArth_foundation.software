import React, { useState } from 'react';
import { Search, ChevronDown, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Check auth status on mount
    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-logo">
                    <span className="logo-text">Dharmarth</span>
                </Link>

                {/* Desktop Menu */}
                <div className="navbar-links hidden-mobile">
                    <Link to="/fundraisers" className="nav-link">Browse Fundraisers</Link>
                    <div className="nav-dropdown">
                        <span className="nav-link">Fundraise For <ChevronDown size={14} /></span>
                    </div>
                    <Link to="/how-it-works" className="nav-link">How It Works</Link>
                    <div className="nav-search">
                        <Search size={16} />
                        <span>Search</span>
                    </div>
                    {user?.isSuperAdmin && (
                        <Link to="/admin" className="nav-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Admin Panel</Link>
                    )}
                </div>

                <div className="navbar-actions hidden-mobile">
                    <Link to="/donate" className="btn btn-outline">Donate</Link>
                    {user ? (
                        <div className="nav-dropdown" style={{ cursor: 'pointer', position: 'relative' }}>
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
                                    {!user.isSuperAdmin && (
                                        <Link to="/dashboard" style={{ display: 'block', padding: '8px', color: '#333' }} onClick={() => setIsProfileOpen(false)}>User Dashboard</Link>
                                    )}
                                    <div onClick={handleLogout} style={{ display: 'block', padding: '8px', color: 'red', cursor: 'pointer' }}>Logout</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn-link">Sign In</Link>
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
                    <Link to="/fundraisers" className="nav-link">Browse Fundraisers</Link>
                    <span className="nav-link">Fundraise For</span>
                    <Link to="/how-it-works" className="nav-link">How It Works</Link>
                    {user && user.isSuperAdmin && <Link to="/admin" className="nav-link">Admin Panel</Link>}
                    {user && !user.isSuperAdmin && <Link to="/dashboard" className="nav-link">User Dashboard</Link>}

                    {!user ? (
                        <Link to="/login" className="nav-link">Sign In</Link>
                    ) : (
                        <span className="nav-link" onClick={handleLogout} style={{ color: 'red' }}>Logout</span>
                    )}

                    <Link to="/start-fundraiser" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>Start a Fundraiser</Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
