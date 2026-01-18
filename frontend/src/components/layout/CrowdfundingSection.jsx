import React from 'react';
import { useTranslation } from 'react-i18next';
import './CrowdfundingSection.css';
import hospitalWardImg from '../../assets/medical_bill_burden.png';
import handsHeartImg from '../../assets/community_support_circle.png';
import mobileAppImg from '../../assets/phone_donation_screen.png';

const CrowdfundingSection = () => {
    const { t } = useTranslation();
    return (
        <section className="crowdfunding-section">
            <div className="container">
                {/* Section 1: Text Left, Image Right */}
                <div className="crowd-row">
                    <div className="crowd-content">
                        <h2 className="crowd-title">
                            {t('crowd.s1.title')}
                        </h2>
                        <p className="crowd-text">
                            {t('crowd.s1.text')}
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
                            {t('crowd.s2.title')}
                        </h2>
                        <p className="crowd-text">
                            {t('crowd.s2.text')}
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
                            {t('crowd.s3.title')}
                        </h2>
                        <p className="crowd-text">
                            {t('crowd.s3.text')}
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
