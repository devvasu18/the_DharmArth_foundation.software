import React, { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';

const InfoAccordion = ({ data }) => {
    const items = data?.items || [];
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="cms-section py-24 bg-white">
            <div className="cms-container">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="cms-heading">{data?.title || 'Documentation & Guides'}</h2>
                        <p className="cms-subheading mx-auto">{data?.subtitle}</p>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div 
                                key={index} 
                                className={`group border-2 rounded-[2rem] overflow-hidden transition-all duration-500 ${
                                    openIndex === index ? 'border-teal-500 bg-teal-50/20' : 'border-gray-50 hover:border-teal-100'
                                }`}
                            >
                                <button 
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                    className="w-full flex items-center justify-between p-8 text-left outline-none"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                            openIndex === index ? 'bg-teal-500 text-white rotate-12' : 'bg-gray-50 text-gray-400 group-hover:bg-teal-50 group-hover:text-teal-500'
                                        }`}>
                                            <FileText size={24} />
                                        </div>
                                        <h4 className={`text-xl font-bold transition-colors duration-300 ${openIndex === index ? 'text-teal-900' : 'text-gray-700'}`}>
                                            {item.title}
                                        </h4>
                                    </div>
                                    <div className={`transition-transform duration-500 ${openIndex === index ? 'rotate-180 text-teal-500' : 'text-gray-300'}`}>
                                        <ChevronDown size={28} />
                                    </div>
                                </button>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                        openIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="px-8 pb-10 pt-2 ml-20">
                                        <div className="text-lg text-gray-600 leading-relaxed space-y-4 font-light">
                                            {item.content?.split('\n').map((para, i) => (
                                                <p key={i}>{para}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InfoAccordion;
