import React from 'react';
import './CrowdfundingSection.css';
import hospitalWardImg from '../../assets/medical_bill_burden.png';
import handsHeartImg from '../../assets/community_support_circle.png';
import mobileAppImg from '../../assets/phone_donation_screen.png';

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
                            Support Medical Crowdfunding
                        </h2>
                        <p className="crowd-text">
                            Stop worrying about the helpless, and start supporting them with The Dharmarth Foundation. We are a Donation Platform dedicated to helping those in need. Crowdfunding is the easiest way to pool support from friends, family and compassionate individuals who are waiting to contribute funds.
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
                            Contribute to Medical Aid for those in Need
                        </h2>
                        <p className="crowd-text">
                            With The Dharmarth Foundation, you can make a quick, secure donation in minutes to support medical bills and healthcare costs for the underprivileged. You can also take on the role of spreading the word and bringing in support. Your contributions give hope to patients and families during their most difficult times.
                        </p>
                    </div>
                    <div className="crowd-image-wrapper">
                        <img src={mobileAppImg} alt="Medical Donation App" className="crowd-image" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CrowdfundingSection;
