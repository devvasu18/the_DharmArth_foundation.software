import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, Share2, CheckCircle, Lock, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './UserDashboard.css'; // Re-use dashboard CSS and add specific modal styles there

const PayoutModal = ({ isOpen, onClose, wallet, user }) => {
    const [timeLeft, setTimeLeft] = useState({});

    // Constants
    const LOCK_IN_DAYS = 90;
    const MIN_BALANCE = 500;

    // Calculate Dates
    // Assuming wallet.createdAt is the start of earning potential. 
    // If wallet doesn't have it, fallback to user.createdAt
    const startDate = new Date(wallet?.createdAt || user?.createdAt || Date.now());
    const unlockDate = new Date(startDate.getTime() + (LOCK_IN_DAYS * 24 * 60 * 60 * 1000));
    const now = new Date();

    // Condition 1: Lock-in Status
    const totalDuration = unlockDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const timeProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const isTimeUnlocked = elapsed >= totalDuration;

    // Condition 2: Balance Status
    const currentBalance = wallet?.balance || 0;
    const balanceProgress = Math.min(100, Math.max(0, (currentBalance / MIN_BALANCE) * 100));
    const isBalanceUnlocked = currentBalance >= MIN_BALANCE;

    const canPayout = isTimeUnlocked && isBalanceUnlocked;

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
            alert('Share link copied to clipboard!');
        }
    };

    const handleProceed = () => {
        if (canPayout) {
            alert("Proceeding to Payment Gateway...");
            // Add actual gateway navigation logic here
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="payout-modal-overlay" onClick={onClose}>
                <motion.div
                    className="payout-modal"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                >
                    <button className="payout-modal-close" onClick={onClose}><X size={24} /></button>

                    <div className="payout-modal-header">
                        <h2>Withdraw Now</h2>
                        <p>Complete these milestones to unlock your rewards</p>
                    </div>

                    <div className="conditions-container">
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
                    </div>

                    <div className="modal-footer">
                        {canPayout ? (
                            <button className="btn-proceed" onClick={handleProceed}>
                                Proceed to Gateway
                            </button>
                        ) : (
                            <button className="btn-locked" disabled>
                                <Lock size={16} /> Payout Locked
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PayoutModal;
