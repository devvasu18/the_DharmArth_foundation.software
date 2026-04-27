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
            document.title = (res.data.metaTitle || res.data.title) + " - The Dharmarth Foundation";
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
                const htmlContent = (i18n.language === 'hi' && block.content.htmlHi) ? block.content.htmlHi : block.content.html;
                return (
                    <div key={index} className="detail-block text-block animate-up">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="detail-block image-block animate-up">
                        <figure className="premium-figure">
                            <img src={block.content.url.startsWith('http') ? block.content.url : `${API_BASE_URL}${block.content.url.startsWith('/') ? '' : '/'}${block.content.url}`} alt={block.content.title || ''} loading="lazy" />
                            {block.content.title && <figcaption>{block.content.title}</figcaption>}
                        </figure>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="detail-block video-block animate-up">
                        <div className="block-label">Video Feature</div>
                        <div className="video-card-premium">
                            <video src={block.content.url.startsWith('http') ? block.content.url : `${API_BASE_URL}${block.content.url.startsWith('/') ? '' : '/'}${block.content.url}`} controls poster={block.content.thumbnail && (block.content.thumbnail.startsWith('http') ? block.content.thumbnail : `${API_BASE_URL}${block.content.thumbnail.startsWith('/') ? '' : '/'}${block.content.thumbnail}`)}></video>
                        </div>
                        {block.content.caption && <p className="media-caption">{block.content.caption}</p>}
                    </div>
                );
            case 'youtube':
                let videoId = '';
                try {
                    const url = block.content.url;
                    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
                    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1];
                    else if (url.includes('embed/')) videoId = url.split('embed/')[1];
                } catch (e) { }

                if (!videoId) return null;

                return (
                    <div key={index} className="detail-block youtube-block animate-up">
                        <div className="block-label">Watch Highlight</div>
                        <div className="youtube-card-premium">
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                );
            case 'instagram':
                return (
                    <div key={index} className="detail-block instagram-block animate-up">
                        <div className="block-label instagram-label">Instagram Feature</div>
                        <div className="instagram-card-premium">
                            <blockquote
                                className="instagram-media"
                                data-instgrm-permalink={block.content.url}
                                data-instgrm-version="14"
                            ></blockquote>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const heroImages = (event.heroImages && event.heroImages.length > 0) ? event.heroImages : [event.coverImage];

    return (
        <div className="event-detail-page-premium">
            <Navbar />

            {/* Cinematic Hero Slider */}
            <header className="premium-hero">
                {heroImages.map((img, idx) => (
                    <div
                        key={idx}
                        className={`hero-slide-bg ${idx === currentHeroSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${img.startsWith('http') ? img : `${API_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`})` }}
                    />
                ))}
                <div className="hero-overlay-gradient"></div>

                <div className="hero-content-layer container">
                    <Link to="/events" className="back-link">
                        <ArrowLeft size={18} /> Back to Events
                    </Link>

                    <div className="hero-text-content">
                        <div className="hero-tags">
                            {event.status && <span className={`status-pill ${event.status}`}>{event.status === 'upcoming' ? (i18n.language === 'hi' ? 'आगामी' : 'Upcoming') : event.status === 'ongoing' ? (i18n.language === 'hi' ? 'अभी हो रहा है' : 'Happening Now') : (i18n.language === 'hi' ? 'पूर्ण' : 'Completed')}</span>}
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
                        {/* Intro / Lead */}
                        {(event.shortDescription || event.shortDescription_hi) && (
                            <div className="article-lead">
                                <p>{(i18n.language === 'hi' && event.shortDescription_hi) ? event.shortDescription_hi : event.shortDescription}</p>
                            </div>
                        )}

                        <div className="article-blocks">
                            {event.blocks && event.blocks.map((block, index) => renderBlock(block, index))}
                        </div>

                        <div className="article-footer">
                            <div className="author-info">
                                <span className="label">Published By</span>
                                <span className="value">The Dharmarth Foundation</span>
                            </div>
                            <div className="publish-info">
                                <Clock size={16} />
                                <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                            </div>

                            <button className="share-btn-large" onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success('Link copied to clipboard!');
                            }}>
                                <Share2 size={18} /> Share Event
                            </button>
                        </div>
                    </article>

                    {/* RIGHT COLUMN: Sidebar */}
                    <aside className="sidebar-column">
                        <div className="sidebar-widget">
                            <h3>Upcoming Events</h3>
                            <div className="widget-content">
                                {recentEvents.length > 0 ? (
                                    <div className="sidebar-events-list">
                                        {recentEvents.slice(0, 3).map(re => (
                                            <Link to={`/events/${re.slug}`} key={re._id} className="sidebar-event-item">
                                                <div className="sidebar-event-thumb">
                                                    <img src={re.coverImage && (re.coverImage.startsWith('http') ? re.coverImage : `${API_BASE_URL}${re.coverImage.startsWith('/') ? '' : '/'}${re.coverImage}`) || '/placeholder.jpg'} alt={re.title} />
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

                        <div className="sidebar-widget highlight">
                            <h3>{(i18n.language === 'hi' ? 'इस कार्यक्रम में रुचि है?' : 'Interested in this event?')}</h3>
                            <p>{(i18n.language === 'hi' ? 'पंजीकरण करें और जब यह शुरू हो तो एक अनुस्मारक प्राप्त करें।' : 'Register and get a reminder when it starts.')}</p>
                            <button
                                className="sidebar-donate-btn"
                                onClick={() => setIsRegisterModalOpen(true)}
                                style={{ border: 'none', width: '100%' }}
                            >
                                {(i18n.language === 'hi' ? 'अभी पंजीकरण करें' : 'Register Interest')}
                            </button>
                        </div>

                        <div className="sidebar-widget">
                            <h3>Share This</h3>
                            <div className="sidebar-share-row">
                                <button className="side-share-icon fb" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success('Link copied to clipboard!');
                                }}><Share2 size={18} /></button>
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
                                        <img src={evt.coverImage && (evt.coverImage.startsWith('http') ? evt.coverImage : `${API_BASE_URL}${evt.coverImage.startsWith('/') ? '' : '/'}${evt.coverImage}`) || '/placeholder.jpg'} alt={evt.title} />
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

                {/* --- NEW SECTION: CTA Banner --- */}
                <section className="detail-cta-banner container">
                    <div className="cta-banner-card">
                        <div className="cta-text">
                            <h2>Inspired by what you read?</h2>
                            <p>Join our mission. Whether you contribute your time or money, every bit helps us bring change.</p>
                        </div>
                        <div className="cta-actions">
                            <Link to="/donate" className="btn-banner primary">Donate Now</Link>
                            <Link to="/volunteer" className="btn-banner outline">Become a Volunteer</Link>
                        </div>
                    </div>
                </section>

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
