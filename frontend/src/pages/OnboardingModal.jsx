import React, { useState } from 'react';
import { X, Building, User, CreditCard, ShieldCheck, Send, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const OnboardingModal = ({ isOpen, onClose, user, setUser }) => {
    const [payoutMethod, setPayoutMethod] = useState(null); // 'bank' or 'upi'
    const [bankForm, setBankForm] = useState({
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifscCode: '',
        upiId: ''
    });
    const [bankLoading, setBankLoading] = useState(false);

    const handleBecomeMotivator = async (e) => {
        e.preventDefault();
        setBankLoading(true);
        // IFSC Validation: 4 chars, 0, then 6 alphanumeric
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (payoutMethod === 'bank' && !ifscRegex.test(bankForm.ifscCode)) {
            toast.error("Invalid IFSC Code. Format: ABCD0123456");
            setBankLoading(false);
            return;
        }

        // Account Number Validation: 9-18 digits
        const accRegex = /^\d{9,18}$/;
        if (payoutMethod === 'bank' && !accRegex.test(bankForm.accountNumber)) {
            toast.error("Invalid Account Number. Should be 9-18 digits.");
            setBankLoading(false);
            return;
        }

        try {
            const { data } = await api.put('/users/become-motivator', bankForm);
            
            const updatedUser = { ...data.user, token: user.token };
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success("Details saved successfully!");
            onClose();
            
            // Short delay to let the user see the success message
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to register as motivator");
        } finally {
            setBankLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="payout-modal-overlay" onClick={onClose}>
                <motion.div
                    className="payout-modal"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                >
                    <button className="payout-modal-close" onClick={onClose}><X size={24} /></button>

                    <div className="payout-modal-header onboarding-header-gradient">
                        <h2>Complete Payout Profile</h2>
                        <p>Unlock withdrawals and higher commissions by providing your payout details.</p>
                    </div>

                    <div className="conditions-container onboarding-modal-body">
                        <div className="payout-method-selector-label">Select Payout Method</div>
                        <div className="payout-method-options">
                            <div
                                className={`method-option ${payoutMethod === 'bank' ? 'active' : ''}`}
                                onClick={() => setPayoutMethod('bank')}
                            >
                                <div className="option-check"></div>
                                <Building className="option-icon" size={24} />
                                <div className="option-info">
                                    <span className="option-title">Bank Transfer</span>
                                    <span className="option-desc">Direct to bank account</span>
                                </div>
                            </div>
                            <div
                                className={`method-option ${payoutMethod === 'upi' ? 'active' : ''}`}
                                onClick={() => setPayoutMethod('upi')}
                            >
                                <div className="option-check"></div>
                                <Send className="option-icon" size={24} />
                                <div className="option-info">
                                    <span className="option-title">UPI / Mobile Pay</span>
                                    <span className="option-desc">Fast & Instant payout</span>
                                </div>
                            </div>
                        </div>

                        {payoutMethod && (
                            <form onSubmit={handleBecomeMotivator} className="onboarding-form">
                                <div className="form-grid">
                                    {payoutMethod === 'bank' ? (
                                        <>
                                            <div className="input-group">
                                                <label>Bank Name</label>
                                                <div className="input-with-icon">
                                                    <Building className="field-icon" size={18} />
                                                    <input required type="text" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="e.g. HDFC Bank" />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Account Holder Name</label>
                                                <div className="input-with-icon">
                                                    <User className="field-icon" size={18} />
                                                    <input required type="text" value={bankForm.accountHolder} onChange={e => setBankForm({ ...bankForm, accountHolder: e.target.value })} placeholder="Your Name" />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Account Number</label>
                                                <div className="input-with-icon">
                                                    <CreditCard className="field-icon" size={18} />
                                                    <input 
                                                        required 
                                                        type="text" 
                                                        maxLength={18}
                                                        pattern="\d*"
                                                        value={bankForm.accountNumber} 
                                                        onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })} 
                                                        placeholder="9-18 Digits" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>IFSC Code</label>
                                                <div className="input-with-icon">
                                                    <ShieldCheck className="field-icon" size={18} />
                                                    <input 
                                                        required 
                                                        type="text" 
                                                        maxLength={11}
                                                        value={bankForm.ifscCode} 
                                                        onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} 
                                                        placeholder="e.g. HDFC0001234" 
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="input-group">
                                                <label>Account Holder Name</label>
                                                <div className="input-with-icon">
                                                    <User className="field-icon" size={18} />
                                                    <input required type="text" value={bankForm.accountHolder} onChange={e => setBankForm({ ...bankForm, accountHolder: e.target.value })} placeholder="Your Name" />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>UPI ID or Mobile Number</label>
                                                <div className="input-with-icon">
                                                    <Send className="field-icon" size={18} />
                                                    <input required type="text" value={bankForm.upiId} onChange={e => setBankForm({ ...bankForm, upiId: e.target.value })} placeholder="e.g. 9876543210@paytm" />
                                                </div>
                                            </div>

                                            <div className="upi-compatibility full-width">
                                                <span className="comp-text">Supports all major apps</span>
                                                <div className="comp-icons">
                                                    <div className="comp-badge">G-Pay</div>
                                                    <div className="comp-badge">PhonePe</div>
                                                    <div className="comp-badge">Paytm</div>
                                                    <div className="comp-badge">+ UPI</div>
                                                </div>
                                            </div>

                                            <div className="upi-info-banner full-width">
                                                <ShieldCheck className="info-icon" size={18} />
                                                <p>Payments will be sent instantly to the UPI app linked to this ID or Mobile Number.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>

                    {payoutMethod && (
                        <div className="modal-footer onboarding-footer">
                            <button 
                                onClick={(e) => {
                                    const form = document.querySelector('.onboarding-form');
                                    if (form) form.requestSubmit();
                                }}
                                className="btn-register-modern" 
                                disabled={bankLoading}
                            >
                                {bankLoading ? 'Registering...' : `Register ${payoutMethod === 'bank' ? 'Bank' : 'UPI'} & Start Earning`}
                                {!bankLoading && <ArrowRight size={18} />}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingModal;
