import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Image, Settings, LogOut, Search, Bell, Maximize, Menu, ChevronDown } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

    useEffect(() => {
        // Basic protection check
        // In real app, verify token validity with backend
        if (!user || !user.token) {
            navigate('/login');
        } else if (!user.isSuperAdmin && (!user.roles || user.roles.length === 0)) {
            // If not super admin and no roles (basic check)
            alert("Access Denied: Admins Only");
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
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
                    <NavLink to="/admin/sliders" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Image size={20} title={isSidebarCollapsed ? "Hero Sliders" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Hero Sliders</span>}
                    </NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Settings size={20} title={isSidebarCollapsed ? "Site Settings" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Site Settings</span>}
                    </NavLink>
                    <NavLink to="/admin/roles" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} title={isSidebarCollapsed ? "Staff & Roles" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Staff & Roles</span>}
                    </NavLink>

                    <div className="admin-link" onClick={handleLogout} style={{ marginTop: 'auto', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <LogOut size={20} title={isSidebarCollapsed ? "Logout" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Logout</span>}
                    </div>
                </nav>
            </div>

            <div className="admin-main-wrapper">
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <button className="sidebar-toggle mobile-only" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <Menu size={20} />
                        </button>
                        <div className="search-container">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Search projects..." className="search-input" />
                        </div>
                    </div>

                    <div className="topbar-right">
                        <div className="icon-btn">
                            <Maximize size={20} />
                        </div>
                        <div className="icon-btn">
                            <Bell size={20} />
                            <span className="badge-dot"></span>
                        </div>
                        <div className="profile-dropdown">
                            <div className="profile-info">
                                <span className="profile-name">{user.name || 'Admin User'}</span>
                                <span className="profile-role">{user.isSuperAdmin ? 'Super Admin' : 'Staff'}</span>
                            </div>
                            <div className="profile-avatar">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <ChevronDown size={14} style={{ opacity: 0.5 }} />
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
