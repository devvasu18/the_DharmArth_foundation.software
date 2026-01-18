import React from 'react';
import { useTranslation } from 'react-i18next';
import './WhyUsSection.css';
import {
    Trophy,
    Users,
    Wrench,
    CreditCard,
    MessageCircleQuestion,
    LayoutDashboard,
    Banknote,
    Globe
} from 'lucide-react';



const WhyUsSection = () => {
    const { t } = useTranslation();

    const features = [
        {
            icon: <Trophy size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.0.text')
        },
        {
            icon: <Users size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.1.text')
        },
        {
            icon: <Wrench size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.2.text')
        },
        {
            icon: <CreditCard size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.3.text')
        },
        {
            icon: <MessageCircleQuestion size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.4.text')
        },
        {
            icon: <LayoutDashboard size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.5.text')
        },
        {
            icon: <Banknote size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.6.text')
        },
        {
            icon: <Globe size={48} strokeWidth={1.5} />,
            text: t('whyUs.items.7.text')
        }
    ];

    return (
        <section className="why-us-section">
            <div className="container">
                <h2 className="why-us-title">{t('whyUs.title')}</h2>

                <div className="why-us-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="why-us-item">
                            <div className="why-us-icon-wrapper">
                                {feature.icon}
                            </div>
                            <div className="why-us-separator"></div>
                            <p className="why-us-text">
                                {feature.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyUsSection;
