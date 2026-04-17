import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { Plus, Edit, Trash2, Eye, Video, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminEventHeaders = () => {
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeLang, setActiveLang] = useState('en');

    // Form State
    const [formData, setFormData] = useState({
        _id: null,
        type: 'image',
        url: '',
        title: '', title_hi: '',
        subtitle: '', subtitle_hi: '',
        description: '', description_hi: '',
        ctaText: 'Learn More', ctaText_hi: '',
        ctaLink: '',
        titleColor: '#ffffff',
        descriptionColor: '#ffffff',
        textPosition: 'center',
        isActive: true,
        order: 0
    });

    useEffect(() => {
        fetchHeaders();
    }, []);

    const fetchHeaders = async () => {
        try {
            const res = await api.get('/event-headers/admin');
            setHeaders(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load headers');
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const res = await api.post('/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            setFormData({ ...formData, url: res.data.imageUrl });
            toast.success('File uploaded');
        } catch (error) {
            console.error(error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData._id) {
                await api.put(`/event-headers/${formData._id}`, formData);
                toast.success('Header updated');
            } else {
                await api.post('/event-headers', formData);
                toast.success('Header created');
            }

            resetForm();
            fetchHeaders();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save header');
        }
    };

    const handleEdit = (header) => {
        setFormData(header);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this slide?')) return;
        try {
            await api.delete(`/event-headers/${id}`);
            setHeaders(headers.filter(h => h._id !== id));
            toast.success('Deleted successfully');
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleSeed = async () => {
        if (!window.confirm('This will replace all current banners with dummy ones. Continue?')) return;
        try {
            await api.post('/event-headers/seed', {});
            toast.success('Dummy banners seeded successfully');
            fetchHeaders();
        } catch (error) {
            console.error(error);
            toast.error('Failed to seed dummy banners');
        }
    };

    const resetForm = () => {
        setFormData({
            _id: null, type: 'image', url: '', title: '', title_hi: '',
            subtitle: '', subtitle_hi: '', description: '', description_hi: '',
            ctaText: 'Learn More', ctaText_hi: '', ctaLink: '', textPosition: 'center', isActive: true, order: 0,
            titleColor: '#ffffff', descriptionColor: '#ffffff'
        });
        setIsEditing(false);
    };

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Events Header Manager</h2>
                <div>
                    <button className="btn-secondary" onClick={handleSeed} style={{ marginRight: 10 }}>
                        Seed Dummy Banners
                    </button>
                    {!isEditing && (
                        <button className="btn-primary" onClick={() => setIsEditing(true)}>
                            <Plus size={18} /> Add New Slide
                        </button>
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="admin-card" style={{ marginBottom: 30, padding: 20, background: 'white', borderRadius: 8, border: '1px solid #ddd' }}>
                    <h3 style={{ marginBottom: 20 }}>{formData._id ? 'Edit Slide' : 'New Slide'}</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Media Type</label>
                                <div style={{ display: 'flex', gap: 15 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                        <input
                                            type="radio" name="type" value="image"
                                            checked={formData.type === 'image'}
                                            onChange={() => setFormData({ ...formData, type: 'image' })}
                                        /> Image
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                        <input
                                            type="radio" name="type" value="video"
                                            checked={formData.type === 'video'}
                                            onChange={() => setFormData({ ...formData, type: 'video' })}
                                        /> Video
                                    </label>
                                </div>
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Media URL / Upload</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input
                                        type="text" className="form-control"
                                        placeholder={formData.type === 'video' ? 'Video URL' : 'Image URL'}
                                        style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        required
                                    />
                                    <input type="file" onChange={handleFileUpload} style={{ width: 100 }} />
                                </div>
                                {formData.type === 'image' && formData.url && (
                                    <img src={formData.url} alt="Preview" style={{ height: 100, marginTop: 10, borderRadius: 4 }} />
                                )}
                            </div>



                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, gridColumn: 'span 2' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: 5 }}>Title Color</label>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <input type="color" value={formData.titleColor} onChange={e => setFormData({ ...formData, titleColor: e.target.value })} style={{ height: 40, width: 60, padding: 0, border: 'none' }} />
                                        <input type="text" className="form-control" value={formData.titleColor} onChange={e => setFormData({ ...formData, titleColor: e.target.value })} style={{ flex: 1, padding: 8 }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: 5 }}>Description Color</label>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <input type="color" value={formData.descriptionColor} onChange={e => setFormData({ ...formData, descriptionColor: e.target.value })} style={{ height: 40, width: 60, padding: 0, border: 'none' }} />
                                        <input type="text" className="form-control" value={formData.descriptionColor} onChange={e => setFormData({ ...formData, descriptionColor: e.target.value })} style={{ flex: 1, padding: 8 }} />
                                    </div>
                                </div>
                            </div>

                            {/* Language Switcher */}
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                                <div style={{ background: '#f0f0f0', padding: 4, borderRadius: 20, display: 'flex' }}>
                                    <button type="button" onClick={() => setActiveLang('en')} style={{ padding: '5px 20px', borderRadius: 16, border: 'none', background: activeLang === 'en' ? 'white' : 'transparent', fontWeight: activeLang === 'en' ? 600 : 400, cursor: 'pointer' }}>English</button>
                                    <button type="button" onClick={() => setActiveLang('hi')} style={{ padding: '5px 20px', borderRadius: 16, border: 'none', background: activeLang === 'hi' ? 'white' : 'transparent', fontWeight: activeLang === 'hi' ? 600 : 400, cursor: 'pointer' }}>Hindi</button>
                                </div>
                            </div>

                            {activeLang === 'en' ? (
                                <>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 5 }}>Title (EN)</label>
                                        <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 5 }}>Subtitle (EN)</label>
                                        <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Description (EN)</label>
                                        <textarea className="form-control" style={{ width: '100%', padding: 8 }} rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 5 }}>CTA Text (EN)</label>
                                        <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.ctaText} onChange={e => setFormData({ ...formData, ctaText: e.target.value })} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 5 }}>Title (HI)</label>
                                        <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.title_hi} onChange={e => setFormData({ ...formData, title_hi: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 5 }}>Subtitle (HI)</label>
                                        <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.subtitle_hi} onChange={e => setFormData({ ...formData, subtitle_hi: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', marginBottom: 5 }}>Description (HI)</label>
                                        <textarea className="form-control" style={{ width: '100%', padding: 8 }} rows="2" value={formData.description_hi} onChange={e => setFormData({ ...formData, description_hi: e.target.value })}></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: 5 }}>CTA Text (HI)</label>
                                        <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.ctaText_hi} onChange={e => setFormData({ ...formData, ctaText_hi: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: 5 }}>CTA Link</label>
                                <input type="text" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.ctaLink} onChange={e => setFormData({ ...formData, ctaLink: e.target.value })} placeholder="/donate" />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: 5 }}>Text Position</label>
                                <select
                                    className="form-control"
                                    style={{ width: '100%', padding: 8 }}
                                    value={formData.textPosition || 'center'}
                                    onChange={e => setFormData({ ...formData, textPosition: e.target.value })}
                                >
                                    <option value="center">Center (Default)</option>
                                    <option value="left">Left Side</option>
                                    <option value="right">Right Side</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: 5 }}>Order</label>
                                <input type="number" className="form-control" style={{ width: '100%', padding: 8 }} value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                    Active
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-outline" onClick={resetForm} style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={uploading}>
                                {formData._id ? 'Update Slide' : 'Create Slide'}
                            </button>
                        </div>
                    </form>
                </div >
            )}

            <div className="admin-card" style={{ background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb', borderBottom: '1px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: 12, textAlign: 'left' }}>Order</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Preview</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Title</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {headers.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center' }}>No slides found.</td></tr>
                        ) : headers.map(h => (
                            <tr key={h._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 12 }}>{h.order}</td>
                                <td style={{ padding: 12 }}>
                                    {h.type === 'video' ? <Video size={24} /> : <img src={h.url.startsWith('http') ? h.url : `${API_BASE_URL}${h.url.startsWith('/') ? '' : '/'}${h.url}`} style={{ width: 50, height: 30, objectFit: 'cover', borderRadius: 4 }} alt="" />}
                                </td>
                                <td style={{ padding: 12 }}>
                                    <div>{h.title || 'No Title'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{h.subtitle}</div>
                                </td>
                                <td style={{ padding: 12 }}>
                                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.8rem', background: h.isActive ? '#dcfce7' : '#f3f4f6', color: h.isActive ? '#166534' : '#666' }}>
                                        {h.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: 12 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleEdit(h)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: '#2563eb' }}><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(h._id)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: '#dc2626' }}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
};

export default AdminEventHeaders;
