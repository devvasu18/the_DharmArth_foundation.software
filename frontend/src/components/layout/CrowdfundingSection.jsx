import React from 'react';
import './CrowdfundingSection.css';
import hospitalWardImg from '../../assets/hospital_ward.png';
import handsHeartImg from '../../assets/hands_holding_heart.png';
import mobileAppImg from '../../assets/mobile_app_dashboard.png';

const CrowdfundingSection = () => {
    return (
        <section className="crowdfunding-section">
            <div className="container">
                {/* Section 1: Text Left, Image Right */}
                <div className="crowd-row">
                    <div className="crowd-content">
                        <h2 className="crowd-title">
                            Medical Bills are a Burden for Many Individuals and Families
                        </h2>
                        <p className="crowd-text">
                            Expenses related to hospital stays, cancer treatments with high-cost chemotherapy routines, and other medicinal costs can be even higher. Treatment costs and necessary living expenses can bring the best of families to the brink of experiencing hard times. Insurance plans are not enough, as policies do not cover everything you need.
                        </p>
                    </div>
                    <div className="crowd-image-wrapper">
                        <img src={hospitalWardImg} alt="Hospital Ward" className="crowd-image" />
                    </div>
                </div>

                {/* Section 2: Image Left, Text Right */}
                <div className="crowd-row reverse">
                    <div className="crowd-content">
                        <h2 className="crowd-title">
                            Try Medical Crowdfunding
                        </h2>
                        <p className="crowd-text">
                            Stop worrying about rising medical bills, or debts and start a medical fundraising campaign with The Dharmarth Foundation. We are a Crowdfunding Platform dedicated to helping those in need. Crowdfunding is the easiest way to avail support from friends, family and numerous individuals who are waiting to contribute funds.
                        </p>
                    </div>
                    <div className="crowd-image-wrapper">
                        <img src={handsHeartImg} alt="Hands holding heart" className="crowd-image" />
                    </div>
                </div>

                {/* Section 3: Text Left, Image Right */}
                <div className="crowd-row">
                    <div className="crowd-content">
                        <h2 className="crowd-title">
                            Start a Medical Fundraiser for Yourself or a Loved One
                        </h2>
                        <p className="crowd-text">
                            With The Dharmarth Foundation, you can start a free, easy fundraiser in minutes to cover medical bills and healthcare costs. You can also take on the role of spreading the word and bring in funds when a close friend is diagnosed with unexpected illnesses. Medical fundraising campaigns can give your well-wishers a way to express support when needed.
                        </p>
                    </div>
                    <div className="crowd-image-wrapper">
                        <img src={mobileAppImg} alt="Medical Fundraiser App" className="crowd-image" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CrowdfundingSection;
