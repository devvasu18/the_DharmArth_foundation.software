import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FAQSection.css';
import { ChevronDown } from 'lucide-react';
import api from '../../services/api';


const FAQSection = () => {
    const { t } = useTranslation();
    const [faqs, setFaqs] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const { data } = await api.get('/content/faqs');
                if (data && data.length > 0) {
                    // Map API fields to UI expected fields
                    const mappedFaqs = data.map(f => ({ q: f.question, a: f.answer }));
                    setFaqs(mappedFaqs);
                } else {
                    // Fallback to translations if DB is empty
                    const fallbackFaqs = t('faq.list', { returnObjects: true });
                    if (Array.isArray(fallbackFaqs)) setFaqs(fallbackFaqs);
                }
            } catch (error) {
                console.error("Failed to fetch FAQs", error);
                const fallbackFaqs = t('faq.list', { returnObjects: true });
                if (Array.isArray(fallbackFaqs)) setFaqs(fallbackFaqs);
            }
        };
        fetchFaqs();
    }, [t]);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="faq-section">
            <div className="faq-container">
                <h2 className="faq-title">{t('faq.title')}</h2>
                <div className="faq-list">
                    {Array.isArray(faqs) && faqs.map((faq, index) => ( // Ensure it's an array to avoid crash during lang switch or load
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                        >
                            <button className="faq-question" onClick={() => toggleFAQ(index)}>
                                <span className="faq-q-text">{faq.q}</span>
                                <ChevronDown
                                    className={`faq-icon ${activeIndex === index ? 'open' : ''}`}
                                    size={24}
                                />
                            </button>
                            <div className={`faq-answer ${activeIndex === index ? 'open' : ''}`}>
                                <p className="faq-a-text">{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
