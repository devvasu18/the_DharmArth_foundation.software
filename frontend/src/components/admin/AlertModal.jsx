import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
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

    const isSuccess = type === 'success';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1200, // Higher than confirmation
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '350px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '1.5rem',
                textAlign: 'center',
                transform: 'scale(1)',
                animation: 'scaleUp 0.2s ease-out',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                <div style={{
                    margin: '0 auto 1rem',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: isSuccess ? '#f0fff4' : '#fff5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSuccess ? '#38a169' : '#e53e3e'
                }}>
                    {isSuccess ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                </div>

                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem', color: '#1a202c' }}>
                    {title}
                </h3>

                <p style={{ color: '#4a5568', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {message}
                </p>

                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 24px',
                        background: isSuccess ? '#3182ce' : '#e53e3e',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 500,
                        width: '100%'
                    }}
                >
                    OK
                </button>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default AlertModal;
