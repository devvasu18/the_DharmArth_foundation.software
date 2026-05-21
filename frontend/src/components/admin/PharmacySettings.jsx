import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Info, Percent, Truck, HelpCircle, Trash2, Plus } from 'lucide-react';
import './PharmacySettings.css';

const PharmacySettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [faqLang, setFaqLang] = useState('en');
    const [config, setConfig] = useState({
        platformFeePercent: 2,
        deliveryChargeType: 'flat',
        flatDeliveryCharge: 50,
        percentDeliveryThreshold: 500,
        percentDeliveryBelowThreshold: 10,
        percentDeliveryAboveThreshold: 5,
        gstPercent: 12,
        faqs: []
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

                {/* Contact Timing Messages */}
                <div className="settings-card glass-card full-width" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <Info size={20} color="#3182ce" />
                        <h3>Contact Timing Messages</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="input-group">
                                <label>Day-time Message (8 AM - 9 PM)</label>
                                <input 
                                    type="text" 
                                    value={config.dayTimeContactText || ''} 
                                    onChange={(e) => setConfig({...config, dayTimeContactText: e.target.value})}
                                    placeholder="e.g. Pharmacist will contact you in 10-20 minutes"
                                />
                                <small>Shown during foundation working hours.</small>
                            </div>
                            <div className="input-group">
                                <label>Night-time Message (9 PM - 8 AM)</label>
                                <input 
                                    type="text" 
                                    value={config.nightTimeContactText || ''} 
                                    onChange={(e) => setConfig({...config, nightTimeContactText: e.target.value})}
                                    placeholder="e.g. Foundation will contact you at 8:30 AM"
                                />
                                <small>Shown after hours to set expectations.</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Order FAQs */}
                <div className="settings-card glass-card full-width" style={{ marginTop: '20px' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HelpCircle size={20} color="#3182ce" />
                            <h3>Dynamic Order Questions (FAQs)</h3>
                        </div>
                        <div className="faq-lang-tabs" style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
                            <button
                                type="button"
                                onClick={() => setFaqLang('en')}
                                style={{
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: faqLang === 'en' ? '#fff' : 'transparent',
                                    color: faqLang === 'en' ? '#0f172a' : '#64748b',
                                    boxShadow: faqLang === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => setFaqLang('hi')}
                                style={{
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    background: faqLang === 'hi' ? '#fff' : 'transparent',
                                    color: faqLang === 'hi' ? '#0f172a' : '#64748b',
                                    boxShadow: faqLang === 'hi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                Hindi (हिंदी)
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
                            These questions will be asked to the user when they upload a prescription. Answers will be visible on the verification screen.
                        </p>
                        
                        {(config.faqs || []).map((faq, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                {faqLang === 'en' ? (
                                    <input 
                                        type="text" 
                                        value={faq.question || ''} 
                                        onChange={(e) => {
                                            const newFaqs = [...(config.faqs || [])];
                                            newFaqs[index].question = e.target.value;
                                            setConfig({...config, faqs: newFaqs});
                                        }}
                                        placeholder="Enter question in English..."
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                ) : (
                                    <input 
                                        type="text" 
                                        value={faq.question_hi || ''} 
                                        onChange={(e) => {
                                            const newFaqs = [...(config.faqs || [])];
                                            newFaqs[index].question_hi = e.target.value;
                                            setConfig({...config, faqs: newFaqs});
                                        }}
                                        placeholder="हिंदी में प्रश्न दर्ज करें..."
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                )}
                                <button 
                                    onClick={() => {
                                        const newFaqs = (config.faqs || []).filter((_, i) => i !== index);
                                        setConfig({...config, faqs: newFaqs});
                                    }}
                                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => {
                                const newFaqs = [...(config.faqs || []), { id: Date.now().toString(), question: '', question_hi: '' }];
                                setConfig({...config, faqs: newFaqs});
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6', fontWeight: '600', marginTop: '10px' }}
                        >
                            <Plus size={18} /> Add New Question
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacySettings;
