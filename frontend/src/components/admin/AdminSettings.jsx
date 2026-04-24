import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';

const AdminSettings = () => {
    const { showAlert, showConfirm } = useConfirm();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key, currentValue) => {
        const newValue = !currentValue;
        try {
            await api.put('/content/settings', { [key]: newValue });
            setSettings({ ...settings, [key]: newValue });
        } catch (error) {
            console.error("Update failed", error);
        }
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
        if (donationConfig.plans.length < 4) {
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
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Manage donation amounts (Max 4). Select one as Popular.</p>

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

                            {donationConfig.plans.length < 4 && (
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

        </div >
    );
};

export default AdminSettings;
