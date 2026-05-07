import React, { useState } from 'react';
import { ChevronDown, FileText, BookOpen, Star, Zap, Shield, HelpCircle } from 'lucide-react';

const ICONS = [FileText, BookOpen, Star, Zap, Shield, HelpCircle];

const InfoAccordion = ({ data }) => {
    const items = data?.items || [];
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section style={{
            padding: '5rem 1.5rem',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'absolute', top: '-80px', right: '-80px',
                width: '300px', height: '300px',
                background: 'radial-gradient(circle, rgba(0,191,165,0.08) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '-60px', left: '-60px',
                width: '240px', height: '240px',
                background: 'radial-gradient(circle, rgba(0,105,92,0.06) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none'
            }} />

            <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #e0fdf4, #ccfbf1)',
                        color: '#0d9488', padding: '6px 18px', borderRadius: '50px',
                        fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px',
                        textTransform: 'uppercase', marginBottom: '1.25rem',
                        border: '1px solid #99f6e4'
                    }}>
                        <BookOpen size={14} /> Resources
                    </div>
                    <h2 style={{
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                        fontWeight: 900,
                        color: '#0f172a',
                        margin: '0 0 0.75rem 0',
                        lineHeight: 1.2
                    }}>
                        {data?.title || 'Guides & Documentation'}
                    </h2>
                    <p style={{
                        color: '#64748b',
                        fontSize: '1.05rem',
                        maxWidth: '500px',
                        margin: '0 auto',
                        lineHeight: 1.7
                    }}>
                        {data?.subtitle || 'Detailed information about our programs.'}
                    </p>
                </div>

                {/* Accordion Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {items.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '3rem',
                            color: '#94a3b8', fontSize: '1rem',
                            background: '#f8fafc', borderRadius: '20px',
                            border: '2px dashed #e2e8f0'
                        }}>
                            No documentation items yet.
                        </div>
                    )}
                    {items.map((item, index) => {
                        const isOpen = openIndex === index;
                        const Icon = ICONS[index % ICONS.length];
                        return (
                            <div
                                key={index}
                                style={{
                                    background: isOpen
                                        ? 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)'
                                        : 'white',
                                    borderRadius: '20px',
                                    border: isOpen
                                        ? '2px solid #99f6e4'
                                        : '2px solid #f1f5f9',
                                    boxShadow: isOpen
                                        ? '0 8px 30px -6px rgba(0, 191, 165, 0.18)'
                                        : '0 2px 8px -2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Trigger Button */}
                                <button
                                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.25rem 1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        gap: '16px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                        {/* Icon Box */}
                                        <div style={{
                                            width: '48px', height: '48px', flexShrink: 0,
                                            borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isOpen
                                                ? 'linear-gradient(135deg, #00bfa5 0%, #00695c 100%)'
                                                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                            color: isOpen ? 'white' : '#94a3b8',
                                            transition: 'all 0.35s ease',
                                            boxShadow: isOpen ? '0 4px 12px rgba(0, 191, 165, 0.35)' : 'none',
                                            transform: isOpen ? 'scale(1.05)' : 'scale(1)'
                                        }}>
                                            <Icon size={22} />
                                        </div>

                                        {/* Title + Number */}
                                        <div>
                                            <span style={{
                                                display: 'block',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                color: isOpen ? '#0d9488' : '#94a3b8',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase',
                                                marginBottom: '2px',
                                                transition: 'color 0.3s'
                                            }}>
                                                Section {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <span style={{
                                                fontSize: '1.05rem',
                                                fontWeight: 800,
                                                color: isOpen ? '#0f172a' : '#374151',
                                                transition: 'color 0.3s',
                                                lineHeight: 1.3
                                            }}>
                                                {item.title}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Chevron */}
                                    <div style={{
                                        width: '36px', height: '36px', flexShrink: 0,
                                        borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isOpen ? '#e0fdf4' : '#f8fafc',
                                        color: isOpen ? '#0d9488' : '#cbd5e1',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'all 0.35s ease',
                                        border: isOpen ? '1px solid #99f6e4' : '1px solid #f1f5f9'
                                    }}>
                                        <ChevronDown size={20} />
                                    </div>
                                </button>

                                {/* Expandable Content */}
                                <div style={{
                                    maxHeight: isOpen ? '1000px' : '0',
                                    opacity: isOpen ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease'
                                }}>
                                    <div style={{ padding: '0 1.5rem 1.75rem 1.5rem' }}>
                                        {/* Divider */}
                                        <div style={{
                                            height: '1px',
                                            background: 'linear-gradient(90deg, #99f6e4, transparent)',
                                            marginBottom: '1.25rem',
                                            marginLeft: '64px'
                                        }} />
                                        <div style={{ paddingLeft: '64px' }}>
                                            {item.content?.split('\n').map((para, i) => para.trim() && (
                                                <p key={i} style={{
                                                    color: '#475569',
                                                    fontSize: '0.975rem',
                                                    lineHeight: 1.8,
                                                    marginBottom: '0.75rem',
                                                    margin: i === 0 ? '0 0 0.75rem 0' : '0.75rem 0'
                                                }}>
                                                    {para}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes accordionFadeIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </section>
    );
};

export default InfoAccordion;
