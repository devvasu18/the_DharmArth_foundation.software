import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Video, GripVertical, Play, Save } from 'lucide-react';
import './AdminEvents.css'; // Reuse existing styles or create new

const AdminEventVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVideo, setCurrentVideo] = useState({
        title: '',
        videoUrl: '',
        videoId: '',
        thumbnail: '',
        isActive: true,
        order: 0
    });

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const res = await api.get('/event-videos');
            setVideos(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch videos");
            setLoading(false);
        }
    };

    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        const videoId = extractVideoId(url);

        setCurrentVideo(prev => ({
            ...prev,
            videoUrl: url,
            videoId: videoId || prev.videoId,
            thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : prev.thumbnail
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentVideo._id) {
                await api.put(`/event-videos/${currentVideo._id}`, currentVideo);
            } else {
                await api.post('/event-videos', {
                    ...currentVideo,
                    order: videos.length // Add to end
                });
            }
            setIsEditing(false);
            fetchVideos();
            resetForm();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this video?')) {
            try {
                await api.delete(`/event-videos/${id}`);
                fetchVideos();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const resetForm = () => {
        setCurrentVideo({
            title: '',
            videoUrl: '',
            videoId: '',
            thumbnail: '',
            isActive: true,
            order: 0
        });
    };

    return (
        <div className="admin-events-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="admin-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2.5rem',
                background: 'white',
                padding: '1.5rem 2rem',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9'
            }}>
                <div className="header-title">
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>Event YouTube Videos</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Manage video highlights from your foundation events</p>
                </div>
                <button
                    className="btn-add-premium"
                    onClick={() => { resetForm(); setIsEditing(true); }}
                    style={{
                        background: 'linear-gradient(135deg, #00bfa5 0%, #00897b 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0, 191, 165, 0.3)',
                        transition: 'all 0.3s ease',
                        fontSize: '0.95rem'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 191, 165, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 191, 165, 0.3)';
                    }}
                >
                    <Plus size={20} strokeWidth={3} /> Add New Video
                </button>
            </div>

            {isEditing && (
                <div className="event-editor-form" style={{ marginBottom: 30, padding: 25, borderRadius: 12, background: 'white' }}>
                    <h3>{currentVideo._id ? 'Edit Video' : 'Add New Video'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div className="form-group">
                            <label>Video Title</label>
                            <input
                                type="text"
                                value={currentVideo.title}
                                onChange={e => setCurrentVideo({ ...currentVideo, title: e.target.value })}
                                required
                                placeholder="e.g. Highlight of Annual Function"
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>YouTube URL</label>
                            <input
                                type="text"
                                value={currentVideo.videoUrl}
                                onChange={handleUrlChange}
                                required
                                placeholder="https://www.youtube.com/watch?v=..."
                                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ddd' }}
                            />
                        </div>

                        {currentVideo.thumbnail && (
                            <div className="video-preview" style={{ width: 200, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
                                <img src={currentVideo.thumbnail} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                <div style={{ padding: 5, fontSize: '0.8rem', background: '#f9f9f9', textAlign: 'center' }}>Auto-fetched Thumbnail</div>
                            </div>
                        )}

                        <div className="form-actions" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button type="submit" className="btn-save" style={{ background: '#00bfa5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Save size={16} /> Save Video
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} style={{ background: '#eee', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="videos-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {videos.map((video, index) => (
                    <div key={video._id} className="video-card-premium" style={{ 
                        background: 'white', 
                        borderRadius: '24px', 
                        overflow: 'hidden', 
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)', 
                        border: '1px solid #f1f5f9',
                        transition: 'all 0.3s ease'
                    }}>
                        <div className="video-thumb" style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                            <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="thumb-img" />
                            <div className="overlay" style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                background: 'rgba(0,0,0,0.2)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                transition: 'background 0.3s ease'
                            }}>
                                <a href={video.videoUrl} target="_blank" rel="noreferrer" style={{ 
                                    background: 'rgba(255,255,255,0.9)', 
                                    color: '#ef4444', 
                                    borderRadius: '50%', 
                                    width: '50px', 
                                    height: '50px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }} className="play-btn-circle">
                                    <Play size={24} fill="#ef4444" />
                                </a>
                            </div>
                        </div>
                        <div className="video-info" style={{ padding: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.4' }}>{video.title}</h4>
                            <div className="video-actions" style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '1rem',
                                marginTop: '0.5rem'
                            }}>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700, 
                                    color: video.isActive ? '#059669' : '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                    {video.isActive ? 'Active' : 'Hidden'}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => { setCurrentVideo(video); setIsEditing(true); }} 
                                        style={{ 
                                            background: '#f8fafc', 
                                            border: '1px solid #e2e8f0', 
                                            borderRadius: '8px',
                                            padding: '6px 12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00bfa5'; e.currentTarget.style.color = '#00bfa5'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                                    >Edit</button>
                                    <button 
                                        onClick={() => handleDelete(video._id)} 
                                        style={{ 
                                            background: '#fff1f2', 
                                            border: '1px solid #ffe4e6', 
                                            borderRadius: '8px',
                                            padding: '6px',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.background = '#fecdd3'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminEventVideos;
