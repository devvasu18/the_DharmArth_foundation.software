import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../services/api';
import { Upload, X } from 'lucide-react';
import './AdminDoctors.css';

const API_URL = `${API_BASE_URL}/api`;

const getAuthHeaders = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const { token } = JSON.parse(storedUser);
            if (token) {
                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };
            }
        } catch (e) {
            console.error('Error getting auth token', e);
        }
    }
    return { 'Content-Type': 'application/json' };
};

const AdminDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [selectedDateNum, setSelectedDateNum] = useState(1);

    // Doctor Categories States
    const [categories, setCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryFormData, setCategoryFormData] = useState({ name: '', icon: '', isActive: true });
    const [editingCategory, setEditingCategory] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        name_hi: '',
        title: '',
        title_hi: '',
        experience: '',
        experience_hi: '',
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
        ],
        dateSpecificTimeSlots: [],
        categories: [],
        description: '',
        description_hi: '',
        privateFee: 0
    });

    useEffect(() => {
        fetchDoctors();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/doctor-categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            toast.error('Failed to fetch categories');
        }
    };

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



    // Category CRUD Handlers
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCategory
                ? `${API_URL}/doctor-categories/${editingCategory._id}`
                : `${API_URL}/doctor-categories`;
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryFormData)
            });

            if (response.ok) {
                toast.success(editingCategory ? 'Category updated!' : 'Category created!');
                setEditingCategory(null);
                setCategoryFormData({ name: '', icon: '', isActive: true });
                fetchCategories();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Error saving category');
            }
        } catch (error) {
            toast.error('Error saving category');
        }
    };

    const handleToggleCategoryStatus = async (cat) => {
        try {
            const response = await fetch(`${API_URL}/doctor-categories/${cat._id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...cat, isActive: !cat.isActive })
            });

            if (response.ok) {
                toast.success('Category status updated!');
                fetchCategories();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Error updating status');
            }
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const handleCategoryDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category? Doctors linked to it will be unlinked.')) return;
        try {
            const response = await fetch(`${API_URL}/doctor-categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                toast.success('Category deleted!');
                fetchCategories();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Error deleting category');
            }
        } catch (error) {
            toast.error('Error deleting category');
        }
    };

    const openModal = (doctor = null) => {
        setActiveTab('profile');
        setSelectedDateNum(1);
        if (doctor) {
            setEditingDoctor(doctor);
            setFormData({
                ...doctor,
                name_hi: doctor.name_hi || '',
                title_hi: doctor.title_hi || '',
                experience_hi: doctor.experience_hi || '',
                defaultTimeSlots: doctor.defaultTimeSlots || [
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'government' },
                    { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'government' },
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType: 'clinic' },
                    { period: 'Afternoon', startTime: '14:00', endTime: '17:00', hospitalType: 'clinic' }
                ],
                dateSpecificTimeSlots: doctor.dateSpecificTimeSlots || [],
                categories: doctor.categories ? doctor.categories.map(c => typeof c === 'object' ? c._id : c) : [],
                description: doctor.description || '',
                description_hi: doctor.description_hi || '',
                privateFee: doctor.privateFee || 0
            });
        } else {
            setEditingDoctor(null);
            setFormData({
                name: '',
                name_hi: '',
                title: '',
                title_hi: '',
                experience: '',
                experience_hi: '',
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
                ],
                dateSpecificTimeSlots: [],
                categories: [],
                description: '',
                description_hi: '',
                privateFee: 0
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

    const handleCreateOverride = (dateNum) => {
        setFormData(prev => ({
            ...prev,
            dateSpecificTimeSlots: [
                ...(prev.dateSpecificTimeSlots || []),
                { dateNumber: dateNum, timeSlots: [] }
            ]
        }));
    };

    const handleClearOverride = (dateNum) => {
        setFormData(prev => ({
            ...prev,
            dateSpecificTimeSlots: (prev.dateSpecificTimeSlots || []).filter(s => s.dateNumber !== dateNum)
        }));
    };

    const addDateSpecificSlot = (dateNum, hospitalType) => {
        setFormData(prev => {
            const overrideList = prev.dateSpecificTimeSlots || [];
            const updated = overrideList.map(s => {
                if (s.dateNumber === dateNum) {
                    return {
                        ...s,
                        timeSlots: [...s.timeSlots, { period: 'Morning', startTime: '09:00', endTime: '12:00', hospitalType }]
                    };
                }
                return s;
            });
            return { ...prev, dateSpecificTimeSlots: updated };
        });
    };

    const removeDateSpecificSlot = (dateNum, index) => {
        setFormData(prev => {
            const overrideList = prev.dateSpecificTimeSlots || [];
            const updated = overrideList.map(s => {
                if (s.dateNumber === dateNum) {
                    return {
                        ...s,
                        timeSlots: s.timeSlots.filter((_, i) => i !== index)
                    };
                }
                return s;
            });
            return { ...prev, dateSpecificTimeSlots: updated };
        });
    };

    const updateDateSpecificSlot = (dateNum, index, field, value) => {
        setFormData(prev => {
            const overrideList = prev.dateSpecificTimeSlots || [];
            const updated = overrideList.map(s => {
                if (s.dateNumber === dateNum) {
                    const updatedSlots = s.timeSlots.map((slot, i) => {
                        if (i === index) {
                            return { ...slot, [field]: value };
                        }
                        return slot;
                    });
                    return { ...s, timeSlots: updatedSlots };
                }
                return s;
            });
            return { ...prev, dateSpecificTimeSlots: updated };
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingDoctor(null);
        setActiveTab('profile');
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

    let currentTab = activeTab;
    if (formData.type === 'government' && activeTab === 'date-slots') {
        currentTab = 'default-slots';
    } else if (formData.type === 'clinic' && activeTab === 'default-slots') {
        currentTab = 'date-slots';
    }

    return (
        <div className="admin-doctors">
            <div className="admin-doctors-header">
                <h3>Doctor Management</h3>
                <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-manage-categories" type="button" onClick={() => setShowCategoryModal(true)} style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>
                        ➕ Manage Doctor Categories
                    </button>
                    <button className="btn-add-doctor" onClick={() => openModal()}>
                        <span>+</span> Add New Doctor
                    </button>
                </div>
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
            </div>

            <div className="doctors-grid">
                {doctors.map(doctor => (
                    <div key={doctor._id} className={`doctor-card ${doctor.type}`}>
                        <div className="doctor-card-header">
                            <div className="doctor-type-badge">
                                {doctor.type === 'government' ? '🏥 Government' : doctor.type === 'clinic' ? '🏨 Clinic' : '🏥 Works in Both'}
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

                            {doctor.description && (
                                <p className="doctor-description-preview" style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
                                    {doctor.description}
                                </p>
                            )}

                            {(doctor.type === 'clinic' || doctor.type === 'both') && doctor.privateFee > 0 && (
                                <div className="doctor-fee-preview" style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: '600', margin: '4px 0' }}>
                                    💵 Fee: ₹{doctor.privateFee} (Clinic)
                                </div>
                            )}

                            {doctor.type === 'clinic' && doctor.priority > 0 && (
                                <div className="priority-badge">⭐ Priority {doctor.priority}</div>
                            )}

                             <div className="doctor-status">
                                <span className={`status-indicator ${doctor.isActive ? 'active' : 'inactive'}`}>
                                    {doctor.isActive ? '✓ Active' : '✗ Inactive'}
                                </span>
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
                            <div className="modal-tabs">
                                <button type="button" className={`modal-tab-btn ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Details</button>
                                <button type="button" className={`modal-tab-btn ${currentTab === 'hindi-profile' ? 'active' : ''}`} onClick={() => setActiveTab('hindi-profile')}>Hindi Translation</button>
                                {formData.type !== 'clinic' && (
                                    <button type="button" className={`modal-tab-btn ${currentTab === 'default-slots' ? 'active' : ''}`} onClick={() => setActiveTab('default-slots')}>
                                        {formData.type === 'government' ? 'Time Slots' : 'Time Slots (Govt)'}
                                    </button>
                                )}
                                {formData.type !== 'government' && (
                                    <button type="button" className={`modal-tab-btn ${currentTab === 'date-slots' ? 'active' : ''}`} onClick={() => setActiveTab('date-slots')}>Date-Specific Slots (1-31)</button>
                                )}
                            </div>

                            {currentTab === 'profile' && (
                                <>
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

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>Description (where worked & current serving)</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="e.g. Worked at SMS Hospital Jaipur, currently serving at Sujangarh Clinic..."
                                            rows="3"
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                                        />
                                    </div>

                                    {(formData.type === 'clinic' || formData.type === 'both') && (
                                        <div className="form-group" style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>Private Clinic Fee (₹)</label>
                                            <input
                                                type="number"
                                                name="privateFee"
                                                value={formData.privateFee}
                                                onChange={handleChange}
                                                min="0"
                                                placeholder="e.g. 200"
                                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}
                                            />
                                        </div>
                                    )}

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>Doctor Categories</label>
                                        {categories.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                                                No categories available. Please create one using "Manage Categories".
                                            </p>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '130px', overflowY: 'auto' }}>
                                                {categories.map(cat => {
                                                    const isChecked = (formData.categories || []).includes(cat._id);
                                                    return (
                                                        <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            categories: [...(prev.categories || []), cat._id]
                                                                        }));
                                                                    } else {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            categories: (prev.categories || []).filter(id => id !== cat._id)
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <span>{cat.icon || '🩺'} {cat.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
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
                                    </div>
                                </>
                            )}

                            {currentTab === 'hindi-profile' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Doctor Name (Hindi)</label>
                                            <input
                                                type="text"
                                                name="name_hi"
                                                value={formData.name_hi || ''}
                                                onChange={handleChange}
                                                placeholder="जैसे: डॉ. जॉन डो"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Professional Title (Hindi)</label>
                                            <input
                                                type="text"
                                                name="title_hi"
                                                value={formData.title_hi || ''}
                                                onChange={handleChange}
                                                placeholder="जैसे: हृदय रोग विशेषज्ञ"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Experience (Hindi)</label>
                                            <input
                                                type="text"
                                                name="experience_hi"
                                                value={formData.experience_hi || ''}
                                                onChange={handleChange}
                                                placeholder="जैसे: 12+ वर्षों का अनुभव"
                                            />
                                        </div>
                                        <div className="form-group" style={{ visibility: 'hidden' }}>
                                            {/* Spacer */}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>Description (Hindi)</label>
                                        <textarea
                                            name="description_hi"
                                            value={formData.description_hi || ''}
                                            onChange={handleChange}
                                            placeholder="जैसे: एसएमएस अस्पताल जयपुर में काम किया, वर्तमान में सुजानगढ़ क्लिनिक में सेवा दे रहे हैं..."
                                            rows="3"
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                </>
                            )}

                            {currentTab === 'default-slots' && (
                                <>
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
                                                <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: '20px 0 0', fontWeight: 'bold' }}>
                                                    {formData.type === 'government' ? '🏥 Government Hospital Time Slots' : '🏥 Government Hospital Time Slots (Weekly)'}
                                                </h3>
                                                {(formData.type === 'government' || formData.type === 'both') && renderSlotsSection('government', null)}
                                            </>
                                        );
                                    })()}
                                </>
                            )}

                            {currentTab === 'date-slots' && (
                                <div className="date-specific-section">
                                    <div className="date-grid-container">
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px', textAlign: 'center' }}>
                                            Select a date number (1-31) to configure custom availability overrides:
                                        </p>
                                        <div className="date-grid">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => {
                                                const hasOverride = (formData.dateSpecificTimeSlots || []).some(s => s.dateNumber === num);
                                                return (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        className={`date-cell ${selectedDateNum === num ? 'selected' : ''} ${hasOverride ? 'has-override' : ''}`}
                                                        onClick={() => setSelectedDateNum(num)}
                                                    >
                                                        {num}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {(() => {
                                        const override = (formData.dateSpecificTimeSlots || []).find(s => s.dateNumber === selectedDateNum);
                                        const hasOverride = !!override;

                                        return (
                                            <div className="date-override-panel">
                                                <div className={`override-status-banner ${hasOverride ? 'active-override' : 'no-override'}`}>
                                                    <div>
                                                        <strong>Day {selectedDateNum} status:</strong> {hasOverride ? 'Custom override schedule active' : 'Using default weekly schedule'}
                                                    </div>
                                                    {hasOverride ? (
                                                        <button
                                                            type="button"
                                                            className="btn-status-action danger"
                                                            onClick={() => handleClearOverride(selectedDateNum)}
                                                        >
                                                            Restore Defaults
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn-status-action"
                                                            onClick={() => handleCreateOverride(selectedDateNum)}
                                                        >
                                                            Override Day {selectedDateNum}
                                                        </button>
                                                    )}
                                                </div>

                                                {hasOverride && (
                                                    <div className="override-slots-editor">
                                                        {(() => {
                                                            const renderOverrideSlots = (hospitalType, label) => {
                                                                const slots = (override.timeSlots || []).map((slot, index) => ({ ...slot, originalIndex: index })).filter(s => s.hospitalType === hospitalType);

                                                                return (
                                                                    <div className="default-slots-section" style={{ margin: '15px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <h5 style={{ fontSize: '0.9rem', color: '#334155', margin: 0, fontWeight: '600' }}>{label}</h5>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addDateSpecificSlot(selectedDateNum, hospitalType)}
                                                                                style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                                                            >
                                                                                + Add Slot
                                                                            </button>
                                                                        </div>
                                                                        {slots.length === 0 ? (
                                                                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '5px 0' }}>No slots set for this type. Doctor is unavailable for {label}.</p>
                                                                        ) : (
                                                                            slots.map((slot) => (
                                                                                <div key={slot.originalIndex} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                                                                    <div>
                                                                                        <select
                                                                                            value={slot.period}
                                                                                            onChange={(e) => updateDateSpecificSlot(selectedDateNum, slot.originalIndex, 'period', e.target.value)}
                                                                                            style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
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
                                                                                            onChange={(e) => updateDateSpecificSlot(selectedDateNum, slot.originalIndex, 'startTime', e.target.value)}
                                                                                            style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <input
                                                                                            type="time"
                                                                                            value={slot.endTime}
                                                                                            onChange={(e) => updateDateSpecificSlot(selectedDateNum, slot.originalIndex, 'endTime', e.target.value)}
                                                                                            style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => removeDateSpecificSlot(selectedDateNum, slot.originalIndex)}
                                                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}
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
                                                                    {(formData.type === 'clinic' || formData.type === 'both') && renderOverrideSlots('clinic', '🏨 Private Clinic Slots')}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

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

            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: '', icon: '', isActive: true });
                }}>
                    <div className="modal-content category-modal" style={{ maxWidth: '600px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, fontWeight: '700' }}>Manage Doctor Categories</h2>
                            <button className="modal-close" onClick={() => {
                                setShowCategoryModal(false);
                                setEditingCategory(null);
                                setCategoryFormData({ name: '', icon: '', isActive: true });
                            }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px 0' }}>
                            <form onSubmit={handleCategorySubmit} style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#334155' }}>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: '12px', alignItems: 'end' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Category Name</label>
                                        <input
                                            type="text"
                                            value={categoryFormData.name}
                                            onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. Cardiologist"
                                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Icon (Emoji)</label>
                                        <input
                                            type="text"
                                            value={categoryFormData.icon}
                                            onChange={(e) => setCategoryFormData(prev => ({ ...prev, icon: e.target.value }))}
                                            placeholder="e.g. 🩺"
                                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="submit" className="btn-submit" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                                            {editingCategory ? 'Save' : 'Add'}
                                        </button>
                                        {editingCategory && (
                                            <button type="button" className="btn-cancel" onClick={() => {
                                                setEditingCategory(null);
                                                setCategoryFormData({ name: '', icon: '', isActive: true });
                                            }} style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', background: '#e2e8f0', border: 'none', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>

                            <div className="categories-list" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', fontSize: '0.8rem', background: '#f8fafc' }}>
                                            <th style={{ padding: '10px 12px' }}>Icon</th>
                                            <th style={{ padding: '10px 12px' }}>Name</th>
                                            <th style={{ padding: '10px 12px' }}>Status</th>
                                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No categories created yet.</td>
                                            </tr>
                                        ) : (
                                            categories.map((cat) => (
                                                <tr key={cat._id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                                                    <td style={{ padding: '10px 12px', fontSize: '1.1rem' }}>{cat.icon || '🩺'}</td>
                                                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>{cat.name}</td>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: '600',
                                                            background: cat.isActive ? '#dcfce7' : '#fee2e2',
                                                            color: cat.isActive ? '#15803d' : '#b91c1c'
                                                        }}>
                                                            {cat.isActive ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingCategory(cat);
                                                                setCategoryFormData({ name: cat.name, icon: cat.icon || '', isActive: cat.isActive });
                                                            }}
                                                            style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '10px', fontSize: '0.8rem', fontWeight: '600' }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCategoryStatus(cat)}
                                                            style={{ border: 'none', background: 'none', color: cat.isActive ? '#d97706' : '#10b981', cursor: 'pointer', marginRight: '10px', fontSize: '0.8rem', fontWeight: '600' }}
                                                        >
                                                            {cat.isActive ? 'Disable' : 'Enable'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCategoryDelete(cat._id)}
                                                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDoctors;
