import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Share2, CheckCircle, Lock, Wallet, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import './UserDashboard.css'; 
const PayoutModal = ({ isOpen, onClose, wallet, user }) => {
    const [showConfirmStep, setShowConfirmStep] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState(0);
    const [timeLeft, setTimeLeft] = useState({});

    // Constants
    const LOCK_IN_DAYS = 90;
    const MIN_BALANCE = 500;

    // Memoized Dates to prevent effect loops
    const { startDate, unlockDate, isTimeUnlocked, totalDuration, timeProgress } = React.useMemo(() => {
        const start = new Date(wallet?.createdAt || user?.createdAt || Date.now());
        const unlock = new Date(start.getTime() + (LOCK_IN_DAYS * 24 * 60 * 60 * 1000));
        const now = new Date();
        const duration = unlock.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        return {
            startDate: start,
            unlockDate: unlock,
            isTimeUnlocked: elapsed >= duration,
            totalDuration: duration,
            timeProgress: Math.min(100, Math.max(0, (elapsed / duration) * 100))
        };
    }, [wallet?.createdAt, user?.createdAt]);

    const currentBalance = wallet?.balance || 0;
    const balanceProgress = Math.min(100, Math.max(0, (currentBalance / MIN_BALANCE) * 100));
    const isBalanceUnlocked = currentBalance >= MIN_BALANCE;

    const canPayout = isTimeUnlocked && isBalanceUnlocked;

    // Effect for initializing amount - ONLY run once when opening
    useEffect(() => {
        if (isOpen) {
            setWithdrawAmount(currentBalance);
        } else {
            setShowConfirmStep(false);
        }
    }, [isOpen, currentBalance]);

    // Effect for timer
    useEffect(() => {
        if (!isOpen || isTimeUnlocked) return;

        const timer = setInterval(() => {
            const nowTime = new Date().getTime();
            const distance = unlockDate.getTime() - nowTime;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft({});
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, isTimeUnlocked, unlockDate]);

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
        if (canPayout) {
            try {
                // Validation
                if (withdrawAmount < MIN_BALANCE) {
                    toast.error(`Minimum withdrawal amount is ₹${MIN_BALANCE}`);
                    return;
                }
                if (withdrawAmount > currentBalance) {
                    toast.error(`Amount exceeds current balance (₹${currentBalance})`);
                    return;
                }

                if (!user.payoutCredentials || (!user.payoutCredentials.accountNumber && !user.payoutCredentials.upiId)) {
                    toast.error("Please register your Payout Details (Bank or UPI) in your profile first.");
                    return;
                }

                if (!showConfirmStep) {
                    setShowConfirmStep(true);
                    return;
                }

                await api.post('/payouts/request', { amount: withdrawAmount });
                toast.success("Withdrawal Request Submitted Successfully!");
                onClose();
            } catch (error) {
                toast.error(error.response?.data?.message || "Failed to submit withdrawal request");
            }
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
                        <h2>{showConfirmStep ? 'Confirm Withdrawal' : 'Withdrawal'}</h2>
                        <p>{showConfirmStep ? 'Please verify your details before proceeding' : 'Track your milestones and request payouts'}</p>
                    </div>

                    <div className="conditions-container">
                        {showConfirmStep ? (
                            <motion.div 
                                className="confirm-step-ui"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="confirm-amount-card">
                                    <label>Amount to Withdraw</label>
                                    <div className="amount-val">₹{withdrawAmount.toLocaleString()}</div>
                                </div>

                                <div className="confirm-details-list">
                                    <div className="confirm-detail-item">
                                        <label>Receiving Via</label>
                                        <span>{user.payoutCredentials.bankName || 'UPI / Mobile Pay'}</span>
                                    </div>
                                    <div className="confirm-detail-item">
                                        <label>Holder Name</label>
                                        <span>{user.payoutCredentials.accountHolder}</span>
                                    </div>
                                    <div className="confirm-detail-item">
                                        <label>Identifier</label>
                                        <span>{user.payoutCredentials.accountNumber ? user.payoutCredentials.accountNumber.replace(/.(?=.{4})/g, '*') : user.payoutCredentials.upiId}</span>
                                    </div>
                                </div>

                                <div className="confirm-notice">
                                    <AlertCircle size={18} />
                                    <p>Your wallet balance will be locked and deducted once the request is approved by our team.</p>
                                </div>

                                <div className="confirm-actions">
                                    <button className="btn-back-modal" onClick={() => setShowConfirmStep(false)}>
                                        Go Back
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Payout Details Section */}
                                <div className="payout-details-card">
                                    <div className="detail-header">
                                        <h3>Receiving Account</h3>
                                        {user.payoutCredentials?.isVerified ? (
                                            <span className="verified-status">
                                                <CheckCircle size={14} /> Verified
                                            </span>
                                        ) : (
                                            <span className="pending-status">
                                                <Clock size={14} /> Pending Verification
                                            </span>
                                        )}
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
                                            {user.payoutCredentials.upiId && (
                                                <div className="info-item">
                                                    <label>UPI / Mobile</label>
                                                    <span>{user.payoutCredentials.upiId}</span>
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

                                {/* Condition 1: Lock-in Period */}
                                <div className={`condition-card ${isTimeUnlocked ? 'unlocked' : 'locked'}`}>
                                    <div className="condition-icon">
                                        {isTimeUnlocked ? <CheckCircle size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div className="condition-content">
                                        <div className="condition-title-row">
                                            <h3>Lock-in Period (3 Months)</h3>
                                            <span className="status-tag">{isTimeUnlocked ? 'Completed' : 'In Progress'}</span>
                                        </div>

                                        <div className="progress-track">
                                            <div
                                                className="progress-fill time-fill"
                                                style={{ width: `${timeProgress}%` }}
                                            ></div>
                                        </div>

                                        {!isTimeUnlocked ? (
                                            <div className="countdown-timer">
                                                <div className="timer-box">
                                                    <span>{timeLeft.days || 0}</span>
                                                    <label>Days</label>
                                                </div>
                                                <span className="colon">:</span>
                                                <div className="timer-box">
                                                    <span>{timeLeft.hours || 0}</span>
                                                    <label>Hrs</label>
                                                </div>
                                                <span className="colon">:</span>
                                                <div className="timer-box">
                                                    <span>{timeLeft.minutes || 0}</span>
                                                    <label>Min</label>
                                                </div>
                                                <span className="colon">:</span>
                                                <div className="timer-box">
                                                    <span>{timeLeft.seconds || 0}</span>
                                                    <label>Sec</label>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="success-msg">Lock-in period successfully completed!</p>
                                        )}
                                    </div>
                                </div>

                                {/* Condition 2: Minimum Balance */}
                                <div className={`condition-card ${isBalanceUnlocked ? 'unlocked' : 'locked'}`}>
                                    <div className="condition-icon">
                                        {isBalanceUnlocked ? <CheckCircle size={24} /> : <Wallet size={24} />}
                                    </div>
                                    <div className="condition-content">
                                        <div className="condition-title-row">
                                            <h3>Minimum Balance (₹{MIN_BALANCE})</h3>
                                            <span className="status-tag">{isBalanceUnlocked ? 'Met' : 'Pending'}</span>
                                        </div>

                                        <div className="progress-track">
                                            <div
                                                className="progress-fill balance-fill"
                                                style={{ width: `${balanceProgress}%` }}
                                            ></div>
                                        </div>

                                        <div className="balance-details">
                                            <span>Current: <strong>₹{currentBalance}</strong></span>
                                            {!isBalanceUnlocked && (
                                                <span className="needed">Need <strong>₹{MIN_BALANCE - currentBalance}</strong> more</span>
                                            )}
                                        </div>

                                        {!isBalanceUnlocked && (
                                            <button className="btn-share-modal" onClick={handleShare}>
                                                <Share2 size={16} /> Share Now to Earn Faster
                                            </button>
                                        )}
                                    </div>
                                </div>

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

                                        <div className="amount-presets">
                                            <button onClick={() => setWithdrawAmount(500)} className={withdrawAmount === 500 ? 'active' : ''}>₹500</button>
                                            <button onClick={() => setWithdrawAmount(1000)} className={withdrawAmount === 1000 ? 'active' : ''}>₹1000</button>
                                            <button onClick={() => setWithdrawAmount(2000)} className={withdrawAmount === 2000 ? 'active' : ''}>₹2000</button>
                                            <button onClick={() => setWithdrawAmount(currentBalance)} className={withdrawAmount === currentBalance ? 'active' : ''}>Max</button>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        {canPayout ? (
                            <button className="btn-proceed" onClick={handleProceed}>
                                {showConfirmStep ? 'Verify and Confirm' : `Next Step`}
                            </button>
                        ) : (
                            <button className="btn-locked" disabled>
                                {currentBalance < MIN_BALANCE ? 'Low Balance' : 'Withdrawal Locked'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PayoutModal;
