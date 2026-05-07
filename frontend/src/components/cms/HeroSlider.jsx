import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = ({ data }) => {
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
            <section className="cms-section py-24 bg-white overflow-hidden">
                <div className="cms-container">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <span className="text-teal-600 font-bold uppercase tracking-widest text-xs mb-3 block">Discover More</span>
                            <h2 className="cms-heading">{data?.title || 'Featured Content'}</h2>
                            <p className="cms-subheading">{data?.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex gap-8 overflow-x-auto pb-10 -mx-4 px-4 scrollbar-hide snap-x">
                        {slides.map((slide, index) => (
                            <div key={index} className="min-w-[380px] h-[520px] rounded-[3rem] overflow-hidden relative group shadow-2xl snap-start">
                                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-10 text-white translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    <h3 className="font-bold text-3xl mb-3">{slide.title}</h3>
                                    <p className="text-white/70 text-sm mb-8 line-clamp-2 font-medium">{slide.subtitle}</p>
                                    {slide.buttonLink && (
                                        <a href={slide.buttonLink} className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center hover:bg-white hover:text-teal-600 transition-all shadow-xl shadow-teal-500/20">
                                            <ArrowRight size={24} />
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

    if (sliderType === 'card') {
        return (
            <section className="cms-section py-32 bg-gray-50/50">
                <div className="cms-container">
                    <div className="text-center mb-20">
                        <span className="text-teal-600 font-bold uppercase tracking-widest text-xs mb-4 block">Our Work</span>
                        <h2 className="cms-heading">{data?.title || 'Our Initiatives'}</h2>
                        <div className="w-24 h-1 bg-teal-500 mx-auto mt-6 mb-8 rounded-full" />
                        <p className="cms-subheading mx-auto">{data?.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {slides.map((slide, index) => (
                            <div key={index} className="cms-card border-none bg-white p-0 group shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden">
                                <div className="h-72 overflow-hidden relative">
                                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-teal-900/10 group-hover:bg-transparent transition-all" />
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-white/95 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold text-teal-600 uppercase tracking-widest shadow-lg">Impact</span>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <h3 className="text-2xl font-black mb-4 group-hover:text-teal-600 transition-colors uppercase tracking-tight">{slide.title}</h3>
                                    <p className="text-gray-500 mb-10 line-clamp-3 leading-relaxed font-medium">{slide.subtitle}</p>
                                    {slide.buttonText && (
                                        <a href={slide.buttonLink} className="inline-flex items-center gap-3 text-teal-600 font-extrabold uppercase tracking-widest text-sm group/btn">
                                            {slide.buttonText} 
                                            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center group-hover/btn:bg-teal-500 group-hover/btn:text-white transition-all">
                                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </div>
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

    // Helper to map content position to CSS classes
    const getPositionClasses = (position) => {
        switch(position) {
            case 'center': return { container: 'items-center justify-center', text: 'text-center mx-auto', overlay: 'bg-black/50', align: 'center' };
            case 'right-center': return { container: 'items-center justify-end', text: 'text-right ml-auto', overlay: 'bg-gradient-to-l from-black/90 via-black/40 to-transparent', align: 'right' };
            case 'bottom-center': return { container: 'items-end justify-center pb-32', text: 'text-center mx-auto', overlay: 'bg-gradient-to-t from-black/90 via-black/40 to-transparent', align: 'center' };
            case 'bottom-left': return { container: 'items-end justify-start pb-32', text: 'text-left', overlay: 'bg-gradient-to-t from-black/90 via-black/40 to-transparent', align: 'left' };
            case 'bottom-right': return { container: 'items-end justify-end pb-32', text: 'text-right ml-auto', overlay: 'bg-gradient-to-t from-black/90 via-black/40 to-transparent', align: 'right' };
            case 'left-center': 
            default: 
                return { container: 'items-center justify-start', text: 'text-left', overlay: 'bg-gradient-to-r from-black/90 via-black/40 to-transparent', align: 'left' };
        }
    };

    // Default: Premium Hero Banner
    return (
        <section className="cms-section w-full overflow-hidden">
            <div className="relative h-90vh min-h-700 bg-gray-900">
                {slides.map((slide, index) => {
                    const { container, text, overlay, align } = getPositionClasses(slide.contentPosition);
                    
                    return (
                        <div 
                            key={index} 
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-105 invisible'}`}
                        >
                            {/* Background Image */}
                            <img 
                                src={slide.image} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover opacity-80" 
                            />
                            
                            {/* Dynamic Overlay */}
                            <div className={`absolute inset-0 ${overlay}`} />
                            
                            <div className={`absolute inset-0 flex ${container}`}>
                                <div className="cms-container w-full">
                                    <div className={`max-w-3xl text-white ${text}`}>
                                        {/* Logo Placeholder */}
                                        <div className={`flex items-center gap-3 mb-8 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                                            <div 
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-500/30"
                                                style={{ backgroundColor: slide.btnBgColor || '#00bfa5' }}
                                            >
                                                <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
                                                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                                </svg>
                                            </div>
                                            <div className="h-12 w-px bg-white/20 mx-2" />
                                            <div className="text-xs font-bold uppercase tracking-widest text-white/60">
                                                Making a Difference <br /> Together
                                            </div>
                                        </div>

                                        <h1 
                                            className="text-5xl md:text-8xl font-black mb-6 uppercase tracking-tighter"
                                            style={{ color: slide.titleColor || '#ffffff' }}
                                            dangerouslySetInnerHTML={{ __html: slide.title || 'United Hope Foundation' }}
                                        />
                                        
                                        <div 
                                            className={`w-20 h-2 mb-8 ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`} 
                                            style={{ backgroundColor: slide.btnBgColor || '#00bfa5' }}
                                        />

                                        <p 
                                            className="text-lg md:text-2xl mb-12 font-medium uppercase tracking-widest"
                                            style={{ color: slide.subtitleColor || 'rgba(255,255,255,0.9)' }}
                                            dangerouslySetInnerHTML={{ __html: slide.subtitle || 'Empowering Communities. Changing Lives.' }}
                                        />

                                        <div className={`flex flex-wrap gap-6 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                                            <a 
                                                href={slide.buttonLink || '#'} 
                                                className="px-10 py-5 font-black rounded-xl transition-all uppercase tracking-widest"
                                                style={{ 
                                                    backgroundColor: slide.btnBgColor || '#00bfa5',
                                                    color: slide.btnTextColor || '#ffffff'
                                                }}
                                            >
                                                {slide.buttonText || 'Join Us'}
                                            </a>
                                            
                                            {slide.buttonLink && slide.buttonLink !== '#' && (
                                                <a 
                                                    href={slide.buttonLink} 
                                                    className="px-10 py-5 bg-white/10 backdrop-blur-md text-white font-black rounded-xl transition-all border border-white/30 uppercase tracking-widest"
                                                >
                                                    Learn More
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Slider Controls */}
                {slides.length > 1 && (
                    <div className="absolute bottom-12 right-12 flex gap-4 z-20">
                        {slides.map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-teal-500 w-20' : 'bg-white/30 w-12'}`} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default HeroSlider;
