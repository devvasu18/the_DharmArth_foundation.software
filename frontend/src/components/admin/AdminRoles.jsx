import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';

const AdminRoles = () => {
    const { showAlert } = useConfirm();
    const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'roles'

    // --- Roles State ---
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState({}); // { moduleName: ['view', 'edit'] }

    // --- Staff State ---
    const [staffMembers, setStaffMembers] = useState([]);
    const [isCreatingStaff, setIsCreatingStaff] = useState(false);
    const [staffFormData, setStaffFormData] = useState({
        name: '', mobile: '', email: '', password: '', roleId: ''
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes, staffRes] = await Promise.all([
                api.get('/roles'),
                api.get('/roles/permissions'),
                api.get('/users/staff')
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
            setStaffMembers(staffRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Role Management Functions ---
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

    const handleEditRole = (role) => {
        setRoleName(role.name);
        const permsObj = {};
        role.permissions.forEach(p => {
            permsObj[p.module] = p.actions;
        });
        setSelectedPermissions(permsObj);
        setEditingRoleId(role._id);
        setIsCreatingRole(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetRoleForm = () => {
        setIsCreatingRole(false);
        setRoleName('');
        setSelectedPermissions({});
        setEditingRoleId(null);
    };

    const handleSaveRole = async () => {
        if (!roleName) return showAlert('error', 'Required', "Role Name required");
        const formattedPerms = Object.keys(selectedPermissions).map(mod => ({
            module: mod,
            actions: selectedPermissions[mod]
        })).filter(p => p.actions.length > 0);

        if (formattedPerms.length === 0) return showAlert('error', 'Required', "Select at least one permission");

        try {
            if (editingRoleId) {
                await api.put(`/roles/${editingRoleId}`, { name: roleName, permissions: formattedPerms });
                showAlert('success', 'Updated', "Role Updated!");
            } else {
                await api.post('/roles', { name: roleName, permissions: formattedPerms });
                showAlert('success', 'Created', "Role Created!");
            }
            resetRoleForm();
            fetchData();
        } catch (error) {
            showAlert('error', 'Failed', error.response?.data?.message || "Failed to save role");
        }
    };

    // --- Staff Management Functions ---
    const handleStaffChange = (e) => {
        setStaffFormData({ ...staffFormData, [e.target.name]: e.target.value });
    };

    const handleCreateStaff = async () => {
        if (!staffFormData.name || !staffFormData.mobile || !staffFormData.password || !staffFormData.roleId) {
            return showAlert('error', 'Missing Info', "Please fill all required fields");
        }
        try {
            await api.post('/users/staff', staffFormData);
            showAlert('success', 'Success', "Staff Member Created Successfully!");
            setIsCreatingStaff(false);
            setStaffFormData({ name: '', mobile: '', email: '', password: '', roleId: '' });
            fetchData();
        } catch (error) {
            showAlert('error', 'Failed', error.response?.data?.message || "Failed to create staff");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Staff & Roles Management</h2>

            <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <button
                    className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                    style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'staff' ? '2px solid #3182ce' : 'none',
                        fontWeight: activeTab === 'staff' ? 'bold' : 'normal',
                        color: activeTab === 'staff' ? '#3182ce' : '#4a5568'
                    }}
                    onClick={() => setActiveTab('staff')}
                >
                    Staff Members
                </button>
                <button
                    className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
                    style={{
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'roles' ? '2px solid #3182ce' : 'none',
                        fontWeight: activeTab === 'roles' ? 'bold' : 'normal',
                        color: activeTab === 'roles' ? '#3182ce' : '#4a5568'
                    }}
                    onClick={() => setActiveTab('roles')}
                >
                    Role Definitions
                </button>
            </div>

            {/* --- STAFF TAB --- */}
            {activeTab === 'staff' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="btn bg-primary text-white" onClick={() => setIsCreatingStaff(!isCreatingStaff)}>
                            {isCreatingStaff ? 'Cancel' : '+ Create New Staff'}
                        </button>
                    </div>

                    {isCreatingStaff && (
                        <div className="admin-card" style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>Create New Staff Member</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        className="form-input"
                                        name="name"
                                        value={staffFormData.name}
                                        onChange={handleStaffChange}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mobile Number *</label>
                                    <input
                                        className="form-input"
                                        name="mobile"
                                        value={staffFormData.mobile}
                                        onChange={handleStaffChange}
                                        placeholder="10-digit mobile number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email (Optional)</label>
                                    <input
                                        className="form-input"
                                        name="email"
                                        value={staffFormData.email}
                                        onChange={handleStaffChange}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        name="password"
                                        value={staffFormData.password}
                                        onChange={handleStaffChange}
                                        placeholder="******"
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Assign Role *</label>
                                    <select className="form-select" name="roleId" value={staffFormData.roleId} onChange={handleStaffChange}>
                                        <option value="">-- Select Role --</option>
                                        {roles.filter(r => r.name !== 'Super Admin').map(role => (
                                            <option key={role._id} value={role._id}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-outline" onClick={() => setIsCreatingStaff(false)} style={{ marginRight: '1rem' }}>
                                    Cancel
                                </button>
                                <button className="btn bg-primary text-white" onClick={handleCreateStaff}>
                                    Create Staff Account
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="admin-card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Mobile</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffMembers.map(staff => (
                                    <tr key={staff._id}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{staff.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#718096' }}>{staff.email}</div>
                                        </td>
                                        <td>{staff.mobile}</td>
                                        <td>
                                            {staff.isSuperAdmin ?
                                                <span className="badge badge-red">Super Admin</span> :
                                                staff.roles.map(r => <span key={r._id} className="badge badge-green">{r.name}</span>)
                                            }
                                        </td>
                                        <td>
                                            <span style={{ color: 'green', fontSize: '0.9rem' }}>Active</span>
                                        </td>
                                    </tr>
                                ))}
                                {staffMembers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No staff members found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- ROLES TAB --- */}
            {activeTab === 'roles' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="btn bg-primary text-white" onClick={() => isCreatingRole ? resetRoleForm() : setIsCreatingRole(true)}>
                            {isCreatingRole ? 'Cancel' : '+ Create New Role'}
                        </button>
                    </div>

                    {isCreatingRole && (
                        <div className="admin-card" style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>{editingRoleId ? 'Edit Role' : 'Create New Role'}</h4>

                            <div className="form-group" style={{ maxWidth: '400px' }}>
                                <label className="form-label">Role Name *</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Manager"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                />
                            </div>

                            <h5 style={{ margin: '1.5rem 0 1rem', fontSize: '1rem', color: '#2d3748', fontWeight: 600 }}>Assign Permissions</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {permissions.map((perm) => (
                                    <div key={perm._id} className="permission-group">
                                        <div className="permission-header">
                                            {perm.moduleName}
                                        </div>
                                        <div className="checkbox-grid">
                                            {perm.availableActions.map(action => (
                                                <div key={action} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`${perm.moduleName}-${action}`}
                                                        checked={(selectedPermissions[perm.moduleName] || []).includes(action)}
                                                        onChange={() => handleCheckboxChange(perm.moduleName, action)}
                                                    />
                                                    <label htmlFor={`${perm.moduleName}-${action}`}>{action}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-outline" onClick={resetRoleForm} style={{ marginRight: '1rem' }}>
                                    Cancel
                                </button>
                                <button className="btn bg-primary text-white" onClick={handleSaveRole}>
                                    {editingRoleId ? 'Update Role' : 'Save Role'}
                                </button>
                            </div>
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
                                                onClick={() => handleEditRole(role)}
                                                disabled={role.name === 'Super Admin'}
                                                title={role.name === 'Super Admin' ? "System Role: Cannot be edited" : "Edit Role"}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRoles;
