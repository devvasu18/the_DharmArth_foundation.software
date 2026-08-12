import React from 'react';
import { Star } from 'lucide-react';
import './Testimonials.css';

const Testimonials = ({ data }) => {
    const items = data?.items || [];

    if (!items || items.length === 0) return null;

    return (
        <section className="cms-section testimonials-cms-section">
            <div className="cms-container">
                <div className="section-header-box">
                    <h2 className="cms-section-title">{data?.title || 'Voices of Change'}</h2>
                    {data?.subtitle && <p className="cms-section-subtitle">{data.subtitle}</p>}
                </div>

                <div className="testimonials-grid-container">
                    {items.map((item, index) => (
                        <div key={index} className="testimonial-card-box">
                            <div className="stars-row">
                                {[...Array(item.rating || 5)].map((_, i) => (
                                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                                ))}
                            </div>

                            <p className="testimonial-quote-text">
                                "{item.text}"
                            </p>

                            <div className="testimonial-user-row">
                                <div className="user-avatar-circle">
                                    <img src={item.photo || `https://i.pravatar.cc/150?u=${index}`} alt={item.name} className="user-avatar-img" />
                                </div>
                                <div className="user-meta-col">
                                    <h4 className="user-name-text">{item.name}</h4>
                                    <span className="user-role-tag">Verified Supporter</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
