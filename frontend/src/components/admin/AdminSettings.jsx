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
    const [editLabel, setEditLabel] = useState({ en: '', hi: '' });

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
    const [whatsappConfig, setWhatsappConfig] = useState({
        donationTemplate: '',
        withdrawalTemplate: '',
        l1MotivatorTemplate: '',
        l2MotivatorTemplate: ''
    });

    // Payout Config State
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutConfig, setPayoutConfig] = useState({
        minBalance: 500
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
                withdrawalTemplate: data.whatsapp_withdrawal_template || "Dear {name}, your payout request of ₹{amount} has been successfully processed and completed. The funds have been transferred as per your provided details. Thank you for your continued support! 🙏",
                l1MotivatorTemplate: data.whatsapp_motivator_l1_template || "Congratulations {motivator_name}! You received ₹{commission} commission for a donation of ₹{donation_amount} from {donor_name} ({donor_mobile}). Level: 1 🙏",
                l2MotivatorTemplate: data.whatsapp_motivator_l2_template || "Level 2 Bonus! {motivator_name}, you received ₹{commission} commission via {l1_motivator_name} ({l1_motivator_mobile}) for a donation from {donor_name} ({donor_mobile}). Level: 2 🙏"
            });

            // Payout Config
            setPayoutConfig({
                minBalance: data.payout_min_balance || 500
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
        if (donationConfig.plans.length < 6) {
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
            hi: settings.donation_label_hi || ''
        });
        setLabelModalOpen(true);
    };

    const handleSaveLabel = async () => {
        const updates = {
            donation_label: editLabel.en,
            donation_label_hi: editLabel.hi
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
                whatsapp_withdrawal_template: whatsappConfig.withdrawalTemplate,
                whatsapp_motivator_l1_template: whatsappConfig.l1MotivatorTemplate,
                whatsapp_motivator_l2_template: whatsappConfig.l2MotivatorTemplate
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
                payout_min_balance: Number(payoutConfig.minBalance)
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
                            <button
                                className="btn btn-outline"
                                onClick={() => handleToggle('show_save_life_banner', settings.show_save_life_banner)}
                            >
                                {settings.show_save_life_banner ? 'Disable' : 'Enable'}
                            </button>
                            <button
                                className="btn btn-outline"
                                style={{ marginLeft: '10px' }}
                                onClick={openConfigModal}
                            >
                                Configure
                            </button>
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
                            Min: ₹{payoutConfig.minBalance} | Lock-in: {payoutConfig.lockInMonths}m {payoutConfig.lockInDays}d {payoutConfig.lockInHours}h
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
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Manage donation amounts (Max 6). Select one as Popular.</p>

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

                            {donationConfig.plans.length < 6 && (
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
                                        {['{name}', '{amount}', '{commission}', '{motivator_name}', '{donor_name}', '{donor_mobile}', '{l1_motivator_name}', '{l1_motivator_mobile}'].map(tag => (
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

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Primary Templates */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="template-card">
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>Donation Thank You</label>
                                            <textarea
                                                className="form-input"
                                                style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                                value={whatsappConfig.donationTemplate}
                                                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, donationTemplate: e.target.value })}
                                                placeholder="Enter thank you message..."
                                            />
                                        </div>
                                        <div className="template-card">
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>Payout Completion</label>
                                            <textarea
                                                className="form-input"
                                                style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white', lineHeight: '1.5' }}
                                                value={whatsappConfig.withdrawalTemplate}
                                                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, withdrawalTemplate: e.target.value })}
                                                placeholder="Enter payout confirmation message..."
                                            />
                                        </div>
                                    </div>

                                    {/* Motivator Alerts */}
                                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Zap size={20} color="#00bfa5" /> Motivator Notifications
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>L1 Commission Alert</label>
                                                <textarea
                                                    className="form-input"
                                                    style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #cbd5e1' }}
                                                    value={whatsappConfig.l1MotivatorTemplate}
                                                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, l1MotivatorTemplate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>L2 Commission Alert</label>
                                                <textarea
                                                    className="form-input"
                                                    style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #cbd5e1' }}
                                                    value={whatsappConfig.l2MotivatorTemplate}
                                                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, l2MotivatorTemplate: e.target.value })}
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

                        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                        minHeight: '80px',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5'
                                    }}
                                    value={editLabel.en}
                                    onChange={(e) => setEditLabel({ ...editLabel, en: e.target.value })}
                                    placeholder="English subtitle..."
                                />
                            </div>

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
                                        minHeight: '80px',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5'
                                    }}
                                    value={editLabel.hi}
                                    onChange={(e) => setEditLabel({ ...editLabel, hi: e.target.value })}
                                    placeholder="Hindi subtitle..."
                                />
                            </div>
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

        </div>
    );
};

export default AdminSettings;
