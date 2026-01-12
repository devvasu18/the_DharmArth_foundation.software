import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Image, Settings, LogOut } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

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
            <div className="admin-sidebar">
                <div className="admin-brand">Admin Panel</div>
                <nav className="admin-nav">
                    <NavLink to="/admin" end className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={18} style={{ marginRight: '10px' }} /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Users size={18} style={{ marginRight: '10px' }} /> User Management
                    </NavLink>
                    <NavLink to="/admin/sliders" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Image size={18} style={{ marginRight: '10px' }} /> Hero Sliders
                    </NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Settings size={18} style={{ marginRight: '10px' }} /> Site Settings
                    </NavLink>
                    <NavLink to="/admin/roles" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
                        <Users size={18} style={{ marginRight: '10px' }} /> Roles & Permissions
                    </NavLink>

                    <div className="admin-link" onClick={handleLogout} style={{ marginTop: 'auto', cursor: 'pointer', borderTop: '1px solid #2d3748' }}>
                        <LogOut size={18} style={{ marginRight: '10px' }} /> Logout
                    </div>
                </nav>
            </div>

            <div className="admin-content">
                <div className="admin-header">
                    <h2>Welcome, {user.name}</h2>
                    <div>
                        <span className="badge badge-green">Super Admin</span>
                    </div>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
