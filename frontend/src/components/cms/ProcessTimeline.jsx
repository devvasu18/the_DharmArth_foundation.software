import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';

const ProcessTimeline = ({ data }) => {
    const steps = data?.steps || [];

    return (
        <section className="cms-section py-32 bg-gray-50/30 overflow-hidden">
            <div className="cms-container">
                <div className="text-center mb-24 relative">
                    <span className="text-teal-600 font-black uppercase tracking-widest text-xs mb-4 block animate-fade-in">Step-by-Step Guide</span>
                    <h2 className="cms-heading text-5xl md:text-6xl font-black mb-6 uppercase tracking-tighter">
                        {data?.title || 'How It Works'}
                    </h2>
                    <div className="w-24 h-2 bg-teal-500 mx-auto rounded-full mb-8" />
                    <p className="cms-subheading mx-auto text-xl font-medium text-gray-500 max-w-2xl">
                        {data?.subtitle || 'Our transparent process ensures that your contribution reaches those who need it most.'}
                    </p>
                </div>

                <div className="relative px-4">
                    {/* Background Connection Line - Curved Path Effect */}
                    <div className="hidden lg:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-teal-200 to-transparent z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center group relative">
                                {/* Step Number Circle */}
                                <div className="relative mb-10">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-white text-teal-600 flex items-center justify-center text-3xl font-black shadow-2xl transition-all duration-500 group-hover:bg-teal-600 group-hover:text-white group-hover:rotate-12 group-hover:scale-110 z-10 relative border-4 border-teal-50">
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                    {/* Pulse Effect */}
                                    <div className="absolute inset-0 rounded-[2.5rem] bg-teal-500/20 scale-125 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
                                </div>

                                {/* Content Card */}
                                <div className="cms-card border-none bg-white p-10 text-center shadow-xl group-hover:shadow-2xl transition-all duration-500 flex-1 flex flex-col items-center min-h-[300px] rounded-[3rem]">
                                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                                        <ArrowRight size={24} />
                                    </div>
                                    <h4 className="text-2xl font-black mb-4 text-gray-900 uppercase tracking-tight group-hover:text-teal-600 transition-colors">
                                        {step.title}
                                    </h4>
                                    <p className="text-gray-500 leading-relaxed font-medium text-sm">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Connector for Mobile/Tablet */}
                                {index < steps.length - 1 && (
                                    <div className="lg:hidden my-8 text-teal-200">
                                        <ChevronRight size={40} className="rotate-90" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-28 text-center">
                    <button className="px-12 py-6 bg-teal-500 text-white font-black rounded-2xl shadow-2xl shadow-teal-500/20 hover:bg-teal-600 hover:-translate-y-2 transition-all uppercase tracking-widest text-sm">
                        Get Started Now
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ProcessTimeline;
