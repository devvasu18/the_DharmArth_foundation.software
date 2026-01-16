import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            const res = await axios.get('http://localhost:5000/api/event-videos');
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
                await axios.put(`http://localhost:5000/api/event-videos/${currentVideo._id}`, currentVideo);
            } else {
                await axios.post('http://localhost:5000/api/event-videos', {
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
                await axios.delete(`http://localhost:5000/api/event-videos/${id}`);
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
        <div className="admin-events-container">
            <div className="admin-header">
                <h2>Event YouTube Videos</h2>
                <button
                    className="btn-add-event"
                    onClick={() => { resetForm(); setIsEditing(true); }}
                >
                    <Plus size={18} /> Add New Video
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

            <div className="videos-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {videos.map((video, index) => (
                    <div key={video._id} className="video-card-admin" style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                        <div className="video-thumb" style={{ position: 'relative', height: 160 }}>
                            <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <a href={video.videoUrl} target="_blank" rel="noreferrer" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,0,0,0.8)', color: 'white', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play size={20} fill="white" />
                            </a>
                        </div>
                        <div className="video-info" style={{ padding: 15 }}>
                            <h4 style={{ margin: '0 0 5px', fontSize: '1rem' }}>{video.title}</h4>
                            <div className="video-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 15 }}>
                                <button onClick={() => { setCurrentVideo(video); setIsEditing(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>Edit</button>
                                <button onClick={() => handleDelete(video._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminEventVideos;
