import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminEvents.css';

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
                        ) : events.map(event => (
                            <tr key={event._id}>
                                <td>
                                    <div className="event-info-cell">
                                        {event.coverImage ? (
                                            <img src={event.coverImage.startsWith('http') ? event.coverImage : `${API_BASE_URL}${event.coverImage.startsWith('/') ? '' : '/'}${event.coverImage}`} alt="" className="event-thumb" />
                                        ) : (
                                            <div className="event-thumb" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>N/A</div>
                                        )}
                                        <span>{event.title}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${event.status}`}>
                                        {event.status}
                                    </span>
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEvents;
