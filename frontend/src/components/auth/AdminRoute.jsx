import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingSpinner />;

    // STRICT CHECK: User must exist, and must be SuperAdmin or have roles
    const isStaff = user && (user.isSuperAdmin || (user.roles && user.roles.length > 0));

    if (!isStaff) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminRoute;
