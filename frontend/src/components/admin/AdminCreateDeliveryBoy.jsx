import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Truck, Plus, Eye, EyeOff } from 'lucide-react';
import './AdminLayout.css';

const AdminCreateDeliveryBoy = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: ''
    });

    const [showForm, setShowForm] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, staffId: null, isCurrentlySuspended: false });

    useEffect(() => {
        fetchDeliveryBoys();
    }, []);

    const fetchDeliveryBoys = async () => {
        setFetching(true);
        try {
            const res = await api.get('/users/staff');
            const deliveryStaff = res.data.filter(staff =>
                staff.roles && staff.roles.some(r => r.name.toLowerCase().includes('delivery') || r.name.toLowerCase().includes('dispatch'))
            );
            setDeliveryBoys(deliveryStaff);
        } catch (error) {
            console.error("Error fetching staff", error);
            toast.error("Failed to load delivery personnel.");
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'mobile') {
            const val = e.target.value.replace(/\D/g, '');
            if (val.length <= 10) {
                setFormData({ ...formData, [e.target.name]: val });
            }
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.mobile || !formData.password) {
            return toast.error("Please fill all required fields (Name, Mobile, Password)");
        }

        setLoading(true);

        try {
            // First, find or create the fixed Delivery Boy role
            const res = await api.get('/roles');
            let deliveryRole = res.data.find(r =>
                r.name.toLowerCase() === 'delivery boy' || r.name.toLowerCase() === 'delivery'
            );

            if (!deliveryRole) {
                const newRoleRes = await api.post('/roles', {
                    name: 'Delivery Boy',
                    permissions: [
                        { module: 'Delivery Management', actions: ['view', 'edit'] },
                        { module: 'Order Management', actions: ['view'] }
                    ]
                });
                deliveryRole = newRoleRes.data;
            }

            // Now submit the staff creation request
            const submitData = { ...formData, roleId: deliveryRole._id };
            await api.post('/users/staff', submitData);

            toast.success("Delivery Boy Created Successfully!");

            setFormData({
                name: '',
                mobile: '',
                email: '',
                password: ''
            });
            setIsCreating(false);
            fetchDeliveryBoys(); // Refresh the list
        } catch (error) {
            console.error("Creation Error:", error);
            toast.error(error.response?.data?.message || "Failed to create Delivery Boy");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleClick = (staffId, isCurrentlySuspended) => {
        setStatusModal({ show: true, staffId, isCurrentlySuspended });
    };

    const executeToggleStatus = async () => {
        const { staffId } = statusModal;
        try {
            const res = await api.put(`/users/staff/${staffId}/status`);
            toast.success(res.data.message);
            fetchDeliveryBoys(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
            setStatusModal({ show: false, staffId: null, isCurrentlySuspended: false });
        }
    };

    return (
        <div className="admin-delivery-premium">
            <header className="page-header-admin" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="title-area">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Truck size={28} className="text-primary" />
                        Delivery Personnel
                    </h1>
                    <p>Manage your delivery and dispatch team.</p>
                </div>
                <div>
                    <button className="btn bg-primary text-white" onClick={() => setIsCreating(!isCreating)}>
                        {isCreating ? 'Cancel' : '+ Create New'}
                    </button>
                </div>
            </header>

            {isCreating && (
                <div className="admin-card" style={{ maxWidth: '800px', marginBottom: '2rem' }}>
                    <form onSubmit={handleCreate} className="w-form">
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    className="form-input"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Ramesh Singh"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mobile Number *</label>
                                <input
                                    className="form-input"
                                    type="tel"
                                    name="mobile"
                                    maxLength="10"
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit mobile number"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="10-digit mobile number"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email (Optional)</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="ramesh@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Set a secure password"
                                        style={{ paddingRight: '40px' }}
                                        required
                                    />
                                    <div
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setIsCreating(false)}
                                style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <Plus size={18} /> {loading ? 'Creating...' : 'Create Delivery Boy'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-card">
                {fetching ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading delivery personnel...</div>
                ) : (
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
                            {deliveryBoys.map(staff => (
                                <tr key={staff._id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{staff.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>{staff.email || 'email : N/A'}</div>
                                    </td>
                                    <td>{staff.mobile}</td>
                                    <td>
                                        {staff.roles.map(r => (
                                            <span key={r._id} className="badge badge-green" style={{ display: 'inline-block', marginRight: '5px' }}>
                                                {r.name}
                                            </span>
                                        ))}
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleToggleClick(staff._id, staff.isSuspended)}
                                            style={{
                                                background: staff.isSuspended ? '#fef2f2' : '#ecfdf5',
                                                color: staff.isSuspended ? '#ef4444' : '#10b981',
                                                border: `1px solid ${staff.isSuspended ? '#fca5a5' : '#6ee7b7'}`,
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                            onMouseOut={(e) => e.target.style.opacity = '1'}
                                        >
                                            {staff.isSuspended ? 'Inactive' : 'Active'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {deliveryBoys.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No delivery personnel found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            
            {/* Custom Confirmation Modal */}
            {statusModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: '15px',
                        width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Confirm Action</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
                            Are you sure you want to <strong>{statusModal.isCurrentlySuspended ? 'activate' : 'deactivate'}</strong> this delivery boy's account?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button 
                                onClick={() => setStatusModal({ show: false, staffId: null, isCurrentlySuspended: false })}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                    background: 'white', color: '#64748b', fontWeight: '500', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeToggleStatus}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                                    background: statusModal.isCurrentlySuspended ? '#10b981' : '#ef4444', 
                                    color: 'white', fontWeight: '500', cursor: 'pointer'
                                }}
                            >
                                Yes, {statusModal.isCurrentlySuspended ? 'Activate' : 'Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCreateDeliveryBoy;
