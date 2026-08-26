import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminEvents.css';

const getYouTubeVideoId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/|[^/\n\s]+\/\S+\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(regExp);
    if (match && match[1]) return match[1];
    try {
        const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
        if (parsed.hostname.includes('youtube.com')) {
            const v = parsed.searchParams.get('v');
            if (v && v.length === 11) return v;
            const pathParts = parsed.pathname.split('/').filter(Boolean);
            for (const part of pathParts) {
                if (part.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(part)) {
                    return part;
                }
            }
        }
        if (parsed.hostname === 'youtu.be') {
            const id = parsed.pathname.slice(1).split('/')[0].split('?')[0];
            if (id && id.length === 11) return id;
        }
    } catch (e) {}
    return null;
};

const getEventCoverUrl = (event) => {
    if (!event) return null;
    if (event.coverImage) {
        const ytId = getYouTubeVideoId(event.coverImage);
        if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        return event.coverImage.startsWith('http')
            ? event.coverImage
            : `${API_BASE_URL}${event.coverImage.startsWith('/') ? '' : '/'}${event.coverImage}`;
    }
    if (event.heroImages && event.heroImages.length > 0) {
        for (const hero of event.heroImages) {
            const ytId = getYouTubeVideoId(hero);
            if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
        const firstHero = event.heroImages[0];
        if (firstHero) {
            return firstHero.startsWith('http')
                ? firstHero
                : `${API_BASE_URL}${firstHero.startsWith('/') ? '' : '/'}${firstHero}`;
        }
    }
    if (event.blocks && event.blocks.length > 0) {
        for (const block of event.blocks) {
            if ((block.type === 'youtube' || block.type === 'video') && block.content?.url) {
                const ytId = getYouTubeVideoId(block.content.url);
                if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
            }
        }
        for (const block of event.blocks) {
            if (block.type === 'image' && block.content?.url) {
                const imgUrl = block.content.url;
                return imgUrl.startsWith('http')
                    ? imgUrl
                    : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
            }
        }
    }
    if (event.youtubeUrl) {
        const ytId = getYouTubeVideoId(event.youtubeUrl);
        if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    if (event.videoUrl) {
        const ytId = getYouTubeVideoId(event.videoUrl);
        if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    return null;
};

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/admin/all');
            setEvents(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load events');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            setEvents(events.filter(e => e._id !== id));
            toast.success('Event deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete event');
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;

    return (
        <div className="admin-events-container">
            <div className="admin-header-actions">
                <h2>Events Management</h2>
                <button className="btn-primary" onClick={() => navigate('/admin/events/new')}>
                    <Plus size={18} /> Add New Event
                </button>
            </div>

            <div className="events-table-wrapper">
                <table className="events-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No events found. Create one!</td>
                            </tr>
                        ) : events.map(event => {
                            const coverUrl = getEventCoverUrl(event);
                            return (
                                <tr key={event._id}>
                                    <td>
                                        <div className="event-info-cell">
                                            {coverUrl ? (
                                                <img src={coverUrl} alt="" className="event-thumb" />
                                            ) : (
                                                <div className="event-thumb" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>N/A</div>
                                            )}
                                            <span>{event.title}</span>
                                        </div>
                                    </td>
                                <td>
                                    {(() => {
                                        const eventDate = new Date(event.date);
                                        const now = new Date();
                                        const eventStatus = event.status || (event.date && eventDate < now ? 'completed' : 'upcoming');
                                        return (
                                            <span className={`status-badge ${eventStatus}`}>
                                                {eventStatus}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</td>
                                <td className="actions-cell">
                                    <button onClick={() => navigate(`/admin/events/edit/${event._id}`)} className="action-btn edit" title="Edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(event._id)} className="action-btn delete" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                    <a href={`/events/${event.slug}`} target="_blank" rel="noreferrer" className="action-btn view" title="View Public">
                                        <Eye size={16} />
                                    </a>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEvents;
