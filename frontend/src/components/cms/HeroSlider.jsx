import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import './HeroSlider.css';

const HeroSlider = ({ data }) => {
    const { t } = useTranslation();
    const slides = Array.isArray(data) ? data : (data?.slides || []);
    const sliderType = data?.sliderType || 'hero';
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (!slides || slides.length === 0) return null;

    if (sliderType === 'carousel') {
        return (
            <section className="cms-section py-16 bg-white overflow-hidden">
                <div className="cms-container">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <span className="text-teal-600 font-bold uppercase tracking-widest text-xs mb-2 block">{t('cms.discoverMore')}</span>
                            <h2 className="cms-heading">{data?.title || t('cms.featuredContent')}</h2>
                            <p className="cms-subheading">{data?.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                        {slides.map((slide, index) => (
                            <div key={index} className="min-w-[320px] md:min-w-[380px] h-[450px] rounded-3xl overflow-hidden relative group shadow-xl snap-start">
                                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-8 text-white">
                                    <h3 className="font-bold text-2xl mb-2">{slide.title}</h3>
                                    <p className="text-white/80 text-sm mb-6 line-clamp-2">{slide.subtitle}</p>
                                    {slide.buttonLink && (
                                        <a href={slide.buttonLink} className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center hover:bg-white hover:text-teal-600 transition-all">
                                            <ArrowRight size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Default: Premium Hero Banner
    return (
        <section className="cms-hero-slider-section">
            <div className="cms-hero-viewport">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`cms-hero-slide ${index === currentSlide ? 'active' : ''}`}
                    >
                        {/* Background Image */}
                        {slide.image && (
                            <img
                                src={slide.image}
                                alt={slide.title || ''}
                                className="cms-slide-bg-img"
                            />
                        )}

                        {/* Dark Overlay */}
                        <div className="cms-slide-overlay" />

                        {/* Content Container */}
                        <div className="cms-slide-container">
                            <div className="cms-slide-brand-tag">
                                <span>The Dharmarth Medical Foundation</span>
                            </div>

                            <h1
                                className="cms-slide-title"
                                style={{ color: slide.titleColor || '#ffffff' }}
                                dangerouslySetInnerHTML={{ __html: slide.title || t('cms.defaultTitle') }}
                            />

                            <div
                                className="cms-slide-divider"
                                style={{ backgroundColor: slide.btnBgColor || '#00bf9a' }}
                            />

                            <p
                                className="cms-slide-subtitle"
                                style={{ color: slide.subtitleColor || 'rgba(255,255,255,0.9)' }}
                                dangerouslySetInnerHTML={{ __html: slide.subtitle || t('cms.defaultSubtitle') }}
                            />

                            <div className="cms-slide-buttons-row">
                                <a
                                    href={slide.buttonLink || '/donate'}
                                    className="cms-btn-primary"
                                    style={{
                                        backgroundColor: slide.btnBgColor || '#00bf9a',
                                        color: slide.btnTextColor || '#ffffff'
                                    }}
                                >
                                    <span>{slide.buttonText || t('cms.joinUs')}</span>
                                    <ArrowRight size={18} />
                                </a>

                                {slide.buttonLink && slide.buttonLink !== '#' && (
                                    <a
                                        href={slide.buttonLink}
                                        className="cms-btn-secondary"
                                    >
                                        <span>{t('cms.learnMore')}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Dots */}
                {slides.length > 1 && (
                    <div className="cms-slider-dots">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`cms-dot-btn ${i === currentSlide ? 'active' : ''}`}
                                title={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default HeroSlider;
