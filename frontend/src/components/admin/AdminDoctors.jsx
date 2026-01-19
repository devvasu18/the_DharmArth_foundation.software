import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import './AdminDoctors.css';

const API_URL = 'http://localhost:5000/api';

const AdminDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        experience: '',
        expertiseBadge: 'Professional Doctor',
        type: 'government',
        priority: 0,
        photo: '',
        isActive: true,
        isEmergencyAvailable: false
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await fetch(`${API_URL}/doctors`);
            const data = await response.json();
            setDoctors(data);
        } catch (error) {
            toast.error('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingDoctor
                ? `${API_URL}/doctors/${editingDoctor._id}`
                : `${API_URL}/doctors`;

            const method = editingDoctor ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(editingDoctor ? 'Doctor updated!' : 'Doctor created!');
                fetchDoctors();
                closeModal();
            } else {
                toast.error('Failed to save doctor');
            }
        } catch (error) {
            toast.error('Error saving doctor');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this doctor?')) return;

        try {
            const response = await fetch(`${API_URL}/doctors/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('Doctor deleted');
                fetchDoctors();
            } else {
                toast.error('Failed to delete doctor');
            }
        } catch (error) {
            toast.error('Error deleting doctor');
        }
    };

    const toggleEmergency = async (id) => {
        try {
            const response = await fetch(`${API_URL}/doctors/${id}/emergency`, {
                method: 'PATCH'
            });

            if (response.ok) {
                toast.success('Emergency status updated');
                fetchDoctors();
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const openModal = (doctor = null) => {
        if (doctor) {
            setEditingDoctor(doctor);
            setFormData(doctor);
        } else {
            setEditingDoctor(null);
            setFormData({
                name: '',
                title: '',
                experience: '',
                expertiseBadge: 'Professional Doctor',
                type: 'government',
                priority: 0,
                photo: '',
                isActive: true,
                isEmergencyAvailable: false
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDoctor(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (loading) {
        return <div className="admin-doctors-loading">Loading doctors...</div>;
    }

    return (
        <div className="admin-doctors">
            <div className="admin-doctors-header">
                <h1>Doctor Management</h1>
                <button className="btn-add-doctor" onClick={() => openModal()}>
                    <span>+</span> Add New Doctor
                </button>
            </div>

            <div className="doctors-stats">
                <div className="stat-card">
                    <div className="stat-icon">👨‍⚕️</div>
                    <div className="stat-info">
                        <h3>{doctors.length}</h3>
                        <p>Total Doctors</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏥</div>
                    <div className="stat-info">
                        <h3>{doctors.filter(d => d.type === 'government').length}</h3>
                        <p>Government Hospital</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏨</div>
                    <div className="stat-info">
                        <h3>{doctors.filter(d => d.type === 'clinic').length}</h3>
                        <p>Private Clinic</p>
                    </div>
                </div>
                <div className="stat-card emergency">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-info">
                        <h3>{doctors.filter(d => d.isEmergencyAvailable).length}</h3>
                        <p>Emergency Available</p>
                    </div>
                </div>
            </div>

            <div className="doctors-grid">
                {doctors.map(doctor => (
                    <div key={doctor._id} className={`doctor-card ${doctor.type}`}>
                        <div className="doctor-card-header">
                            <div className="doctor-type-badge">{doctor.type === 'government' ? '🏥 Government' : '🏨 Clinic'}</div>
                            <div className="doctor-actions">
                                <button
                                    className={`emergency-toggle ${doctor.isEmergencyAvailable ? 'active' : ''}`}
                                    onClick={() => toggleEmergency(doctor._id)}
                                    title="Toggle Emergency Availability"
                                >
                                    🚨
                                </button>
                            </div>
                        </div>

                        <div className="doctor-photo">
                            {doctor.photo ? (
                                <img src={doctor.photo} alt={doctor.name} />
                            ) : (
                                <div className="photo-placeholder">👨‍⚕️</div>
                            )}
                        </div>

                        <div className="doctor-info">
                            <h3>{doctor.name}</h3>
                            <p className="doctor-title">{doctor.title}</p>
                            <p className="doctor-experience"> {doctor.experience}</p>
                            <div className="expertise-badge">{doctor.expertiseBadge}</div>

                            {doctor.type === 'clinic' && doctor.priority > 0 && (
                                <div className="priority-badge">⭐ Priority {doctor.priority}</div>
                            )}

                            <div className="doctor-status">
                                <span className={`status-indicator ${doctor.isActive ? 'active' : 'inactive'}`}>
                                    {doctor.isActive ? '✓ Active' : '✗ Inactive'}
                                </span>
                                {doctor.isEmergencyAvailable && (
                                    <span className="emergency-badge">🚨 Emergency</span>
                                )}
                            </div>
                        </div>

                        <div className="doctor-card-actions">
                            <button className="btn-edit" onClick={() => openModal(doctor)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(doctor._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="doctor-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Doctor Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Dr. John Doe"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Professional Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="Cardiologist"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Experience *</label>
                                    <input
                                        type="text"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        required
                                        placeholder="12+ Years Experience"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Expertise Badge *</label>
                                    <select
                                        name="expertiseBadge"
                                        value={formData.expertiseBadge}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Professional Doctor">Professional Doctor</option>
                                        <option value="Senior Specialist">Senior Specialist</option>
                                        <option value="Top Expert">Top Expert</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="government">Government Hospital</option>
                                        <option value="clinic">Private Clinic</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Priority (for Clinic)</label>
                                    <input
                                        type="number"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        min="0"
                                        max="10"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Photo URL</label>
                                <input
                                    type="text"
                                    name="photo"
                                    value={formData.photo}
                                    onChange={handleChange}
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>

                            <div className="form-row checkbox-row">
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                        />
                                        <span>Active</span>
                                    </label>
                                </div>

                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="isEmergencyAvailable"
                                            checked={formData.isEmergencyAvailable}
                                            onChange={handleChange}
                                        />
                                        <span>Emergency Available</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDoctors;
