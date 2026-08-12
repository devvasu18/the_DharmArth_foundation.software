import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import './CTASection.css';

const CTASection = ({ data }) => {
    return (
        <section className="cms-section cta-cms-section">
            <div className="cms-container">
                <div className="cta-card-box">
                    <div className="cta-content-col">
                        <h2 className="cta-card-title">
                            {data?.title || 'Ready to Change a Life Today?'}
                        </h2>
                        <p className="cta-card-subtitle">
                            {data?.subtitle || 'Your contribution provides direct support to those who need it most. Join our community of changemakers.'}
                        </p>

                        <div className="cta-benefits-row">
                            <div className="cta-benefit-item">
                                <CheckCircle2 size={18} color="#ccfbf1" />
                                <span>Tax Benefits (80G)</span>
                            </div>
                            <div className="cta-benefit-item">
                                <CheckCircle2 size={18} color="#ccfbf1" />
                                <span>Secure Payment</span>
                            </div>
                        </div>

                        {data?.buttonText && (
                            <div className="cta-btn-wrapper">
                                <a href={data.buttonLink || '/donate'} className="cta-primary-btn">
                                    <span>{data.buttonText}</span>
                                    <ArrowRight size={18} />
                                </a>
                            </div>
                        )}
                    </div>

                    {data?.image && (
                        <div className="cta-image-col">
                            <img src={data.image} alt="" className="cta-card-img" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CTASection;
