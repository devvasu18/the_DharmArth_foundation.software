import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminSliders = () => {
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState('image'); // 'image' or 'text'

    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '', title_hi: '', subtitle: '', subtitle_hi: '', imageUrl: '', order: 0, ctaLink: '', ctaText: 'Donate', type: 'image'
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
            type: slider.type || 'image'
        });
        setActiveTab(slider.type === 'text' ? 'text' : 'image');
        setEditingId(slider._id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            title: '', title_hi: '', subtitle: '', subtitle_hi: '', imageUrl: '', order: 0, ctaLink: '', ctaText: 'Donate',
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
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>

                        {activeTab === 'text' && (
                            <>
                                <input className="form-input" placeholder="Title (En)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                                <input className="form-input" placeholder="Title (Hi)" value={formData.title_hi} onChange={e => setFormData({ ...formData, title_hi: e.target.value })} />

                                <input className="form-input" placeholder="Subtitle (En)" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
                                <input className="form-input" placeholder="Subtitle (Hi)" value={formData.subtitle_hi} onChange={e => setFormData({ ...formData, subtitle_hi: e.target.value })} />

                                <input className="form-input" placeholder="CTA Text (e.g. Donate)" value={formData.ctaText} onChange={e => setFormData({ ...formData, ctaText: e.target.value })} />
                                <input className="form-input" placeholder="CTA Link (e.g. /donate)" value={formData.ctaLink} onChange={e => setFormData({ ...formData, ctaLink: e.target.value })} />
                            </>
                        )}

                        {activeTab === 'image' && (
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Slider Image</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="form-input"
                                    />
                                    {uploading && <span>Uploading...</span>}
                                </div>
                                {formData.imageUrl && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'green' }}>Image Uploaded!</p>
                                        <img src={formData.imageUrl} alt="Preview" style={{ height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        )}

                        <input type="number" className="form-input" placeholder="Order (e.g. 1)" value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />

                        <button type="submit" className="btn bg-primary text-white" disabled={uploading}>
                            {editingId ? 'Update' : 'Save'}
                        </button>
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
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                        onClick={() => handleEdit(slider)}
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
    );
};

export default AdminSliders;
