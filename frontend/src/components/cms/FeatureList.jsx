import React from 'react';
import * as LucideIcons from 'lucide-react';
import './FeatureList.css';

const FeatureList = ({ data }) => {
    const items = data?.items || [];

    return (
        <section className="cms-section features-cms-section">
            <div className="cms-container">
                <div className="section-header-box">
                    <h2 className="cms-section-title">{data?.title || 'Our Core Values'}</h2>
                    {data?.subtitle && <p className="cms-section-subtitle">{data.subtitle}</p>}
                </div>

                <div className="features-list-wrapper">
                    {items.map((item, index) => {
                        const Icon = LucideIcons[item.icon] || LucideIcons.Check;
                        return (
                            <div key={index} className="feature-card-box">
                                <div className="feature-icon-circle">
                                    <Icon size={22} color="#00bf9a" />
                                </div>
                                <div className="feature-content-col">
                                    <h3 className="feature-item-title">{item.title}</h3>
                                    <p className="feature-item-desc">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FeatureList;
