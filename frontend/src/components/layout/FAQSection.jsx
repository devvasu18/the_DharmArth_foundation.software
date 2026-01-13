import React, { useState } from 'react';
import './FAQSection.css';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: "How do I start a fundraiser on The Dharmarth Foundation?",
        answer: "Starting a fundraiser is easy and free! Simply click on the 'Start a Fundraiser' button, sign up or log in, fill in the details of the cause, upload a picture, and submit. Your campaign will be live in minutes."
    },
    {
        question: "Is there a fee for raising funds?",
        answer: "We strive to keep costs low. We charge a minimal platform fee of 0% on widespread donation campaigns for natural disasters, but for personal campaigns, a standard transaction processing fee may apply to cover payment gateway costs."
    },
    {
        question: "How can I withdraw the raised funds?",
        answer: "You can request a withdrawal at any time from your personalized dashboard. Once your documents are verified, the funds are transferred directly to your secure bank account within 2-5 business days."
    },
    {
        question: "Is my donation safe?",
        answer: "Absolutely. We use industry-standard encryption and secure payment gateways to ensure your transaction is safe. We also verify the authenticity of every fundraiser to ensure your money reaches the right cause."
    },
    {
        question: "Can I raise funds for a friend or relative?",
        answer: "Yes, you can start a fundraiser for yourself, a friend, a relative, or even a complete stranger in need. Just ensure you have the beneficiary's consent and necessary documents for verification."
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
