import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Share2, CheckCircle, Lock, Wallet, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './UserDashboard.css';
const PayoutModal = ({ isOpen, onClose, wallet, user, onSuccess, onEditDetails }) => {
    const [showConfirmStep, setShowConfirmStep] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState(0);
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [showSuccessStep, setShowSuccessStep] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [payoutRules, setPayoutRules] = useState({
        minBalance: 500,
        lockInMonths: 0,
        lockInDays: 0,
        lockInHours: 0,
        hasLockInSettings: false
    });
    const [loadingRules, setLoadingRules] = useState(true);

    // Fetch Rules
    useEffect(() => {
        if (isOpen) {
            const fetchRules = async () => {
                try {
                    const { data } = await api.get('/content/settings');
                    setPayoutRules({
                        minBalance: data.payout_min_balance || 500,
                        lockInMonths: data.payout_lock_in_months || 0,
                        lockInDays: data.payout_lock_in_days || 0,
                        lockInHours: data.payout_lock_in_hours || 0,
                        hasLockInSettings: 'payout_lock_in_months' in data || 'payout_lock_in_days' in data || 'payout_lock_in_hours' in data
                    });
                } catch (error) {
                    console.error("Failed to fetch payout rules", error);
                } finally {
                    setLoadingRules(false);
                }
            };
            fetchRules();
        }
    }, [isOpen]);

    // Memoized Dates to prevent effect loops
    const currentBalance = wallet?.balance || 0;
    const MIN_BALANCE = payoutRules.minBalance || 500;
    const balanceProgress = Math.min(100, Math.max(0, (currentBalance / MIN_BALANCE) * 100));
    const isBalanceUnlocked = currentBalance >= MIN_BALANCE;

    const canPayout = isBalanceUnlocked;

    // Effect for initializing amount - ONLY run once when opening
    useEffect(() => {
        if (isOpen) {
            setWithdrawAmount(currentBalance);
        } else {
            setShowConfirmStep(false);
            setShowSuccessStep(false);
        }
    }, [isOpen, currentBalance]);


    const handleShare = () => {
        const shareLink = `${window.location.origin}/donate?ref=${user?.mobile}`;
        if (navigator.share) {
            navigator.share({
                title: 'Support a Cause',
                text: 'Help me reach my goal! Donate using this link.',
                url: shareLink,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareLink);
            toast.success('Share link copied to clipboard!');
        }
    };

    const handleProceed = async () => {
        if (!canPayout) return;

        // Validation
        if (withdrawAmount < MIN_BALANCE) {
            toast.error(`Minimum withdrawal amount is ₹${MIN_BALANCE}`);
            return;
        }
        if (withdrawAmount > currentBalance) {
            toast.error(`Amount exceeds current balance (₹${currentBalance})`);
            return;
        }

        if (!user.payoutCredentials || !user.payoutCredentials.accountNumber) {
            toast.error("Please register your Payout Details (Bank) in your profile first.");
            return;
        }

        if (!showConfirmStep) {
            setShowConfirmStep(true);
            return;
        }

        if (!showOtpStep) {
            // Send OTP
            setSendingOtp(true);
            try {
                await api.post('/payouts/send-otp');
                setShowOtpStep(true);
                toast.success("Verification OTP sent to your WhatsApp");
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to send OTP");
            } finally {
                setSendingOtp(false);
            }
            return;
        }

        // Final Step: Submit with OTP
        const otpString = otp.join('');
        if (otpString.length < 6) {
            toast.error("Please enter complete 6-digit OTP");
            return;
        }

        setVerifying(true);
        try {
            await api.post('/payouts/request', { 
                amount: withdrawAmount,
                otp: otpString
            });
            setShowSuccessStep(true);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit request");
        } finally {
            setVerifying(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.slice(0, 6).split('');
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (i + index < 6) newOtp[i + index] = char;
            });
            setOtp(newOtp);
            // Focus last pasted or next empty
            const nextIdx = Math.min(index + pastedData.length, 5);
            document.getElementById(`otp-${nextIdx}`)?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
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

                    <div className="payout-modal-header">
                        <h2>{showSuccessStep ? 'Success!' : showConfirmStep ? 'Confirm Withdrawal' : 'Withdrawal'}</h2>
                        <p>{showSuccessStep ? 'Request submitted successfully' : showConfirmStep ? 'Please verify your details before proceeding' : 'Track your milestones and request payouts'}</p>
                    </div>

                    <div className="conditions-container">
                        {showSuccessStep ? (
                            <motion.div 
                                className="success-step-ui"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '2rem 1rem' }}
                            >
                                <div className="success-icon-wrapper" style={{ 
                                    width: '80px', 
                                    height: '80px', 
                                    background: '#ecfdf5', 
                                    color: '#10b981', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    margin: '0 auto 1.5rem',
                                    boxShadow: '0 10px 20px rgba(16, 185, 129, 0.1)'
                                }}>
                                    <CheckCircle size={48} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Thank You!</h3>
                                <p style={{ color: '#059669', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Withdrawal Request Submitted Successfully!</p>
                                <div style={{ 
                                    background: '#f8fafc', 
                                    padding: '1.25rem', 
                                    borderRadius: '16px', 
                                    border: '1px solid #e2e8f0',
                                    color: '#64748b',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.6'
                                }}>
                                    Your payment will be received in your bank account in the next <strong>5-7 working days</strong>.
                                </div>
                            </motion.div>
                        ) : showConfirmStep ? (
                            <motion.div
                                className="confirm-step-ui"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="confirm-amount-card">
                                    <label>Amount to Withdraw</label>
                                    <div className="amount-val">₹{withdrawAmount.toLocaleString()}</div>
                                </div>

                                {!showOtpStep && (
                                    <>
                                        <div className="confirm-details-list">
                                            <div className="confirm-detail-item">
                                                <label>Bank</label>
                                                <span>{user.payoutCredentials.bankName}</span>
                                            </div>
                                            <div className="confirm-detail-item">
                                                <label> Account Holder Name</label>
                                                <span>{user.payoutCredentials.accountHolder}</span>
                                            </div>
                                            <div className="confirm-detail-item">
                                                <label>Account No.</label>
                                                <span>{user.payoutCredentials.accountNumber?.replace(/.(?=.{4})/g, '*')}</span>
                                            </div>
                                        </div>

                                        <div className="confirm-notice">
                                            <AlertCircle size={18} />
                                            <p>Your wallet balance will be locked and deducted once the request is approved by our team.</p>
                                        </div>
                                    </>
                                )}


                                {showOtpStep && (
                                    <motion.div 
                                        className="otp-verification-area"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="otp-header-mini">
                                            <Lock size={16} />
                                            <span>Verify it's you</span>
                                        </div>
                                        <p className="otp-desc-mini">Enter 6-digit code sent to <strong>{user.mobile}</strong></p>
                                        
                                        <div className="otp-input-grid-mini">
                                            {otp.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    id={`otp-${idx}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                    autoComplete="one-time-code"
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            <>
                                {/* Payout Details Section */}
                                <div className="payout-details-card">
                                    <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0 }}>Receiving Account</h3>
                                        <button 
                                            className="btn-edit-inline" 
                                            onClick={onEditDetails}
                                            title="Change Payout Details"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {user.payoutCredentials ? (
                                        <div className="bank-info-grid">
                                            {user.payoutCredentials.bankName && (
                                                <div className="info-item">
                                                    <label>Bank</label>
                                                    <span>{user.payoutCredentials.bankName}</span>
                                                </div>
                                            )}
                                            {user.payoutCredentials.accountNumber && (
                                                <div className="info-item">
                                                    <label>A/c Number</label>
                                                    <span>{user.payoutCredentials.accountNumber?.replace(/.(?=.{4})/g, '*')}</span>
                                                </div>
                                            )}
                                            {user.payoutCredentials.ifscCode && (
                                                <div className="info-item">
                                                    <label>IFSC</label>
                                                    <span>{user.payoutCredentials.ifscCode}</span>
                                                </div>
                                            )}
                                            <div className="info-item">
                                                <label>Holder</label>
                                                <span>{user.payoutCredentials.accountHolder}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-bank-warning">
                                            <AlertCircle size={20} />
                                            <p>Please update your bank details in your profile settings.</p>
                                        </div>
                                    )}
                                </div>


                                {/* Condition 2: Minimum Balance */}
                                {!isBalanceUnlocked && (
                                    <div className={`condition-card locked`}>
                                        <div className="condition-icon">
                                            <Wallet size={24} />
                                        </div>
                                        <div className="condition-content">
                                            <div className="condition-title-row">
                                                <h3>Minimum Balance (₹{MIN_BALANCE})</h3>
                                                <span className="status-tag">Pending</span>
                                            </div>

                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill balance-fill"
                                                    style={{ width: `${balanceProgress}%` }}
                                                ></div>
                                            </div>

                                            <div className="balance-details">
                                                <span>Current: <strong>₹{currentBalance}</strong></span>
                                                <span className="needed">Need <strong>₹{MIN_BALANCE - currentBalance}</strong> more</span>
                                            </div>

                                            <button className="btn-share-modal" onClick={handleShare}>
                                                <Share2 size={16} /> Share Now to Earn Faster
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Amount Selection - ONLY SHOW IF UNLOCKED */}
                                {canPayout && (
                                    <motion.div
                                        className="amount-selection-card"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <div className="selection-header">
                                            <IndianRupee size={18} />
                                            <h3>Enter Withdrawal Amount</h3>
                                        </div>

                                        <div className="amount-input-wrapper">
                                            <span className="currency-symbol">₹</span>
                                            <input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                                min={MIN_BALANCE}
                                                max={currentBalance}
                                                className="modern-amount-input"
                                            />
                                        </div>

                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        {loadingRules ? (
                            <div className="animate-pulse" style={{ height: '50px', background: '#f1f5f9', borderRadius: '12px', width: '100%' }}></div>
                        ) : showSuccessStep ? (
                            <button className="btn-proceed" onClick={onClose} style={{ width: '100%', borderRadius: '12px' }}>
                                Got it, Thanks!
                            </button>
                        ) : !canPayout ? (
                            <button className="btn-locked" disabled>
                                {currentBalance < MIN_BALANCE ? 'Low Balance' : 'Withdrawal Locked'}
                            </button>
                        ) : (
                            <>
                                {showConfirmStep && (
                                    <button className="btn-back-modal" onClick={() => showOtpStep ? setShowOtpStep(false) : setShowConfirmStep(false)}>
                                        {showOtpStep ? 'Edit' : 'Back'}
                                    </button>
                                )}
                                <button 
                                    className={`btn-proceed ${(sendingOtp || verifying) ? 'loading' : ''}`} 
                                    onClick={handleProceed}
                                    disabled={sendingOtp || verifying}
                                >
                                    {sendingOtp ? 'Sending OTP...' : 
                                     verifying ? 'Verifying...' :
                                     showOtpStep ? 'Confirm Withdrawal' :
                                     showConfirmStep ? 'Verify and Confirm' : 'Next Step'}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PayoutModal;

