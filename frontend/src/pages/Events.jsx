import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, ArrowRight, Loader2, Mail, Heart, Users, CheckCircle, Smartphone, PlayCircle, Eye, Image } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Events.css';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past
    const [searchTerm, setSearchTerm] = useState('');
    const [headerSlides, setHeaderSlides] = useState([]);
    const [eventVideos, setEventVideos] = useState([]);
    const [headerLoading, setHeaderLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeVideo, setActiveVideo] = useState(null);

    useEffect(() => {
        if (eventVideos.length > 0) {
            setActiveVideo(eventVideos[0]);
        }
    }, [eventVideos]);

    useEffect(() => {
        const fetchHeaders = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/event-headers');
                setHeaderSlides(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setHeaderLoading(false);
            }
        };

        const fetchVideos = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/event-videos');
                setEventVideos(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchHeaders();
        fetchVideos();
        fetchEvents();
    }, []);

    // Slider Autoplay
    useEffect(() => {
        if (headerSlides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % headerSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [headerSlides]);

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

            <header className="events-header-slider">
                {headerLoading ? (
                    <div className="header-loader"><Loader2 className="animate-spin" /></div>
                ) : headerSlides.length > 0 ? (
                    <div className="slider-container">
                        {headerSlides.map((slide, index) => (
                            <div
                                key={slide._id}
                                className={`slider-item ${index === currentSlide ? 'active' : ''} pos-${slide.textPosition || 'center'}`}
                                style={{ backgroundImage: slide.type === 'image' ? `url(${slide.url})` : 'none' }}
                            >
                                {slide.type === 'video' && (
                                    <video className="slider-video-bg" autoPlay muted loop playsInline>
                                        <source src={slide.url} type="video/mp4" />
                                    </video>
                                )}
                                <div className="slider-overlay"></div>
                                <div className="slider-content">
                                    <h1 className="event-slide-up" style={{ color: slide.titleColor || '#ffffff' }}>{slide.title || 'Our Impact & Events'}</h1>
                                    {slide.subtitle && <h3 className="event-slide-up delay-1">{slide.subtitle}</h3>}
                                    {slide.description && <p className="event-slide-up delay-2" style={{ color: slide.descriptionColor || '#ffffff' }}>{slide.description}</p>}
                                    {slide.ctaLink && (
                                        <Link to={slide.ctaLink} className="btn-primary event-slide-up delay-3">
                                            {slide.ctaText || 'Learn More'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="static-header-fallback" style={{ background: 'linear-gradient(to right, #1a202c, #2d3748)', padding: '100px 0', color: 'white', textAlign: 'center' }}>
                        <div className="container">
                            <h1>Our Impact & Events</h1>
                            <p>Join us in making a difference. Check out our upcoming drives and past activities.</p>
                        </div>
                    </div>
                )}
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
                        <Link to="/gallery" className="filter-tab gallery-link" style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Image size={16} /> Gallery
                        </Link>
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
                                        <div className="placeholder-image">
                                            <Calendar size={40} color="#ccc" />
                                        </div>
                                    )}
                                    <span className={`event-status-tag ${event.status}`}>
                                        {event.status === 'upcoming' ? 'Upcoming' : event.status === 'ongoing' ? 'Happening Now' : 'Completed'}
                                    </span>
                                </Link>
                                <div className="event-card-content">
                                    <span className="event-meta-row">
                                        <span className="meta-item timestamp">
                                            {event.date ? new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                                        </span>
                                        <span className="meta-dot">•</span>
                                        <span className="meta-item location">
                                            {event.location || 'Online'}
                                        </span>
                                    </span>

                                    <h3 className="event-title">
                                        <Link to={`/events/${event.slug}`}>
                                            {event.title}
                                        </Link>
                                    </h3>

                                    <p className="event-desc">
                                        {event.shortDescription ?
                                            (event.shortDescription.length > 100 ? event.shortDescription.substring(0, 100) + '...' : event.shortDescription)
                                            : 'Join us for this special event.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Engagement & Newsletter Section */}
            <section className="events-engagement-section">
                <div className="container">
                    <div className="engagement-header">
                        <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>Be The Change You Want To See</h2>
                        <p>Events are just the beginning. Become a permanent part of our journey.</p>
                    </div>

                    <div className="cta-cards-container">
                        <div className="cta-card volunteer">
                            <div className="card-icon-wrapper">
                                <Heart size={32} />
                            </div>
                            <h3>Become a Volunteer</h3>
                            <p>Join our on-ground team and experience the joy of giving firsthand.</p>
                            <ul className="cta-benefits">
                                <li><CheckCircle size={16} /> Certificate of Appreciation</li>
                                <li><CheckCircle size={16} /> Networking Opportunities</li>
                                <li><CheckCircle size={16} /> Skill Development</li>
                            </ul>
                            <Link to="/volunteer" className="cta-btn primary">
                                Join Now <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="cta-card partner">
                            <div className="card-icon-wrapper secondary">
                                <Users size={32} />
                            </div>
                            <h3>Partner With Us</h3>
                            <p>Collaborate with us to amplify our impact and reach more lives.</p>
                            <ul className="cta-benefits">
                                <li><CheckCircle size={16} /> CSR Opportunities</li>
                                <li><CheckCircle size={16} /> Brand Visibility</li>
                                <li><CheckCircle size={16} /> Joint Impact Reports</li>
                            </ul>
                            <Link to="/contact" className="cta-btn secondary">
                                Contact Us <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>


                    <div className="newsletter-wrapper">
                        <div className="newsletter-content">
                            <div className="icon-box">
                                <Smartphone size={24} />
                            </div>
                            <div className="text-box">
                                <h3>Don't Miss an Update</h3>
                                <p>Get the latest event news and impact stories via SMS/WhatsApp.</p>
                            </div>
                        </div>
                        <div className="newsletter-form">
                            <input type="tel" placeholder="Enter your mobile number" />
                            <button className="subscribe-btn">Subscribe</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Event Videos Section */}
            <section className="events-video-section">
                <div className="container">
                    <div className="video-section-header">
                        <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>Our Impact in Motion</h2>

                        <a href="https://www.youtube.com/@TheDharmarthFoundation" target="_blank" rel="noreferrer" className="view-channel-link">
                            View Channel <ArrowRight size={16} />
                        </a>
                    </div>

                    <div className={`video-asymmetric-grid ${eventVideos.length === 1 ? 'single' : ''}`}>
                        {/* Main Featured Video */}
                        {activeVideo && (
                            <div className="video-main-feature">
                                <div className="video-wrapper">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${activeVideo.videoId}`}
                                        title={activeVideo.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="video-main-content">
                                    <h3>{activeVideo.title}</h3>
                                </div>
                            </div>
                        )}

                        {/* Side List */}
                        <div className="video-side-list">
                            {eventVideos.filter(v => v._id !== activeVideo?._id).slice(0, 3).map(video => (
                                <div
                                    key={video._id}
                                    className="video-side-item"
                                    onClick={() => setActiveVideo(video)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="side-video-thumb">
                                        <img src={video.thumbnail} alt={video.title} />
                                        <div className="play-overlay">
                                            <PlayCircle size={32} />
                                        </div>
                                    </div>
                                    <div className="side-video-info">
                                        <h4>{video.title}</h4>
                                        <span className="watch-now-txt">Watch Now</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Events;
