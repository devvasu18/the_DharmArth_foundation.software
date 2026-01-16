import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Save, ArrowLeft, Image as ImageIcon, Video, Type, Youtube, Instagram,
    Trash2, ArrowUp, ArrowDown, Move, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './EventEditor.css';

const EventEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        coverImage: '',
        heroImages: [],
        date: '',
        location: '',
        shortDescription: '',
        status: 'upcoming',
        blocks: [],
        metaTitle: '',
        metaDescription: '',
        isPublished: false
    });

    useEffect(() => {
        if (isEditMode) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await axios.get(`http://localhost:5000/api/events/admin/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setFormData(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load event');
            navigate('/admin/events');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Block Management
    const addBlock = (type) => {
        const newBlock = {
            id: Date.now().toString(),
            type,
            content: getDefaultContent(type)
        };
        setFormData({
            ...formData,
            blocks: [...formData.blocks, newBlock]
        });
    };

    const getDefaultContent = (type) => {
        switch (type) {
            case 'image': return { url: '', title: '', layout: 'default' };
            case 'video': return { url: '', caption: '' };
            case 'text': return { html: '' };
            case 'youtube': return { url: '', caption: '' };
            case 'instagram': return { url: '' };
            default: return {};
        }
    };

    const updateBlock = (index, field, value) => {
        const newBlocks = [...formData.blocks];
        newBlocks[index].content = {
            ...newBlocks[index].content,
            [field]: value
        };
        setFormData({ ...formData, blocks: newBlocks });
    };

    const removeBlock = (index) => {
        if (!window.confirm('Remove this block?')) return;
        const newBlocks = formData.blocks.filter((_, i) => i !== index);
        setFormData({ ...formData, blocks: newBlocks });
    };

    const moveBlock = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === formData.blocks.length - 1) return;

        const newBlocks = [...formData.blocks];
        const temp = newBlocks[index];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        newBlocks[index] = newBlocks[targetIndex];
        newBlocks[targetIndex] = temp;

        setFormData({ ...formData, blocks: newBlocks });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.status === 'completed' && formData.date) {
            const selectedDate = new Date(formData.date).toISOString().slice(0, 10);
            const today = new Date().toLocaleDateString('en-CA');
            if (selectedDate > today) {
                return toast.error('Future dates are not allowed for completed events');
            }
        }

        setSaving(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (isEditMode) {
                await axios.put(`http://localhost:5000/api/events/${id}`, formData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                toast.success('Event updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/events', formData, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                toast.success('Event created successfully');
                navigate('/admin/events');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error saving event');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const toastId = toast.loading('Uploading...');
            const res = await axios.post('http://localhost:5000/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(toastId);

            if (field === 'coverImage') {
                setFormData({ ...formData, coverImage: res.data.imageUrl });
            } else {
                // Must be a block update, tricky to pass index here directly without wrapper
            }
            toast.success('Uploaded');
            return res.data.imageUrl;
        } catch (error) {
            toast.error('Upload failed');
            return null;
        }
    };

    const handleBlockFileUpload = async (e, index, field) => {
        const url = await handleFileUpload(e);
        if (url) {
            updateBlock(index, field, url);
        }
    };

    if (loading) return <div className="loading-container"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="event-editor-container">
            <form onSubmit={handleSubmit}>
                <div className="editor-header">
                    <div className="header-left">
                        <button type="button" onClick={() => navigate('/admin/events')} className="btn-back" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <ArrowLeft size={20} /> Back
                        </button>
                        <h2>{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
                    </div>
                    <div className="editor-actions">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? ' Saving...' : ' Save Event'}
                        </button>
                    </div>
                </div>

                <div className="editor-section">
                    <h3>Basic Information</h3>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Event Title</label>
                            <input
                                type="text" name="title" className="form-control" required
                                value={formData.title} onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Slug (URL Friendly)</label>
                            <input
                                type="text" name="slug" className="form-control"
                                value={formData.slug} onChange={handleInputChange}
                                placeholder="Auto-generated from title if empty"
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Event Date</label>
                            <input
                                type="date" name="date" className="form-control"
                                max={formData.status === 'completed' ? new Date().toLocaleDateString('en-CA') : undefined}
                                value={formData.date ? new Date(formData.date).toISOString().slice(0, 10) : ''} onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text" name="location" className="form-control"
                                value={formData.location} onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Cover Image URL (or upload)</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input
                                    type="text" name="coverImage" className="form-control"
                                    value={formData.coverImage} onChange={handleInputChange}
                                />
                                <input type="file" onChange={(e) => handleFileUpload(e, 'coverImage')} style={{ width: 100 }} />
                            </div>
                            {formData.coverImage && <img src={formData.coverImage} className="preview-img" alt="Cover" />}
                        </div>
                        <div className="form-group full-width">
                            <label>Hero Slider Images (Optional - overrides Cover Image on page)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                                {formData.heroImages && formData.heroImages.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative', width: 100, height: 60 }}>
                                        <img src={img} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newImages = formData.heroImages.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, heroImages: newImages });
                                            }}
                                            style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 18, height: 18, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
                                        >X</button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input type="file" multiple onChange={async (e) => {
                                    const files = Array.from(e.target.files);
                                    for (const file of files) {
                                        const uploadData = new FormData();
                                        uploadData.append('image', file);
                                        try {
                                            const res = await axios.post('http://localhost:5000/api/upload', uploadData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            setFormData(prev => ({
                                                ...prev,
                                                heroImages: [...(prev.heroImages || []), res.data.imageUrl]
                                            }));
                                        } catch (err) {
                                            toast.error('Failed to upload an image');
                                        }
                                    }
                                }} />
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>Short Description</label>
                            <textarea
                                name="shortDescription" className="form-control" rows="3"
                                value={formData.shortDescription} onChange={handleInputChange}
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox" name="isPublished"
                                    checked={formData.isPublished} onChange={handleInputChange}
                                /> Publish Event
                            </label>
                        </div>
                    </div>
                </div>

                <div className="editor-section">
                    <h3>Content Blocks</h3>
                    <div className="blocks-container">
                        {formData.blocks.map((block, index) => (
                            <div key={block.id || index} className="content-block">
                                <div className="block-header">
                                    <span className="block-type-badge">{block.type}</span>
                                    <div className="block-controls">
                                        <button type="button" className="control-btn" onClick={() => moveBlock(index, 'up')} title="Move Up"><ArrowUp size={14} /></button>
                                        <button type="button" className="control-btn" onClick={() => moveBlock(index, 'down')} title="Move Down"><ArrowDown size={14} /></button>
                                        <button type="button" className="control-btn delete" onClick={() => removeBlock(index)} title="Remove"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <div className="block-content">
                                    {block.type === 'image' && (
                                        <div className="image-block-grid">
                                            <div className="form-group">
                                                <label>Image URL</label>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <input type="text" className="form-control" value={block.content.url} onChange={(e) => updateBlock(index, 'url', e.target.value)} />
                                                    <input type="file" onChange={(e) => handleBlockFileUpload(e, index, 'url')} style={{ width: 80 }} />
                                                </div>
                                                {block.content.url && <img src={block.content.url} className="preview-img" alt="Preview" />}
                                            </div>
                                            <div className="form-group">
                                                <label>Title/Caption</label>
                                                <input type="text" className="form-control" value={block.content.title} onChange={(e) => updateBlock(index, 'title', e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'text' && (
                                        <div className="form-group">
                                            <label>Content (HTML/Markdown)</label>
                                            <textarea
                                                className="form-control" rows="5"
                                                value={block.content.html}
                                                onChange={(e) => updateBlock(index, 'html', e.target.value)}
                                                placeholder="Write your text here..."
                                            ></textarea>
                                        </div>
                                    )}

                                    {block.type === 'youtube' && (
                                        <div className="form-group">
                                            <label>YouTube Link</label>
                                            <input
                                                type="text" className="form-control"
                                                value={block.content.url}
                                                onChange={(e) => updateBlock(index, 'url', e.target.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </div>
                                    )}

                                    {block.type === 'video' && (
                                        <div className="image-block-grid">
                                            <div className="form-group">
                                                <label>Video URL (MP4/WebM)</label>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    <input type="text" className="form-control" value={block.content.url} onChange={(e) => updateBlock(index, 'url', e.target.value)} />
                                                    <input type="file" onChange={(e) => handleBlockFileUpload(e, index, 'url')} style={{ width: 80 }} />
                                                </div>
                                                {block.content.url && <video src={block.content.url} className="preview-img" controls />}
                                            </div>
                                            <div className="form-group">
                                                <label>Caption</label>
                                                <input type="text" className="form-control" value={block.content.caption} onChange={(e) => updateBlock(index, 'caption', e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'instagram' && (
                                        <div className="form-group">
                                            <label>Instagram Post/Reel Link</label>
                                            <input
                                                type="text" className="form-control"
                                                value={block.content.url}
                                                onChange={(e) => updateBlock(index, 'url', e.target.value)}
                                                placeholder="https://instagram.com/reel/..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {formData.blocks.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                                No content blocks yet. Add one below!
                            </div>
                        )}
                    </div>

                    <div className="add-block-section">
                        <h4>Add Content Block</h4>
                        <div className="add-block-buttons">
                            <button type="button" className="add-btn" onClick={() => addBlock('text')}>
                                <Type size={16} /> Text
                            </button>
                            <button type="button" className="add-btn" onClick={() => addBlock('image')}>
                                <ImageIcon size={16} /> Image
                            </button>
                            <button type="button" className="add-btn" onClick={() => addBlock('video')}>
                                <Video size={16} /> Video
                            </button>
                            <button type="button" className="add-btn" onClick={() => addBlock('youtube')}>
                                <Youtube size={16} /> YouTube
                            </button>
                            <button type="button" className="add-btn" onClick={() => addBlock('instagram')}>
                                <Instagram size={16} /> Instagram
                            </button>
                        </div>
                    </div>
                </div>

                <div className="editor-section">
                    <h3>SEO Settings</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Meta Title</label>
                            <input type="text" name="metaTitle" className="form-control" value={formData.metaTitle} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Meta Description</label>
                            <input type="text" name="metaDescription" className="form-control" value={formData.metaDescription} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EventEditor;
