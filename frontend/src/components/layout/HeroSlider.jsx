import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
                // Ensure only visible slides are used
                const visibleSlides = data.filter(s => s.isVisible !== false).sort((a, b) => a.order - b.order);
                setSlides(visibleSlides);
            } catch (error) {
                console.error("Failed to fetch sliders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    const heroMode = slides.length >= 4;

    useEffect(() => {
        if (heroMode && slides.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [heroMode, slides.length]);

    if (loading) return <div style={{ height: '550px', background: '#F0F9FF' }}></div>;
    if (slides.length === 0) return null;

    // Determine current slide for text content
    // For static mode (< 4), we just pick the first one or let the user click? 
    // The prompt implies static layout for < 4. Let's default to the first one for text 
    // but maybe allow clicking to select in future? converting static to just 'no auto rotate'.
    // actually, for <4, let's just make the "Center" one the focus if possible, or just index 1.
    // Let's stick to using currentIndex even for static, but maybe without auto-rotation?
    // User said: "Show a static layout with 3 images fixed side-by-side. No animation."
    // This implies purely static. So text is likely from the primary (first) slide or generic.
    // But checking the 'admin/sliders' requirement, likely dynamic.
    // I will use slides[currentIndex] for text. In static mode, currentIndex defaults to 0 and stays there?
    // Or maybe I should make the static cards clickable to change the text?
    // For now, I'll default to index 1 (center visual) as the 'active' one for text if static, or just 0. 
    // Let's go with 0 for static.

    const activeSlide = slides[currentIndex];

    // Card Variants for Animation
    const cardVariants = {
        center: {
            x: 0,
            scale: 1.1,
            zIndex: 10,
            rotate: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        left: {
            x: -250,
            scale: 0.9,
            zIndex: 5,
            rotate: -6,
            opacity: 0.8,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        right: {
            x: 250,
            scale: 0.9,
            zIndex: 5,
            rotate: 6,
            opacity: 0.8,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        enter: {
            x: 450,
            scale: 0.7,
            zIndex: 1,
            rotate: 15,
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        exit: {
            x: -450,
            scale: 0.7,
            zIndex: 1,
            rotate: -15,
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        hidden: {
            opacity: 0,
            zIndex: 0,
            display: 'none'
        }
    };

    const getPosition = (index) => {
        if (!heroMode) {
            // Static Layout Logic
            // Just show first 3 side-by-side
            if (index === 0) return 'left';
            if (index === 1) return 'center'; // Visually center
            if (index === 2) return 'right';
            return 'hidden';
        }

        const len = slides.length;
        // Calculate relative indices
        const isCenter = index === currentIndex;
        const isLeft = index === (currentIndex - 1 + len) % len;
        const isRight = index === (currentIndex + 1) % len;

        // We need to identify 'enter' (next to come) and 'exit' (just left)
        // If moving Right -> Left (slides rotate Left)
        // active: 1. Next active: 2.
        // 2 (Right) -> Center
        // 1 (Center) -> Left
        // 0 (Left) -> Exit
        // 3 (New) -> Right (Enter)

        // So for a specific render current=C
        // (C-1) is Left
        // (C+1) is Right
        // (C+2) is Enter (waiting at right)
        // (C-2) is Exit (just left) - actually standard is just hiding any others.
        // But to animate 'Left' -> 'Exit', it needs to be identified.
        // With only 4 visible states, we can treat all others as Hidden/Enter.

        const isEnter = index === (currentIndex + 2) % len;
        // If we want the 'exit' animation to happen, the item that WAS left needs to go to 'exit'.
        // That is index === (currentIndex - 2 + len) % len ?
        // Yes, roughly.
        const isExit = index === (currentIndex - 2 + len) % len;

        if (isCenter) return 'center';
        if (isLeft) return 'left';
        if (isRight) return 'right';
        if (isEnter) return 'enter';
        if (isExit) return 'exit';

        return 'hidden';
    };

    // For static mode, we need to override the Variant positions to be static visuals
    const staticVariants = {
        center: { x: 0, scale: 1.1, zIndex: 10, opacity: 1 },
        left: { x: -220, scale: 0.9, zIndex: 5, opacity: 1 },
        right: { x: 220, scale: 0.9, zIndex: 5, opacity: 1 },
        hidden: { opacity: 0, display: 'none' }
    };

    // Use a secondary index for text if static? 
    // If static, let's fix the text to the center card (index 1) if it exists, else 0
    const textSlide = !heroMode && slides.length >= 2 ? slides[1] : activeSlide;

    return (
        <section className="hero-section">
            <div className="hero-container">
                {/* Visuals - Dial */}
                <div className="hero-visuals">
                    {slides.map((slide, index) => {
                        const position = getPosition(index);
                        const isHidden = position === 'hidden';
                        // Optimization: Don't animate hidden slides if too many
                        if (isHidden && heroMode && slides.length > 10) return null;

                        return (
                            <motion.div
                                key={slide._id || index}
                                className="hero-card"
                                variants={heroMode ? cardVariants : staticVariants}
                                initial="enter"
                                animate={position}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <img src={slide.imageUrl} alt={slide.title} />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="hero-content">
                    <motion.div
                        key={textSlide._id} // Animate text when slide changes
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="hero-text-wrapper"
                    >
                        <h1 className="hero-title">{textSlide.title}</h1>

                        <div className="hero-stats">
                            {/* Hardcoded stats for visual matching or dynamic if available */}
                            <div className="stat-item">
                                <h3>0%</h3>
                                <p>PLATFORM FEE</p>
                            </div>
                            <div className="stat-item">
                                <h3>72 Lakh+</h3>
                                <p>CONTRIBUTORS</p>
                            </div>
                            <div className="stat-item">
                                <h3>3.2 Lakh+</h3>
                                <p>RAISED</p>
                            </div>
                        </div>

                        <p className="hero-description">
                            {textSlide.subtitle || "Every contribution brings us closer to a better world. Join our mission today."}
                        </p>

                        <Link to={textSlide.ctaLink} className="hero-cta-btn">
                            {textSlide.ctaText}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"></path>
                                <path d="M12 5l7 7-7 7"></path>
                            </svg>
                        </Link>

                        <Link to="/how-it-works" className="hero-link-arrow">
                            See how it works &gt;
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSlider;
