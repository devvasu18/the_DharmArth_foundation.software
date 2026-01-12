import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './HeroSlider.css';

const HeroSlider = () => {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const { data } = await api.get('/content/sliders');
                setSlides(data);
            } catch (error) {
                console.error("Failed to fetch sliders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    const displaySlides = slides;
    const heroMode = displaySlides.length >= 4;

    useEffect(() => {
        if (heroMode && displaySlides.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [heroMode, displaySlides.length]);

    if (loading) return <div style={{ height: '400px', background: '#f0f0f0' }}></div>;
    if (displaySlides.length === 0) return null;

    if (!heroMode) {
        return (
            <div className="static-slider-container">
                {displaySlides.map((slide, index) => (
                    <div key={slide._id || index} className="static-slide" style={{ backgroundImage: `url(${slide.imageUrl})` }}>
                        <div className="hero-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                            <div className="container" style={{ paddingBottom: '20px' }}>
                                <h2 className="text-white text-xl font-bold">{slide.title}</h2>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="hero-slider">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="hero-slide"
                    style={{ backgroundImage: `url(${displaySlides[currentIndex].imageUrl})` }}
                >
                    <div className="hero-overlay">
                        <div className="container hero-content-box">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="hero-title"
                            >
                                {displaySlides[currentIndex].title}
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="hero-subtitle"
                            >
                                {displaySlides[currentIndex].subtitle}
                            </motion.p>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Link to={displaySlides[currentIndex].ctaLink} className="hero-cta">
                                    {displaySlides[currentIndex].ctaText}
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators */}
            <div className="hero-indicators">
                {displaySlides.map((_, idx) => (
                    <div
                        key={idx}
                        className={`indicator ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
