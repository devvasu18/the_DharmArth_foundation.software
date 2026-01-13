import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, title, message, buttonText = "Continue" }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1300,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-out'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '2rem',
                textAlign: 'center',
                transform: 'scale(1)',
                animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.1)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{
                    margin: '0 auto 1.5rem',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e6ffFA 0%, #B2F5EA 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#319795',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <CheckCircle size={48} strokeWidth={2.5} />
                </div>

                <h3 style={{
                    marginTop: 0,
                    marginBottom: '0.5rem',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#2D3748'
                }}>
                    {title}
                </h3>

                <p style={{
                    color: '#718096',
                    marginBottom: '2rem',
                    lineHeight: 1.6,
                    fontSize: '1rem'
                }}>
                    {message}
                </p>

                <button
                    onClick={onClose}
                    style={{
                        padding: '12px 32px',
                        background: 'linear-gradient(90deg, #319795 0%, #2C7A7B 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1rem',
                        width: '100%',
                        boxShadow: '0 4px 14px 0 rgba(49, 151, 149, 0.39)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(49, 151, 149, 0.39)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(49, 151, 149, 0.39)';
                    }}
                >
                    {buttonText}
                </button>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default SuccessModal;
