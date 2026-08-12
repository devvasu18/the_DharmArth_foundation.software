import React, { useState } from 'react';
import { Play, Share2, Clock } from 'lucide-react';
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
        <section className="cms-section video-cms-section">
            <div className="cms-container">
                <div className="section-header-box">
                    <h2 className="cms-section-title">{data?.title || 'Watch Our Story'}</h2>
                    {data?.subtitle && <p className="cms-section-subtitle">{data.subtitle}</p>}
                </div>

                <div
                    className={`video-embed-container ${isPlaying ? 'playing' : ''}`}
                    onClick={() => !isPlaying && setIsPlaying(true)}
                >
                    {!isPlaying ? (
                        <>
                            <img src={thumbnailUrl} alt={data.title || 'Video Thumbnail'} className="video-thumbnail" />
                            <div className="video-overlay">
                                <div className="video-header">
                                    <div className="channel-icon">
                                        <img src="/logo192.png" alt="Channel" className="channel-img" />
                                    </div>
                                    <div className="video-title-info">
                                        <h4>{data.title || 'Dharmarth Foundation | Impact Video'}</h4>
                                        <span className="channel-name">The Dharmarth Medical Foundation</span>
                                    </div>
                                </div>

                                <div className="play-button-wrapper">
                                    <div className="play-button">
                                        <Play size={36} fill="white" />
                                    </div>
                                </div>

                                <div className="video-footer">
                                    <div className="footer-left-actions">
                                        <div className="action-icon" title="Share">
                                            <Share2 size={18} color="white" />
                                        </div>
                                        <div className="action-icon" title="Watch Later">
                                            <Clock size={18} color="white" />
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
                            title={data.title || 'Video Player'}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )}
                </div>
            </div>
        </section>
    );
};

export default VideoSection;
