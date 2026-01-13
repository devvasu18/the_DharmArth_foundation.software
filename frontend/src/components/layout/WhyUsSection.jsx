import React from 'react';
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

const features = [
    {
        icon: <Trophy size={48} strokeWidth={1.5} />,
        text: "Industry's best fundraising success rate"
    },
    {
        icon: <Users size={48} strokeWidth={1.5} />,
        text: "Supported By a Growing Community of Donors"
    },
    {
        icon: <Wrench size={48} strokeWidth={1.5} />,
        text: "Easy-To-Manage Tools To Boost Results"
    },
    {
        icon: <CreditCard size={48} strokeWidth={1.5} />,
        text: "Receive contributions via all popular payment modes"
    },
    {
        icon: <MessageCircleQuestion size={48} strokeWidth={1.5} />,
        text: "Get Expert Support 24/7"
    },
    {
        icon: <LayoutDashboard size={48} strokeWidth={1.5} />,
        text: "A Dedicated Smart-Dashboard"
    },
    {
        icon: <Banknote size={48} strokeWidth={1.5} />,
        text: "Withdraw Funds Without Hassle"
    },
    {
        icon: <Globe size={48} strokeWidth={1.5} />,
        text: "International Payment Support"
    }
];

const WhyUsSection = () => {
    return (
        <section className="why-us-section">
            <div className="container">
                <h2 className="why-us-title">Why The Dharmarth Foundation?</h2>

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
