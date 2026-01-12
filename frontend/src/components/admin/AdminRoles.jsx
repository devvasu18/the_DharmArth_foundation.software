import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminRoles = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

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
            // If removing 'view', remove everything? Or validation? 
            // Prompt says: If Add/Edit/Delete selected, View MUST be selected.
            // So if View is unchecked, uncheck all?
            if (action === 'view') newActions = [];
        } else {
            // Check
            newActions = [...currentActions, action];
            // Auto-select view if other action selected
            if (action !== 'view' && !newActions.includes('view')) {
                newActions.push('view');
            }
        }

        setSelectedPermissions({
            ...selectedPermissions,
            [moduleName]: newActions
        });
    };

    const handleCreateRole = async () => {
        if (!roleName) return alert("Role Name required");

        // Format to backend structure: [{ module, actions }]
        const formattedPerms = Object.keys(selectedPermissions).map(mod => ({
            module: mod,
            actions: selectedPermissions[mod]
        })).filter(p => p.actions.length > 0);

        if (formattedPerms.length === 0) return alert("Select at least one permission");

        try {
            await api.post('/roles', { name: roleName, permissions: formattedPerms });
            alert("Role Created!");
            setIsCreating(false);
            setRoleName('');
            setSelectedPermissions({});
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to create role");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Roles & Permission Library</h3>
                <button className="btn bg-primary text-white" onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : '+ Create New Role'}
                </button>
            </div>

            {isCreating && (
                <div className="admin-card" style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Create New Role</h4>
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

                    <button className="btn bg-primary text-white" onClick={handleCreateRole} style={{ marginTop: '1.5rem' }}>
                        Save Role
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
                                    <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>View Details</button>
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
