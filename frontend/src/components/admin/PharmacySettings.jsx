import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Info, Percent, Truck, HelpCircle, Trash2, Plus, MapPin, RefreshCw, X, AlertTriangle } from 'lucide-react';
import './PharmacySettings.css';

const PharmacySettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [faqLang, setFaqLang] = useState('en');
    const [newVillageInput, setNewVillageInput] = useState('');
    const [newPincode, setNewPincode] = useState('');
    const [newPinVillages, setNewPinVillages] = useState('');
    const [config, setConfig] = useState({
        platformFeePercent: 2,
        deliveryChargeType: 'flat',
        flatDeliveryCharge: 50,
        percentDeliveryThreshold: 500,
        percentDeliveryBelowThreshold: 10,
        percentDeliveryAboveThreshold: 5,
        gstPercent: 12,
        serviceableVillages: 'छापर, सांडवा, बीदासर',
        acceptedPincodes: '331502, 331517, 331501',
        pincodeVillages: [
            { pincode: '331502', villages: 'छापर' },
            { pincode: '331517', villages: 'सांडवा' },
            { pincode: '331501', villages: 'बीदासर' }
        ],
        unserviceableNotice: 'इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा छापर, सांडवा, बीदासर के लिए उपलब्ध है',
        faqs: []
    });

    const getVillageList = () => {
        if (!config.serviceableVillages) return ['छापर', 'सांडवा', 'बीदासर'];
        return config.serviceableVillages.split(',').map(v => v.trim()).filter(Boolean);
    };

    const handleAddVillage = (villageName) => {
        const trimmed = (villageName || newVillageInput).trim();
        if (!trimmed) return;
        const currentList = getVillageList();
        if (!currentList.includes(trimmed)) {
            const updatedList = [...currentList, trimmed];
            const updatedStr = updatedList.join(', ');
            setConfig(prev => ({
                ...prev,
                serviceableVillages: updatedStr,
                unserviceableNotice: `इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा ${updatedStr} के लिए उपलब्ध है`
            }));
            setNewVillageInput('');
            toast.success(`गाँव "${trimmed}" जोड़ा गया!`);
        }
    };

    const handleRemoveVillage = (villageToRemove) => {
        const currentList = getVillageList();
        const updatedList = currentList.filter(v => v !== villageToRemove);
        const updatedStr = updatedList.join(', ');
        setConfig(prev => ({
            ...prev,
            serviceableVillages: updatedStr,
            unserviceableNotice: `इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा ${updatedStr} के लिए उपलब्ध है`
        }));
        toast.success(`गाँव "${villageToRemove}" हटाया गया`);
    };

    const handleSyncNoticeWithVillages = () => {
        const currentList = getVillageList();
        const updatedStr = currentList.join(', ');
        setConfig(prev => ({
            ...prev,
            unserviceableNotice: `इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा ${updatedStr} के लिए उपलब्ध है`
        }));
        toast.success("चेतावनी सूचना अपडेट हो गई!");
    };

    const handleUpdatePincode = (index, value) => {
        const updated = [...(config.pincodeVillages || [])];
        updated[index] = { ...updated[index], pincode: value.trim() };
        setConfig(prev => ({ ...prev, pincodeVillages: updated }));
    };

    const handleUpdateVillagesForPin = (index, value) => {
        const updated = [...(config.pincodeVillages || [])];
        updated[index] = { ...updated[index], villages: value };
        setConfig(prev => ({ ...prev, pincodeVillages: updated }));
    };

    const handleRemovePincodeMapping = (index) => {
        const updated = (config.pincodeVillages || []).filter((_, i) => i !== index);
        setConfig(prev => ({ ...prev, pincodeVillages: updated }));
        toast.success("Mapping removed");
    };

    const handleAddPincodeMapping = () => {
        if (!newPincode.trim() || !newPinVillages.trim()) {
            toast.error("Please enter both PIN Code and Village names");
            return;
        }
        const updated = [...(config.pincodeVillages || []), { pincode: newPincode.trim(), villages: newPinVillages.trim() }];
        const currentPins = (config.acceptedPincodes || '').split(',').map(p => p.trim()).filter(Boolean);
        if (!currentPins.includes(newPincode.trim())) {
            currentPins.push(newPincode.trim());
        }
        setConfig(prev => ({
            ...prev,
            pincodeVillages: updated,
            acceptedPincodes: currentPins.join(', ')
        }));
        setNewPincode('');
        setNewPinVillages('');
        toast.success(`PIN ${newPincode} mapped to ${newPinVillages}`);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.pharmacy_config) {
                setConfig({
                    pincodeVillages: [
                        { pincode: '331502', villages: 'छापर' },
                        { pincode: '331517', villages: 'सांडवा' },
                        { pincode: '331501', villages: 'बीदासर' }
                    ],
                    ...res.data.pharmacy_config
                });
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

                {/* Serviceable Area Settings */}
                <div className="settings-card glass-card">
                    <div className="card-header">
                        <MapPin size={20} color="#e53e3e" />
                        <h3>Serviceable Area Settings</h3>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <label>Accepted Pin Code(s)</label>
                            <input 
                                type="text" 
                                value={config.acceptedPincodes || ''} 
                                onChange={(e) => setConfig({...config, acceptedPincodes: e.target.value})}
                                placeholder="e.g. 110001, 110002"
                            />
                            <small>Comma-separated list of pin codes to accept orders from. Leave blank to accept all.</small>
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

                {/* Service Area, Villages & Unserviceable Notice (Admin Configurable) */}
                <div className="settings-card glass-card full-width" style={{ marginTop: '20px' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={20} color="#3182ce" />
                            <div>
                                <h3 style={{ margin: 0 }}>Service Area & Village Customization (सेवा क्षेत्र व गाँव प्रबंधन)</h3>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                    Manage delivery villages (छापर, सांडवा, बीदासर), accepted PIN codes, and automatic fallback warning notices.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        {/* 1. Serviceable Villages Tag Manager */}
                        <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                                    Active Serviceable Villages (सक्रिय सेवा योग्य गाँव / कस्बे)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSyncNoticeWithVillages}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '5px 10px',
                                        background: '#ecfdf5',
                                        color: '#059669',
                                        border: '1px solid #a7f3d0',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                    title="Click to automatically update the warning notice with current villages"
                                >
                                    <RefreshCw size={12} /> Sync with Warning Notice
                                </button>
                            </div>

                            {/* Active Village Badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {getVillageList().map((village, idx) => (
                                    <span 
                                        key={idx}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            background: '#3b82f6',
                                            color: '#ffffff',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)'
                                        }}
                                    >
                                        <MapPin size={12} /> {village}
                                        <X 
                                            size={14} 
                                            style={{ cursor: 'pointer', opacity: 0.8 }} 
                                            onClick={() => handleRemoveVillage(village)}
                                            title={`Remove ${village}`}
                                        />
                                    </span>
                                ))}
                            </div>

                            {/* Add New Village Inline Form */}
                            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
                                <input 
                                    type="text" 
                                    value={newVillageInput} 
                                    onChange={(e) => setNewVillageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddVillage();
                                        }
                                    }}
                                    placeholder="गाँव का नाम लिखें (e.g. सुजानगढ़, छापर)..."
                                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddVillage()}
                                    style={{
                                        padding: '8px 14px',
                                        background: '#2563eb',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Plus size={14} /> जोड़ें (Add)
                                </button>
                            </div>
                            <small style={{ color: '#64748b', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                                You can also edit the raw comma-separated list below.
                            </small>
                        </div>

                        {/* Raw Comma Separated Villages */}
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <label>Serviceable Villages (Comma Separated)</label>
                            <input 
                                type="text" 
                                value={config.serviceableVillages || ''} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setConfig({
                                        ...config, 
                                        serviceableVillages: val,
                                        unserviceableNotice: `इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा ${val} के लिए उपलब्ध है`
                                    });
                                }}
                                placeholder="छापर, सांडवा, बीदासर"
                            />
                            <small>Enter all active villages/cities separated by commas.</small>
                        </div>

                        {/* Accepted PIN Codes */}
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <label>Accepted Pin Codes (स्वीकृत पिन कोड - Comma Separated)</label>
                            <input 
                                type="text" 
                                value={config.acceptedPincodes || ''} 
                                onChange={(e) => setConfig({...config, acceptedPincodes: e.target.value})}
                                placeholder="e.g. 331502, 331517, 331501"
                            />
                            <small>Leave empty to allow all locations, or restrict to active delivery zones (e.g. 331502 for Chhapar, 331517 for Sandwa, 331501 for Bidasar).</small>
                        </div>

                        {/* Dynamic Warning Notice */}
                        <div className="input-group" style={{ marginBottom: '16px' }}>
                            <label>Dynamic Unserviceable Warning Notice (Hindi / Local Text)</label>
                            <textarea 
                                rows={2}
                                value={config.unserviceableNotice || ''} 
                                onChange={(e) => setConfig({...config, unserviceableNotice: e.target.value})}
                                placeholder="इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा छापर, सांडवा, बीदासर के लिए उपलब्ध है"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                            />
                            <small>This exact warning text is rendered in real time if the customer's delivery area is outside coverage.</small>
                        </div>

                        {/* 2-LEVEL CHECK: Dynamic PIN Code -> Villages Dropdown Mapping */}
                        <div style={{ marginTop: '20px', marginBottom: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontWeight: '700', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={16} color="#15803d" />
                                    2-Level Check: PIN Code ➔ Village/City Dropdown Mappings (पिन कोड अनुसार गाँव/शहर ड्रॉपडाउन)
                                </label>
                                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#15803d' }}>
                                    When patient enters a serviceable PIN code, the system will dynamically show a dropdown containing these specific villages/cities for that PIN.
                                </p>
                            </div>

                            {/* Table of PIN to Village Mappings */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                                {(config.pincodeVillages || []).map((mapping, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                        <div style={{ width: '130px' }}>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '2px' }}>PIN Code</span>
                                            <input 
                                                type="text" 
                                                value={mapping.pincode} 
                                                onChange={(e) => handleUpdatePincode(idx, e.target.value)}
                                                placeholder="331502"
                                                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', fontWeight: '700', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '2px' }}>Villages / Cities in this PIN (Dropdown options - Comma Separated)</span>
                                            <input 
                                                type="text" 
                                                value={mapping.villages} 
                                                onChange={(e) => handleUpdateVillagesForPin(idx, e.target.value)}
                                                placeholder="e.g. छापर, रामपुरा"
                                                style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePincodeMapping(idx)}
                                            style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '8px', borderRadius: '6px', cursor: 'pointer', marginTop: '16px' }}
                                            title="Delete this PIN mapping"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New PIN -> Villages Mapping Row */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px dashed #86efac' }}>
                                <div style={{ width: '130px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>New PIN Code</label>
                                    <input 
                                        type="text" 
                                        value={newPincode} 
                                        onChange={(e) => setNewPincode(e.target.value)}
                                        placeholder="e.g. 331502"
                                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'block', marginBottom: '4px' }}>Villages (Comma Separated)</label>
                                    <input 
                                        type="text" 
                                        value={newPinVillages} 
                                        onChange={(e) => setNewPinVillages(e.target.value)}
                                        placeholder="e.g. छापर, रामपुर"
                                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddPincodeMapping}
                                    style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', height: '34px' }}
                                >
                                    <Plus size={14} /> Add PIN Mapping
                                </button>
                            </div>
                        </div>

                        {/* Live Warning Preview for Admin */}
                        <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <AlertTriangle size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div>
                                <strong style={{ fontSize: '12px', color: '#92400e', display: 'block' }}>Customer Screen Live Preview (ग्राहक को दिखने वाली चेतावनी):</strong>
                                <span style={{ fontSize: '12px', color: '#b45309' }}>
                                    {config.unserviceableNotice || `इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा ${config.serviceableVillages || 'छापर, सांडवा, बीदासर'} के लिए उपलब्ध है`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Configurable Payment Methods */}
                <div className="settings-card glass-card full-width" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <Percent size={20} color="#16a34a" />
                        <h3>Payment Methods Availability</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input 
                                    type="checkbox" 
                                    checked={config.allowOnlinePayment !== false} 
                                    onChange={(e) => setConfig({...config, allowOnlinePayment: e.target.checked})}
                                />
                                Allow Online Payment (UPI / Cards)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input 
                                    type="checkbox" 
                                    checked={config.allowWalletPayment !== false} 
                                    onChange={(e) => setConfig({...config, allowWalletPayment: e.target.checked})}
                                />
                                Allow Dharmarth Wallet
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input 
                                    type="checkbox" 
                                    checked={config.allowPartnerCod !== false} 
                                    onChange={(e) => setConfig({...config, allowPartnerCod: e.target.checked})}
                                />
                                Allow Partner Cash-on-Delivery (COD)
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacySettings;
