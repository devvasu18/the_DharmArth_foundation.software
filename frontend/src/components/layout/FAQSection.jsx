import React, { useState } from 'react';
import './FAQSection.css';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: "How do I make a donation on The Dharmarth Foundation?",
        answer: "Making a contribution is simple and secure. Click on the 'Donate' button, select the cause you wish to support, enter the amount, and complete the payment using your preferred method. Your support reaches those in need instantly."
    },
    {
        question: "Is there a fee for donating?",
        answer: "We strive to ensure maximum impact. We do not charge any platform fee from donors. A small standard transaction processing fee may apply from the payment gateway provider, which is standard across all online payments."
    },
    {
        question: "Do I get tax benefits for my donation?",
        answer: "Yes, all donations made to The Dharmarth Foundation are eligible for tax exemption under Section 80G of the Income Tax Act. You will receive a tax receipt instantly via email after your donation."
    },
    {
        question: "Is my donation safe?",
        answer: "Absolutely. We use industry-standard encryption and secure payment gateways to ensure your transaction is safe. We also verify the authenticity of every cause to ensure your money reaches the right beneficiaries."
    },
    {
        question: " Can I donate to a specific person or cause?",
        answer: "Yes, you can browse through our verified list of active cases and choose to support a specific individual, medical case, or social cause that resonates with you. Every contribution makes a difference."
    },
    {
        question: "Does The Dharmarth Foundation support international currencies?",
        answer: "Yes, our platform supports contributions from around the world. We accept major international currencies and credit cards to help you get the maximum support for your cause."
    }
];

const FAQSection = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="faq-section">
            <div className="faq-container">
                <h2 className="faq-title">Frequently Asked Questions</h2>
                <div className="faq-list">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                        >
                            <button className="faq-question" onClick={() => toggleFAQ(index)}>
                                <span className="faq-q-text">{faq.question}</span>
                                <ChevronDown
                                    className={`faq-icon ${activeIndex === index ? 'open' : ''}`}
                                    size={24}
                                />
                            </button>
                            <div className={`faq-answer ${activeIndex === index ? 'open' : ''}`}>
                                <p className="faq-a-text">{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
