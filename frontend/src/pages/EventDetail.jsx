import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import { Calendar, MapPin, Share2, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Clock, Tag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './EventDetail.css';
import DOMPurify from 'dompurify';

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

const EventDetail = () => {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerFormData, setRegisterFormData] = useState({
        name: '',
        mobile: '',
        email: ''
    });
    const [registering, setRegistering] = useState(false);
    const { i18n } = useTranslation();

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEvent();
        fetchRecentEvents();
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setRegisterFormData({
                name: user.name || '',
                mobile: user.mobile || '',
                email: user.email || ''
            });
        }
    }, [slug]);

    useEffect(() => {
        if (event && event.heroImages && event.heroImages.length > 1) {
            const timer = setInterval(() => {
                setCurrentHeroSlide(prev => (prev + 1) % event.heroImages.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [event]);

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/slug/${slug}`);
            setEvent(res.data);
            document.title = (res.data.metaTitle || res.data.title) + " - The Dharmarth Medical Foundation";
        } catch (error) {
            console.error('Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentEvents = async () => {
        try {
            const res = await api.get('/events');
            if (res.data.events) {
                // Get 6 events: 3 for sidebar, 3 for related grid
                setRecentEvents(res.data.events.filter(e => e.slug !== slug).slice(0, 6));
            }
        } catch (error) {
            console.error('Failed to load recent events');
        }
    };

    const handleRegisterInterest = async (e) => {
        e.preventDefault();
        setRegistering(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await api.post('/events/register', {
                eventId: event._id,
                ...registerFormData,
                userId: user ? user._id : null
            });
            toast.success(res.data.message);
            setIsRegisterModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to register interest');
        } finally {
            setRegistering(false);
        }
    };

    // Instagram Embed Script
    useEffect(() => {
        if (event && event.blocks.some(b => b.type === 'instagram')) {
            const processInstagram = () => {
                if (window.instgrm) {
                    setTimeout(() => window.instgrm.Embeds.process(), 500);
                }
            };
            if (!window.instgrm) {
                const script = document.createElement('script');
                script.src = "//www.instagram.com/embed.js";
                script.async = true;
                script.onload = processInstagram;
                document.body.appendChild(script);
            } else {
                processInstagram();
            }
        }
    }, [event]);

    if (loading) return (
        <div className="loading-screen">
            <Loader2 className="animate-spin" size={50} color="var(--primary)" />
        </div>
    );

    if (!event) return (
        <div className="not-found-container">
            <h2>Event not found</h2>
            <Link to="/events" className="btn-primary">Return to Events</Link>
        </div>
    );

    const nextSlide = () => {
        if (event.heroImages?.length) {
            setCurrentHeroSlide(prev => (prev + 1) % event.heroImages.length);
        }
    };

    const prevSlide = () => {
        if (event.heroImages?.length) {
            setCurrentHeroSlide(prev => (prev - 1 + event.heroImages.length) % event.heroImages.length);
        }
    };

    // --- Block Renderers ---
    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'text':
                const textContent = (i18n.language === 'hi' && block.content?.htmlHi)
                    ? block.content.htmlHi
                    : (block.content?.html || block.content?.text || '');
                return (
                    <div key={index} className="detail-block text-block animate-up">
                        <div style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(textContent) }} />
                    </div>
                );
            default:
                return null;
        }
    };

    const youtubeCoverId = getYouTubeVideoId(event.coverImage)
        || (event.heroImages && event.heroImages.length > 0 && getYouTubeVideoId(event.heroImages[0]))
        || (event.youtubeUrl && getYouTubeVideoId(event.youtubeUrl))
        || (event.videoUrl && getYouTubeVideoId(event.videoUrl));
    const defaultCover = getEventCoverUrl(event) || '/placeholder.jpg';
    const heroImages = (event.heroImages && event.heroImages.length > 0)
        ? event.heroImages
        : [defaultCover];

    return (
        <div className="event-detail-page-premium">
            <Navbar />

            {/* Cinematic Hero Slider */}
            <header className="premium-hero">
                {heroImages.map((rawImg, idx) => {
                    const ytId = getYouTubeVideoId(rawImg);
                    const imgUrl = ytId
                        ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                        : (rawImg.startsWith('http') ? rawImg : `${API_BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`);

                    return (
                        <div
                            key={idx}
                            className={`hero-slide-item ${idx === currentHeroSlide ? 'active' : ''}`}
                        >
                            <div className="hero-media-wrapper">
                                <div
                                    className="hero-blur-bg"
                                    style={{ backgroundImage: `url(${imgUrl})` }}
                                />
                                <img
                                    src={imgUrl}
                                    alt={event.title || 'Event Cover'}
                                    className="hero-image-fg"
                                />
                            </div>
                        </div>
                    );
                })}
                <div className="hero-overlay-gradient"></div>

                <div className="hero-content-layer container">
                    <Link to="/events" className="back-link">
                        <ArrowLeft size={18} /> {i18n.language === 'hi' ? 'कार्यक्रमों पर वापस जाएं' : 'Back to Events'}
                    </Link>

                    <div className="hero-text-content">
                        <div className="hero-tags">
                            {(() => {
                                const eventDate = new Date(event.date);
                                const now = new Date();
                                const eventStatus = event.status || (event.date && eventDate < now ? 'completed' : 'upcoming');
                                return (
                                    <span className={`status-pill ${eventStatus}`}>
                                        {eventStatus === 'upcoming' ? (i18n.language === 'hi' ? 'आगामी' : 'Upcoming') :
                                            eventStatus === 'ongoing' ? (i18n.language === 'hi' ? 'अभी हो रहा है' : 'Happening Now') :
                                                (i18n.language === 'hi' ? 'पूर्ण' : 'Completed')}
                                    </span>
                                );
                            })()}
                            {event.date && <span className="date-pill"><Calendar size={14} /> {new Date(event.date).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        </div>
                        <h1 className="hero-title">{(i18n.language === 'hi' && event.title_hi) ? event.title_hi : event.title}</h1>
                        {(event.location || event.location_hi) && <p className="hero-location"><MapPin size={18} /> {(i18n.language === 'hi' && event.location_hi) ? event.location_hi : event.location}</p>}
                    </div>

                    {/* Slider Nav if multiple */}
                    {heroImages.length > 1 && (
                        <div className="hero-slider-nav">
                            <button onClick={prevSlide} className="nav-arrow"><ChevronLeft size={24} /></button>
                            <div className="slide-dots">
                                {heroImages.map((_, idx) => (
                                    <span key={idx} className={`dot ${idx === currentHeroSlide ? 'active' : ''}`} onClick={() => setCurrentHeroSlide(idx)} />
                                ))}
                            </div>
                            <button onClick={nextSlide} className="nav-arrow"><ChevronRight size={24} /></button>
                        </div>
                    )}
                </div>
            </header>

            <main className="premium-body-content">
                <div className="content-layout-grid container">

                    {/* LEFT COLUMN: Main Articles */}
                    <article className="main-article-column">
                        {/* Featured Video Embed if coverImage is YouTube */}
                        {youtubeCoverId && (
                            <div className="detail-block video-block animate-up" style={{ marginBottom: '2rem' }}>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${youtubeCoverId}?rel=0&modestbranding=1&enablejsapi=1`}
                                        title={event.title || 'Event Video'}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}

                        {/* Intro / Lead */}
                        {(event.shortDescription || event.shortDescription_hi) && (
                            <div className="article-lead">
                                <p>{(i18n.language === 'hi' && event.shortDescription_hi) ? event.shortDescription_hi : event.shortDescription}</p>
                            </div>
                        )}

                        <div className="article-blocks">
                            {event.blocks && event.blocks.length > 0 ? (
                                event.blocks.map((block, index) => renderBlock(block, index))
                            ) : (event.description || event.description_hi) ? (
                                <div className="detail-block text-block animate-up">
                                    <div style={{ whiteSpace: 'pre-line' }} dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            (i18n.language === 'hi' && event.description_hi) ? event.description_hi : (event.description || '')
                                        )
                                    }} />
                                </div>
                            ) : null}
                        </div>


                    </article>

                    {/* RIGHT COLUMN: Sidebar */}
                    <aside className="sidebar-column">
                        <div className="sidebar-widget">
                            <h3>{i18n.language === 'hi' ? 'आगामी कार्यक्रम' : 'Upcoming Events'}</h3>
                            <div className="widget-content">
                                {recentEvents.length > 0 ? (
                                    <div className="sidebar-events-list">
                                        {recentEvents.slice(0, 3).map(re => (
                                            <Link to={`/events/${re.slug}`} key={re._id} className="sidebar-event-item">
                                                <div className="sidebar-event-thumb">
                                                    <img src={getEventCoverUrl(re) || '/placeholder.jpg'} alt={re.title} />
                                                </div>
                                                <div className="sidebar-event-info">
                                                    <h4>{re.title}</h4>
                                                    <span className="date">{new Date(re.date).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="empty-widget">No other events at the moment.</p>
                                )}
                                <Link to="/events" className="widget-link">View All <ArrowRight size={14} /></Link>
                            </div>
                        </div>




                    </aside>

                </div>

                {/* --- NEW SECTION: Related Stories --- */}
                {recentEvents.length > 3 && (
                    <section className="related-stories-section container">
                        <div className="section-header-center">
                            <h2>More Stories of Change</h2>
                            <div className="title-underline"></div>
                        </div>
                        <div className="related-grid">
                            {recentEvents.slice(3, 6).map(evt => (
                                <Link to={`/events/${evt.slug}`} key={evt._id} className="related-card">
                                    <div className="related-thumb">
                                        <img src={getEventCoverUrl(evt) || '/placeholder.jpg'} alt={evt.title} />
                                        <span className="related-tag">{evt.status}</span>
                                    </div>
                                    <div className="related-content">
                                        <div className="related-date"><Calendar size={14} /> {new Date(evt.date).toLocaleDateString()}</div>
                                        <h3>{evt.title}</h3>
                                        <span className="read-more-link">Read Story <ArrowRight size={14} /></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}



            </main>

            {/* Registration Modal */}
            {isRegisterModalOpen && (
                <div className="registration-modal-overlay">
                    <div className="registration-modal-card">
                        <button className="modal-close-btn" onClick={() => setIsRegisterModalOpen(false)}>×</button>
                        <div className="modal-header">
                            <h2>{(i18n.language === 'hi' ? 'अपनी रुचि दर्ज करें' : 'Register Your Interest')}</h2>
                            <p>{(i18n.language === 'hi' ? 'हमें अपना विवरण दें, हम आपको आगामी स्वास्थ्य शिविरों और कार्यक्रमों के बारे में सूचित करेंगे।' : 'Give us your details, we will notify you about upcoming health camps and events.')}</p>
                        </div>
                        <form onSubmit={handleRegisterInterest} className="registration-form">
                            <div className="form-group">
                                <label>{(i18n.language === 'hi' ? 'पूरा नाम' : 'Full Name')}</label>
                                <input
                                    type="text"
                                    required
                                    value={registerFormData.name}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
                                    placeholder={(i18n.language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name')}
                                />
                            </div>
                            <div className="form-group">
                                <label>{(i18n.language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number')}</label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    value={registerFormData.mobile}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, mobile: e.target.value })}
                                    placeholder="10 digit mobile number"
                                />
                            </div>
                            <div className="form-group">
                                <label>{(i18n.language === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)')}</label>
                                <input
                                    type="email"
                                    value={registerFormData.email}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, email: e.target.value })}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <button type="submit" className="btn-modal-submit" disabled={registering}>
                                {registering ? (i18n.language === 'hi' ? 'पंजीकरण हो रहा है...' : 'Registering...') : (i18n.language === 'hi' ? 'पंजीकरण सबमिट करें' : 'Submit Registration')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default EventDetail;
