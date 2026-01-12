import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

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

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/roles');
            setAvailableRoles(data);
        } catch (error) {
            console.error("Failed to fetch roles", error);
        }
    };

    const handleEditClick = (user) => {
        if (user.isSuperAdmin) {
            alert("Cannot edit roles for Super Admin via this panel.");
            return;
        }
        setEditingUser(user);
        setSelectedRoleIds(user.roles ? user.roles.map(r => r._id) : []);
    };

    const handleRoleToggle = (roleId) => {
        if (selectedRoleIds.includes(roleId)) {
            setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
        } else {
            setSelectedRoleIds([...selectedRoleIds, roleId]);
        }
    };

    const handleSaveRoles = async () => {
        if (!editingUser) return;
        try {
            await api.put(`/users/${editingUser._id}/roles`, { roleIds: selectedRoleIds });
            alert("User roles updated successfully!");
            setEditingUser(null);
            fetchUsers(); // Refresh list
        } catch (error) {
            alert(error.response?.data?.message || "Failed to update roles");
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
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.mobile}</td>
                            <td style={{ fontWeight: 'bold', color: '#2d3748' }}>₹{user.walletBalance?.toLocaleString() || 0}</td>
                            <td>{user.email || '-'}</td>
                            <td>
                                {user.isSuperAdmin ? <span className="badge badge-red">Super Admin</span> :
                                    user.roles && user.roles.length > 0 ? user.roles.map(r => r.name).join(', ') :
                                        <span style={{ color: '#aaa' }}>User</span>}
                            </td>
                            <td>
                                <button
                                    className="btn btn-outline"
                                    style={{
                                        padding: '5px 10px',
                                        fontSize: '0.8rem',
                                        opacity: user.isSuperAdmin ? 0.5 : 1,
                                        cursor: user.isSuperAdmin ? 'not-allowed' : 'pointer',
                                        borderColor: user.isSuperAdmin ? '#ccc' : '',
                                        color: user.isSuperAdmin ? '#999' : ''
                                    }}
                                    onClick={() => handleEditClick(user)}
                                    disabled={user.isSuperAdmin}
                                    title={user.isSuperAdmin ? "Super Admin roles cannot be edited" : "Edit User Roles"}
                                >
                                    {user.isSuperAdmin ? 'Locked' : 'Edit Role'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px' }}>
                        <h4>Assign Roles to {editingUser.name}</h4>
                        <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {availableRoles.length === 0 && <p>No roles defined yet.</p>}
                            {availableRoles.map(role => (
                                <label key={role._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedRoleIds.includes(role._id)}
                                        onChange={() => handleRoleToggle(role._id)}
                                    />
                                    {role.name}
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="btn bg-primary text-white" onClick={handleSaveRoles}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
