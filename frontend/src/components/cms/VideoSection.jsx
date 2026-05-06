import React, { useState } from 'react';
import { Play, Share2, Clock, ExternalLink } from 'lucide-react';
import './VideoSection.css';

const VideoSection = ({ data }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    if (!data?.videoUrl) return null;

    const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = extractVideoId(data.videoUrl);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    return (
        <section className="cms-section py-24 bg-white">
            <div className="cms-container">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="cms-heading">{data?.title || 'Watch Our Story'}</h2>
                        <p className="cms-subheading mx-auto">{data?.subtitle}</p>
                    </div>
                    
                    <div 
                        className={`video-embed-container ${isPlaying ? 'playing' : ''}`}
                        onClick={() => !isPlaying && setIsPlaying(true)}
                    >
                        {!isPlaying ? (
                            <>
                                <img src={thumbnailUrl} alt={data.title} className="video-thumbnail" />
                                <div className="video-overlay">
                                    <div className="video-header">
                                        <div className="channel-icon">
                                            <img src="/logo192.png" alt="Channel" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="video-title-info">
                                            <h4>{data.title || 'Dharmarth Foundation | Impact Video'}</h4>
                                            <span className="channel-name">ॐ नाम OM NAAM</span>
                                        </div>
                                    </div>

                                    <div className="play-button-wrapper">
                                        <div className="play-button">
                                            <Play size={40} fill="white" />
                                        </div>
                                    </div>

                                    <div className="video-footer">
                                        <div className="footer-left-actions">
                                            <div className="action-icon">
                                                <Share2 size={20} />
                                            </div>
                                            <div className="action-icon">
                                                <Clock size={20} />
                                            </div>
                                        </div>
                                        <a 
                                            href={data.videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="watch-on-youtube"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Watch on <span className="youtube-logo">YouTube</span>
                                        </a>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <iframe 
                                className="video-iframe"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                title={data.title}
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VideoSection;

