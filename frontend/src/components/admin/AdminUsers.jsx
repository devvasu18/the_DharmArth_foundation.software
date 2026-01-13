import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UserDetailModal from './UserDetailModal';
import { Eye } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // View User State
    const [viewingUser, setViewingUser] = useState(null);
    const [canViewDetails, setCanViewDetails] = useState(false);

    useEffect(() => {
        checkPermissions();
        fetchUsers();
    }, []);

    const checkPermissions = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            if (user.isSuperAdmin) {
                setCanViewDetails(true);
            } else {
                // Check if user has 'User Management' -> 'view' permission
                // Note: The structure is user.roles -> role.permissions -> [{ module: '...', actions: [...] }]
                const hasPerm = user.roles?.some(role =>
                    role.permissions?.some(p =>
                        p.module === 'User Management' && p.actions.includes('view')
                    )
                );
                setCanViewDetails(!!hasPerm);
            }
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewUser = async (userId) => {
        try {
            // Fetch fresh details for the single user
            const { data } = await api.get(`/users/${userId}`);
            setViewingUser(data);
        } catch (error) {
            alert("Failed to load user details: " + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="admin-card">
            <h3 style={{ marginBottom: '1.5rem' }}>User Management</h3>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Wallet</th>
                        <th>Referred By</th>
                        <th>Email</th>
                        {canViewDetails && <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.mobile}</td>
                            <td style={{ fontWeight: 'bold', color: '#2d3748' }}>₹{user.walletBalance?.toLocaleString() || 0}</td>
                            <td>{user.referredBy ? `${user.referredBy.name} (${user.referredBy.mobile})` : '-'}</td>
                            <td>{user.email || '-'}</td>
                            {canViewDetails && (
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        className="btn-icon"
                                        style={{
                                            background: '#ebf8ff', color: '#3182ce', border: 'none',
                                            padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onClick={() => handleViewUser(user._id)}
                                        title="View Full Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {viewingUser && (
                <UserDetailModal
                    user={viewingUser}
                    onClose={() => setViewingUser(null)}
                />
            )}
        </div>
    );
};

export default AdminUsers;
