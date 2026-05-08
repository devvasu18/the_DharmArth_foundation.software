import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Info, X, Save, Zap, HelpCircle } from 'lucide-react';

const AdminSettings = () => {
    const { showAlert, showConfirm } = useConfirm();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [labelModalOpen, setLabelModalOpen] = useState(false);
    const [editLabel, setEditLabel] = useState({ en: '', hi: '', link: '', btnText: '', btnTextHi: '' });
    const [subtitleTab, setSubtitleTab] = useState('en');

    // Leaderboard Config State
    const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
    const [leaderboardLimit, setLeaderboardLimit] = useState(10);

    // Banner Config State
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [bannerConfig, setBannerConfig] = useState({
        text: '',
        btnText: '',
        link: ''
    });

    // Donation Config State
    const [donationModalOpen, setDonationModalOpen] = useState(false);
    const [donationConfig, setDonationConfig] = useState({
        plans: [600, 1000, 5000],
        popularAmount: 1000
    });

    // WhatsApp Config State
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [whatsappTab, setWhatsappTab] = useState('en');
    const [whatsappConfig, setWhatsappConfig] = useState({
        donationTemplate: '',
        donationTemplate_hi: '',
        withdrawalTemplate: '',
        withdrawalTemplate_hi: '',
        l1MotivatorTemplate: '',
        l1MotivatorTemplate_hi: '',
        l2MotivatorTemplate: '',
        l2MotivatorTemplate_hi: '',
        walletOtpTemplate: '',
        walletOtpTemplate_hi: '',
        walletDonationTemplate: '',
        walletDonationTemplate_hi: '',
        suspensionOtpTemplate: '',
        suspensionOtpTemplate_hi: ''
    });

    // Payout Config State
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutConfig, setPayoutConfig] = useState({
        minBalance: 500,
        successMessage: 'Your payment will be received in your bank account in the next 5-7 working days.'
    });

    // Wallet Config State
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [walletTab, setWalletTab] = useState('en');
    const [walletConfig, setWalletConfig] = useState({
        donateBtnText: 'Donate From Wallet',
        donateBtnText_hi: 'वॉलेट से दान करें'
    });

    // Security Config State
    const [securityModalOpen, setSecurityModalOpen] = useState(false);
    const [securityConfig, setSecurityConfig] = useState({
        adminSuspensionMobile: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/content/settings');
            setSettings(data);

            // Parse Donation Config
            if (data.donation_config) {
                const config = typeof data.donation_config === 'string'
                    ? JSON.parse(data.donation_config)
                    : data.donation_config;
                if (config && config.plans) {
                    setDonationConfig(config);
                }
            }

            // WhatsApp Config
            setWhatsappConfig({
                donationTemplate: data.whatsapp_donation_template || "Dear {name}, thank you for your generous donation of ₹{amount} to The DharmArth Foundation. Your support helps us make a big difference! 🙏",
                donationTemplate_hi: data.whatsapp_donation_template_hi || "नमस्ते {name}, The DharmArth Foundation को ₹{amount} का  दान देने के लिए धन्यवाद। आपका समर्थन हमें बड़ा बदलाव लाने में मदद करता है! 🙏",
                withdrawalTemplate: data.whatsapp_withdrawal_template || "Dear {name}, your payout request of ₹{amount} has been successfully processed and completed. The funds have been transferred as per your provided details. Thank you for your continued support! 🙏",
                withdrawalTemplate_hi: data.whatsapp_withdrawal_template_hi || "नमस्ते {name}, आपके ₹{amount} के भुगतान के अनुरोध को सफलतापूर्वक संसाधित और पूरा कर लिया गया है। आपके द्वारा प्रदान किए गए विवरण के अनुसार धनराशि स्थानांतरित कर दी गई है। आपके निरंतर समर्थन के लिए धन्यवाद! 🙏",
                l1MotivatorTemplate: data.whatsapp_motivator_l1_template || "Congratulations {motivator_name}! You received ₹{commission} commission for a donation of ₹{donation_amount} from {donor_name} ({donor_mobile}). Level: Directly Inspired Donor 🙏",
                l1MotivatorTemplate_hi: data.whatsapp_motivator_l1_template_hi || "बधाई हो {motivator_name}! आपको {donor_name} ({donor_mobile}) से ₹{donation_amount} के दान के लिए ₹{commission} कमीशन प्राप्त हुआ। स्तर: प्रेरित दानवीर 🙏",
                l2MotivatorTemplate: data.whatsapp_motivator_l2_template || "Partner-Inspired Bonus! {motivator_name}, you received ₹{commission} commission via {l1_motivator_name} ({l1_motivator_mobile}) for a donation from {donor_name} ({donor_mobile}). Level:Partner-Inspired Donor 🙏",
                l2MotivatorTemplate_hi: data.whatsapp_motivator_l2_template_hi || "स्तर 2 बोनस! {motivator_name}, आपको {donor_name} ({donor_mobile}) से दान के लिए {l1_motivator_name} ({l1_motivator_mobile}) के माध्यम से ₹{commission} कमीशन प्राप्त हुआ। स्तर: साथी द्वारा प्रेरित दानवीर 🙏",
                walletOtpTemplate: data.whatsapp_wallet_otp_template || "Your OTP for The DharmArth Foundation *Wallet Donation* is: *{otp}*. Valid for 10 minutes. Please do not share this code with anyone.",
                walletOtpTemplate_hi: data.whatsapp_wallet_otp_template_hi || "The DharmArth Foundation वॉलेट दान के लिए आपका OTP है: *{otp}*। यह 10 मिनट के लिए मान्य है।",
                walletDonationTemplate: data.whatsapp_wallet_donation_template || "Dear {name}, thank you for your donation of ₹{amount} from your wallet.",
                walletDonationTemplate_hi: data.whatsapp_wallet_donation_template_hi || "नमस्ते {name}, आपके वॉलेट से ₹{amount} के दान के लिए धन्यवाद।" ,
                suspensionOtpTemplate: data.whatsapp_suspension_otp_template || "The DharmArth Foundation: Your OTP for User Suspension/Activation is: *{otp}*. Please do not share this code with anyone.",
                suspensionOtpTemplate_hi: data.whatsapp_suspension_otp_template_hi || "The DharmArth Foundation: यूजर सस्पेंड/एक्टिवेट करने के लिए आपका OTP है: *{otp}*। कृपया इसे किसी के साथ साझा न करें।"
            });

            // Payout Config
            setPayoutConfig({
                minBalance: data.payout_min_balance || 500,
                successMessage: data.payout_success_message || 'Your payment will be received in your bank account in the next 5-7 working days.'
            });

            // Leaderboard Limit
            setLeaderboardLimit(data.leaderboard_limit || 10);

            // Wallet Config
            setWalletConfig({
                donateBtnText: data.wallet_donate_btn_text || 'Donate From Wallet',
                donateBtnText_hi: data.wallet_donate_btn_text_hi || 'वॉलेट से दान करें'
            });

            // Security Config
            setSecurityConfig({
                adminSuspensionMobile: data.admin_suspension_mobile || ''
            });
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async (key, value) => {
        try {
            await api.put('/content/settings', { [key]: value });
            setSettings(prev => ({ ...prev, [key]: value }));
            toast.success("Setting updated!");
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to update setting");
        }
    };

    const handleToggle = async (key, currentValue) => {
        handleUpdateSetting(key, !currentValue);
    };

    // --- Banner Logic ---
    const openConfigModal = () => {
        setBannerConfig({
            text: settings.save_life_banner_text || '',
            text_hi: settings.save_life_banner_text_hi || '',
            btnText: settings.save_life_banner_btn_text || '',
            btnText_hi: settings.save_life_banner_btn_text_hi || '',
            link: settings.save_life_banner_link || ''
        });
        setConfigModalOpen(true);
    };

    const handleSaveConfig = async () => {
        try {
            const updates = {
                save_life_banner_text: bannerConfig.text,
                save_life_banner_text_hi: bannerConfig.text_hi,
                save_life_banner_btn_text: bannerConfig.btnText,
                save_life_banner_btn_text_hi: bannerConfig.btnText_hi,
                save_life_banner_link: bannerConfig.link
            };
            await api.put('/content/settings', updates);
            setSettings({ ...settings, ...updates });
            setConfigModalOpen(false);
            toast.success("Banner Configuration Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save configuration");
        }
    };

    // --- Donation Logic ---
    const openDonationModal = () => {
        setDonationModalOpen(true);
    };

    const handlePlanChange = (index, value) => {
        const newPlans = [...donationConfig.plans];
        newPlans[index] = Number(value);
        setDonationConfig({ ...donationConfig, plans: newPlans });
    };

    const handleAddPlan = () => {
        if (donationConfig.plans.length < 9) {
            setDonationConfig({ ...donationConfig, plans: [...donationConfig.plans, 1000] });
        }
    };

    const handleRemovePlan = (index) => {
        const newPlans = donationConfig.plans.filter((_, i) => i !== index);
        setDonationConfig({ ...donationConfig, plans: newPlans });
    };

    const setPopular = (amount) => {
        setDonationConfig({ ...donationConfig, popularAmount: amount });
    };

    const openLabelModal = () => {
        setEditLabel({
            en: settings.donation_label || '',
            hi: settings.donation_label_hi || '',
            link: settings.donation_label_link || '',
            btnText: settings.donation_label_btn_text || '',
            btnTextHi: settings.donation_label_btn_text_hi || ''
        });
        setLabelModalOpen(true);
    };

    const handleSaveLabel = async () => {
        const updates = {
            donation_label: editLabel.en,
            donation_label_hi: editLabel.hi,
            donation_label_link: editLabel.link,
            donation_label_btn_text: editLabel.btnText,
            donation_label_btn_text_hi: editLabel.btnTextHi
        };
        try {
            await api.put('/content/settings', updates);
            setSettings(prev => ({ ...prev, ...updates }));
            toast.success("Subtitles updated!");
            setLabelModalOpen(false);
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save subtitles");
        }
    };

    const handleSaveDonationConfig = async () => {
        try {
            await api.put('/content/settings', { donation_config: donationConfig });
            // Update local settings state so it reflects immediately if we used it elsewhere (optional)
            setSettings({ ...settings, donation_config: donationConfig });
            setDonationModalOpen(false);
            toast.success("Donation Plans Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save donation plans");
        }
    };

    // --- WhatsApp Logic ---
    const openWhatsappModal = () => {
        setWhatsappModalOpen(true);
    };

    const handleSaveWhatsappConfig = async () => {
        try {
            const updates = {
                whatsapp_donation_template: whatsappConfig.donationTemplate,
                whatsapp_donation_template_hi: whatsappConfig.donationTemplate_hi,
                whatsapp_withdrawal_template: whatsappConfig.withdrawalTemplate,
                whatsapp_withdrawal_template_hi: whatsappConfig.withdrawalTemplate_hi,
                whatsapp_motivator_l1_template: whatsappConfig.l1MotivatorTemplate,
                whatsapp_motivator_l1_template_hi: whatsappConfig.l1MotivatorTemplate_hi,
                whatsapp_motivator_l2_template: whatsappConfig.l2MotivatorTemplate,
                whatsapp_motivator_l2_template_hi: whatsappConfig.l2MotivatorTemplate_hi,
                whatsapp_wallet_otp_template: whatsappConfig.walletOtpTemplate,
                whatsapp_wallet_otp_template_hi: whatsappConfig.walletOtpTemplate_hi,
                whatsapp_wallet_donation_template: whatsappConfig.walletDonationTemplate,
                whatsapp_wallet_donation_template_hi: whatsappConfig.walletDonationTemplate_hi,
                whatsapp_suspension_otp_template: whatsappConfig.suspensionOtpTemplate,
                whatsapp_suspension_otp_template_hi: whatsappConfig.suspensionOtpTemplate_hi
            };
            await api.put('/content/settings', updates);
            setSettings({ ...settings, ...updates });
            setWhatsappModalOpen(false);
            toast.success("WhatsApp Templates Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save WhatsApp templates");
        }
    };

    // --- Payout Logic ---
    const openPayoutModal = () => {
        setPayoutModalOpen(true);
    };

    const handleSavePayoutConfig = async () => {
        try {
            const updates = {
                payout_min_balance: Number(payoutConfig.minBalance),
                payout_success_message: payoutConfig.successMessage
            };
            await api.put('/content/settings', updates);
            setSettings({ ...settings, ...updates });
            setPayoutModalOpen(false);
            toast.success("Payout Configuration Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save payout configuration");
        }
    };

    // --- Leaderboard Logic ---
    const openLeaderboardModal = () => {
        setLeaderboardLimit(settings.leaderboard_limit || 10);
        setLeaderboardModalOpen(true);
    };

    const handleSaveLeaderboardConfig = async () => {
        try {
            await api.put('/content/settings', { leaderboard_limit: Number(leaderboardLimit) });
            setSettings({ ...settings, leaderboard_limit: Number(leaderboardLimit) });
            setLeaderboardModalOpen(false);
            toast.success("Leaderboard Limit Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save leaderboard limit");
        }
    };

    const handleSaveWalletConfig = async () => {
        try {
            const updates = {
                wallet_donate_btn_text: walletConfig.donateBtnText,
                wallet_donate_btn_text_hi: walletConfig.donateBtnText_hi
            };
            await api.put('/content/settings', updates);
            setSettings({ ...settings, ...updates });
            setWalletModalOpen(false);
            toast.success("Wallet Configuration Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save wallet configuration");
        }
    };

    const handleSaveSecurityConfig = async () => {
        try {
            const updates = {
                admin_suspension_mobile: securityConfig.adminSuspensionMobile
            };
            await api.put('/content/settings', updates);
            setSettings({ ...settings, ...updates });
            setSecurityModalOpen(false);
            toast.success("Security Configuration Saved!");
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save security configuration");
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="admin-card">
            <h3>Site Configuration</h3>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>Manage global site settings and feature flags.</p>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Setting Key</th>
                        <th>Current Value</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Banner Row */}
                    <tr>
                        <td><strong>Show "Save a Life" Banner</strong> (<a href="/login" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>Login Page</a>)</td>
                        <td>
                            {settings.show_save_life_banner ?
                                <span className="badge badge-green">Enabled</span> :
                                <span className="badge badge-red">Disabled</span>
                            }
                        </td>
                        <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => handleToggle('show_save_life_banner', settings.show_save_life_banner)}
                                >
                                    {settings.show_save_life_banner ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={openConfigModal}
                                >
                                    Configure
                                </button>
                            </div>
                        </td>
                    </tr>

                    {/* Donation Plans Row */}
                    <tr>
                        <td><strong>Donation Plans</strong> (Amounts & Popular)</td>
                        <td>
                            {donationConfig.plans.join(', ')} (Poppular: {donationConfig.popularAmount})
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={openDonationModal}
                            >
                                Configure
                            </button>
                        </td>
                    </tr>

                    {/* Donation Label Row */}
                    <tr>
                        <td><strong>Donation Form Subtitle</strong> (Appears under the title on Donate page)</td>
                        <td>
                            <div><strong>EN:</strong> {settings.donation_label || <span style={{ color: '#999' }}>Not set</span>}</div>
                            <div style={{ marginTop: '5px' }}><strong>HI:</strong> {settings.donation_label_hi || <span style={{ color: '#999' }}>Not set</span>}</div>
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={openLabelModal}
                            >
                                Edit Subtitle
                            </button>
                        </td>
                    </tr>

                    {/* WhatsApp Row */}
                    <tr>
                        <td><strong>WhatsApp Notifications</strong> (Message Templates)</td>
                        <td>
                            Dynamic Templates Configured
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={openWhatsappModal}
                            >
                                Configure
                            </button>
                        </td>
                    </tr>

                    {/* Payout Config Row */}
                    <tr>
                        <td><strong>Payout Configuration</strong> (Min Balance & Lock-in)</td>
                        <td>
                            Min: ₹{payoutConfig.minBalance} | Success Message: {payoutConfig.successMessage.substring(0, 30)}...
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={openPayoutModal}
                            >
                                Configure
                            </button>
                        </td>
                    </tr>

                    {/* Wallet Config Row */}
                    <tr>
                        <td><strong>Wallet Configuration</strong> (Donate From Wallet Button)</td>
                        <td>
                            <div><strong>EN:</strong> {walletConfig.donateBtnText}</div>
                            <div style={{ marginTop: '5px' }}><strong>HI:</strong> {walletConfig.donateBtnText_hi}</div>
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={() => setWalletModalOpen(true)}
                            >
                                Configure
                            </button>
                        </td>
                    </tr>

                    {/* Leaderboard Row */}
                    <tr>
                        <td><strong>Leaderboard Configuration</strong> (Top Donors Limit)</td>
                        <td>
                            Displaying Top {settings.leaderboard_limit || 10} Donors
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={openLeaderboardModal}
                            >
                                Configure
                            </button>
                        </td>
                    </tr>

                    {/* Security Row */}
                    <tr>
                        <td><strong>Security Configuration</strong> (Admin Suspension OTP)</td>
                        <td>
                            Admin Mobile: {settings.admin_suspension_mobile || <span style={{ color: '#ef4444' }}>Not Configured</span>}
                        </td>
                        <td>
                            <button
                                className="btn btn-outline"
                                onClick={() => setSecurityModalOpen(true)}
                            >
                                Configure
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Banner Modal */}
            {configModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', maxWidth: '90%' }}>
                        <h4>Configure Banner</h4>
                        <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Banner Text (En)</label>
                                <input
                                    className="form-input"
                                    value={bannerConfig.text}
                                    onChange={(e) => setBannerConfig({ ...bannerConfig, text: e.target.value })}
                                    placeholder="e.g. Help us save lives..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Banner Text (Hi)</label>
                                <input
                                    className="form-input"
                                    value={bannerConfig.text_hi}
                                    onChange={(e) => setBannerConfig({ ...bannerConfig, text_hi: e.target.value })}
                                    placeholder="e.g. Hindi Translation"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Link Text (En)</label>
                                <input
                                    className="form-input"
                                    value={bannerConfig.btnText}
                                    onChange={(e) => setBannerConfig({ ...bannerConfig, btnText: e.target.value })}
                                    placeholder="e.g. Donate Now"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Link Text (Hi)</label>
                                <input
                                    className="form-input"
                                    value={bannerConfig.btnText_hi}
                                    onChange={(e) => setBannerConfig({ ...bannerConfig, btnText_hi: e.target.value })}
                                    placeholder="Hindi Link Text"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Button Link</label>
                                <input
                                    className="form-input"
                                    value={bannerConfig.link}
                                    onChange={(e) => setBannerConfig({ ...bannerConfig, link: e.target.value })}
                                    placeholder="e.g. /donate"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-outline" onClick={() => setConfigModalOpen(false)}>Cancel</button>
                            <button className="btn bg-primary text-white" onClick={handleSaveConfig}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Donation Config Modal */}
            {donationModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '500px', maxWidth: '90%' }}>
                        <h4>Configure Donation Plans</h4>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Manage donation amounts (Max 9). Select one as Popular.</p>

                        <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {donationConfig.plans.map((plan, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="radio"
                                        name="popularPlan"
                                        checked={donationConfig.popularAmount === plan}
                                        onChange={() => setPopular(plan)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={plan}
                                        onChange={(e) => handlePlanChange(index, e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>₹</span>
                                    {donationConfig.plans.length > 1 && (
                                        <button
                                            className="btn btn-outline"
                                            style={{ color: 'red', borderColor: 'red', padding: '5px 10px' }}
                                            onClick={async () => {
                                                if (await showConfirm("Remove Plan?", "Are you sure you want to remove this plan?")) {
                                                    handleRemovePlan(index)
                                                }
                                            }}
                                        >
                                            X
                                        </button>
                                    )}
                                </div>
                            ))}

                            {donationConfig.plans.length < 9 && (
                                <button className="btn btn-outline" onClick={handleAddPlan}>
                                    + Add Plan
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-outline" onClick={() => setDonationModalOpen(false)}>Cancel</button>
                            <button className="btn bg-primary text-white" onClick={handleSaveDonationConfig}>Save Plans</button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Config Modal */}
            <AnimatePresence>
                {whatsappModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 2000, backdropFilter: 'blur(8px)', padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{
                                background: '#f8fafc',
                                borderRadius: '24px',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '95vh',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #00bfa5 0%, #00695c 100%)',
                                padding: '2rem',
                                color: 'white',
                                position: 'relative'
                            }}>
                                <button
                                    onClick={() => setWhatsappModalOpen(false)}
                                    style={{
                                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                                        background: 'rgba(255,255,255,0.2)', border: 'none',
                                        borderRadius: '50%', width: '36px', height: '36px',
                                        color: 'white', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px' }}>
                                        <MessageSquare size={32} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>WhatsApp Templates</h2>
                                        <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>Configure dynamic messages for donors and motivators</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                                {/* Placeholders Info */}
                                <div style={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '16px',
                                    padding: '1.25rem',
                                    marginBottom: '2rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e293b' }}>
                                        <Zap size={18} color="#00bfa5" fill="#00bfa5" />
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Placeholders</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {['{name}', '{amount}', '{commission}', '{motivator_name}', '{donor_name}', '{donor_mobile}', '{l1_motivator_name}', '{l1_motivator_mobile}', '{otp}'].map(tag => (
                                            <span key={tag} style={{
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                border: '1px solid #e2e8f0',
                                                cursor: 'default',
                                                transition: 'all 0.2s'
                                            }}
                                                onMouseEnter={(e) => { e.target.style.background = '#e2e8f0'; e.target.style.color = '#1e293b'; }}
                                                onMouseLeave={(e) => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#475569'; }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <p style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Info size={14} /> Use these tags to automatically insert donation and motivator details.
                                    </p>
                                </div>

                                {/* Language Tabs */}
                                <div style={{
                                    display: 'flex',
                                    background: '#f1f5f9',
                                    padding: '4px',
                                    borderRadius: '12px',
                                    marginBottom: '2rem',
                                    width: 'fit-content'
                                }}>
                                    <button
                                        onClick={() => setWhatsappTab('en')}
                                        style={{
                                            padding: '8px 24px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: whatsappTab === 'en' ? 'white' : 'transparent',
                                            color: whatsappTab === 'en' ? '#00bfa5' : '#64748b',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: whatsappTab === 'en' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setWhatsappTab('hi')}
                                        style={{
                                            padding: '8px 24px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: whatsappTab === 'hi' ? 'white' : 'transparent',
                                            color: whatsappTab === 'hi' ? '#00bfa5' : '#64748b',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            boxShadow: whatsappTab === 'hi' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Hindi
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Primary Templates */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="template-card">
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                                                Donation Thank You ({whatsappTab === 'en' ? 'EN' : 'HI'})
                                            </label>
                                            <textarea
                                                className="form-input"
                                                style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                                value={whatsappTab === 'en' ? whatsappConfig.donationTemplate : whatsappConfig.donationTemplate_hi}
                                                onChange={(e) => setWhatsappConfig({
                                                    ...whatsappConfig,
                                                    [whatsappTab === 'en' ? 'donationTemplate' : 'donationTemplate_hi']: e.target.value
                                                })}
                                                placeholder={`Enter ${whatsappTab === 'en' ? 'English' : 'Hindi'} thank you message...`}
                                            />
                                        </div>
                                        <div className="template-card">
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                                                Payout Completion ({whatsappTab === 'en' ? 'EN' : 'HI'})
                                            </label>
                                            <textarea
                                                className="form-input"
                                                style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                                value={whatsappTab === 'en' ? whatsappConfig.withdrawalTemplate : whatsappConfig.withdrawalTemplate_hi}
                                                onChange={(e) => setWhatsappConfig({
                                                    ...whatsappConfig,
                                                    [whatsappTab === 'en' ? 'withdrawalTemplate' : 'withdrawalTemplate_hi']: e.target.value
                                                })}
                                                placeholder={`Enter ${whatsappTab === 'en' ? 'English' : 'Hindi'} payout confirmation message...`}
                                            />
                                        </div>
                                    </div>

                                    {/* Wallet OTP Template */}
                                    <div className="template-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                                            Wallet Donation OTP Verification ({whatsappTab === 'en' ? 'EN' : 'HI'})
                                        </label>
                                        <textarea
                                            className="form-input"
                                            style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                            value={whatsappTab === 'en' ? whatsappConfig.walletOtpTemplate : whatsappConfig.walletOtpTemplate_hi}
                                            onChange={(e) => setWhatsappConfig({
                                                ...whatsappConfig,
                                                [whatsappTab === 'en' ? 'walletOtpTemplate' : 'walletOtpTemplate_hi']: e.target.value
                                            })}
                                            placeholder={`Enter ${whatsappTab === 'en' ? 'English' : 'Hindi'} wallet OTP message...`}
                                        />
                                        <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                            Must include <strong>{'{otp}'}</strong> placeholder.
                                        </p>
                                    </div>

                                    {/* Wallet Donation Success Template */}
                                    <div className="template-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                                            Wallet Donation Thank You ({whatsappTab === 'en' ? 'EN' : 'HI'})
                                        </label>
                                        <textarea
                                            className="form-input"
                                            style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                            value={whatsappTab === 'en' ? whatsappConfig.walletDonationTemplate : whatsappConfig.walletDonationTemplate_hi}
                                            onChange={(e) => setWhatsappConfig({
                                                ...whatsappConfig,
                                                [whatsappTab === 'en' ? 'walletDonationTemplate' : 'walletDonationTemplate_hi']: e.target.value
                                            })}
                                            placeholder={`Enter ${whatsappTab === 'en' ? 'English' : 'Hindi'} wallet donation success message...`}
                                        />
                                        <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                            Placeholders: <strong>{'{name}'}</strong>, <strong>{'{amount}'}</strong>
                                        </p>
                                    </div>

                                    {/* Suspension OTP Template */}
                                    <div className="template-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                                            Admin Suspension/Activation OTP ({whatsappTab === 'en' ? 'EN' : 'HI'})
                                        </label>
                                        <textarea
                                            className="form-input"
                                            style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                            value={whatsappTab === 'en' ? whatsappConfig.suspensionOtpTemplate : whatsappConfig.suspensionOtpTemplate_hi}
                                            onChange={(e) => setWhatsappConfig({
                                                ...whatsappConfig,
                                                [whatsappTab === 'en' ? 'suspensionOtpTemplate' : 'suspensionOtpTemplate_hi']: e.target.value
                                            })}
                                            placeholder={`Enter ${whatsappTab === 'en' ? 'English' : 'Hindi'} suspension OTP message...`}
                                        />
                                        <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                            Must include <strong>{'{otp}'}</strong> placeholder.
                                        </p>
                                    </div>

                                    {/* Motivator Alerts */}
                                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Zap size={20} color="#00bfa5" /> Motivator Notifications ({whatsappTab === 'en' ? 'EN' : 'HI'})
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>L1 Commission Alert</label>
                                                <textarea
                                                    className="form-input"
                                                    style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #cbd5e1' }}
                                                    value={whatsappTab === 'en' ? whatsappConfig.l1MotivatorTemplate : whatsappConfig.l1MotivatorTemplate_hi}
                                                    onChange={(e) => setWhatsappConfig({
                                                        ...whatsappConfig,
                                                        [whatsappTab === 'en' ? 'l1MotivatorTemplate' : 'l1MotivatorTemplate_hi']: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>L2 Commission Alert</label>
                                                <textarea
                                                    className="form-input"
                                                    style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #cbd5e1' }}
                                                    value={whatsappTab === 'en' ? whatsappConfig.l2MotivatorTemplate : whatsappConfig.l2MotivatorTemplate_hi}
                                                    onChange={(e) => setWhatsappConfig({
                                                        ...whatsappConfig,
                                                        [whatsappTab === 'en' ? 'l2MotivatorTemplate' : 'l2MotivatorTemplate_hi']: e.target.value
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '1.5rem 2rem',
                                background: 'white',
                                borderTop: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '1rem'
                            }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setWhatsappModalOpen(false)}
                                    style={{ padding: '10px 24px', borderRadius: '10px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn bg-primary text-white"
                                    onClick={handleSaveWhatsappConfig}
                                    style={{
                                        padding: '10px 28px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: '#00bfa5',
                                        fontWeight: 700
                                    }}
                                >
                                    <Save size={18} />
                                    Save Templates
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payout Config Modal */}
            {payoutModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', minWidth: '400px', maxWidth: '90%' }}>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Configure Payout Rules</h4>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>Set the minimum balance requirement for user withdrawals.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Minimum Withdrawal Balance (₹)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    value={payoutConfig.minBalance}
                                    onChange={(e) => setPayoutConfig({ ...payoutConfig, minBalance: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Payout Success Message</label>
                                <textarea
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px' }}
                                    value={payoutConfig.successMessage}
                                    onChange={(e) => setPayoutConfig({ ...payoutConfig, successMessage: e.target.value })}
                                    placeholder="Enter the message users see after requesting a payout..."
                                />
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>This full text will be displayed in the success modal after a withdrawal request.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-outline" onClick={() => setPayoutModalOpen(false)} style={{ borderRadius: '10px' }}>Cancel</button>
                            <button
                                className="btn bg-primary text-white"
                                onClick={handleSavePayoutConfig}
                                style={{ borderRadius: '10px', background: '#00bfa5', fontWeight: 700 }}
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Donation Label Modal */}
            {labelModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '24px',
                        minWidth: '450px',
                        maxWidth: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Edit Donation Subtitle</h4>
                            <button onClick={() => setLabelModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                            This text appears directly under the main title on the donation page.
                        </p>

                        <div style={{
                            display: 'flex',
                            background: '#f1f5f9',
                            padding: '4px',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <button
                                onClick={() => setSubtitleTab('en')}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: subtitleTab === 'en' ? 'white' : 'transparent',
                                    color: subtitleTab === 'en' ? '#00bfa5' : '#64748b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: subtitleTab === 'en' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setSubtitleTab('hi')}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: subtitleTab === 'hi' ? 'white' : 'transparent',
                                    color: subtitleTab === 'hi' ? '#00bfa5' : '#64748b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: subtitleTab === 'hi' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Hindi
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            {subtitleTab === 'en' ? (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                                        Subtitle Text (English)
                                    </label>
                                    <textarea
                                        className="form-input"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            minHeight: '120px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5'
                                        }}
                                        value={editLabel.en}
                                        onChange={(e) => setEditLabel({ ...editLabel, en: e.target.value })}
                                        placeholder="English subtitle..."
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                                        Subtitle Text (Hindi)
                                    </label>
                                    <textarea
                                        className="form-input"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            minHeight: '120px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.5'
                                        }}
                                        value={editLabel.hi}
                                        onChange={(e) => setEditLabel({ ...editLabel, hi: e.target.value })}
                                        placeholder="Hindi subtitle..."
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                                Link URL (Optional)
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem'
                                }}
                                value={editLabel.link}
                                onChange={(e) => setEditLabel({ ...editLabel, link: e.target.value })}
                                placeholder="https://example.com/more-info"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                                Button Text ({subtitleTab === 'en' ? 'English' : 'Hindi'})
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem'
                                }}
                                value={subtitleTab === 'en' ? editLabel.btnText : editLabel.btnTextHi}
                                onChange={(e) => {
                                    if (subtitleTab === 'en') {
                                        setEditLabel({ ...editLabel, btnText: e.target.value });
                                    } else {
                                        setEditLabel({ ...editLabel, btnTextHi: e.target.value });
                                    }
                                }}
                                placeholder={subtitleTab === 'en' ? "Learn More" : "अधिक जानें"}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setLabelModalOpen(false)}
                                style={{ borderRadius: '12px', padding: '10px 20px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn bg-primary text-white"
                                onClick={handleSaveLabel}
                                style={{
                                    borderRadius: '12px',
                                    padding: '10px 24px',
                                    background: '#00bfa5',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <Save size={18} />
                                Save Subtitle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard Config Modal */}
            {leaderboardModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', minWidth: '400px', maxWidth: '90%' }}>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Leaderboard Limit</h4>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>Set the maximum number of top donors to display on the leaderboard.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>Top Donors Count</label>
                                <select
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    value={leaderboardLimit}
                                    onChange={(e) => setLeaderboardLimit(e.target.value)}
                                >
                                    <option value={5}>Top 5</option>
                                    <option value={10}>Top 10</option>
                                    <option value={15}>Top 15</option>
                                    <option value={20}>Top 20</option>
                                    <option value={30}>Top 30</option>
                                    <option value={50}>Top 50</option>
                                    <option value={100}>Top 100</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn btn-outline" onClick={() => setLeaderboardModalOpen(false)} style={{ borderRadius: '10px' }}>Cancel</button>
                            <button
                                className="btn bg-primary text-white"
                                onClick={handleSaveLeaderboardConfig}
                                style={{ borderRadius: '10px', background: '#00bfa5', fontWeight: 700 }}
                            >
                                Save Limit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Wallet Config Modal */}
            {walletModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 2000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', minWidth: '500px', maxWidth: '95%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Wallet Configuration</h4>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>Configure settings for the user wallet and donations.</p>
                            </div>
                            <button onClick={() => setWalletModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                        </div>

                        {/* Language Tabs */}
                        <div style={{
                            display: 'flex',
                            background: '#f1f5f9',
                            padding: '4px',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            width: 'fit-content'
                        }}>
                            <button
                                onClick={() => setWalletTab('en')}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: walletTab === 'en' ? 'white' : 'transparent',
                                    color: walletTab === 'en' ? '#00bfa5' : '#64748b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: walletTab === 'en' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setWalletTab('hi')}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: walletTab === 'hi' ? 'white' : 'transparent',
                                    color: walletTab === 'hi' ? '#00bfa5' : '#64748b',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: walletTab === 'hi' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Hindi
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569' }}>
                                    Donate Button Text ({walletTab === 'en' ? 'English' : 'Hindi'})
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    value={walletTab === 'en' ? walletConfig.donateBtnText : walletConfig.donateBtnText_hi}
                                    onChange={(e) => {
                                        if (walletTab === 'en') {
                                            setWalletConfig({ ...walletConfig, donateBtnText: e.target.value });
                                        } else {
                                            setWalletConfig({ ...walletConfig, donateBtnText_hi: e.target.value });
                                        }
                                    }}
                                    placeholder={walletTab === 'en' ? "Donate From Wallet" : "वॉलेट से दान करें"}
                                />
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                                    {walletTab === 'en' ? "This text will appear on the donation button in the User Dashboard wallet section." : "यह टेक्स्ट यूजर डैशबोर्ड के वॉलेट सेक्शन में दान बटन पर दिखाई देगा।"}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
                            <button className="btn btn-outline" onClick={() => setWalletModalOpen(false)} style={{ borderRadius: '10px' }}>Cancel</button>
                            <button
                                className="btn bg-primary text-white"
                                onClick={handleSaveWalletConfig}
                                style={{
                                    borderRadius: '10px',
                                    background: '#00bfa5',
                                    fontWeight: 700,
                                    padding: '12px 32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Save size={18} />
                                Save Wallet Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Config Modal */}
            {securityModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', minWidth: '400px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0 }}>Security Configuration</h4>
                            <button onClick={() => setSecurityModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>
                                Admin OTP Mobile Number
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                value={securityConfig.adminSuspensionMobile}
                                onChange={(e) => setSecurityConfig({ ...securityConfig, adminSuspensionMobile: e.target.value })}
                                placeholder="Enter mobile number (e.g. 9876543210)"
                            />
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
                                This mobile number will receive a WhatsApp OTP whenever an administrator attempts to suspend or activate a user account.
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => setSecurityModalOpen(false)}>Cancel</button>
                            <button 
                                className="btn bg-primary text-white" 
                                onClick={handleSaveSecurityConfig}
                                style={{ background: '#00bfa5', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Save size={18} />
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
