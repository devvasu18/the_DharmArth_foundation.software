import React from 'react';
import * as LucideIcons from 'lucide-react';
import './StatsCounter.css';

const StatsCounter = ({ data }) => {
    const items = data?.items || [];

    return (
        <section className="cms-section stats-cms-section">
            <div className="cms-container">
                {(data?.title || data?.subtitle) && (
                    <div className="section-header-box">
                        {data.title && <h2 className="cms-section-title">{data.title}</h2>}
                        {data.subtitle && <p className="cms-section-subtitle">{data.subtitle}</p>}
                    </div>
                )}

                <div className="stats-grid-container">
                    {items.map((stat, index) => {
                        const Icon = LucideIcons[stat.icon] || LucideIcons.Zap;

                        return (
                            <div key={index} className="stat-card-box">
                                <div className="stat-icon-circle">
                                    <Icon size={22} color="#00bf9a" />
                                </div>
                                <div className="stat-value-text">{stat.value}</div>
                                <div className="stat-label-text">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default StatsCounter;
