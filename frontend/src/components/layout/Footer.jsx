import React from 'react';
import { Facebook, Twitter, Linkedin, Youtube, Instagram, Phone, Mail } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-container">
                    <div className="footer-brand">
                        <h2>Ketto</h2>
                        <div className="footer-social">
                            <span className="social-icon"><Facebook size={18} /></span>
                            <span className="social-icon"><Twitter size={18} /></span>
                            <span className="social-icon"><Linkedin size={18} /></span>
                            <span className="social-icon"><Youtube size={18} /></span>
                            <span className="social-icon"><Instagram size={18} /></span>
                            <span className="social-icon"><Phone size={18} /></span>
                        </div>
                        <div className="footer-stats">
                            <div className="stat-item"><span className="stat-val">2.5M+</span> Followers</div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <p>For any queries</p>
                            <p><strong>Email: info@ketto.org</strong></p>
                            <p><strong>Contact No: +91 9930088522</strong></p>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h3>Causes</h3>
                        <ul className="footer-links">
                            <li><a href="#">Medical Crowdfunding</a></li>
                            <li><a href="#">Cancer Crowdfunding</a></li>
                            <li><a href="#">Transplant Crowdfunding</a></li>
                            <li><a href="#">Education Crowdfunding</a></li>
                            <li><a href="#">Sports Crowdfunding</a></li>
                            <li><a href="#">Child Welfare</a></li>
                            <li><a href="#">Animal Fundraisers</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>How it works?</h3>
                        <ul className="footer-links">
                            <li><a href="#">Fundraising for NGOs</a></li>
                            <li><a href="#">Sponsor A Child</a></li>
                            <li><a href="#">Fundraising Tips</a></li>
                            <li><a href="#">What is Crowdfunding?</a></li>
                            <li><a href="#">Corporates</a></li>
                            <li><a href="#">Withdraw Funds</a></li>
                            <li><a href="#">Browse Fundraiser</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>About Us</h3>
                        <ul className="footer-links">
                            <li><a href="#">Team Ketto</a></li>
                            <li><a href="#">In The News</a></li>
                            <li><a href="#">Web Stories</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Ketto Blog</a></li>
                            <li><a href="#">Success Stories</a></li>
                            <li><a href="#">Is Ketto Genuine?</a></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>Support</h3>
                        <ul className="footer-links">
                            <li><a href="#">Medical Finance</a></li>
                            <li><a href="#">FAQs & Help Center</a></li>
                            <li><a href="#">Are Ketto Campaigns Genuine?</a></li>
                            <li><a href="#">Fundraiser Video</a></li>
                            <li><a href="#">Trust & Safety</a></li>
                            <li><a href="#">Plans & Pricing</a></li>
                            <li><a href="#">Contact Us</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="payment-icons">
                        <span className="payment-icon">VISA</span>
                        <span className="payment-icon">MasterCard</span>
                        <span className="payment-icon">RuPay</span>
                        <span className="payment-icon">UPI</span>
                        <span className="payment-icon">100% Secure</span>
                    </div>
                    <div className="copyright">
                        Copyright © 2026 Ketto Online Ventures Pvt Ltd. All Rights Reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
