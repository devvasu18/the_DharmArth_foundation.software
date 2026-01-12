import React, { createContext, useContext, useState, useRef } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('confirm'); // 'confirm' or 'alert'
    const resolveRef = useRef(null);

    const confirm = (msg) => {
        setMessage(msg);
        setType('confirm');
        setIsOpen(true);
        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const showAlert = (msg) => {
        setMessage(msg);
        setType('alert');
        setIsOpen(true);
        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    };

    const handleConfirm = () => {
        if (resolveRef.current) resolveRef.current(true);
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (resolveRef.current) resolveRef.current(false);
        setIsOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm, showAlert }}>
            {children}
            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000 // Higher than other modals
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '350px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
                            {type === 'alert' ? 'Notification' : 'Confirm Action'}
                        </h4>
                        <p style={{ marginBottom: '2rem', color: '#666', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>{message}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            {type === 'confirm' && (
                                <button
                                    className="btn btn-outline"
                                    onClick={handleCancel}
                                    style={{ padding: '8px 20px' }}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                className="btn bg-primary text-white"
                                onClick={handleConfirm}
                                style={{ padding: '8px 20px' }}
                            >
                                {type === 'alert' ? 'OK' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
