import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import './FAQAccordion.css';

const FAQAccordion = ({ data }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const items = data?.items || [];

    if (!items || items.length === 0) return null;

    return (
        <section className="faq-section">
            <div className="faq-container">
                <div className="faq-header text-center mb-16">
                    <div className="faq-icon-wrapper">
                        <HelpCircle size={32} />
                    </div>
                    <h2 className="cms-heading text-5xl font-black uppercase tracking-tighter mb-4">
                        {data?.title || 'Frequently Asked Questions'}
                    </h2>
                    <div className="w-24 h-2 bg-teal-500 mx-auto rounded-full mb-6" />
                    <p className="cms-subheading mx-auto font-medium">
                        {data?.subtitle || 'Find answers to common questions about our foundation and how you can help.'}
                    </p>
                </div>

                <div className="faq-list">
                    {items.map((item, index) => (
                        <div 
                            key={index} 
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                        >
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="faq-button"
                            >
                                <span className="faq-question">
                                    {item.question}
                                </span>
                                <div className="faq-indicator">
                                    {activeIndex === index ? <Minus size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />}
                                </div>
                            </button>
                            <div className="faq-answer-wrapper">
                                <div className="faq-answer-content">
                                    <div className="faq-divider" />
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQAccordion;
