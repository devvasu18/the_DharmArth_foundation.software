import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [editingId, setEditingId] = useState(null);

    // New Role Form State
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState({}); // { moduleName: ['view', 'edit'] }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/roles'),
                api.get('/roles/permissions') // Fetches the library of available permissions
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (moduleName, action) => {
        const currentActions = selectedPermissions[moduleName] || [];
        let newActions;

        if (currentActions.includes(action)) {
            // Uncheck
            newActions = currentActions.filter(a => a !== action);
            if (action === 'view') newActions = [];
        } else {
            // Check
            newActions = [...currentActions, action];
            if (action !== 'view' && !newActions.includes('view')) {
                newActions.push('view');
            }
        }

        setSelectedPermissions({
            ...selectedPermissions,
            [moduleName]: newActions
        });
    };

    const handleEdit = (role) => {
        setRoleName(role.name);
        // Convert array [{module: 'x', actions: []}] to object {'x': []}
        const permsObj = {};
        role.permissions.forEach(p => {
            permsObj[p.module] = p.actions;
        });
        setSelectedPermissions(permsObj);
        setEditingId(role._id);
        setIsCreating(true);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setIsCreating(false);
        setRoleName('');
        setSelectedPermissions({});
        setEditingId(null);
    };

    const handleSaveRole = async () => {
        if (!roleName) return alert("Role Name required");

        // Format to backend structure: [{ module, actions }]
        const formattedPerms = Object.keys(selectedPermissions).map(mod => ({
            module: mod,
            actions: selectedPermissions[mod]
        })).filter(p => p.actions.length > 0);

        if (formattedPerms.length === 0) return alert("Select at least one permission");

        try {
            if (editingId) {
                await api.put(`/roles/${editingId}`, { name: roleName, permissions: formattedPerms });
                alert("Role Updated!");
            } else {
                await api.post('/roles', { name: roleName, permissions: formattedPerms });
                alert("Role Created!");
            }
            resetForm();
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to save role");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Roles & Permission Library</h3>
                <button className="btn bg-primary text-white" onClick={() => isCreating ? resetForm() : setIsCreating(true)}>
                    {isCreating ? 'Cancel' : '+ Create New Role'}
                </button>
            </div>

            {isCreating && (
                <div className="admin-card" style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{editingId ? 'Edit Role' : 'Create New Role'}</h4>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Role Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Manager"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            style={{ maxWidth: '300px' }}
                        />
                    </div>

                    <h5 style={{ marginBottom: '0.5rem', color: '#718096' }}>Assign Permissions</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {permissions.map((perm) => (
                            <div key={perm._id} style={{ border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '4px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                    {perm.moduleName}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {perm.availableActions.map(action => (
                                        <div key={action} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input
                                                type="checkbox"
                                                id={`${perm.moduleName}-${action}`}
                                                checked={(selectedPermissions[perm.moduleName] || []).includes(action)}
                                                onChange={() => handleCheckboxChange(perm.moduleName, action)}
                                            />
                                            <label htmlFor={`${perm.moduleName}-${action}`} style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{action}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn bg-primary text-white" onClick={handleSaveRole} style={{ marginTop: '1.5rem' }}>
                        {editingId ? 'Update Role' : 'Save Role'}
                    </button>
                </div>
            )}

            <div className="admin-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Role Name</th>
                            <th>Permissions Count</th>
                            <th>Modules Access</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role._id}>
                                <td>{role.name}</td>
                                <td>{role.permissions.reduce((acc, curr) => acc + curr.actions.length, 0)} Actions</td>
                                <td>
                                    {role.permissions.map(p => (
                                        <span key={p.module} className="badge badge-blue" style={{ marginRight: '5px', marginBottom: '5px', display: 'inline-block' }}>
                                            {p.module}
                                        </span>
                                    ))}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-outline"
                                        style={{
                                            padding: '5px 10px',
                                            fontSize: '0.8rem',
                                            marginRight: '5px',
                                            borderColor: role.name === 'Super Admin' ? '#ccc' : '#4fd1c5',
                                            color: role.name === 'Super Admin' ? '#999' : '#2d3748',
                                            cursor: role.name === 'Super Admin' ? 'not-allowed' : 'pointer'
                                        }}
                                        onClick={() => handleEdit(role)}
                                        disabled={role.name === 'Super Admin'}
                                        title={role.name === 'Super Admin' ? "System Role: Cannot be edited" : "Edit Role"}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                        onClick={() => handleEdit(role)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRoles;
