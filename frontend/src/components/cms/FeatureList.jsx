import React from 'react';
import * as LucideIcons from 'lucide-react';

const FeatureList = ({ data }) => {
    const items = data?.items || [];

    return (
        <section className="cms-section py-32 bg-white overflow-hidden relative">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-50/30 -skew-x-12 translate-x-1/2" />

            <div className="cms-container relative z-10">
                <div className="text-center mb-24">
                    <span className="text-teal-600 font-black uppercase tracking-widest text-xs mb-4 block animate-fade-in">Key Advantages</span>
                    <h2 className="cms-heading text-5xl md:text-6xl font-black mb-6 uppercase tracking-tighter">
                        {data?.title || 'Why Join the Mission?'}
                    </h2>
                    <div className="w-24 h-2 bg-teal-500 mx-auto rounded-full mb-8" />
                    <p className="cms-subheading mx-auto text-xl font-medium text-gray-500 max-w-2xl leading-relaxed">
                        {data?.subtitle || 'Beyond incentives, you are part of a transparent movement for global good.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {items.map((item, index) => {
                        const Icon = LucideIcons[item.icon] || LucideIcons.Check;
                        return (
                            <div key={index} className="flex flex-col items-center text-center group">
                                {/* Icon with double border/shadow effect */}
                                <div className="relative mb-10">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-teal-50 text-teal-600 flex items-center justify-center transition-all duration-500 group-hover:bg-teal-600 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 shadow-xl shadow-teal-500/5 group-hover:shadow-teal-500/20 z-10 relative">
                                        <Icon size={40} strokeWidth={2.2} />
                                    </div>
                                    <div className="absolute -inset-2 bg-teal-100 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm scale-110" />
                                </div>

                                <h3 className="text-2xl font-black mb-4 text-gray-900 uppercase tracking-tight group-hover:text-teal-600 transition-colors duration-300">
                                    {item.title}
                                </h3>

                                <div className="w-10 h-1 bg-teal-100 mb-6 rounded-full group-hover:w-20 group-hover:bg-teal-500 transition-all duration-500" />

                                <p className="text-gray-500 leading-relaxed font-medium text-sm px-4">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>


            </div>
        </section>
    );
};

export default FeatureList;
