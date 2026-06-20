import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api, { API_BASE_URL } from '../../services/api';
import { Upload, X, Search, Plus, Edit, Trash2, Clock, Activity } from 'lucide-react';
import './AdminBodyTests.css';

const AdminBodyTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
    
    const [activeLang, setActiveLang] = useState('en');
    
    const [formData, setFormData] = useState({
        name: '',
        name_hi: '',
        price: '',
        originalPrice: '',
        time: '',
        category: 'General Health',
        category_hi: '',
        image: '',
        description: '',
        description_hi: '',
        isActive: true
    });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const response = await api.get('/body-tests');
            setTests(response.data);
        } catch (error) {
            toast.error('Failed to fetch body tests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim()) return toast.error('Test Name is required');
        if (!formData.price.trim()) return toast.error('Price is required');
        if (!formData.time.trim()) return toast.error('Duration is required');
        if (!formData.category.trim()) return toast.error('Category is required');

        try {
            if (editingTest) {
                await api.put(`/body-tests/${editingTest._id}`, formData);
                toast.success('Body test updated successfully!');
            } else {
                await api.post('/body-tests', formData);
                toast.success('Body test created successfully!');
            }
            fetchTests();
            closeModal();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error saving body test';
            toast.error(msg);
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this body test?')) return;

        try {
            await api.delete(`/body-tests/${id}`);
            toast.success('Body test deleted successfully');
            fetchTests();
        } catch (error) {
            toast.error('Failed to delete body test');
            console.error(error);
        }
    };

    const toggleStatus = async (test) => {
        try {
            const updatedTest = { ...test, isActive: !test.isActive };
            await api.put(`/body-tests/${test._id}`, updatedTest);
            toast.success(`Test status updated to ${updatedTest.isActive ? 'Active' : 'Inactive'}`);
            fetchTests();
        } catch (error) {
            toast.error('Failed to update status');
            console.error(error);
        }
    };

    const openModal = (test = null) => {
        if (test) {
            setEditingTest(test);
            setFormData({
                name: test.name || '',
                name_hi: test.name_hi || '',
                price: test.price || '',
                originalPrice: test.originalPrice || '',
                time: test.time || '',
                category: test.category || 'General Health',
                category_hi: test.category_hi || '',
                image: test.image || '',
                description: test.description || '',
                description_hi: test.description_hi || '',
                isActive: test.isActive !== undefined ? test.isActive : true
            });
        } else {
            setEditingTest(null);
            setFormData({
                name: '',
                name_hi: '',
                price: '',
                originalPrice: '',
                time: '',
                category: 'General Health',
                category_hi: '',
                image: '',
                description: '',
                description_hi: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTest(null);
        setActiveLang('en');
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
            const response = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data && response.data.imageUrl) {
                setFormData(prev => ({ ...prev, image: response.data.imageUrl }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Upload failed: Invalid response');
            }
        } catch (error) {
            toast.error('Error uploading image');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const categories = ['General Health', 'Pathology', 'Radiology', 'Cardiology', 'Neurology', 'Other'];

    const filteredTests = tests.filter(test => {
        const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              test.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (test.name_hi && test.name_hi.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (test.category_hi && test.category_hi.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategoryFilter === 'All' || test.category === selectedCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Compute categories for stats
    const totalCount = tests.length;
    const activeCount = tests.filter(t => t.isActive).length;
    const categoryStats = tests.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return <div className="admin-tests-loading">Loading medical tests...</div>;
    }

    return (
        <div className="admin-tests">
            <div className="admin-tests-header">
                <div>
                    <h1>Body Tests Management</h1>
                    <p className="subtitle">Configure and manage available medical tests and checkups</p>
                </div>
                <button className="btn-add-test" onClick={() => openModal()}>
                    <Plus size={20} /> Add New Test
                </button>
            </div>

            {/* Stats Dashboard */}
            <div className="tests-stats">
                <div className="stat-card">
                    <div className="stat-icon">🔬</div>
                    <div className="stat-info">
                        <h3>{totalCount}</h3>
                        <p>Total Tests</p>
                    </div>
                </div>
                <div className="stat-card active-tests">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>{activeCount}</h3>
                        <p>Active Tests</p>
                    </div>
                </div>
                <div className="stat-card category-card-stat">
                    <div className="stat-icon">📁</div>
                    <div className="stat-info">
                        <h3>{Object.keys(categoryStats).length}</h3>
                        <p>Categories</p>
                    </div>
                </div>
            </div>

            {/* Toolbar Filters */}
            <div className="tests-toolbar">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search tests by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-select-wrapper">
                    <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="category-select"
                    >
                        <option value="All">All Categories</option>
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid display */}
            {filteredTests.length === 0 ? (
                <div className="no-tests-found">
                    <p>No medical tests found matching the criteria.</p>
                </div>
            ) : (
                <div className="tests-grid">
                    {filteredTests.map(test => (
                        <div key={test._id} className={`test-card-admin ${!test.isActive ? 'inactive' : ''}`}>
                            <div className="test-image-admin">
                                {test.image ? (
                                    <img 
                                        src={test.image.startsWith('http') ? test.image : `${API_BASE_URL}${test.image.startsWith('/') ? '' : '/'}${test.image}`} 
                                        alt={test.name} 
                                    />
                                ) : (
                                    <div className="placeholder-image-admin">🔬</div>
                                )}
                                <span className="test-category-admin">
                                    {test.category}
                                    {test.category_hi && ` (${test.category_hi})`}
                                </span>
                            </div>

                            <div className="test-info-admin">
                                <h3>{test.name}</h3>
                                {test.name_hi && <h4 style={{ fontSize: '0.9rem', color: '#475569', marginTop: '2px', fontWeight: 'normal' }}>Name (Hindi): {test.name_hi}</h4>}
                                <p className="test-desc-admin">{test.description || 'No description provided.'}</p>
                                {test.description_hi && <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>Desc (Hindi): {test.description_hi}</p>}
                                
                                <div className="test-details-admin">
                                    <div className="detail-item">
                                        <Clock size={16} />
                                        <span>{test.time}</span>
                                    </div>
                                    <div className="detail-price" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {test.originalPrice && (
                                            <span style={{ textDecoration: 'line-through', color: '#ef4444', fontSize: '0.85rem', fontWeight: '500' }}>
                                                {test.originalPrice.startsWith('₹') ? test.originalPrice : `₹${test.originalPrice}`}
                                            </span>
                                        )}
                                        <span style={{ color: '#000000', fontWeight: '800' }}>
                                            {test.price.startsWith('₹') ? test.price : `₹${test.price}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="test-status-admin">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={test.isActive}
                                            onChange={() => toggleStatus(test)}
                                        />
                                        <span className="slider-toggle"></span>
                                    </label>
                                    <span className={`status-text ${test.isActive ? 'active' : 'inactive'}`}>
                                        {test.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="test-actions-admin">
                                <button className="btn-edit-admin" onClick={() => openModal(test)} title="Edit Test">
                                    <Edit size={16} /> Edit
                                </button>
                                <button className="btn-delete-admin" onClick={() => handleDelete(test._id)} title="Delete Test">
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <h2>{editingTest ? 'Edit Medical Test' : 'Add New Medical Test'}</h2>
                                <button className="modal-close" onClick={closeModal}>&times;</button>
                            </div>
                            
                            {/* Language Toggle */}
                            <div style={{ background: '#f1f5f9', borderRadius: '999px', padding: '4px', display: 'flex', border: '1px solid #cbd5e1' }}>
                                <button
                                    type="button"
                                    onClick={() => setActiveLang('en')}
                                    style={{
                                        padding: '6px 18px', borderRadius: '999px', border: 'none',
                                        background: activeLang === 'en' ? 'white' : 'transparent',
                                        color: activeLang === 'en' ? 'var(--primary)' : '#64748b',
                                        fontWeight: activeLang === 'en' ? '700' : '500',
                                        cursor: 'pointer', fontSize: '0.85rem',
                                        boxShadow: activeLang === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    English
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveLang('hi')}
                                    style={{
                                        padding: '6px 18px', borderRadius: '999px', border: 'none',
                                        background: activeLang === 'hi' ? 'white' : 'transparent',
                                        color: activeLang === 'hi' ? 'var(--primary)' : '#64748b',
                                        fontWeight: activeLang === 'hi' ? '700' : '500',
                                        cursor: 'pointer', fontSize: '0.85rem',
                                        boxShadow: activeLang === 'hi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    Hindi
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="test-form">
                            {activeLang === 'en' ? (
                                <>
                                    <div className="form-group">
                                        <label>Test Name * (English)</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Complete Blood Count (CBC)"
                                            required
                                        />
                                    </div>

                                    <div className="form-row-admin">
                                        <div className="form-group">
                                            <label>Category * (English)</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                required
                                            >
                                                {categories.map((cat, idx) => (
                                                    <option key={idx} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Description (English)</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Provide detailed description of test requirements in English (e.g., fasting required)"
                                            rows="3"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Test Name (Hindi)</label>
                                        <input
                                            type="text"
                                            name="name_hi"
                                            value={formData.name_hi || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. कम्प्लीट ब्लड काउंट (सीबीसी)"
                                        />
                                    </div>

                                    <div className="form-row-admin">
                                        <div className="form-group">
                                            <label>Category (Hindi)</label>
                                            <input
                                                type="text"
                                                name="category_hi"
                                                value={formData.category_hi || ''}
                                                onChange={handleChange}
                                                placeholder="e.g. सामान्य स्वास्थ्य"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Description (Hindi)</label>
                                        <textarea
                                            name="description_hi"
                                            value={formData.description_hi || ''}
                                            onChange={handleChange}
                                            placeholder="विवरण हिंदी में दर्ज करें..."
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-row-admin">
                                <div className="form-group">
                                    <label>Discounted Price (₹) *</label>
                                    <input
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="e.g. 350 or ₹350"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Original Price (₹) (Optional)</label>
                                    <input
                                        type="text"
                                        name="originalPrice"
                                        value={formData.originalPrice || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 500 or ₹500"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Duration *</label>
                                    <input
                                        type="text"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleChange}
                                        placeholder="e.g. 15 mins or 1 hour"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row-admin">
                                <div className="form-group checkbox-admin">
                                    <label className="checkbox-label-admin">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                        />
                                        <span>Available for booking</span>
                                    </label>
                                </div>
                            </div>


                            <div className="form-group">
                                <label>Test Cover Image</label>
                                <div className="image-upload-container-admin">
                                    <div className="image-input-wrapper-admin">
                                        <input
                                            type="text"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleChange}
                                            placeholder="Image URL or upload"
                                            className="form-input-admin"
                                        />
                                        <label className={`btn-upload-admin ${uploading ? 'uploading' : ''}`}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                hidden
                                                disabled={uploading}
                                            />
                                            {uploading ? 'Uploading...' : <><Upload size={16} /> Upload</>}
                                        </label>
                                    </div>
                                    <small className="upload-hint">Recommended ratio 3:2, max file size: 4MB</small>
                                    
                                    {formData.image && (
                                        <div className="image-preview-admin">
                                            <img 
                                                src={formData.image.startsWith('http') ? formData.image : `${API_BASE_URL}${formData.image.startsWith('/') ? '' : '/'}${formData.image}`} 
                                                alt="Preview" 
                                            />
                                            <button
                                                type="button"
                                                className="btn-remove-image-admin"
                                                onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions-admin">
                                <button type="button" className="btn-cancel-admin" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit-admin">
                                    {editingTest ? 'Update Test' : 'Create Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBodyTests;
