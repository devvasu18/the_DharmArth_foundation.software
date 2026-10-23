import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Stethoscope, Users, FlaskConical, Pill, Share2, Activity, User, LayoutGrid, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './HeroSlider.css';

// Web SVG Icon Components matching Mobile App SVGs
const DoctorSvg = ({ size = 38, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="256" cy="256" r="240" fill="#E0F2FE" />
        <g>
            <path d="M165 210 C165 190, 186 195, 186 215 C186 235, 165 230, 165 210 Z" fill="#FCD0B4" />
            <path d="M347 210 C347 190, 326 195, 326 215 C326 235, 347 230, 347 210 Z" fill="#FCD0B4" />
            <path d="M220 280 L220 350 H292 L292 280 Z" fill="#ECA985" />
            <path d="M185 180 C185 270, 205 310, 256 310 C307 310, 327 270, 327 180 C327 150, 185 150, 185 180 Z" fill="#FCD0B4" />
        </g>
        <g>
            <path d="M178 180 C170 170, 172 130, 195 105 C215 85, 275 80, 310 100 C335 120, 342 160, 334 180 C330 150, 305 130, 256 130 C207 130, 182 150, 178 180 Z" fill="#1A1A1A" />
            <path d="M176 160 C170 130, 190 90, 230 75 C270 60, 320 70, 340 100 C350 115, 345 140, 340 155 C330 120, 280 110, 240 120 C200 130, 185 145, 176 160 Z" fill="#2D2D2D" />
            <path d="M210 120 C240 110, 290 115, 335 145 C325 130, 280 125, 245 130 C210 135, 195 145, 195 145 Z" fill="#1A1A1A" />
        </g>
        <g>
            <path d="M200 162 Q220 147 240 157" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M312 162 Q292 147 272 157" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" fill="none" />
            <ellipse cx="220" cy="188" rx="7" ry="9" fill="#1A1A1A" />
            <circle cx="218" cy="185" r="2.5" fill="#FFFFFF" />
            <ellipse cx="292" cy="188" rx="7" ry="9" fill="#1A1A1A" />
            <circle cx="290" cy="185" r="2.5" fill="#FFFFFF" />
            <path d="M256 188 C256 188 246 220 256 220" stroke="#ECA985" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M251 218 Q256 223 261 218" stroke="#ECA985" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M232 248 Q256 268 280 248" stroke="#B76E59" strokeWidth="5" strokeLinecap="round" fill="none" />
            <rect x="190" y="168" width="55" height="42" rx="14" stroke="#1A1A1A" strokeWidth="7" fill="none" />
            <rect x="267" y="168" width="55" height="42" rx="14" stroke="#1A1A1A" strokeWidth="7" fill="none" />
            <path d="M245 183 H267" stroke="#1A1A1A" strokeWidth="7" strokeLinecap="round" />
            <path d="M190 183 Q176 179 168 178" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
            <path d="M322 183 Q336 179 344 178" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
        </g>
        <g>
            <path d="M110 400 C110 345 160 315 256 315 C352 315 402 345 402 400 L412 512 H100 L110 400 Z" fill="#FFFFFF" />
            <path d="M210 315 L256 395 L302 315 Z" fill="#BAD8FF" />
            <path d="M210 315 L238 360 L256 350 Z" fill="#9CC3F2" />
            <path d="M302 315 L274 360 L256 350 Z" fill="#9CC3F2" />
            <path d="M248 350 H264 L260 365 H252 Z" fill="#1D3557" />
            <path d="M252 365 H260 L266 430 L256 445 L246 430 Z" fill="#1D3557" />
            <path d="M254 365 H258 L262 425 L256 438 L250 425 Z" fill="#2A4B7C" />
            <path d="M210 315 L170 345 L210 435 L256 455" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M302 315 L342 345 L302 435 L256 455" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M295 385 H335 V435 C335 440 295 440 295 435 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
            <path d="M105 450 C115 435 240 430 260 430 C270 430 270 480 260 495 L105 495 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3.5" />
            <path d="M407 450 C397 435 272 430 252 430 C242 430 242 480 252 495 L407 495 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3.5" />
            <path d="M190 442 C200 442 210 460 210 475" stroke="#CBD5E1" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M322 442 C312 442 302 460 302 475" stroke="#CBD5E1" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </g>
    </svg>
);

const CapsuleSvg = ({ size = 42, color = '#FFFFFF', ...props }) => (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g transform="translate(210, 210) rotate(45)">
            <rect x="-65" y="-140" width="130" height="280" rx="65" stroke={color} strokeWidth="20" fill="none" />
            <path d="M -65,0 H 65" stroke={color} strokeWidth="20" strokeLinecap="round" />
            <path d="M -48,-22 H 48 V -75 A 48,48 0 0,0 -48,-75 Z" fill={color} />
            <path d="M -36,-84 A 36,36 0 0,1 -12,-108" stroke="#2b9ebb" strokeWidth="10" strokeLinecap="round" fill="none" />
        </g>
        <circle cx="350" cy="350" r="75" fill={color} />
        <path d="M 265,350 H 435" stroke="#2b9ebb" strokeWidth="18" strokeLinecap="round" />
    </svg>
);

const HeroSlider = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [slides, setSlides] = useState([]);
    const [textSlides, setTextSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [showTestCategoryModal, setShowTestCategoryModal] = useState(false);

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
                const response = await api.get('/content/sliders');
                const allSliders = (response.data || []).filter(s => s.isVisible !== false);
                const images = allSliders.filter(s => s.type === 'image' || !s.type).sort((a, b) => (a.order || 0) - (b.order || 0));
                const texts = allSliders.filter(s => s.type === 'text').sort((a, b) => (a.order || 0) - (b.order || 0));

                setSlides(images);
                setTextSlides(texts.length > 0 ? texts : images);
            } catch (error) {
                console.error("Error fetching slides:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const activeTextSlide = textSlides[currentIndex] || textSlides[0];

    const getTranslatedText = (textObj) => {
        if (!textObj) return '';
        if (typeof textObj === 'string') return textObj;
        return textObj[i18n.language] || textObj['en'] || textObj['hi'] || '';
    };

    return (
        <>
            <section className="hero-slider-section">
                <div className="hero-container">
                    {/* Visuals */}
                    <div className="hero-visuals">
                        {slides.map((slide, index) => {
                            let position = "hidden";
                            if (index === currentIndex) position = "active";
                            else if (index === (currentIndex - 1 + slides.length) % slides.length) position = "prev";
                            else if (index === (currentIndex + 1) % slides.length) position = "next";

                            const cardVariants = {
                                active: { x: "0%", scale: 1, zIndex: 10, opacity: 1 },
                                prev: { x: "-25%", scale: 0.85, zIndex: 5, opacity: 0.7 },
                                next: { x: "25%", scale: 0.85, zIndex: 5, opacity: 0.7 },
                                hidden: { x: "0%", scale: 0.7, zIndex: 1, opacity: 0 }
                            };

                            const staticVariants = {
                                active: { opacity: 1, zIndex: 10 },
                                prev: { opacity: 0, zIndex: 1 },
                                next: { opacity: 0, zIndex: 1 },
                                hidden: { opacity: 0, zIndex: 1 }
                            };

                            const heroMode = false;

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

                    {/* Mobile Hero Controls (Dots + Red Donate Button) */}
                    <div className="mobile-hero-controls">
                        {slides.length > 1 && (
                            <div className="hero-dots">
                                {slides.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`hero-dot ${idx === currentIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentIndex(idx)}
                                    />
                                ))}
                            </div>
                        )}
                        <Link to={activeTextSlide?.ctaLink || "/events"} className="mobile-red-donate-btn">
                            {i18n.language === 'hi' ? 'अभी दान करें' : 'Donate Now'}
                            <ArrowRight size={20} />
                        </Link>
                    </div>

                    {/* Content */}
                    <div className="hero-content">
                        {activeTextSlide && (
                            <motion.div
                                key={activeTextSlide._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="hero-text-wrapper"
                            >
                                <h1 className="hero-title black">
                                    {i18n.language === 'hi'
                                        ? (activeTextSlide.title_hi || getTranslatedText(activeTextSlide.title))
                                        : activeTextSlide.title}
                                </h1>

                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <h3>
                                            {i18n.language === 'hi'
                                                ? (activeTextSlide.stat1Number_hi || activeTextSlide.stat1Number || t('hero.feePercent'))
                                                : (activeTextSlide.stat1Number || t('hero.feeLabel'))}
                                        </h3>
                                        <p>
                                            {i18n.language === 'hi'
                                                ? (activeTextSlide.stat1Label_hi || activeTextSlide.stat1Label || t('hero.feeLabel'))
                                                : (activeTextSlide.stat1Label || t('hero.feeLabel'))}
                                        </p>
                                    </div>
                                    <div className="stat-item">
                                        <h3>
                                            {i18n.language === 'hi'
                                                ? (activeTextSlide.stat2Number_hi || activeTextSlide.stat2Number || "72 लाख+")
                                                : (activeTextSlide.stat2Number || "72 Lakh+")}
                                        </h3>
                                        <p>
                                            {i18n.language === 'hi'
                                                ? (activeTextSlide.stat2Label_hi || activeTextSlide.stat2Label || t('hero.contributorsLabel'))
                                                : (activeTextSlide.stat2Label || t('hero.contributorsLabel'))}
                                        </p>
                                    </div>
                                </div>

                                <p className="hero-description">
                                    {i18n.language === 'hi'
                                        ? (activeTextSlide.subtitle_hi || getTranslatedText(activeTextSlide.subtitle))
                                        : (activeTextSlide.subtitle || t('hero.defaultSubtitle'))}
                                </p>

                                <Link to={activeTextSlide.ctaLink || "/events"} className="hero-cta-btn">
                                    {i18n.language === 'hi'
                                        ? (activeTextSlide.ctaText_hi || getTranslatedText(activeTextSlide.ctaText))
                                        : (activeTextSlide.ctaText || 'Donate')}
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

            {/* Mobile Quick Action Grid */}
            <div className="mobile-action-grid-wrapper">
                <div className="mobile-action-grid">
                    <Link to="/doctors" className="mobile-card card-orange">
                        <div className="mobile-card-text">
                            <span>{i18n.language === 'hi' ? 'सुजानगढ़ के डॉक्टर ढूंढें' : 'Find Doctors of Sujangarh'}</span>
                        </div>
                        <div className="mobile-card-icon">
                            <DoctorSvg size={38} />
                        </div>
                    </Link>

                    <Link to="/p/join-and-earn" className="mobile-card card-purple">
                        <div className="mobile-card-text">
                            <span>{i18n.language === 'hi' ? 'अभी जुड़ें ' : 'Join Now'}</span>
                        </div>
                        <div className="mobile-card-icon">
                            <Users size={38} color="#ffffff" />
                        </div>
                    </Link>

                    <div
                        className="mobile-card card-green"
                        onClick={() => setShowTestCategoryModal(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="mobile-card-text">
                            <span>{i18n.language === 'hi' ? 'ब्लड टेस्ट' : 'Blood Tests'}</span>
                        </div>
                        <div className="mobile-card-icon">
                            <FlaskConical size={38} color="#ffffff" />
                        </div>
                    </div>

                    <Link to="/order-medicine" className="mobile-card card-cyan">
                        <span className="card-badge">{i18n.language === 'hi' ? 'जल्द आ रहा है' : 'Coming Soon'}</span>
                        <div className="mobile-card-text">
                            <span>{i18n.language === 'hi' ? 'ऑनलाइन दवा ऑर्डर करें' : 'Order Online Medicine'}</span>
                        </div>
                        <div className="mobile-card-icon">
                            <CapsuleSvg size={42} />
                        </div>
                    </Link>

                    <Link to={user ? `/v/${user.referralCode || user.mobile}` : "/login"} className="mobile-card card-gold full-width">
                        <div className="mobile-card-text">
                            <span>{i18n.language === 'hi' ? 'साझा करें ' : 'Share'}</span>
                        </div>
                        <div className="mobile-card-icon">
                            <Share2 size={24} />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Select Test Category Modal (Matching Image 1) */}
            {showTestCategoryModal && (
                <div className="test-modal-overlay" onClick={() => setShowTestCategoryModal(false)}>
                    <div className="test-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="test-modal-header">
                            <h3>{i18n.language === 'hi' ? 'टेस्ट श्रेणी चुनें' : 'Select Test Category'}</h3>
                            <button className="test-modal-close" onClick={() => setShowTestCategoryModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="test-modal-grid">
                            <div
                                className="test-modal-item"
                                onClick={() => {
                                    setShowTestCategoryModal(false);
                                    navigate('/body-tests?category=BLOOD TESTS');
                                }}
                            >
                                <div className="test-modal-icon-circle"><FlaskConical size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{i18n.language === 'hi' ? 'खून और पेशाब की जांच' : 'Blood & Urine Test'}</span>
                            </div>

                            <div
                                className="test-modal-item"
                                onClick={() => {
                                    setShowTestCategoryModal(false);
                                    navigate('/body-tests?category=RADIOLOGY');
                                }}
                            >
                                <div className="test-modal-icon-circle"><Activity size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{i18n.language === 'hi' ? 'एक्स-रे और ईसीजी' : 'X-Ray & ECG'}</span>
                            </div>

                            <div
                                className="test-modal-item"
                                onClick={() => {
                                    setShowTestCategoryModal(false);
                                    navigate('/body-tests?category=FULL BODY TESTS');
                                }}
                            >
                                <div className="test-modal-icon-circle"><User size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{i18n.language === 'hi' ? 'फुल बॉडी चेकअप' : 'Full Body Checkup'}</span>
                            </div>

                            <div
                                className="test-modal-item"
                                onClick={() => {
                                    setShowTestCategoryModal(false);
                                    navigate('/body-tests?category=All');
                                }}
                            >
                                <div className="test-modal-icon-circle"><LayoutGrid size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{i18n.language === 'hi' ? 'सभी जांच' : 'All Tests'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HeroSlider;
