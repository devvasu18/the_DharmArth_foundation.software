import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Info, Percent, Truck } from 'lucide-react';
import './PharmacySettings.css';

const PharmacySettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        platformFeePercent: 2,
        deliveryChargeType: 'flat',
        flatDeliveryCharge: 50,
        percentDeliveryThreshold: 500,
        percentDeliveryBelowThreshold: 10,
        percentDeliveryAboveThreshold: 5,
        gstPercent: 12
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.pharmacy_config) {
                setConfig(res.data.pharmacy_config);
            }
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/settings', { pharmacy_config: config });
            toast.success("Pharmacy settings updated!");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading settings...</div>;

    return (
        <div className="pharmacy-settings-container">
            <div className="settings-header">
                <div className="title-group">
                    <SettingsIcon className="title-icon" />
                    <div>
                        <h1>Pharmacy Calculations</h1>
                        <p>Configure dynamic taxes, platform fees, and delivery charges.</p>
                    </div>
                </div>
                <button className="btn-save-settings" onClick={handleSave} disabled={saving}>
                    {saving ? <div className="spinner-small"></div> : <><Save size={18} /> Save Changes</>}
                </button>
            </div>

            <div className="settings-grid">
                {/* Platform & GST */}
                <div className="settings-card glass-card">
                    <div className="card-header">
                        <Percent size={20} color="#3182ce" />
                        <h3>Taxes & Platform Fees</h3>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <label>Platform Fee (%)</label>
                            <input 
                                type="number" 
                                value={config.platformFeePercent} 
                                onChange={(e) => setConfig({...config, platformFeePercent: Number(e.target.value)})}
                            />
                            <small>Charged on the total medicine subtotal.</small>
                        </div>
                        <div className="input-group">
                            <label>GST/Tax (%)</label>
                            <input 
                                type="number" 
                                value={config.gstPercent} 
                                onChange={(e) => setConfig({...config, gstPercent: Number(e.target.value)})}
                            />
                            <small>Government taxes applied to medicines.</small>
                        </div>
                    </div>
                </div>

                {/* Delivery Charges */}
                <div className="settings-card glass-card">
                    <div className="card-header">
                        <Truck size={20} color="#38a169" />
                        <h3>Delivery Charge Configuration</h3>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <label>Charge Type</label>
                            <select 
                                value={config.deliveryChargeType} 
                                onChange={(e) => setConfig({...config, deliveryChargeType: e.target.value})}
                            >
                                <option value="flat">Flat Fee</option>
                                <option value="percent">Percentage Based</option>
                            </select>
                        </div>

                        {config.deliveryChargeType === 'flat' ? (
                            <div className="input-group">
                                <label>Flat Delivery Fee (₹)</label>
                                <input 
                                    type="number" 
                                    value={config.flatDeliveryCharge} 
                                    onChange={(e) => setConfig({...config, flatDeliveryCharge: Number(e.target.value)})}
                                />
                            </div>
                        ) : (
                            <div className="percent-config-area">
                                <div className="input-group">
                                    <label>Threshold Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        value={config.percentDeliveryThreshold} 
                                        onChange={(e) => setConfig({...config, percentDeliveryThreshold: Number(e.target.value)})}
                                    />
                                    <small>The subtotal amount to switch percentage rates.</small>
                                </div>
                                <div className="dual-inputs">
                                    <div className="input-group">
                                        <label>Below Threshold (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.percentDeliveryBelowThreshold} 
                                            onChange={(e) => setConfig({...config, percentDeliveryBelowThreshold: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Above Threshold (%)</label>
                                        <input 
                                            type="number" 
                                            value={config.percentDeliveryAboveThreshold} 
                                            onChange={(e) => setConfig({...config, percentDeliveryAboveThreshold: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Info */}
                <div className="info-card glass-card full-width">
                    <div className="info-icon-wrapper">
                        <Info size={24} color="#3182ce" />
                    </div>
                    <div className="info-content">
                        <h4>Calculation Logic Summary</h4>
                        <p>
                            Final Amount = Subtotal + GST ({config.gstPercent}%) + Platform Fee ({config.platformFeePercent}%) + 
                            {config.deliveryChargeType === 'flat' 
                                ? ` Flat Delivery (₹${config.flatDeliveryCharge})` 
                                : ` Variable Delivery (${config.percentDeliveryBelowThreshold}% if < ₹${config.percentDeliveryThreshold}, else ${config.percentDeliveryAboveThreshold}%)`
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacySettings;
