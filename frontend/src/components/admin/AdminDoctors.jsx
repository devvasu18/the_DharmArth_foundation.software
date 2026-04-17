import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../services/api';
import { Upload, X } from 'lucide-react';
import './AdminDoctors.css';

const API_URL = `${API_BASE_URL}/api`;

const AdminDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [uploading, setUploading] = useState(false);
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
                const errorData = await response.json();
                let errorMessage = errorData.message || 'Failed to save doctor';
                if (errorData.validationErrors) {
                    const fields = Object.keys(errorData.validationErrors);
                    errorMessage = `Validation Error: ${fields.map(f => errorData.validationErrors[f].message).join(', ')}`;
                }
                toast.error(errorMessage);
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: uploadData
            });
            const data = await response.json();

            if (response.ok) {
                setFormData(prev => ({ ...prev, photo: data.imageUrl }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch (error) {
            toast.error('Error uploading image');
        } finally {
            setUploading(false);
        }
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
                        <h3>{doctors.filter(d => d.type === 'government' || d.type === 'both').length}</h3>
                        <p>In Govt Hospital</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏨</div>
                    <div className="stat-info">
                        <h3>{doctors.filter(d => d.type === 'clinic' || d.type === 'both').length}</h3>
                        <p>In Private Clinic</p>
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
                            <div className="doctor-type-badge">
                                {doctor.type === 'government' ? '🏥 Government' : doctor.type === 'clinic' ? '🏨 Clinic' : '🏥 Works in Both'}
                            </div>
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
                                <img src={doctor.photo.startsWith('http') ? doctor.photo : `${API_BASE_URL}${doctor.photo.startsWith('/') ? '' : '/'}${doctor.photo}`} alt={doctor.name} />
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
                                        <option value="both">Works in Both</option>
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
                                <label>Doctor Photo</label>
                                <div className="image-upload-container">
                                    <div className="image-input-wrapper">
                                        <input
                                            type="text"
                                            name="photo"
                                            value={formData.photo}
                                            onChange={handleChange}
                                            placeholder="Image URL or upload"
                                            className="form-input"
                                        />
                                        <label className={`btn-upload ${uploading ? 'uploading' : ''}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                hidden
                                                disabled={uploading}
                                            />
                                            {uploading ? (
                                                <span>Uploading...</span>
                                            ) : (
                                                <>
                                                    <Upload size={18} /> Upload
                                                </>
                                            )}
                                        </label>
                                    </div>
                                    {formData.photo && (
                                        <div className="image-preview">
                                            <img src={formData.photo.startsWith('http') ? formData.photo : `${API_BASE_URL}${formData.photo.startsWith('/') ? '' : '/'}${formData.photo}`} alt="Preview" />
                                            <button
                                                type="button"
                                                className="btn-remove-image"
                                                onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
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
