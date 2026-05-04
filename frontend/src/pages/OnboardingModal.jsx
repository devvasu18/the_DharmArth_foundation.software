import React, { useState, useRef, useEffect } from 'react';
import { X, Building, User, CreditCard, ShieldCheck, Send, ArrowRight, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const indianBanks = [
    "Bank of Baroda", "Bank of India", "Bank of Maharashtra", "Canara Bank", "Central Bank of India",
    "Indian Bank", "Indian Overseas Bank", "Punjab & Sind Bank", "Punjab National Bank", "State Bank of India",
    "UCO Bank", "Union Bank of India", "Axis Bank", "Bandhan Bank", "CSB Bank",
    "City Union Bank", "DCB Bank", "Dhanlaxmi Bank", "Federal Bank", "HDFC Bank",
    "ICICI Bank", "IDBI Bank", "IDFC FIRST Bank", "IndusInd Bank", "Jammu & Kashmir Bank",
    "Karnataka Bank", "Karur Vysya Bank", "Kotak Mahindra Bank", "Nainital Bank", "RBL Bank",
    "South Indian Bank", "Tamilnad Mercantile Bank", "YES Bank", "AU Small Finance Bank",
    "Capital Small Finance Bank", "Equitas Small Finance Bank", "ESAF Small Finance Bank",
    "Fincare Small Finance Bank", "Jana Small Finance Bank", "North East Small Finance Bank",
    "Shivalik Small Finance Bank", "Suryoday Small Finance Bank", "Ujjivan Small Finance Bank",
    "Unity Small Finance Bank", "Utkarsh Small Finance Bank", "Airtel Payments Bank",
    "Fino Payments Bank", "India Post Payments Bank", "Jio Payments Bank", "NSDL Payments Bank",
    "Paytm Payments Bank"
].sort();

const OnboardingModal = ({ isOpen, onClose, user, setUser }) => {
    const [payoutMethod, setPayoutMethod] = useState('bank'); // Always 'bank' now
    const [bankForm, setBankForm] = useState({
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifscCode: ''
    });
    const [bankLoading, setBankLoading] = useState(false);

    // Searchable Dropdown States
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const filteredBanks = indianBanks.filter(bank =>
        bank.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBecomeMotivator = async (e) => {
        if (e) e.preventDefault();
        setBankLoading(true);
        // IFSC Validation: 4 chars, 0, then 6 alphanumeric
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(bankForm.ifscCode)) {
            toast.error("Invalid IFSC Code. Format: ABCD0123456");
            setBankLoading(false);
            return;
        }

        // Account Number Validation: 9-18 digits
        const accRegex = /^\d{9,18}$/;
        if (!accRegex.test(bankForm.accountNumber)) {
            toast.error("Invalid Account Number. Should be 9-18 digits.");
            setBankLoading(false);
            return;
        }

        if (!bankForm.bankName) {
            toast.error("Please select a Bank Name");
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
                        <div className="payout-method-selector-label">Payout Method: Bank Transfer</div>

                        <form onSubmit={handleBecomeMotivator} className="onboarding-form">
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Bank Name</label>
                                    <div className="searchable-dropdown" ref={dropdownRef}>
                                        <div
                                            className={`dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >

                                            <span className={bankForm.bankName ? 'selected-val' : 'placeholder'}>
                                                {bankForm.bankName || "Select Your Bank"}
                                            </span>
                                            <ChevronDown className={`chevron-icon ${isDropdownOpen ? 'rotate' : ''}`} size={18} />
                                        </div>

                                        <AnimatePresence>
                                            {isDropdownOpen && (
                                                <motion.div
                                                    className="dropdown-menu-list"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                >
                                                    <div className="dropdown-search">
                                                        <div className="search-input-wrapper">
                                                            <Search size={18} />
                                                            <input
                                                                type="text"
                                                                placeholder="Search bank name..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="options-container">
                                                        {filteredBanks.length > 0 ? (
                                                            filteredBanks.map((bank, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`dropdown-option ${bankForm.bankName === bank ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        setBankForm({ ...bankForm, bankName: bank });
                                                                        setIsDropdownOpen(false);
                                                                        setSearchTerm('');
                                                                    }}
                                                                >
                                                                    {bank}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="no-options">No banks found</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                                            minLength={9}
                                            maxLength={18}
                                            pattern="\d{9,18}"
                                            title="Account number should be 9-18 digits"
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
                                            pattern="[A-Z]{4}0[A-Z0-9]{6}"
                                            title="Invalid IFSC Code. Format: ABCD0123456"
                                            value={bankForm.ifscCode}
                                            onChange={e => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                                            placeholder="e.g. HDFC0001234"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {payoutMethod && (
                        <div className="modal-footer onboarding-footer">
                            <button
                                onClick={(e) => {
                                    handleBecomeMotivator();
                                }}
                                className="btn-register-modern"
                                disabled={bankLoading}
                            >
                                {bankLoading ? 'Registering...' : 'Register Bank & Start Earning'}
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
