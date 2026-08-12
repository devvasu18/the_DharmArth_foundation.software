import React from 'react';
import './ProcessTimeline.css';

const ProcessTimeline = ({ data }) => {
    const steps = data?.steps || [];

    return (
        <section className="cms-section timeline-cms-section">
            <div className="cms-container">
                <div className="section-header-box">
                    <h2 className="cms-section-title">{data?.title || 'Our Journey'}</h2>
                    {data?.subtitle && <p className="cms-section-subtitle">{data.subtitle}</p>}
                </div>

                <div className="timeline-vertical-wrapper">
                    <div className="timeline-line"></div>
                    {steps.map((step, index) => (
                        <div key={index} className="timeline-step-row">
                            <div className="step-badge-circle">
                                {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="step-content-box">
                                <h3 className="step-item-title">{step.title}</h3>
                                <p className="step-item-desc">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProcessTimeline;
