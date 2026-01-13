import React from 'react';
import './MonthlyGivingSection.css';
import happyKidsImg from '../../assets/happy_kids_illustration.png';
import { ArrowRight } from 'lucide-react';

const MonthlyGivingSection = () => {
    return (
        <section className="monthly-giving-section">
            <div className="container">
                <div className="monthly-giving-wrapper">
                    {/* Left: Illustration */}
                    <div className="monthly-giving-image-container">
                        <img src={happyKidsImg} alt="Happy Kids" className="monthly-giving-img" />
                    </div>

                    {/* Right: Content */}
                    <div className="monthly-giving-content">
                        <h2 className="monthly-giving-title">Gift Smiles with Monthly Giving</h2>
                        <p className="monthly-giving-text">
                            <span className="monthly-giving-highlight">6,619 Lives</span> Have Been Saved With Monthly Contributions From <span className="monthly-giving-highlight">4,21,908 Contributors</span>. Save Countless Lives By Giving Monthly.
                        </p>
                        <button className="monthly-giving-btn" onClick={() => window.location.href = '/donate'}>
                            START MONTHLY GIVING <ArrowRight size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MonthlyGivingSection;
