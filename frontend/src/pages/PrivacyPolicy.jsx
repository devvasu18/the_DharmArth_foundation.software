import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, ChevronRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/common/SEO';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    return (
        <div className="privacy-page">
            <SEO 
                title="Privacy Policy"
                description="Read the Privacy Policy of The DharmArth Foundation regarding online donations, user registration, 80G tax exemptions, and pharmacy/medicine ordering safety."
                keywords="Privacy Policy NGO, donation privacy, The DharmArth Foundation terms, medical data security, 80G tax exemption records"
            />
            <Navbar />
            {/* Hero Section */}
            <div className="privacy-hero">
                <div className="privacy-hero-overlay" />
                <div className="privacy-hero-content">
                    <div className="privacy-shield-icon">
                        <Shield size={48} />
                    </div>
                    <h1>Privacy Policy</h1>
                    <p>DharmArth Foundation — Committed to protecting your privacy</p>
                    <span className="privacy-last-updated">Last updated: May 31, 2025</span>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="privacy-breadcrumb">
                <div className="container">
                    <Link to="/">Home</Link>
                    <ChevronRight size={14} />
                    <span>Privacy Policy</span>
                </div>
            </div>

            {/* Content */}
            <div className="privacy-content">
                <div className="container">
                    <div className="privacy-layout">
                        {/* Table of Contents */}
                        <aside className="privacy-toc">
                            <h3>Contents</h3>
                            <ul>
                                <li><a href="#information-we-collect">1. Information We Collect</a></li>
                                <li><a href="#how-we-use">2. How We Use Information</a></li>
                                <li><a href="#information-sharing">3. Information Sharing</a></li>
                                <li><a href="#data-security">4. Data Security</a></li>
                                <li><a href="#your-rights">5. Your Rights</a></li>
                                <li><a href="#payments">6. Payments</a></li>
                                <li><a href="#location">7. Location Data</a></li>
                                <li><a href="#notifications">8. Notifications</a></li>
                                <li><a href="#children">9. Children's Privacy</a></li>
                                <li><a href="#changes">10. Changes to Policy</a></li>
                                <li><a href="#contact">11. Contact Us</a></li>
                            </ul>
                        </aside>

                        {/* Main Content */}
                        <main className="privacy-main">
                            <div className="privacy-intro">
                                <p>
                                    The DharmArth Foundation ("we", "our", or "us") operates the DharmArth Foundation
                                    mobile application and website at <strong>https://thedharmarth.com</strong>. This
                                    Privacy Policy explains how we collect, use, disclose, and safeguard your information
                                    when you use our services. Please read this policy carefully.
                                </p>
                            </div>

                            <section id="information-we-collect" className="privacy-section">
                                <h2>1. Information We Collect</h2>
                                <h3>Personal Information</h3>
                                <ul>
                                    <li>Full name, mobile number, and email address (during registration)</li>
                                    <li>Delivery address for medicine orders</li>
                                    <li>PAN card number and Aadhaar number (only when claiming 80G tax exemption)</li>
                                    <li>Payment information processed securely via Razorpay</li>
                                </ul>
                                <h3>Automatically Collected Information</h3>
                                <ul>
                                    <li>Device information (device type, operating system)</li>
                                    <li>Usage data (pages visited, features used)</li>
                                    <li>Location data (only when you permit it, for address auto-fill)</li>
                                    <li>Push notification tokens (for sending alerts)</li>
                                </ul>
                            </section>

                            <section id="how-we-use" className="privacy-section">
                                <h2>2. How We Use Your Information</h2>
                                <ul>
                                    <li>To process and deliver medicine orders</li>
                                    <li>To process donations and issue 80G tax exemption receipts</li>
                                    <li>To schedule and manage doctor consultations</li>
                                    <li>To send important updates about your orders and appointments</li>
                                    <li>To send push notifications about foundation events and news</li>
                                    <li>To improve our services and user experience</li>
                                    <li>To comply with legal and regulatory requirements</li>
                                    <li>To detect and prevent fraud</li>
                                </ul>
                            </section>

                            <section id="information-sharing" className="privacy-section">
                                <h2>3. Information Sharing</h2>
                                <p>We do <strong>not</strong> sell, trade, or rent your personal information to third parties. We may share information only with:</p>
                                <ul>
                                    <li><strong>Razorpay:</strong> For secure payment processing</li>
                                    <li><strong>Delivery partners:</strong> Your address for medicine delivery</li>
                                    <li><strong>Government authorities:</strong> When required by law</li>
                                    <li><strong>Service providers:</strong> Cloud hosting, SMS, and notification services under strict confidentiality agreements</li>
                                </ul>
                            </section>

                            <section id="data-security" className="privacy-section">
                                <h2>4. Data Security</h2>
                                <p>
                                    We implement industry-standard security measures to protect your information:
                                </p>
                                <ul>
                                    <li>All data transmission is encrypted using HTTPS/TLS</li>
                                    <li>Passwords are hashed and never stored in plain text</li>
                                    <li>Payment information is handled by PCI-DSS compliant Razorpay</li>
                                    <li>Access to personal data is restricted to authorized personnel only</li>
                                    <li>Regular security audits and monitoring</li>
                                </ul>
                            </section>

                            <section id="your-rights" className="privacy-section">
                                <h2>5. Your Rights</h2>
                                <p>You have the right to:</p>
                                <ul>
                                    <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                    <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                                    <li><strong>Portability:</strong> Receive your data in a portable format</li>
                                </ul>
                                <p>To exercise these rights, contact us at <strong>thedharmarth@gmail.com</strong>.</p>
                            </section>

                            <section id="payments" className="privacy-section">
                                <h2>6. Payments</h2>
                                <p>
                                    All payment transactions are processed through <strong>Razorpay</strong>, a PCI-DSS compliant
                                    payment gateway. We do not store your card details, UPI credentials, or banking information
                                    on our servers. Razorpay's privacy policy applies to all payment data.
                                </p>
                                <p>
                                    For 80G tax exemptions, your PAN number is collected and used solely for generating
                                    the donation receipt as required by Indian Income Tax regulations.
                                </p>
                            </section>

                            <section id="location" className="privacy-section">
                                <h2>7. Location Data</h2>
                                <p>
                                    Our mobile app requests location permission only to auto-fill your delivery address
                                    when ordering medicines. Location data is:
                                </p>
                                <ul>
                                    <li>Collected only when you explicitly grant permission</li>
                                    <li>Used only to populate the address field</li>
                                    <li>Never shared with third parties for advertising</li>
                                    <li>Not tracked in the background</li>
                                </ul>
                                <p>You can revoke location permissions at any time from your device settings.</p>
                            </section>

                            <section id="notifications" className="privacy-section">
                                <h2>8. Push Notifications</h2>
                                <p>
                                    We use <strong>OneSignal</strong> to send push notifications about:
                                </p>
                                <ul>
                                    <li>Order status updates (medicine delivery)</li>
                                    <li>Appointment reminders</li>
                                    <li>Foundation events and announcements</li>
                                    <li>Important service updates</li>
                                </ul>
                                <p>
                                    You can disable push notifications at any time from your device settings or
                                    within the app settings.
                                </p>
                            </section>

                            <section id="children" className="privacy-section">
                                <h2>9. Children's Privacy</h2>
                                <p>
                                    Our services are not directed to children under the age of 13. We do not knowingly
                                    collect personal information from children under 13. If you believe a child has
                                    provided us with personal information, please contact us immediately.
                                </p>
                            </section>

                            <section id="changes" className="privacy-section">
                                <h2>10. Changes to This Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time. We will notify you of any
                                    significant changes by posting the new policy on this page with an updated date.
                                    We encourage you to review this policy periodically.
                                </p>
                            </section>

                            <section id="contact" className="privacy-section">
                                <h2>11. Contact Us</h2>
                                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                                <div className="privacy-contact-cards">
                                    <a href="mailto:thedharmarth@gmail.com" className="privacy-contact-card">
                                        <Mail size={20} />
                                        <span>thedharmarth@gmail.com</span>
                                    </a>
                                    <a href="tel:+918306305569" className="privacy-contact-card">
                                        <Phone size={20} />
                                        <span>+91 83063 05569</span>
                                    </a>
                                </div>
                                <div className="privacy-address">
                                    <p><strong>DharmArth Foundation</strong></p>
                                    <p>Website: <a href="https://thedharmarth.com" target="_blank" rel="noreferrer">https://thedharmarth.com</a></p>
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

export default PrivacyPolicy;
