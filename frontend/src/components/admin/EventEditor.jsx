import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import {
    Save, ArrowLeft, Image as ImageIcon, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './EventEditor.css';

const getYouTubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
};

const EventEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [globalLang, setGlobalLang] = useState('en');
    const [contentLang, setContentLang] = useState('en');

    const [formData, setFormData] = useState({
        title: '',
        title_hi: '',
        slug: '',
        coverImage: '',
        heroImages: [],
        date: '',
        location: '',
        location_hi: '',
        shortDescription: '',
        shortDescription_hi: '',
        description: '',
        description_hi: '',
        status: 'upcoming',
        category: 'Social Event',
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
            const res = await api.get(`/events/admin/${id}`);
            const data = res.data;
            const textBlock = data.blocks?.find(b => b.type === 'text');
            const description = data.description || textBlock?.content?.html || '';
            const description_hi = data.description_hi || textBlock?.content?.htmlHi || '';
            setFormData({
                ...data,
                description,
                description_hi
            });
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
            const payload = {
                ...formData,
                blocks: [
                    {
                        id: 'main-content',
                        type: 'text',
                        content: {
                            html: formData.description || '',
                            htmlHi: formData.description_hi || ''
                        }
                    }
                ]
            };

            if (isEditMode) {
                await api.put(`/events/${id}`, payload);
                toast.success('Event updated successfully');
            } else {
                await api.post('/events', payload);
                toast.success('Event created successfully');
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

        if (file.size > 4 * 1024 * 1024) {
            toast.error("Please select a file smaller than 4MB");
            e.target.value = null;
            return;
        }

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const toastId = toast.loading('Uploading...');
            const res = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(toastId);

            if (field === 'coverImage') {
                setFormData(prev => ({ ...prev, coverImage: res.data.imageUrl }));
            }
            toast.success('Uploaded');
            return res.data.imageUrl;
        } catch (error) {
            toast.error('Upload failed');
            return null;
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
                            <label className="modern-label">Main Cover Media (Image URL / YouTube Video URL / Upload)</label>
                            <div className="image-upload-wrapper">
                                <div className="url-upload-row">
                                    <input
                                        type="text" name="coverImage" className="modern-input"
                                        value={formData.coverImage} onChange={handleInputChange}
                                        placeholder="Paste YouTube video link (watch/shorts/youtu.be) or image URL"
                                    />
                                    <label className="btn-upload-modern">
                                        <ImageIcon size={18} /> Upload Image
                                        <input type="file" onChange={(e) => handleFileUpload(e, 'coverImage')} />
                                    </label>
                                </div>
                                <small className="text-gray-400 text-xs mt-1 block">Supports YouTube video links (plays directly without redirecting) or image uploads up to 4MB</small>
                                {formData.coverImage && (
                                    <div className="preview-container" style={{ marginTop: '1rem', maxWidth: '420px' }}>
                                        {getYouTubeVideoId(formData.coverImage) ? (
                                            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                <iframe
                                                    width="100%"
                                                    height="235"
                                                    src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(formData.coverImage)}?rel=0&modestbranding=1&enablejsapi=1`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                    style={{ border: 'none', display: 'block', width: '100%' }}
                                                ></iframe>
                                            </div>
                                        ) : (
                                            <img
                                                src={formData.coverImage.startsWith('http') ? formData.coverImage : `${API_BASE_URL}${formData.coverImage.startsWith('/') ? '' : '/'}${formData.coverImage}`}
                                                className="premium-preview-img" alt="Cover"
                                            />
                                        )}
                                    </div>
                                )}
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

                {/* Single Event Content Editor with English and Hindi Support */}
                <div className="editor-section">
                    <div className="section-title-row">
                        <h3>Event Description & Content</h3>
                        <div className="lang-switch-modern">
                            <button
                                type="button"
                                className={`lang-btn ${contentLang === 'en' ? 'active' : ''}`}
                                onClick={() => setContentLang('en')}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                className={`lang-btn ${contentLang === 'hi' ? 'active' : ''}`}
                                onClick={() => setContentLang('hi')}
                            >
                                Hindi
                            </button>
                        </div>
                    </div>

                    <div className="form-group full-width">
                        {contentLang === 'en' ? (
                            <div>
                                <label className="modern-label">Detailed Content (English)</label>
                                <textarea
                                    name="description"
                                    className="modern-textarea"
                                    rows="8"
                                    value={formData.description || ''}
                                    onChange={handleInputChange}
                                    placeholder="Write the full event details and description in English..."
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="modern-label">Detailed Content (Hindi)</label>
                                <textarea
                                    name="description_hi"
                                    className="modern-textarea"
                                    rows="8"
                                    value={formData.description_hi || ''}
                                    onChange={handleInputChange}
                                    placeholder="कार्यक्रम का पूरा विवरण हिंदी में लिखें..."
                                />
                            </div>
                        )}
                    </div>
                </div>


            </form>
        </div>
    );
};

export default EventEditor;
