import React, { useEffect } from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = "bg-red-600" }) => {
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
            zIndex: 1100,
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '1.5rem',
                transform: 'scale(1)',
                animation: 'scaleUp 0.2s ease-out'
            }} onClick={e => e.stopPropagation()}>

                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem', color: '#1a202c' }}>
                    {title}
                </h3>

                <p style={{ color: '#4a5568', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            color: '#4a5568',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            padding: '8px 16px',
                            background: confirmColor === 'red' ? '#e53e3e' : '#3182ce',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ConfirmationModal;
