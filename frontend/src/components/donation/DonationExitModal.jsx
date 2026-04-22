import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Send, Phone, User, ArrowRight, Home } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './DonationExitModal.css';

const DonationExitModal = ({ isOpen, onClose, onConfirmNavigation }) => {
    const [phase, setPhase] = useState(1); // 1: Message, 2: Form
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: ''
    });

    useEffect(() => {
        if (isOpen) {
            // Check for logged-in user to auto-fill
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setFormData({
                        name: user.name || '',
                        mobile: user.mobile || ''
                    });
                } catch (e) {
                    console.error("Error parsing user from localStorage");
                }
            }
        } else {
            // Reset phase when closed
            setPhase(1);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.mobile || formData.mobile.length < 10) {
            toast.error("Please enter a valid mobile number");
            return;
        }

        setLoading(true);
        try {
            await api.post('/leads', {
                ...formData,
                type: 'donation_exit',
                source: 'donation_page',
                language: localStorage.getItem('i18nextLng') || 'en'
            });
            toast.success("We'll remind you later! Thank you.");
            onConfirmNavigation(); // Proceed with navigation after submitting lead
        } catch (error) {
            console.error("Failed to save lead:", error);
            toast.error("Something went wrong, but you can still donate later!");
            onConfirmNavigation();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="exit-modal-overlay">
            <motion.div 
                className="exit-modal-container"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
                <button className="exit-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <AnimatePresence mode="wait">
                    {phase === 1 ? (
                        <motion.div 
                            key="phase1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="exit-modal-content"
                        >
                            <div className="exit-modal-icon-wrap">
                                <Heart size={48} className="heart-pulse" />
                            </div>
                            <h2>Please Don't Give Up!</h2>
                            <p>Every small contribution makes a huge difference in someone's life. Are you sure you want to leave?</p>
                            
                            <div className="exit-modal-actions">
                                <button className="btn-stay" onClick={onClose}>
                                    Contribute Now
                                </button>
                                <button className="btn-later" onClick={() => setPhase(2)}>
                                    Remind Me Later <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="phase2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="exit-modal-content"
                        >
                            <div className="exit-modal-icon-wrap secondary">
                                <Phone size={32} />
                            </div>
                            <h3>We'll remind you!</h3>
                            <p>Leave your details and we'll send you a gentle reminder when you're ready.</p>
                            
                            <form onSubmit={handleSubmit} className="exit-modal-form">
                                <div className="exit-form-group">
                                    <div className="exit-input-wrapper">
                                        <User size={18} className="exit-input-icon" />
                                        <input 
                                            type="text" 
                                            placeholder="Your Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="exit-form-group">
                                    <div className="exit-input-wrapper">
                                        <Phone size={18} className="exit-input-icon" />
                                        <input 
                                            type="tel" 
                                            placeholder="Mobile Number"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                </div>
                                <button className="btn-submit-lead" type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Remind Later'} <Send size={16} />
                                </button>
                                <button type="button" className="btn-cancel-navigation" onClick={onConfirmNavigation}>
                                    Just let me leave
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default DonationExitModal;
