import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminSliders = () => {
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState('image'); // 'image' or 'text'

    const [editingId, setEditingId] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null); // ID of item to delete

    const [activeLang, setActiveLang] = useState('en'); // 'en' or 'hi'

    // Form State
    const [formData, setFormData] = useState({
        title: '', title_hi: '', subtitle: '', subtitle_hi: '', imageUrl: '', order: 0, ctaLink: '', ctaText: 'Donate', ctaText_hi: '', type: 'image'
    });

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            const { data } = await api.get('/content/sliders');
            setSliders(data);
        } catch (error) {
            console.error("Failed to fetch sliders", error);
        } finally {
            setLoading(false);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const { data } = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, imageUrl: data.imageUrl });
        } catch (error) {
            console.error('Upload failed', error);
            alert('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (slider) => {
        setFormData({
            title: slider.title || '',
            title_hi: slider.title_hi || '',
            subtitle: slider.subtitle || '',
            subtitle_hi: slider.subtitle_hi || '',
            imageUrl: slider.imageUrl || '',
            order: slider.order || 0,
            ctaLink: slider.ctaLink || '',
            ctaText: slider.ctaText || 'Donate',
            ctaText_hi: slider.ctaText_hi || '',
            type: slider.type || 'image'
        });
        setActiveTab(slider.type === 'text' ? 'text' : 'image');
        setEditingId(slider._id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            title: '', title_hi: '', subtitle: '', subtitle_hi: '', imageUrl: '', order: 0, ctaLink: '', ctaText: 'Donate', ctaText_hi: '',
            type: activeTab
        });
        setEditingId(null);
        setIsAdding(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, type: activeTab };

            if (editingId) {
                await api.put(`/content/sliders/${editingId}`, payload);
                alert("Slider Updated!");
            } else {
                await api.post('/content/sliders', payload);
                alert("Slider Created!");
            }
            resetForm();
            fetchSliders(); // Refresh
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save slider');
        }
    };

    const handleDelete = (id) => {
        setDeleteConfirmation(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        try {
            await api.delete(`/content/sliders/${deleteConfirmation}`);
            alert("Item deleted!");
            fetchSliders();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete item");
        } finally {
            setDeleteConfirmation(null);
        }
    };

    const filteredSliders = sliders.filter(s => {
        if (activeTab === 'image') return s.type === 'image' || !s.type; // Backward compat
        return s.type === 'text';
    });

    if (loading) return <div>Loading sliders...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Hero Sliders Manager</h3>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    onClick={() => { setActiveTab('image'); setIsAdding(false); }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'image' ? '2px solid #008080' : 'none',
                        fontWeight: activeTab === 'image' ? 'bold' : 'normal',
                        color: activeTab === 'image' ? '#008080' : '#64748b',
                        background: 'none', border: 'none', cursor: 'pointer'
                    }}
                >
                    Shifter Images
                </button>
                <button
                    onClick={() => { setActiveTab('text'); setIsAdding(false); }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'text' ? '2px solid #008080' : 'none',
                        fontWeight: activeTab === 'text' ? 'bold' : 'normal',
                        color: activeTab === 'text' ? '#008080' : '#64748b',
                        background: 'none', border: 'none', cursor: 'pointer'
                    }}
                >
                    Text Content
                </button>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn bg-primary text-white" onClick={() => {
                    if (isAdding) resetForm();
                    else {
                        resetForm(); // Ensure clean state with correct type
                        setIsAdding(true);
                    }
                }}>
                    {isAdding ? 'Cancel' : `+ Add New ${activeTab === 'image' ? 'Image' : 'Text'}`}
                </button>
            </div>

            {isAdding && (
                <div className="admin-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h4>{editingId ? 'Edit Item' : `Add New ${activeTab === 'image' ? 'Image' : 'Text Content'}`}</h4>
                    <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>

                        {activeTab === 'text' && (
                            <div style={{ marginBottom: '2rem' }}>
                                {/* Language Toggle */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                    <div style={{ background: '#e2e8f0', borderRadius: '999px', padding: '4px', display: 'flex' }}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveLang('en')}
                                            style={{
                                                padding: '0.5rem 2rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                background: activeLang === 'en' ? 'white' : 'transparent',
                                                color: activeLang === 'en' ? '#008080' : '#64748b',
                                                fontWeight: activeLang === 'en' ? '600' : '500',
                                                boxShadow: activeLang === 'en' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            English
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveLang('hi')}
                                            style={{
                                                padding: '0.5rem 2rem',
                                                borderRadius: '999px',
                                                border: 'none',
                                                background: activeLang === 'hi' ? 'white' : 'transparent',
                                                color: activeLang === 'hi' ? '#008080' : '#64748b',
                                                fontWeight: activeLang === 'hi' ? '600' : '500',
                                                boxShadow: activeLang === 'hi' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Hindi
                                        </button>
                                    </div>
                                </div>

                                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                    {activeLang === 'en' ? (
                                        <>
                                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Title (English)</label>
                                                <input className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="Enter title in English" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Subtitle (English)</label>
                                                <textarea className="form-input" style={{ width: '100%', padding: '0.75rem', minHeight: '80px' }} placeholder="Enter subtitle description" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>CTA Button Text</label>
                                                <input className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. Donate Now" value={formData.ctaText} onChange={e => setFormData({ ...formData, ctaText: e.target.value })} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Title (Hindi)</label>
                                                <input className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="Enter title in Hindi" value={formData.title_hi} onChange={e => setFormData({ ...formData, title_hi: e.target.value })} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Subtitle (Hindi)</label>
                                                <textarea className="form-input" style={{ width: '100%', padding: '0.75rem', minHeight: '80px' }} placeholder="Enter subtitle description in Hindi" value={formData.subtitle_hi} onChange={e => setFormData({ ...formData, subtitle_hi: e.target.value })} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>CTA Button Text (Hindi)</label>
                                                <input className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. दान करें" value={formData.ctaText_hi} onChange={e => setFormData({ ...formData, ctaText_hi: e.target.value })} />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div className="form-group">
                                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>CTA Link Route</label>
                                            <input className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. /donate" value={formData.ctaLink} onChange={e => setFormData({ ...formData, ctaLink: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Display Order</label>
                                            <input type="number" className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. 1" value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                        <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancel</button>
                                        <button type="submit" className="btn bg-primary text-white" disabled={uploading} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                            {editingId ? 'Update Content' : 'Save Content'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'image' && (
                            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#334155' }}>Upload Slider Image</label>
                                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', textAlign: 'center', background: '#f8fafc' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            id="slider-upload"
                                        />
                                        <label htmlFor="slider-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                            {formData.imageUrl ? (
                                                <img src={formData.imageUrl} alt="Preview" style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                            ) : (
                                                <div style={{ padding: '2rem' }}>
                                                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🖼️</span>
                                                    <span style={{ color: '#64748b', fontWeight: '500' }}>Click to Browse Image</span>
                                                </div>
                                            )}
                                        </label>
                                        {uploading && <p style={{ marginTop: '1rem', color: '#008080' }}>Uploading...</p>}
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '2rem' }}>
                                    <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>Display Order</label>
                                    <input type="number" className="form-input" style={{ width: '100%', padding: '0.75rem' }} placeholder="e.g. 1" value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancel</button>
                                    <button type="submit" className="btn bg-primary text-white" disabled={uploading || !formData.imageUrl} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                        {editingId ? 'Update Image' : 'Save Image'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}

            <div className="admin-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            {activeTab === 'image' && <th>Image</th>}
                            {activeTab === 'text' && <th>Title</th>}
                            {activeTab === 'text' && <th>Subtitle</th>}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSliders.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No {activeTab} slides found.</td></tr>
                        ) : filteredSliders.map(slider => (
                            <tr key={slider._id}>
                                <td style={{ width: '50px', textAlign: 'center' }}>{slider.order}</td>
                                {activeTab === 'image' && (
                                    <td><img src={slider.imageUrl} alt="prev" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /></td>
                                )}
                                {activeTab === 'text' && (
                                    <>
                                        <td>{slider.title}</td>
                                        <td>{slider.subtitle ? slider.subtitle.substring(0, 30) + '...' : ''}</td>
                                    </>
                                )}
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                            onClick={() => handleEdit(slider)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '5px 10px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                                            onClick={() => handleDelete(slider._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {deleteConfirmation && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#1a202c' }}>Confirm Delete</h4>
                        <p style={{ marginBottom: '1.5rem', color: '#4a5568' }}>Are you sure you want to delete this item? This action cannot be undone.</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => setDeleteConfirmation(null)}>Cancel</button>
                            <button className="btn bg-primary text-white" style={{ background: '#ef4444' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSliders;
