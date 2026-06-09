import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, ArrowRight, Loader2, Mail, Heart, Users, CheckCircle, Smartphone, PlayCircle, Eye, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Events.css';
import SEO from '../components/common/SEO';

const Events = () => {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, past
    const [categoryFilter, setCategoryFilter] = useState('all');
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
                const res = await api.get('/event-headers');
                setHeaderSlides(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setHeaderLoading(false);
            }
        };

        const fetchVideos = async () => {
            try {
                const res = await api.get('/event-videos');
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

    useEffect(() => {
        fetchEvents();
    }, [filter, categoryFilter]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const statusParam = filter === 'all' ? '' : filter;
            const categoryParam = categoryFilter === 'all' ? '' : categoryFilter;
            const res = await api.get(`/events?status=${statusParam}&category=${categoryParam}`);
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

    const eventsSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "The DharmArth Foundation Events & Campaigns",
        "description": "Browse active donation campaigns, healthcare checkup drives, and community welfare events by The DharmArth Foundation.",
        "url": "https://thedharmarth.com/events"
    };

    return (
        <div className="events-page-container">
            <SEO 
                title="Donation Campaigns & Healthcare Events"
                description="Browse active donation campaigns, healthcare checkup camps, and community welfare drives by The DharmArth Foundation. Support medical crowdfunding in India."
                keywords="Healthcare events, Diagnostic checkup camps, Donation campaigns, NGO events Sujangarh, Medical Crowdfunding, Support Charity"
                jsonLd={eventsSchema}
            />
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
                                style={{ backgroundImage: slide.type === 'image' ? `url(${slide.url.startsWith('http') ? slide.url : `${API_BASE_URL}${slide.url.startsWith('/') ? '' : '/'}${slide.url}`})` : 'none' }}
                            >
                                {slide.type === 'video' && (
                                    <video className="slider-video-bg" autoPlay muted loop playsInline>
                                        <source src={slide.url.startsWith('http') ? slide.url : `${API_BASE_URL}${slide.url.startsWith('/') ? '' : '/'}${slide.url}`} type="video/mp4" />
                                    </video>
                                )}
                                <div className="slider-overlay"></div>
                                <div className="slider-content">
                                    <h1 className="event-slide-up" style={{ color: slide.titleColor || '#ffffff' }}>
                                        {(i18n.language === 'hi' && slide.title_hi) ? slide.title_hi : (slide.title || 'Our Impact & Events')}
                                    </h1>
                                    {((i18n.language === 'hi' && slide.subtitle_hi) || slide.subtitle) && (
                                        <h3 className="event-slide-up delay-1">
                                            {(i18n.language === 'hi' && slide.subtitle_hi) ? slide.subtitle_hi : slide.subtitle}
                                        </h3>
                                    )}
                                    {((i18n.language === 'hi' && slide.description_hi) || slide.description) && (
                                        <p className="event-slide-up delay-2" style={{ color: slide.descriptionColor || '#ffffff' }}>
                                            {(i18n.language === 'hi' && slide.description_hi) ? slide.description_hi : slide.description}
                                        </p>
                                    )}
                                    {slide.ctaLink && (
                                        <Link to={slide.ctaLink} className="btn-primary event-slide-up delay-3">
                                            {(i18n.language === 'hi' && slide.ctaText_hi) ? slide.ctaText_hi : (slide.ctaText || 'Learn More')}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="static-header-fallback" style={{ background: 'linear-gradient(to right, #1a202c, #2d3748)', padding: '100px 0', color: 'white', textAlign: 'center' }}>
                        <div className="container">
                            <h1>{(i18n.language === 'hi') ? 'हमारा प्रभाव और कार्यक्रम' : 'Our Impact & Events'}</h1>
                            <p>{(i18n.language === 'hi') ? 'बदलाव लाने में हमारे साथ जुड़ें। हमारे आगामी अभियानों और पिछली गतिविधियों को देखें।' : 'Join us in making a difference. Check out our upcoming drives and past activities.'}</p>
                        </div>
                    </div>
                )}
            </header>

            <div className="events-filters">
                <div className="filter-wrapper">
                    <div className="status-filter-row">
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >{(i18n.language === 'hi') ? 'सभी' : 'All'}</button>
                            <button
                                className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setFilter('upcoming')}
                            >{(i18n.language === 'hi') ? 'आगामी' : 'Upcoming'}</button>
                            <button
                                className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
                                onClick={() => setFilter('past')}
                            >{(i18n.language === 'hi') ? 'पूर्ण' : 'Past'}</button>
                        </div>

                        <div className="search-box">
                            <input
                                type="text"
                                className="search-input"
                                placeholder={(i18n.language === 'hi') ? 'कार्यक्रम खोजें...' : 'Search events...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={18} className="search-icon" />
                        </div>
                    </div>

                    <div className="category-filter-row">
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#666', alignSelf: 'center', marginRight: '5px' }}>
                            {(i18n.language === 'hi' ? 'श्रेणी:' : 'Category:')}
                        </span>
                        {['all', 'Health Blog', 'Medical Camp', 'Social Event', 'Success Story'].map(cat => (
                            <button
                                key={cat}
                                className={`cat-pill ${categoryFilter === cat ? 'active' : ''}`}
                                onClick={() => setCategoryFilter(cat)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid #ddd',
                                    background: categoryFilter === cat ? '#2563eb' : 'white',
                                    color: categoryFilter === cat ? 'white' : '#666',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {cat === 'all' ? (i18n.language === 'hi' ? 'सभी श्रेणियां' : 'All Categories') : cat}
                            </button>
                        ))}
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
                        <h3>{(i18n.language === 'hi') ? 'आपके मानदंडों से मेल खाने वाला कोई कार्यक्रम नहीं मिला।' : 'No events found matching your criteria.'}</h3>
                    </div>
                ) : (
                    <div className="events-grid">
                        {filteredEvents.map(event => (
                            <div key={event._id} className="event-card">
                                <Link to={`/events/${event.slug}`} className="event-card-image">
                                    {event.coverImage ? (
                                        <img src={event.coverImage.startsWith('http') ? event.coverImage : `${API_BASE_URL}${event.coverImage.startsWith('/') ? '' : '/'}${event.coverImage}`} alt={event.title} />
                                    ) : (
                                        <div className="placeholder-image">
                                            <Calendar size={40} color="#ccc" />
                                        </div>
                                    )}
                                    <div className="event-card-badges">
                                        <span className={`event-status-tag ${event.status}`}>
                                            {event.status === 'upcoming' ? (i18n.language === 'hi' ? 'आगामी' : 'Upcoming') :
                                                event.status === 'ongoing' ? (i18n.language === 'hi' ? 'अभी हो रहा है' : 'Happening Now') :
                                                    (i18n.language === 'hi' ? 'पूर्ण' : 'Completed')}
                                        </span>
                                        {event.category && (
                                            <span className="event-category-badge">
                                                {event.category}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <div className="event-card-content">
                                    <span className="event-meta-row">
                                        <span className="meta-item timestamp">
                                            {event.date ? new Date(event.date).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}
                                        </span>
                                        <span className="meta-dot">•</span>
                                        <span className="meta-item location">
                                            {(i18n.language === 'hi' && event.location_hi) ? event.location_hi : (event.location || 'Online')}
                                        </span>
                                    </span>

                                    <h3 className="event-title">
                                        <Link to={`/events/${event.slug}`}>
                                            {(i18n.language === 'hi' && event.title_hi) ? event.title_hi : event.title}
                                        </Link>
                                    </h3>

                                    <p className="event-desc">
                                        {(i18n.language === 'hi' && event.shortDescription_hi) ?
                                            (event.shortDescription_hi.length > 100 ? event.shortDescription_hi.substring(0, 100) + '...' : event.shortDescription_hi) :
                                            (event.shortDescription ?
                                                (event.shortDescription.length > 100 ? event.shortDescription.substring(0, 100) + '...' : event.shortDescription)
                                                : (i18n.language === 'hi' ? 'इस विशेष कार्यक्रम के लिए हमसे जुड़ें।' : 'Join us for this special event.'))}
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
                        <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>{t('events.beTheChange')}</h2>
                        <p>{t('events.eventsBeginning')}</p>
                    </div>

                    <div className="cta-cards-container">
                        <div className="cta-card volunteer">
                            <div className="card-icon-wrapper">
                                <Heart size={32} />
                            </div>
                            <h3>{t('events.becomeVolunteer')}</h3>
                            <p>{t('events.volunteerDesc')}</p>
                            <ul className="cta-benefits">
                                <li><CheckCircle size={16} /> {t('events.certAppreciation')}</li>
                                <li><CheckCircle size={16} /> {t('events.networkingOpportunities')}</li>
                                <li><CheckCircle size={16} /> {t('events.skillDevelopment')}</li>
                            </ul>
                            <Link to="/donate" className="cta-btn primary">
                                {t('events.joinNow')} <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="cta-card partner">
                            <div className="card-icon-wrapper secondary">
                                <Users size={32} />
                            </div>
                            <h3>{t('events.partnerWithUs')}</h3>
                            <p>{t('events.partnerDesc')}</p>
                            <ul className="cta-benefits">
                                <li><CheckCircle size={16} /> {t('events.csrOpportunities')}</li>
                                <li><CheckCircle size={16} /> {t('events.brandVisibility')}</li>
                                <li><CheckCircle size={16} /> {t('events.jointImpactReports')}</li>
                            </ul>
                            <Link to="/contact" className="cta-btn secondary">
                                {t('events.contactUs')} <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>


                    <div className="newsletter-wrapper">
                        <div className="newsletter-content">
                            <div className="icon-box">
                                <Smartphone size={24} />
                            </div>
                            <div className="text-box">
                                <h3>{t('events.dontMissUpdate')}</h3>
                                <p>{t('events.smsUpdates')}</p>
                            </div>
                        </div>
                        <div className="newsletter-form">
                            <input type="tel" placeholder={t('events.enterMobilePlaceholder')} />
                            <button className="subscribe-btn">{t('events.subscribe')}</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Event Videos Section */}
            <section className="events-video-section">
                <div className="container">
                    <div className="video-section-header">
                        <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--spacing-4)', color: 'var(--secondary)' }}>{t('events.ourImpactInMotion')}</h2>

                        <a href="https://www.youtube.com/@TheDharmarthFoundation" target="_blank" rel="noreferrer" className="view-channel-link">
                            {t('events.viewChannel')} <ArrowRight size={16} />
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
                                        <img src={video.thumbnail.startsWith('http') ? video.thumbnail : `${API_BASE_URL}${video.thumbnail.startsWith('/') ? '' : '/'}${video.thumbnail}`} alt={video.title} />
                                        <div className="play-overlay">
                                            <PlayCircle size={32} />
                                        </div>
                                    </div>
                                    <div className="side-video-info">
                                        <h4>{video.title}</h4>
                                        <span className="watch-now-txt">{t('events.watchNow')}</span>
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
