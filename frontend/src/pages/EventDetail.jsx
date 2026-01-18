import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Share2, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Clock, Tag, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './EventDetail.css';

const EventDetail = () => {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEvent();
        fetchRecentEvents();
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
            const res = await axios.get(`http://localhost:5000/api/events/slug/${slug}`);
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
            const res = await axios.get('http://localhost:5000/api/events');
            if (res.data.events) {
                // Get 3 events that are NOT the current one
                setRecentEvents(res.data.events.filter(e => e.slug !== slug).slice(0, 3));
            }
        } catch (err) {
            console.error(err);
        }
    }

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
                return (
                    <div key={index} className="detail-block text-block animate-up">
                        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="detail-block image-block animate-up">
                        <figure className="premium-figure">
                            <img src={block.content.url} alt={block.content.title || ''} loading="lazy" />
                            {block.content.title && <figcaption>{block.content.title}</figcaption>}
                        </figure>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="detail-block video-block animate-up">
                        <div className="block-label">Video Feature</div>
                        <div className="video-card-premium">
                            <video src={block.content.url} controls poster={block.content.thumbnail}></video>
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
                        style={{ backgroundImage: `url(${img})` }}
                    />
                ))}
                <div className="hero-overlay-gradient"></div>

                <div className="hero-content-layer container">
                    <Link to="/events" className="back-link">
                        <ArrowLeft size={18} /> Back to Events
                    </Link>

                    <div className="hero-text-content">
                        <div className="hero-tags">
                            {event.status && <span className={`status-pill ${event.status}`}>{event.status}</span>}
                            {event.date && <span className="date-pill"><Calendar size={14} /> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        </div>
                        <h1 className="hero-title">{event.title}</h1>
                        {event.location && <p className="hero-location"><MapPin size={18} /> {event.location}</p>}
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
                        {event.shortDescription && (
                            <div className="article-lead">
                                <p>{event.shortDescription}</p>
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
                                alert('Link copied to clipboard!');
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
                                        {recentEvents.map(re => (
                                            <Link to={`/events/${re.slug}`} key={re._id} className="sidebar-event-item">
                                                <div className="sidebar-event-thumb">
                                                    <img src={re.coverImage || '/placeholder.jpg'} alt={re.title} />
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
                            <h3>Support Our Cause</h3>
                            <p>Your contribution can bring a smile to someone's face today.</p>
                            <Link to="/donate" className="sidebar-donate-btn">Donate Now</Link>
                        </div>

                        <div className="sidebar-widget">
                            <h3>Share This</h3>
                            <div className="sidebar-share-row">
                                <button className="side-share-icon fb"><Share2 size={18} /></button>
                                {/* Add real share links if needed */}
                            </div>
                        </div>
                    </aside>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EventDetail;
