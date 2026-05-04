import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const CTASection = ({ data }) => {
    return (
        <section className="cms-section py-24 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-500/5 -skew-x-12 translate-x-1/2" />

            <div className="cms-container relative z-10">
                <div className="rounded-3xl bg-teal-600 border border-teal-500/20 p-12 md:p-20 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-500 rounded-full blur-3xl opacity-30 group-hover:scale-110 transition-transform duration-700" />

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                                {data?.title || 'Ready to Change a Life Today?'}
                            </h2>
                            <p className="text-xl text-teal-50 mb-10 opacity-90 leading-relaxed font-light">
                                {data?.subtitle || 'Your contribution provides direct support to those who need it most. Join our community of changemakers.'}
                            </p>

                            <div className="flex flex-wrap gap-6 mb-10">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-teal-300" />
                                    <span className="font-semibold">Tax Benefits (80G)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-teal-300" />
                                    <span className="font-semibold">Secure Payment</span>
                                </div>
                            </div>

                            <div className={`flex flex-wrap gap-4 ${data?.buttonPosition === 'center' ? 'justify-center' : data?.buttonPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
                                {data?.buttonText && (
                                    <a href={data.buttonLink} className="px-10 py-4 bg-white text-teal-600 rounded-full font-extrabold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3">
                                        {data.buttonText} <ArrowRight size={22} />
                                    </a>
                                )}
                            </div>
                        </div>

                        {data?.image && (
                            <div className="relative">
                                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl rotate-3 scale-95 hover:rotate-0 hover:scale-100 transition-all duration-700 border-8 border-white/10">
                                    <img src={data.image} alt="" className="w-full h-full object-cover" />
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
