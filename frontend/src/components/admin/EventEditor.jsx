import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import {
    Save, ArrowLeft, Image as ImageIcon, Video, Type, Youtube, Instagram,
    Trash2, ArrowUp, ArrowDown, Move, Loader2, AlertTriangle, Bell, Users, CheckCircle2, MessageSquare, Info
} from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import toast from 'react-hot-toast';
import UserSelectorModal from './UserSelectorModal';
import './EventEditor.css';

const EventEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [blockTabs, setBlockTabs] = useState({}); // To track active language tab for each block
    const [globalLang, setGlobalLang] = useState('en');

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

    const [notificationData, setNotificationData] = useState({
        sendNotification: false,
        targetType: 'none', // 'all', 'selected', 'none'
        userIds: [],
        channels: ['whatsapp', 'app']
    });

    const [userSelectorOpen, setUserSelectorOpen] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/events/admin/${id}`);
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
            case 'text': return { html: '', htmlHi: '' };
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
            let savedEvent;
            if (isEditMode) {
                const res = await api.put(`/events/${id}`, formData);
                savedEvent = res.data;
                toast.success('Event updated successfully');
            } else {
                const res = await api.post('/events', formData);
                savedEvent = res.data;
                toast.success('Event created successfully');
            }

            // Send Notifications if enabled
            if (notificationData.sendNotification && notificationData.targetType !== 'none') {
                try {
                    await api.post(`/events/${savedEvent._id}/notify`, {
                        targetType: notificationData.targetType,
                        userIds: notificationData.userIds,
                        channels: notificationData.channels
                    });
                    toast.success('Notifications queued successfully');
                } catch (err) {
                    console.error("Notification failed", err);
                    toast.error('Event saved but notifications failed to queue');
                }
            }

            if (!isEditMode) navigate('/admin/events');
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
            const res = await api.post('/upload', uploadData, {
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
                        <button type="button" onClick={() => navigate('/admin/events')} className="btn-back-modern">
                            <ArrowLeft size={18} /> Back to Events
                        </button>
                        <h2>{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
                    </div>
                    <div className="editor-actions">
                        {isEditMode && (
                            <button 
                                type="button" 
                                className="btn-secondary-modern" 
                                style={{ marginRight: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => setNotificationData({ ...notificationData, sendNotification: true })}
                            >
                                <Bell size={18} /> Resend Notification
                            </button>
                        )}
                        <button type="submit" className="btn-save-premium" disabled={saving}>
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? ' Saving Changes...' : ' Save Event'}
                        </button>
                    </div>
                </div>

                <div className="editor-section">
                    <div className="section-title-row">
                        <h3>Basic Information</h3>
                        <div className="lang-switch-modern">
                            <button type="button" 
                                className={`lang-btn ${globalLang === 'en' ? 'active' : ''}`}
                                onClick={() => setGlobalLang('en')}>English</button>
                            <button type="button" 
                                className={`lang-btn ${globalLang === 'hi' ? 'active' : ''}`}
                                onClick={() => setGlobalLang('hi')}>Hindi</button>
                        </div>
                    </div>

                    <div className="form-grid">
                        {globalLang === 'en' ? (
                            <>
                                <div className="form-group full-width">
                                    <label className="modern-label">Event Title (English)</label>
                                    <input
                                        type="text" name="title" className="modern-input" required
                                        value={formData.title} onChange={handleInputChange}
                                        placeholder="Enter event name..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="modern-label">Location (English)</label>
                                    <input
                                        type="text" name="location" className="modern-input"
                                        value={formData.location} onChange={handleInputChange}
                                        placeholder="Where is the event?"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="modern-label">Short Description (English)</label>
                                    <textarea
                                        name="shortDescription" className="modern-textarea" rows="3"
                                        value={formData.shortDescription} onChange={handleInputChange}
                                        placeholder="Brief summary of the event..."
                                    ></textarea>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group full-width">
                                    <label className="modern-label">Event Title (Hindi)</label>
                                    <input
                                        type="text" name="title_hi" className="modern-input"
                                        value={formData.title_hi || ''} onChange={handleInputChange}
                                        placeholder="कार्यक्रम का नाम..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="modern-label">Location (Hindi)</label>
                                    <input
                                        type="text" name="location_hi" className="modern-input"
                                        value={formData.location_hi || ''} onChange={handleInputChange}
                                        placeholder="स्थान..."
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="modern-label">Short Description (Hindi)</label>
                                    <textarea
                                        name="shortDescription_hi" className="modern-textarea" rows="3"
                                        value={formData.shortDescription_hi || ''} onChange={handleInputChange}
                                        placeholder="संक्षिप्त विवरण..."
                                    ></textarea>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label className="modern-label">URL Slug</label>
                            <input
                                type="text" name="slug" className="modern-input"
                                value={formData.slug} onChange={handleInputChange}
                                placeholder="auto-generated-url-friendly"
                            />
                        </div>
                        <div className="form-group">
                            <label className="modern-label">Status</label>
                            <select name="status" className="modern-select" value={formData.status} onChange={handleInputChange}>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="modern-label">Category</label>
                            <select name="category" className="modern-select" value={formData.category || 'Social Event'} onChange={handleInputChange}>
                                <option value="Social Event">Social Event</option>
                                <option value="Health Blog">Health Blog</option>
                                <option value="Medical Camp">Medical Camp</option>
                                <option value="Success Story">Success Story</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="modern-label">Event Date</label>
                            <input
                                type="date" name="date" className="modern-input"
                                max={formData.status === 'completed' ? new Date().toLocaleDateString('en-CA') : undefined}
                                value={formData.date ? new Date(formData.date).toISOString().slice(0, 10) : ''} onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label className="modern-label">Main Cover Image</label>
                            <div className="image-upload-wrapper">
                                <div className="url-upload-row">
                                    <input
                                        type="text" name="coverImage" className="modern-input"
                                        value={formData.coverImage} onChange={handleInputChange}
                                        placeholder="Paste image URL or upload file"
                                    />
                                    <label className="btn-upload-modern">
                                        <ImageIcon size={18} /> Upload
                                        <input type="file" onChange={(e) => handleFileUpload(e, 'coverImage')} />
                                    </label>
                                </div>
                                {formData.coverImage && (
                                    <div className="preview-container">
                                        <img 
                                            src={formData.coverImage.startsWith('http') ? formData.coverImage : `${API_BASE_URL}${formData.coverImage.startsWith('/') ? '' : '/'}${formData.coverImage}`} 
                                            className="premium-preview-img" alt="Cover" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label className="modern-label">Gallery Slider Images (Optional)</label>
                            <div className="image-upload-wrapper">
                                {formData.heroImages && formData.heroImages.length > 0 && (
                                    <div className="multi-image-grid">
                                        {formData.heroImages.map((img, idx) => (
                                            <div key={idx} className="multi-image-item">
                                                <img src={img.startsWith('http') ? img : `${API_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`} alt="Hero" />
                                                <button
                                                    type="button"
                                                    className="btn-remove-img"
                                                    onClick={() => {
                                                        const newImages = formData.heroImages.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, heroImages: newImages });
                                                    }}
                                                ><Trash2 size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="btn-upload-modern" style={{ width: 'fit-content' }}>
                                    <ImageIcon size={18} /> Add Images to Gallery
                                    <input type="file" multiple onChange={async (e) => {
                                        const files = Array.from(e.target.files);
                                        for (const file of files) {
                                            const uploadData = new FormData();
                                            uploadData.append('image', file);
                                            try {
                                                const res = await api.post('/upload', uploadData, {
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
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="modern-checkbox-label">
                                <input
                                    type="checkbox" name="isPublished"
                                    checked={formData.isPublished} onChange={handleInputChange}
                                /> 
                                <span>Visible to Public</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="editor-section">
                    <div className="section-title-row">
                        <h3>Content Blocks</h3>
                    </div>
                    
                    <div className="blocks-container">
                        {formData.blocks.map((block, index) => (
                            <div key={block.id || index} className="premium-block">
                                <div className="block-header">
                                    <div className="block-type-chip">
                                        {block.type === 'text' && <Type size={14} />}
                                        {block.type === 'image' && <ImageIcon size={14} />}
                                        {block.type === 'video' && <Video size={14} />}
                                        {block.type === 'youtube' && <Youtube size={14} />}
                                        {block.type === 'instagram' && <Instagram size={14} />}
                                        {block.type}
                                    </div>
                                    <div className="block-actions">
                                        <button type="button" className="action-btn-mini" onClick={() => moveBlock(index, 'up')} title="Move Up"><ArrowUp size={16} /></button>
                                        <button type="button" className="action-btn-mini" onClick={() => moveBlock(index, 'down')} title="Move Down"><ArrowDown size={16} /></button>
                                        <button type="button" className="action-btn-mini delete" onClick={() => removeBlock(index)} title="Remove"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="block-content">
                                    {block.type === 'image' && (
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="modern-label">Image URL / Upload</label>
                                                <div className="url-upload-row">
                                                    <input type="text" className="modern-input" value={block.content.url} onChange={(e) => updateBlock(index, 'url', e.target.value)} />
                                                    <label className="btn-upload-modern">
                                                        <ImageIcon size={16} />
                                                        <input type="file" onChange={(e) => handleBlockFileUpload(e, index, 'url')} />
                                                    </label>
                                                </div>
                                                {block.content.url && (
                                                    <div className="preview-container" style={{ marginTop: '1rem', maxWidth: '200px' }}>
                                                        <img src={block.content.url.startsWith('http') ? block.content.url : `${API_BASE_URL}${block.content.url.startsWith('/') ? '' : '/'}${block.content.url}`} className="premium-preview-img" alt="Preview" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label className="modern-label">Image Caption</label>
                                                <input type="text" className="modern-input" value={block.content.title} onChange={(e) => updateBlock(index, 'title', e.target.value)} placeholder="Describe this image..." />
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'text' && (
                                        <div className="form-group full-width">
                                            <div className="block-tabs">
                                                <button
                                                    type="button"
                                                    className={`tab-pill ${(!blockTabs[block.id] || blockTabs[block.id] === 'en') ? 'active' : ''}`}
                                                    onClick={() => setBlockTabs({ ...blockTabs, [block.id]: 'en' })}
                                                >English</button>
                                                <button
                                                    type="button"
                                                    className={`tab-pill ${blockTabs[block.id] === 'hi' ? 'active' : ''}`}
                                                    onClick={() => setBlockTabs({ ...blockTabs, [block.id]: 'hi' })}
                                                >Hindi</button>
                                            </div>

                                            {(!blockTabs[block.id] || blockTabs[block.id] === 'en') && (
                                                <div className="editor-wrapper">
                                                    <label className="modern-label">Content (English)</label>
                                                    <CKEditor
                                                        editor={ClassicEditor}
                                                        data={block.content.html || ''}
                                                        onChange={(event, editor) => {
                                                            const data = editor.getData();
                                                            updateBlock(index, 'html', data);
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {blockTabs[block.id] === 'hi' && (
                                                <div className="editor-wrapper">
                                                    <label className="modern-label">Content (Hindi)</label>
                                                    <CKEditor
                                                        editor={ClassicEditor}
                                                        data={block.content.htmlHi || ''}
                                                        onChange={(event, editor) => {
                                                            const data = editor.getData();
                                                            updateBlock(index, 'htmlHi', data);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {block.type === 'youtube' && (
                                        <div className="form-group full-width">
                                            <label className="modern-label">YouTube Link</label>
                                            <input
                                                type="text" className="modern-input"
                                                value={block.content.url}
                                                onChange={(e) => updateBlock(index, 'url', e.target.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </div>
                                    )}

                                    {block.type === 'video' && (
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label className="modern-label">Video URL / Upload</label>
                                                <div className="url-upload-row">
                                                    <input type="text" className="modern-input" value={block.content.url} onChange={(e) => updateBlock(index, 'url', e.target.value)} />
                                                    <label className="btn-upload-modern">
                                                        <Video size={16} />
                                                        <input type="file" onChange={(e) => handleBlockFileUpload(e, index, 'url')} />
                                                    </label>
                                                </div>
                                                {block.content.url && (
                                                    <div className="preview-container" style={{ marginTop: '1rem', maxWidth: '300px' }}>
                                                        <video src={block.content.url.startsWith('http') ? block.content.url : `${API_BASE_URL}${block.content.url.startsWith('/') ? '' : '/'}${block.content.url}`} className="premium-preview-img" controls />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label className="modern-label">Video Caption</label>
                                                <input type="text" className="modern-input" value={block.content.caption} onChange={(e) => updateBlock(index, 'caption', e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'instagram' && (
                                        <div className="form-group full-width">
                                            <label className="modern-label">Instagram Link</label>
                                            <input
                                                type="text" className="modern-input"
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
                            <div className="empty-state-notice">
                                <AlertTriangle size={32} opacity={0.3} />
                                <p>No content blocks yet. Add one below to build your event page!</p>
                            </div>
                        )}
                    </div>

                    <div className="add-block-section">
                        <h4>Build Page Content</h4>
                        <div className="add-block-grid">
                            <button type="button" className="btn-add-type" onClick={() => addBlock('text')}>
                                <Type size={18} /> Add Text
                            </button>
                            <button type="button" className="btn-add-type" onClick={() => addBlock('image')}>
                                <ImageIcon size={18} /> Add Image
                            </button>
                            <button type="button" className="btn-add-type" onClick={() => addBlock('video')}>
                                <Video size={18} /> Add Video
                            </button>
                            <button type="button" className="btn-add-type" onClick={() => addBlock('youtube')}>
                                <Youtube size={18} /> YouTube
                            </button>
                            <button type="button" className="btn-add-type" onClick={() => addBlock('instagram')}>
                                <Instagram size={18} /> Instagram
                            </button>
                        </div>
                    </div>
                </div>

                <div className="editor-section">
                    <div className="section-title-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bell size={20} color="#00bfa5" />
                            <h3>Send Notification</h3>
                        </div>
                        <div className="modern-switch-row">
                            <label className="modern-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={notificationData.sendNotification}
                                    onChange={(e) => setNotificationData({ ...notificationData, sendNotification: e.target.checked })}
                                />
                                <span>Enable Notifications</span>
                            </label>
                        </div>
                    </div>

                    {notificationData.sendNotification && (
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="modern-label">Target Audience</label>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio" name="targetType" value="all"
                                                checked={notificationData.targetType === 'all'}
                                                onChange={() => setNotificationData({ ...notificationData, targetType: 'all' })}
                                            />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>All Users</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio" name="targetType" value="selected"
                                                checked={notificationData.targetType === 'selected'}
                                                onChange={() => setNotificationData({ ...notificationData, targetType: 'selected' })}
                                            />
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Selected Users</span>
                                        </label>
                                    </div>

                                    {notificationData.targetType === 'selected' && (
                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                                                    <Users size={18} />
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                                        {notificationData.userIds.length} users selected
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setUserSelectorOpen(true)}
                                                    style={{
                                                        padding: '6px 16px', borderRadius: '8px', border: '1px solid #00bfa5',
                                                        background: '#f0fdfa', color: '#00bfa5', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                                                    }}
                                                >
                                                    Select Users
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label className="modern-label">Notification Channels</label>
                                    <div style={{ display: 'flex', gap: '30px', marginTop: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={notificationData.channels.includes('whatsapp')}
                                                onChange={(e) => {
                                                    const channels = e.target.checked 
                                                        ? [...notificationData.channels, 'whatsapp']
                                                        : notificationData.channels.filter(c => c !== 'whatsapp');
                                                    setNotificationData({ ...notificationData, channels });
                                                }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MessageSquare size={16} color="#25D366" />
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>WhatsApp</span>
                                            </div>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={notificationData.channels.includes('app')}
                                                onChange={(e) => {
                                                    const channels = e.target.checked 
                                                        ? [...notificationData.channels, 'app']
                                                        : notificationData.channels.filter(c => c !== 'app');
                                                    setNotificationData({ ...notificationData, channels });
                                                }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Bell size={16} color="#00bfa5" />
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>App Notification</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0, 191, 165, 0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={14} color="#00bfa5" />
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                            {notificationData.channels.includes('whatsapp') && "WhatsApp messages include title, date, location and link. "}
                                            {notificationData.channels.includes('app') && "App notifications will appear in user dashboards."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="editor-section">
                    <div className="section-title-row">
                        <h3>SEO & Social Sharing</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="modern-label">Meta Title (Browser Tab)</label>
                            <input type="text" name="metaTitle" className="modern-input" value={formData.metaTitle} onChange={handleInputChange} placeholder="How the page title appears in Google" />
                        </div>
                        <div className="form-group">
                            <label className="modern-label">Meta Description</label>
                            <textarea name="metaDescription" className="modern-textarea" rows="2" value={formData.metaDescription} onChange={handleInputChange} placeholder="Brief summary for search engines..." />
                        </div>
                    </div>
                </div>
            </form>

            <UserSelectorModal
                isOpen={userSelectorOpen}
                onClose={() => setUserSelectorOpen(false)}
                onSelect={(ids) => setNotificationData({ ...notificationData, userIds: ids })}
                initialSelected={notificationData.userIds}
            />
        </div>
    );
};

export default EventEditor;
