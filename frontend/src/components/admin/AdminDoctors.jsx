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
        isEmergencyAvailable: false,
        defaultTimeSlots: [
            { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'government' },
            { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'government' },
            { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'clinic' },
            { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'clinic' }
        ]
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
            setFormData({
                ...doctor,
                defaultTimeSlots: doctor.defaultTimeSlots || [
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'government' },
                    { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'government' },
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'clinic' },
                    { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'clinic' }
                ]
            });
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
                isEmergencyAvailable: false,
                defaultTimeSlots: [
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'government' },
                    { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'government' },
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'clinic' },
                    { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'clinic' }
                ]
            });
        }
        setShowModal(true);
    };

    const addDefaultSlot = (hospitalType) => {
        setFormData(prev => ({
            ...prev,
            defaultTimeSlots: [
                ...(prev.defaultTimeSlots || []),
                { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType }
            ]
        }));
    };

    const removeDefaultSlot = (index) => {
        setFormData(prev => ({
            ...prev,
            defaultTimeSlots: (prev.defaultTimeSlots || []).filter((_, i) => i !== index)
        }));
    };

    const updateDefaultSlot = (index, field, value) => {
        setFormData(prev => {
            const updated = (prev.defaultTimeSlots || []).map((slot, i) => {
                if (i === index) {
                    return { ...slot, [field]: value };
                }
                return slot;
            });
            return { ...prev, defaultTimeSlots: updated };
        });
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

        if (file.size > 4 * 1024 * 1024) {
            toast.error("Please select an image smaller than 4MB");
            e.target.value = null;
            return;
        }

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
                <h3>Doctor Management</h3>
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
                                    <small className="upload-hint" style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Maximum upload size: 4MB</small>
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

                            {/* Custom helper section to render slots by type */}
                            {(() => {
                                const renderSlotsSection = (hospitalType, label) => {
                                    const slots = (formData.defaultTimeSlots || []).map((slot, index) => ({ ...slot, originalIndex: index })).filter(s => s.hospitalType === hospitalType);

                                    return (
                                        <div className="default-slots-section" style={{ margin: '20px 0', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <h4 style={{ fontSize: '0.95rem', color: '#1e293b', margin: 0 }}>{label}</h4>
                                                <button type="button" onClick={() => addDefaultSlot(hospitalType)} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                    + Add Slot
                                                </button>
                                            </div>
                                            {slots.length === 0 ? (
                                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '5px 0' }}>No default slots configured. Click Add Slot to add custom hours.</p>
                                            ) : (
                                                slots.map((slot) => (
                                                    <div key={slot.originalIndex} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div>
                                                            <select
                                                                value={slot.period}
                                                                onChange={(e) => updateDefaultSlot(slot.originalIndex, 'period', e.target.value)}
                                                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                                                            >
                                                                <option value="Morning">Morning</option>
                                                                <option value="Afternoon">Afternoon</option>
                                                                <option value="Evening">Evening</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) => updateDefaultSlot(slot.originalIndex, 'startTime', e.target.value)}
                                                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) => updateDefaultSlot(slot.originalIndex, 'endTime', e.target.value)}
                                                                style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDefaultSlot(slot.originalIndex)}
                                                                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    );
                                };

                                return (
                                    <>
                                        <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '20px 0 0', fontWeight: 'bold' }}>Default Weekly Time Slots</h3>
                                        {(formData.type === 'government' || formData.type === 'both') && renderSlotsSection('government', '🏥 Government Hospital Slots')}
                                        {(formData.type === 'clinic' || formData.type === 'both') && renderSlotsSection('clinic', '🏨 Private Clinic Slots')}
                                    </>
                                );
                            })()}

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
