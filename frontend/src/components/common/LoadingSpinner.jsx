import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <motion.div
                style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid var(--primary, #6366f1)',
                    borderRadius: '50%'
                }}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    marginTop: '1.5rem',
                    color: '#64748b',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                }}
            >
                PREPARING YOUR EXPERIENCE...
            </motion.p>
        </div>
    );
};

export default LoadingSpinner;
