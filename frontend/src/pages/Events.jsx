import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Events.css';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Fetch all for now and filter status client side or server side
            // Ideally server side, but for MVP fetching default is okay
            const res = await axios.get('http://localhost:5000/api/events');
            setEvents(res.data.events || []);
        } catch (error) {
            console.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
        const eventDate = new Date(event.date);
        const now = new Date();

        let matchesFilter = true;
        if (filter === 'upcoming') {
            matchesFilter = eventDate >= now || event.status === 'upcoming' || event.status === 'ongoing';
        } else if (filter === 'past') {
            matchesFilter = eventDate < now || event.status === 'completed';
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="events-page-container">
            <Navbar />

            <header className="events-header">
                <div className="container">
                    <h1>Our Impact & Events</h1>
                    <p>Join us in making a difference. Check out our upcoming drives and past activities.</p>
                </div>
            </header>

            <div className="events-filters">
                <div className="filter-wrapper">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >All Events</button>
                        <button
                            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setFilter('upcoming')}
                        >Upcoming</button>
                        <button
                            className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
                            onClick={() => setFilter('past')}
                        >Past Events</button>
                    </div>

                    <div className="search-box">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', right: 15, top: 12, color: '#999' }} />
                    </div>
                </div>
            </div>

            <main className="events-grid-section">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
                        <Loader2 className="animate-spin" size={40} color="#666" />
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50, color: '#666' }}>
                        <h3>No events found matching your criteria.</h3>
                    </div>
                ) : (
                    <div className="events-grid">
                        {filteredEvents.map(event => (
                            <div key={event._id} className="event-card">
                                <Link to={`/events/${event.slug}`} className="event-card-image">
                                    {event.coverImage ? (
                                        <img src={event.coverImage} alt={event.title} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={40} color="#ccc" />
                                        </div>
                                    )}
                                    <span className={`event-status-tag ${event.status}`}>{event.status}</span>
                                </Link>
                                <div className="event-card-content">
                                    <div className="event-date">
                                        <Calendar size={14} />
                                        {event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBA'}
                                    </div>
                                    <h3 className="event-title">
                                        <Link to={`/events/${event.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                            {event.title}
                                        </Link>
                                    </h3>
                                    <p className="event-desc">
                                        {event.shortDescription || 'No description available.'}
                                    </p>
                                    <div className="event-card-footer">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#666', fontSize: '0.85rem' }}>
                                            <MapPin size={14} /> {event.location || 'Online'}
                                        </span>
                                        <Link to={`/events/${event.slug}`} className="view-details-btn">
                                            Read More <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Events;
