import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
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

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="admin-card">
            <h3 style={{ marginBottom: '1.5rem' }}>User Management</h3>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Mobile</th>
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
                            <td>{user.email || '-'}</td>
                            <td>
                                {user.isSuperAdmin ? <span className="badge badge-red">Super Admin</span> :
                                    user.roles && user.roles.length > 0 ? user.roles.map(r => r.name).join(', ') :
                                        <span style={{ color: '#aaa' }}>User</span>}
                            </td>
                            <td>
                                <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Edit Role</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUsers;
