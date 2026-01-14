import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './EventDetail.css';

const EventDetail = () => {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvent();
    }, [slug]);

    const fetchEvent = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/events/slug/${slug}`);
            setEvent(res.data);
            // Update document title for SEO
            document.title = (res.data.metaTitle || res.data.title) + " - Dharmarth Foundation";
        } catch (error) {
            console.error('Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (event && event.blocks.some(b => b.type === 'instagram')) {
            // Function to process Instagram embeds
            const processInstagram = () => {
                if (window.instgrm) {
                    // Small delay to ensure DOM is updated
                    setTimeout(() => {
                        window.instgrm.Embeds.process();
                    }, 500);
                }
            };

            if (!window.instgrm) {
                const script = document.createElement('script');
                script.src = "//www.instagram.com/embed.js";
                script.async = true;
                script.onload = processInstagram; // Process after load
                document.body.appendChild(script);
            } else {
                processInstagram(); // Process if already loaded
            }
        }
    }, [event]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={40} />
        </div>
    );

    if (!event) return (
        <div style={{ padding: 50, textAlign: 'center' }}>
            <h2>Event not found</h2>
            <Link to="/events" className="btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>Back to Events</Link>
        </div>
    );

    // Helpers to render blocks
    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'text':
                return (
                    <div key={index} className="content-block-render text-block">
                        <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="content-block-render image-block">
                        <figure>
                            <img src={block.content.url} alt={block.content.title || event.title} loading="lazy" />
                            {block.content.title && <figcaption>{block.content.title}</figcaption>}
                        </figure>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="content-block-render video-block">
                        <div className="video-container">
                            <video src={block.content.url} controls poster={block.content.thumbnail}></video>
                        </div>
                        {block.content.caption && <p style={{ textAlign: 'center', color: '#666', marginTop: 10 }}>{block.content.caption}</p>}
                    </div>
                );
            case 'youtube':
                // robust youtube id extraction
                let videoId = '';
                try {
                    const url = block.content.url;
                    if (!url) return null;

                    // Regex for various youtube formats (standard, short, embed, mobile)
                    const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:[?&].*)?$/;
                    const match = url.match(regExp);

                    if (match && match[1]) {
                        videoId = match[1];
                    }
                } catch (e) {
                    console.error("Youtube parsing error", e);
                }

                if (!videoId) return null;

                return (
                    <div key={index} className="content-block-render youtube-block">
                        <div className="video-container">
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
                    <div key={index} className="content-block-render instagram-block">
                        <blockquote
                            className="instagram-media"
                            data-instgrm-permalink={block.content.url}
                            data-instgrm-version="14"
                            style={{
                                background: '#FFF',
                                border: 0,
                                borderRadius: 3,
                                boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                                margin: '0 auto', // Center it
                                maxWidth: 540,
                                minWidth: 326,
                                padding: 0,
                                width: '99.375%',
                                width: '-webkit-calc(100% - 2px)',
                                width: 'calc(100% - 2px)'
                            }}
                        >
                            <div style={{ padding: 16 }}>
                                <a href={block.content.url} style={{ background: '#FFFFFF', lineHeight: 0, padding: '0 0', textAlign: 'center', textDecoration: 'none', width: '100%' }} target="_blank" rel="noreferrer">
                                    View this post on Instagram
                                </a>
                            </div>
                        </blockquote>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="event-detail-container">
            <Navbar />

            <div className="event-hero" style={{ backgroundImage: `url(${event.coverImage || 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'})` }}>
                <div className="event-hero-overlay"></div>
                <div className="container event-hero-content">
                    <Link to="/events" style={{ color: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 20, opacity: 0.8 }}>
                        <ArrowLeft size={16} /> Back to Events
                    </Link>
                    <h1 className="event-title-large">{event.title}</h1>
                    <div className="event-meta-row">
                        {event.date && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={18} /> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        )}
                        {event.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <MapPin size={18} /> {event.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <main className="event-detail-content">
                {/* Short Description Intro */}
                {event.shortDescription && (
                    <div style={{ fontSize: '1.3rem', lineHeight: '1.6', color: '#4b5563', marginBottom: 40, borderLeft: '4px solid var(--primary)', paddingLeft: 20 }}>
                        {event.shortDescription}
                    </div>
                )}

                {/* Blocks */}
                <div className="blocks-wrapper">
                    {event.blocks && event.blocks.map((block, index) => renderBlock(block, index))}
                </div>

                <div className="share-section">
                    <h3>Share this Event</h3>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
                        <button className="btn-secondary" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '8px 16px', borderRadius: 20, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                            <Share2 size={16} /> Copy Link
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default EventDetail;
