import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import './CrowdfundingSection.css';

const CrowdfundingSection = () => {
    const { t, i18n } = useTranslation();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const { data } = await api.get('/content/crowdfunding');
                setSections(data);
            } catch (error) {
                console.error("Failed to fetch crowdfunding sections", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSections();
    }, []);

    if (loading) return <div style={{ padding: '4rem 0', textAlign: 'center' }}>Loading...</div>;
    if (sections.length === 0) return null;

    return (
        <section className="crowdfunding-section">
            <div className="container">
                {sections.map((section, index) => (
                    <div key={section._id} className={`crowd-row ${index % 2 !== 0 ? 'reverse' : ''}`}>
                        <div className="crowd-content">
                            <h2 className="crowd-title">
                                {i18n.language === 'hi' && section.title_hi ? section.title_hi : section.title}
                            </h2>
                            <p className="crowd-text">
                                {i18n.language === 'hi' && section.text_hi ? section.text_hi : section.text}
                            </p>
                        </div>
                        <div className="crowd-image-wrapper">
                            <img 
                                src={section.imageUrl} 
                                alt={section.title} 
                                className="crowd-image" 
                                loading="lazy"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default CrowdfundingSection;
