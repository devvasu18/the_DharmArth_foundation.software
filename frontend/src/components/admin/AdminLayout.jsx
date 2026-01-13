import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Image, Settings, LogOut } from 'lucide-react';
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
                    {isSidebarCollapsed ? 'AP' : 'Admin Panel'}
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
                        <Users size={20} title={isSidebarCollapsed ? "Roles & Permissions" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Roles & Permissions</span>}
                    </NavLink>

                    <div className="admin-link" onClick={handleLogout} style={{ marginTop: 'auto', cursor: 'pointer', borderTop: '1px solid #2d3748' }}>
                        <LogOut size={20} title={isSidebarCollapsed ? "Logout" : ""} />
                        {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Logout</span>}
                    </div>
                </nav>
            </div>


            <div className="admin-content">

                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
