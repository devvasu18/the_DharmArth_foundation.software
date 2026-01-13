import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UserDetailModal from './UserDetailModal';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';
import { Eye, Ban, CheckCircle } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // View User State
    const [viewingUser, setViewingUser] = useState(null);
    const [canViewDetails, setCanViewDetails] = useState(false);
    const [canSuspend, setCanSuspend] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        userId: null,
        isSuspended: false
    });

    // Alert Modal State
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    useEffect(() => {
        checkPermissions();
        fetchUsers();
    }, []);

    const checkPermissions = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            if (user.isSuperAdmin) {
                setCanViewDetails(true);
                setCanSuspend(true);
            } else {
                // Check permissions
                const hasView = user.roles?.some(role =>
                    role.permissions?.some(p =>
                        p.module === 'User Management' && p.actions.includes('view')
                    )
                );
                const hasEdit = user.roles?.some(role =>
                    role.permissions?.some(p =>
                        p.module === 'User Management' && p.actions.includes('edit')
                    )
                );
                setCanViewDetails(!!hasView);
                setCanSuspend(!!hasEdit);
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
            const { data } = await api.get(`/users/${userId}`);
            setViewingUser(data);
        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: "Failed to load user details: " + (error.response?.data?.message || error.message),
                type: 'error'
            });
        }
    };

    const confirmSuspend = (userId, currentStatus) => {
        setConfirmModal({
            isOpen: true,
            userId: userId,
            isSuspended: currentStatus
        });
    };

    const handleSuspendAction = async () => {
        const { userId, isSuspended } = confirmModal;
        try {
            const { data } = await api.put(`/users/${userId}/suspend`);
            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, isSuspended: data.isSuspended } : u));
            setAlertModal({
                isOpen: true,
                title: 'Success',
                message: data.message,
                type: 'success'
            });
        } catch (error) {
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: "Failed to update status: " + (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false }); // Close modal
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
                        {(canViewDetails || canSuspend) && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id} style={{ opacity: user.isSuspended ? 0.6 : 1, background: user.isSuspended ? '#fff5f5' : 'inherit' }}>
                            <td>
                                {user.name}
                                {user.isSuspended && <span style={{ marginLeft: '5px', fontSize: '0.7rem', color: 'red', fontWeight: 'bold' }}>(SUSPENDED)</span>}
                            </td>
                            <td>{user.mobile}</td>
                            <td style={{ fontWeight: 'bold', color: '#2d3748' }}>₹{user.walletBalance?.toLocaleString() || 0}</td>
                            <td>
                                {user.referredBy ? (
                                    <span>{user.referredBy.name} <small style={{ color: '#64748b' }}>({user.referredBy.mobile})</small></span>
                                ) : (
                                    <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '500', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>Direct Joined</span>
                                )}
                            </td>
                            <td>
                                {user.email ? (
                                    user.email
                                ) : (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Not Provided</span>
                                )}
                            </td>
                            {(canViewDetails || canSuspend) && (
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        {canViewDetails && (
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
                                        )}
                                        {canSuspend && (
                                            <button
                                                className="btn-icon"
                                                style={{
                                                    background: user.isSuspended ? '#f0fff4' : '#fff5f5',
                                                    color: user.isSuspended ? '#38a169' : '#e53e3e',
                                                    border: 'none',
                                                    padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onClick={() => confirmSuspend(user._id, user.isSuspended)}
                                                title={user.isSuspended ? "Activate User" : "Suspend User"}
                                            >
                                                {user.isSuspended ? <CheckCircle size={18} /> : <Ban size={18} />}
                                            </button>
                                        )}
                                    </div>
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

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleSuspendAction}
                title={confirmModal.isSuspended ? "Activate User" : "Suspend User"}
                message={`Are you sure you want to ${confirmModal.isSuspended ? 'activate' : 'suspend'} this user? This action can be reversed.`}
                confirmText={confirmModal.isSuspended ? "Activate" : "Suspend"}
                confirmColor={confirmModal.isSuspended ? "blue" : "red"}
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );
};

export default AdminUsers;
