import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, ChevronRight, AlertTriangle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './PrivacyPolicy.css'; // Reuses the premium styles of policy layouts

const ChildSafety = () => {
    return (
        <div className="privacy-page">
            <Navbar />
            {/* Hero Section */}
            <div className="privacy-hero" style={{ background: 'linear-gradient(135deg, #7c1a2e 0%, #a62639 50%, #db3a34 100%)' }}>
                <div className="privacy-hero-overlay" />
                <div className="privacy-hero-content">
                    <div className="privacy-shield-icon" style={{ background: 'rgba(255, 255, 255, 0.12)' }}>
                        <Shield size={48} />
                    </div>
                    <h1>Child Safety Standards</h1>
                    <p>DharmArth Foundation — Protect and prevent Child Sexual Abuse and Exploitation (CSAE)</p>
                    <span className="privacy-last-updated">Effective Date: June 1, 2026</span>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="privacy-breadcrumb">
                <div className="container">
                    <Link to="/">Home</Link>
                    <ChevronRight size={14} />
                    <span>Child Safety Policy</span>
                </div>
            </div>

            {/* Content */}
            <div className="privacy-content">
                <div className="container">
                    <div className="privacy-layout">
                        {/* Table of Contents */}
                        <aside className="privacy-toc">
                            <h3>Policy Sections</h3>
                            <ul>
                                <li><a href="#zero-tolerance">1. Zero Tolerance Statement</a></li>
                                <li><a href="#prohibited-conduct">2. Prohibited Conduct</a></li>
                                <li><a href="#detection-moderation">3. Detection & Moderation</a></li>
                                <li><a href="#reporting-abuse">4. Reporting Abuse</a></li>
                                <li><a href="#law-cooperation">5. Law Enforcement Policy</a></li>
                                <li><a href="#safe-environment">6. Creating a Safe Space</a></li>
                                <li><a href="#contact-us">7. Contact Safety Team</a></li>
                            </ul>
                        </aside>

                        {/* Main Content */}
                        <main className="privacy-main">
                            <div className="privacy-intro" style={{ background: 'linear-gradient(135deg, #fff0f2, #ffe5e8)', borderLeftColor: '#db3a34' }}>
                                <p style={{ color: '#5f0f1a' }}>
                                    <strong>IMPORTANT POLICY NOTICE:</strong> The DharmArth Foundation is committed to providing a safe, trustworthy, and supportive environment for patients, contributors, volunteers, and all users. We maintain a strict, absolute <strong>Zero-Tolerance Policy</strong> against any form of Child Sexual Abuse Material (CSAM) or Child Sexual Abuse and Exploitation (CSAE).
                                </p>
                            </div>

                            <section id="zero-tolerance" className="privacy-section">
                                <h2>1. Zero Tolerance Policy</h2>
                                <p>
                                    At the DharmArth Foundation, we are committed to safeguarding minors and children across all our platforms, operations, and programs. We strictly prohibit the generation, transmission, sharing, requesting, or storage of any content that depicts, encourages, or facilitates Child Sexual Abuse Material (CSAM) or Child Sexual Abuse and Exploitation (CSAE).
                                </p>
                                <p>
                                    Any user, volunteer, or donor found violating this policy will face <strong>immediate account termination</strong>, a permanent platform ban, and an automatic referral to relevant national and international cyber law enforcement agencies.
                                </p>
                            </section>

                            <section id="prohibited-conduct" className="privacy-section">
                                <h2>2. Prohibited Conduct</h2>
                                <p>We strictly prohibit any of the following activities on our platforms:</p>
                                <ul>
                                    <li>Uploading, sending, or storing images, videos, or textual depictions of Child Sexual Abuse Material (CSAM) or Child Sexual Abuse and Exploitation (CSAE).</li>
                                    <li>Grooming or engaging in predatory behavior towards minors.</li>
                                    <li>Sharing links, metadata, or online references to platforms containing CSAM/CSAE.</li>
                                    <li>Exploitation of minors in any capacity, including commercial, medical, or financial exploitation.</li>
                                    <li>Harassing, threatening, or endangering children on or through our platform services.</li>
                                </ul>
                            </section>

                            <section id="detection-moderation" className="privacy-section">
                                <h2>3. Detection & Moderation Standards</h2>
                                <p>
                                    To ensure complete compliance with the Google Play Developer Policy and international child welfare laws, we employ a combination of proactive moderation technologies and human review:
                                </p>
                                <ul>
                                    <li><strong>Image Verification:</strong> Any user-provided image (such as doctor prescriptions, volunteer cards, or fundraiser covers) is subjected to validation to ensure zero containing abusive content.</li>
                                    <li><strong>Human Moderation:</strong> Our dedicated community safety team conducts manual, routine audits of all new profiles, community chats, medicine order histories, and fundraiser content submissions.</li>
                                    <li><strong>Keyword Filters:</strong> Automated text-filtering scripts scan user inputs (usernames, profile updates, chat queries) for signs of child grooming, solicitation, or unsafe dialogue.</li>
                                </ul>
                            </section>

                            <section id="reporting-abuse" className="privacy-section">
                                <h2>4. How to Report Child Exploitation</h2>
                                <p>
                                    If you observe, receive, or suspect any form of Child Sexual Abuse or Exploitation within the DharmArth platform, we urge you to report it immediately. Your prompt reporting can save a child and keep the community secure.
                                </p>
                                <p>
                                    <strong>How to submit a report:</strong>
                                </p>
                                <ul>
                                    <li><strong>Email us:</strong> Send a detailed report with usernames, screenshots, or transaction numbers to our dedicated safety mailbox: <strong>thedharmarth@gmail.com</strong>.</li>
                                    <li><strong>Response Time:</strong> Our Safety Response Team reviews every child protection ticket with the highest priority and responds/actions it within 2 hours.</li>
                                </ul>
                            </section>

                            <section id="law-cooperation" className="privacy-section">
                                <h2>5. Cooperation with Law Enforcement</h2>
                                <p>
                                    The DharmArth Foundation cooperates directly with local, national, and global organizations dedicated to child protection:
                                </p>
                                <ul>
                                    <li><strong>International Authorities:</strong> Any discovered CSAM/CSAE material will be reported to the <strong>National Center for Missing & Exploited Children (NCMEC)</strong> and respective international law enforcement bodies.</li>
                                    <li><strong>Indian Legal Authorities:</strong> We actively report child exploitation attempts directly to the <strong>Indian Computer Emergency Response Team (CERT-In)</strong>, local Cyber Crime Police branches, and the Ministry of Home Affairs (MHA) National Cyber Crime Reporting Portal.</li>
                                    <li><strong>Legal Compliance:</strong> We retain server logs, user registry files, and metadata of violators to hand over to police officials conducting child safety investigations.</li>
                                </ul>
                            </section>

                            <section id="safe-environment" className="privacy-section">
                                <h2>6. Creating a Safe Environment</h2>
                                <p>
                                    As a registered charitable organization dedicated to community healthcare, medicine ordering, and crowdfunding:
                                </p>
                                <ul>
                                    <li>We verify all partner pharmacy staff and delivery boys prior to onboarding.</li>
                                    <li>We ensure that child welfare programs and fundraisers are managed directly by pre-verified, authenticated administrators of the DharmArth Foundation.</li>
                                    <li>We educate volunteers and employees on child safety protocols to establish a secure medical environment for families.</li>
                                </ul>
                            </section>

                            <section id="contact-us" className="privacy-section">
                                <h2>7. Contact our Safety & Compliance Officer</h2>
                                <p>If you have any questions, feedback, or need to escalate a safety concern, please get in touch with our team:</p>
                                <div className="privacy-contact-cards">
                                    <a href="mailto:thedharmarth@gmail.com" className="privacy-contact-card" style={{ background: '#fff0f2', borderColor: '#ffcdd2' }}>
                                        <Mail size={20} style={{ color: '#db3a34' }} />
                                        <span>thedharmarth@gmail.com</span>
                                    </a>
                                    <a href="tel:+918306305569" className="privacy-contact-card" style={{ background: '#fff0f2', borderColor: '#ffcdd2' }}>
                                        <Phone size={20} style={{ color: '#db3a34' }} />
                                        <span>+91 83063 05569</span>
                                    </a>
                                </div>
                                <div className="privacy-address">
                                    <p><strong>DharmArth Foundation Child Protection Unit</strong></p>
                                    <p>Official Website: <a href="https://thedharmarth.com" target="_blank" rel="noreferrer" style={{ color: '#db3a34' }}>https://thedharmarth.com</a></p>
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ChildSafety;
