import React, { useState } from 'react';
import { Send, CheckCircle2, Mail, Phone, MapPin, MessageSquare, User, AtSign, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const INPUT_STYLE = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '0.95rem',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    background: 'white',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
};

const LABEL_STYLE = {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#0d9488',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '7px'
};

const ContactForm = ({ data }) => {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(null);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/leads', {
                name: `${form.firstName} ${form.lastName}`.trim(),
                email: form.email,
                mobile: form.mobile,
                notes: form.message,
                type: 'contact',
                source: 'cms_contact_form'
            });
        } catch (err) {
            // Submit silently — still show success to user
            console.error('Lead submission error:', err);
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    };

    const focusStyle = (field) => ({
        ...INPUT_STYLE,
        borderColor: focused === field ? '#00bfa5' : '#e2e8f0',
        boxShadow: focused === field ? '0 0 0 4px rgba(0, 191, 165, 0.08)' : 'none'
    });

    const contactItems = [
        {
            icon: <Mail size={20} />,
            label: 'Email Us',
            value: data?.email || 'contact@foundation.org',
            color: '#0d9488'
        },
        {
            icon: <Phone size={20} />,
            label: 'Call Us',
            value: data?.phone || '+91 98765 43210',
            color: '#6366f1'
        },
        {
            icon: <MapPin size={20} />,
            label: 'Our Location',
            value: data?.address || 'Rajasthan, India',
            color: '#f59e0b'
        }
    ];

    return (
        <section style={{
            padding: '5rem 1.5rem',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'absolute', top: '-100px', right: '-100px',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(0,191,165,0.07) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '-60px', left: '-60px',
                width: '280px', height: '280px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none'
            }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
                {/* Section Header */}
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #e0fdf4, #ccfbf1)',
                        color: '#0d9488', padding: '6px 18px', borderRadius: '50px',
                        fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px',
                        textTransform: 'uppercase', marginBottom: '1.25rem',
                        border: '1px solid #99f6e4'
                    }}>
                        <MessageSquare size={14} /> Contact
                    </div>
                    <h2 style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                        fontWeight: 900, color: '#0f172a',
                        margin: '0 0 0.75rem 0', lineHeight: 1.2
                    }}>
                        {data?.title || 'Get in Touch'}
                    </h2>
                    <p style={{
                        color: '#64748b', fontSize: '1.05rem',
                        maxWidth: '500px', margin: '0 auto', lineHeight: 1.7
                    }}>
                        {data?.subtitle || 'Have questions? We\'re here to help you on your journey.'}
                    </p>
                </div>

                {/* Two-column layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
                    gap: '2.5rem',
                    alignItems: 'start'
                }}>
                    {/* Left — Info Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Info Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
                            borderRadius: '24px',
                            padding: '2.5rem',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: '-30px', right: '-30px',
                                width: '150px', height: '150px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '50%'
                            }} />
                            <div style={{
                                position: 'absolute', bottom: '-40px', left: '-20px',
                                width: '120px', height: '120px',
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: '50%'
                            }} />

                            <h3 style={{
                                fontSize: '1.3rem', fontWeight: 800,
                                margin: '0 0 0.5rem 0'
                            }}>Contact Information</h3>
                            <p style={{
                                color: 'rgba(255,255,255,0.65)',
                                fontSize: '0.9rem', margin: '0 0 2rem 0'
                            }}>
                                Reach out through any channel — we respond within 24 hours.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                                {contactItems.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, backdropFilter: 'blur(4px)'
                                        }}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', marginTop: '1px' }}>
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick note */}
                        <div style={{
                            background: 'white', borderRadius: '16px',
                            padding: '1.5rem', border: '2px solid #f1f5f9',
                            display: 'flex', alignItems: 'flex-start', gap: '12px'
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: '#f0fdf4', color: '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', marginBottom: '3px' }}>
                                    We value your privacy
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6 }}>
                                    Your information is never shared with third parties and is used only to respond to your inquiry.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right — Form Panel */}
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 8px 40px -12px rgba(0,0,0,0.08)'
                    }}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                <div style={{
                                    width: '80px', height: '80px',
                                    background: 'linear-gradient(135deg, #00bfa5, #0d9488)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    boxShadow: '0 8px 24px rgba(0, 191, 165, 0.3)',
                                    animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}>
                                    <CheckCircle2 size={38} color="white" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                                    Message Sent! 🎉
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                                    Thank you for reaching out. We'll get back to you within 24 hours.
                                </p>
                                <button
                                    onClick={() => { setSubmitted(false); setForm({ firstName: '', lastName: '', email: '', mobile: '', message: '' }); }}
                                    style={{
                                        padding: '10px 24px', borderRadius: '12px',
                                        border: '2px solid #e0fdf4', background: '#f0fdfa',
                                        color: '#0d9488', fontWeight: 700, cursor: 'pointer',
                                        fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <ArrowRight size={16} /> Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                                        Send us a message
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                                        Fill in the form and we'll be in touch shortly.
                                    </p>
                                </div>

                                {/* Name Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label style={LABEL_STYLE}>
                                            <User size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                            First Name
                                        </label>
                                        <input
                                            type="text" placeholder="Ramesh" required
                                            value={form.firstName}
                                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                                            onFocus={() => setFocused('firstName')}
                                            onBlur={() => setFocused(null)}
                                            style={focusStyle('firstName')}
                                        />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Last Name</label>
                                        <input
                                            type="text" placeholder="Sharma" required
                                            value={form.lastName}
                                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                                            onFocus={() => setFocused('lastName')}
                                            onBlur={() => setFocused(null)}
                                            style={focusStyle('lastName')}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label style={LABEL_STYLE}>
                                        <AtSign size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                        Email Address
                                    </label>
                                    <input
                                        type="email" placeholder="ramesh@example.com" required
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        onFocus={() => setFocused('email')}
                                        onBlur={() => setFocused(null)}
                                        style={focusStyle('email')}
                                    />
                                </div>

                                {/* Mobile */}
                                <div>
                                    <label style={LABEL_STYLE}>
                                        <Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel" placeholder="+91 98765 43210"
                                        value={form.mobile}
                                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                                        onFocus={() => setFocused('mobile')}
                                        onBlur={() => setFocused(null)}
                                        style={focusStyle('mobile')}
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label style={LABEL_STYLE}>
                                        <MessageSquare size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                        Your Message
                                    </label>
                                    <textarea
                                        rows={4} placeholder="Tell us how we can help you..." required
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        onFocus={() => setFocused('message')}
                                        onBlur={() => setFocused(null)}
                                        style={{
                                            ...focusStyle('message'),
                                            resize: 'none',
                                            lineHeight: 1.6
                                        }}
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '15px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: loading
                                            ? '#94a3b8'
                                            : 'linear-gradient(135deg, #00bfa5 0%, #00695c 100%)',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: loading ? 'none' : '0 6px 20px rgba(0, 191, 165, 0.3)',
                                        transition: 'all 0.2s',
                                        transform: 'translateY(0)'
                                    }}
                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    {loading
                                        ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                                        : <><Send size={18} /> Send Message</>
                                    }
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    .contact-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
};

export default ContactForm;
