import React from 'react';
import * as LucideIcons from 'lucide-react';

const StatsCounter = ({ data }) => {
    const items = data?.items || [];

    return (
        <section className="cms-section py-32 bg-gray-900 overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="cms-container relative z-10">
                {/* Header for Stats if provided */}
                {(data?.title || data?.subtitle) && (
                    <div className="text-center mb-20">
                        {data.title && <h2 className="cms-heading text-white text-5xl md:text-6xl font-black uppercase tracking-tighter mb-6">{data.title}</h2>}
                        {data.subtitle && <p className="cms-subheading text-white/60 mx-auto text-xl font-medium max-w-2xl">{data.subtitle}</p>}
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {items.map((stat, index) => {
                        // Dynamically find icon or fallback
                        const Icon = LucideIcons[stat.icon] || LucideIcons.Zap;

                        return (
                            <div key={index} className="group relative">
                                {/* Card Glass effect */}
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 transition-all duration-500 group-hover:bg-white/10 group-hover:scale-105 group-hover:border-teal-500/30" />

                                <div className="relative p-10 text-center flex flex-col items-center">
                                    {/* Icon Container */}
                                    <div className="w-16 h-16 rounded-2xl bg-teal-500 text-white flex items-center justify-center mb-8 shadow-2xl shadow-teal-500/20 group-hover:rotate-12 transition-all duration-500 group-hover:scale-110">
                                        <Icon size={32} strokeWidth={2.5} />
                                    </div>

                                    {/* Value with specific styling */}
                                    <div className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase group-hover:text-teal-400 transition-colors duration-500">
                                        {stat.value}
                                    </div>

                                    {/* Label */}
                                    <div className="text-xs font-black uppercase tracking-[0.3em] text-white group-hover:text-teal-400 transition-colors duration-500">
                                        {stat.label}
                                    </div>

                                    {/* Decorative underline */}
                                    <div className="w-8 h-1 bg-white/10 mt-6 rounded-full group-hover:w-16 group-hover:bg-teal-500 transition-all duration-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default StatsCounter;
