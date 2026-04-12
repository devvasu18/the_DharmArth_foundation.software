import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import './HeroSlider.css';

const HeroSlider = () => {
    const { t, i18n } = useTranslation();
    const [slides, setSlides] = useState([]);
    const [textSlides, setTextSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const { data } = await api.get('/content/sliders');
                const visible = data.filter(s => s.isVisible !== false).sort((a, b) => a.order - b.order);
                const visuals = visible.filter(s => s.type === 'image' || !s.type); // Default to image if undefined
                const texts = visible.filter(s => s.type === 'text');

                // If no explicit text slides, use visuals as legacy text source
                const finalTexts = texts.length > 0 ? texts : visuals;

                setSlides(visuals);
                setTextSlides(finalTexts);
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

    // Rotate text independently if there are multiple text contents
    useEffect(() => {
        if (textSlides.length > 1) {
            const interval = setInterval(() => {
                setCurrentTextIndex((prev) => (prev + 1) % textSlides.length);
            }, 6000);
            return () => clearInterval(interval);
        }
    }, [textSlides.length]);

    if (loading) return <div style={{ height: '550px', background: '#F0F9FF' }}></div>;
    // We display even if only text or only images exist?
    // If no images (slides), might look empty. 
    // If slides is empty but texts exist, we might want to show placeholders? 
    // Assuming at least one image exists for now.
    if (slides.length === 0 && textSlides.length === 0) return null;

    // Use currentTextIndex for text, fallback to first
    const activeTextSlide = textSlides[currentTextIndex] || textSlides[0];

    const xOffset = isMobile ? 120 : 220;
    const enterExitOffset = isMobile ? 220 : 400;

    // Card Variants for Animation
    const cardVariants = {
        center: {
            x: 0,
            y: "-40%",
            scale: 1.1,
            zIndex: 10,
            rotate: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        left: {
            x: -xOffset,
            y: "-40%",
            scale: 0.9,
            zIndex: 5,
            rotate: -6,
            opacity: 0.9,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        right: {
            x: xOffset,
            y: "-40%",
            scale: 0.9,
            zIndex: 5,
            rotate: 6,
            opacity: 0.9,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        enter: {
            x: enterExitOffset,
            y: "-40%",
            scale: 0.7,
            zIndex: 1,
            rotate: 15,
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        exit: {
            x: -enterExitOffset,
            y: "-40%",
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
        const isEnter = index === (currentIndex + 2) % len;
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
        center: { x: 0, y: "-40%", scale: 1.1, zIndex: 10, opacity: 1 },
        left: { x: -130, y: "-40%", scale: 0.85, zIndex: 5, opacity: 1 },
        right: { x: 130, y: "-40%", scale: 0.85, zIndex: 5, opacity: 1 },
        hidden: { opacity: 0, display: 'none' }
    };

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
                    {activeTextSlide && (
                        <motion.div
                            key={activeTextSlide._id} // Animate text when slide changes
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="hero-text-wrapper"
                        >
                            <h1 className="hero-title black">
                                {i18n.language === 'hi' && activeTextSlide.title_hi ? activeTextSlide.title_hi : activeTextSlide.title}
                            </h1>

                            <div className="hero-stats">
                                {/* Hardcoded stats for visual matching or dynamic if available */}
                                <div className="stat-item">
                                    <h3>{t('hero.feePercent')}</h3>
                                    <p>{t('hero.feeLabel')}</p>
                                </div>
                                <div className="stat-item">
                                    <h3>72 Lakh+</h3>
                                    <p>{t('hero.contributorsLabel')}</p>
                                </div>

                            </div>

                            <p className="hero-description">
                                {i18n.language === 'hi' && activeTextSlide.subtitle_hi ? activeTextSlide.subtitle_hi : (activeTextSlide.subtitle || t('hero.defaultSubtitle'))}
                            </p>

                            <Link to={activeTextSlide.ctaLink} className="hero-cta-btn">
                                {activeTextSlide.ctaText}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14"></path>
                                    <path d="M12 5l7 7-7 7"></path>
                                </svg>
                            </Link>

                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSlider;
