import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, ArrowRight, Loader2, Mail, Heart, Users, CheckCircle, Smartphone, PlayCircle, Eye, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Events.css';
import SEO from '../components/common/SEO';

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
            const statusParam = filter === 'all' ? '' : (filter === 'past' ? 'completed' : filter);
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
        const eventStatus = event.status || (event.date && eventDate < now ? 'completed' : 'upcoming');

        let matchesFilter = true;
        if (filter === 'upcoming') {
            matchesFilter = eventStatus === 'upcoming' || eventStatus === 'ongoing';
        } else if (filter === 'past') {
            matchesFilter = eventStatus === 'completed';
        }

        return matchesSearch && matchesFilter;
    });

    const eventsSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "The Dharmarth Medical Foundation Events & Campaigns",
        "description": "Browse active donation campaigns, healthcare checkup drives, and community welfare events by The Dharmarth Medical Foundation.",
        "url": "https://thedharmarth.com/events"
    };

    return (
        <div className="events-page-container">
            <SEO
                title="Donation Campaigns & Healthcare Events"
                description="Browse active donation campaigns, healthcare checkup camps, and community welfare drives by The Dharmarth Medical Foundation. Support medical crowdfunding in India."
                keywords="Healthcare events, Diagnostic checkup camps, Donation campaigns, NGO events Sujangarh, Medical Crowdfunding, Support Charity"
                jsonLd={eventsSchema}
            />
            <Navbar />

            <header className="events-header-slider">
                {headerLoading ? (
                    <div className="header-loader"><Loader2 className="animate-spin" /></div>
                ) : headerSlides.length > 0 ? (
                    <div className="slider-container">
                        {headerSlides.map((slide, index) => {
                            const ytId = getYouTubeVideoId(slide.url);
                            const bgUrl = ytId
                                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                                : (slide.type === 'image' ? (slide.url.startsWith('http') ? slide.url : `${API_BASE_URL}${slide.url.startsWith('/') ? '' : '/'}${slide.url}`) : 'none');

                            return (
                                <div
                                    key={slide._id}
                                    className={`slider-item ${index === currentSlide ? 'active' : ''} pos-${slide.textPosition || 'center'}`}
                                >
                                    {ytId ? (
                                        <div className="slider-media-wrapper">
                                            <div
                                                className="slider-blur-bg"
                                                style={{ backgroundImage: `url(https://img.youtube.com/vi/${ytId}/hqdefault.jpg)` }}
                                            />
                                            <div className="slider-video-frame">
                                                <iframe
                                                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&rel=0&modestbranding=1&enablejsapi=1&playsinline=1`}
                                                    title="YouTube Header Slide"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                />
                                            </div>
                                        </div>
                                    ) : slide.type === 'video' ? (
                                        <div className="slider-media-wrapper">
                                            <video className="slider-blur-bg" autoPlay muted loop playsInline>
                                                <source src={slide.url.startsWith('http') ? slide.url : `${API_BASE_URL}${slide.url.startsWith('/') ? '' : '/'}${slide.url}`} type="video/mp4" />
                                            </video>
                                            <div className="slider-video-frame">
                                                <video className="slider-video-fg" autoPlay muted loop playsInline>
                                                    <source src={slide.url.startsWith('http') ? slide.url : `${API_BASE_URL}${slide.url.startsWith('/') ? '' : '/'}${slide.url}`} type="video/mp4" />
                                                </video>
                                            </div>
                                        </div>
                                    ) : bgUrl !== 'none' ? (
                                        <div className="slider-media-wrapper">
                                            <div
                                                className="slider-blur-bg"
                                                style={{ backgroundImage: `url(${bgUrl})` }}
                                            />
                                            <img src={bgUrl} alt={slide.title || 'Header Banner'} className="slider-image-fg" />
                                        </div>
                                    ) : null}
                                    <div className="slider-overlay"></div>
                                    {(slide.title || slide.subtitle || slide.description || slide.ctaLink) && (
                                        <div className="slider-content">
                                            {((i18n.language === 'hi' && slide.title_hi) || slide.title) && (
                                                <h1 className="event-slide-up" style={{ color: slide.titleColor || '#ffffff' }}>
                                                    {(i18n.language === 'hi' && slide.title_hi) ? slide.title_hi : slide.title}
                                                </h1>
                                            )}
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
                                    )}
                                </div>
                            );
                        })}
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
                                    {(() => {
                                        const coverUrl = getEventCoverUrl(event);
                                        return coverUrl ? (
                                            <img src={coverUrl} alt={event.title} />
                                        ) : (
                                            <div className="placeholder-image">
                                                <Calendar size={40} color="#ccc" />
                                            </div>
                                        );
                                    })()}
                                                                                                                                                                                            <div className="event-card-badges">
                                        {(() => {
                                            const eventDate = new Date(event.date);
                                            const now = new Date();
                                            const eventStatus = event.status || (event.date && eventDate < now ? 'completed' : 'upcoming');
                                            return (
                                                <span className={`event-status-tag ${eventStatus}`}>
                                                    {eventStatus === 'upcoming' ? (i18n.language === 'hi' ? 'आगामी' : 'Upcoming') :
                                                        eventStatus === 'ongoing' ? (i18n.language === 'hi' ? 'अभी हो रहा है' : 'Happening Now') :
                                                            (i18n.language === 'hi' ? 'पूर्ण' : 'Completed')}
                                                </span>
                                            );
                                        })()}
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


                   
                </div>
            </section>

         

            <Footer />
        </div>
    );
};

export default Events;
