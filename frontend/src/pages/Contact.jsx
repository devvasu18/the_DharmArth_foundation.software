import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck, Heart } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Contact.css';

export default function Contact() {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone || !formData.message) {
            toast.error(i18n.language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
            return;
        }

        setLoading(true);
        try {
            // Post leads to dynamic backend contact receiver
            await api.post('/leads', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                notes: `Subject: ${formData.subject || 'General Inquiry'}\nMessage: ${formData.message}`
            });
            toast.success(
                i18n.language === 'hi'
                    ? 'आपका संदेश सफलतापूर्वक भेज दिया गया है! हम जल्द ही आपसे संपर्क करेंगे।'
                    : 'Your message has been sent successfully! We will contact you soon.'
            );
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (err) {
            console.error(err);
            toast.error(
                i18n.language === 'hi'
                    ? 'संदेश भेजने में विफल। कृपया पुन: प्रयास करें।'
                    : 'Failed to send message. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page-wrapper">
            <Navbar />
            
            {/* Header Banner */}
            <div className="contact-hero-banner">
                <div className="container hero-content">
                    <span className="badge-pill">
                        <Heart size={14} className="heart-icon animate-pulse" />
                        {i18n.language === 'hi' ? 'हम यहाँ सहायता के लिए हैं' : 'We are here to help'}
                    </span>
                    <h1>
                        {i18n.language === 'hi' 
                            ? 'द धर्मार्थ फाउंडेशन से संपर्क करें' 
                            : 'Contact The Dharmarth Foundation'}
                    </h1>
                    <p>
                        {i18n.language === 'hi'
                            ? 'क्या आपके पास कोई प्रश्न है? सहयोग करना चाहते हैं? हमसे सीधे संपर्क करें।'
                            : 'Have any questions? Want to collaborate? Reach out to us directly.'}
                    </p>
                </div>
                <div className="banner-wave">
                    <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="shape-fill"></path>
                    </svg>
                </div>
            </div>

            <div className="container main-contact-grid">
                {/* Contact Info Cards */}
                <div className="contact-sidebar">
                    <div className="info-card">
                        <div className="icon-box">
                            <Phone size={24} />
                        </div>
                        <div className="details">
                            <h3>{i18n.language === 'hi' ? 'हेल्पलाइन नंबर' : 'Helpline Support'}</h3>
                            <p className="primary-text">+91 94139 41300</p>
                            <p className="secondary-text">{i18n.language === 'hi' ? 'सुबह 9 बजे से शाम 6 बजे तक उपलब्ध' : 'Available 9 AM - 6 PM'}</p>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="icon-box">
                            <Mail size={24} />
                        </div>
                        <div className="details">
                            <h3>{i18n.language === 'hi' ? 'ईमेल एड्रेस' : 'Email Address'}</h3>
                            <p className="primary-text">support@dharmarth.org</p>
                            <p className="secondary-text">{i18n.language === 'hi' ? '24 घंटे के भीतर त्वरित प्रतिक्रिया' : 'Quick response within 24 hours'}</p>
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="icon-box">
                            <MapPin size={24} />
                        </div>
                        <div className="details">
                            <h3>{i18n.language === 'hi' ? 'मुख्य कार्यालय' : 'Headquarters Office'}</h3>
                            <p className="primary-text">TDMF Online Ventures Pvt Ltd</p>
                            <p className="secondary-text">
                                {i18n.language === 'hi'
                                    ? 'जयपुर, राजस्थान, भारत'
                                    : 'Jaipur, Rajasthan, India'}
                            </p>
                        </div>
                    </div>

                    <div className="trust-card">
                        <ShieldCheck size={40} className="trust-icon" />
                        <h4>{i18n.language === 'hi' ? '100% सुरक्षित और पारदर्शी' : '100% Secure & Transparent'}</h4>
                        <p>
                            {i18n.language === 'hi'
                                ? 'सभी योगदानों को रीयल-टाइम में ट्रैक किया जाता है। आपकी जानकारी हमेशा सुरक्षित रहती है।'
                                : 'All inquiries are processed securely. Your support keeps making a verified difference.'}
                        </p>
                    </div>
                </div>

                {/* Interactive Contact Form Card */}
                <div className="contact-form-container">
                    <div className="form-card-header">
                        <MessageSquare size={28} className="header-icon" />
                        <h2>{i18n.language === 'hi' ? 'हमें एक संदेश भेजें' : 'Send Us A Message'}</h2>
                        <p>{i18n.language === 'hi' ? 'कृपया अपनी जानकारी भरें और हमारी टीम आपसे संपर्क करेगी।' : 'Fill out your contact details and our support team will reach you.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="premium-contact-form">
                        <div className="form-group-row">
                            <div className="form-group">
                                <label>{i18n.language === 'hi' ? 'पूरा नाम*' : 'Full Name*'}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={i18n.language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{i18n.language === 'hi' ? 'मोबाइल नंबर*' : 'Mobile Number*'}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder={i18n.language === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-digit phone number'}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{i18n.language === 'hi' ? 'ईमेल आईडी' : 'Email Address (Optional)'}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@domain.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>{i18n.language === 'hi' ? 'विषय' : 'Subject (Optional)'}</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder={i18n.language === 'hi' ? 'आप किस बारे में संपर्क कर रहे हैं?' : 'What is this regarding?'}
                            />
                        </div>

                        <div className="form-group">
                            <label>{i18n.language === 'hi' ? 'आपका संदेश*' : 'Your Message*'}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder={i18n.language === 'hi' ? 'यहाँ अपना विस्तृत संदेश लिखें...' : 'Type your detailed query here...'}
                                rows="5"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (
                                <div className="spinner"></div>
                            ) : (
                                <>
                                    <span>{i18n.language === 'hi' ? 'संदेश भेजें' : 'Send Message'}</span>
                                    <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
