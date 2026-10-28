import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Check, X, Eye, Package, Truck, Search, User, Phone, Calendar, AlertCircle, Trash2, Plus, Edit2, Lock, Share2, Stethoscope } from 'lucide-react';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import './AdminPrescriptions.css';

const AdminPrescriptions = () => {
    const { showAlert } = useConfirm();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState('');
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState(null);
    const defaultItem = { medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '', isAvailable: true, margPack: 0, margBatch: '', margExpiry: '', margBillNo: '', batches: [] };
    const [verifiedItems, setVerifiedItems] = useState([{ ...defaultItem }]);
    const [errors, setErrors] = useState([]);
    const [searchingIndex, setSearchingIndex] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [statusFilter, setStatusFilter] = useState('Pending'); // 'Pending', 'Verified', 'All'
    const [customerSearch, setCustomerSearch] = useState('');
    const searchTimeoutRef = useRef(null);

    const handleCopyLink = (prescriptionId) => {
        const url = `${window.location.origin}/checkout/${prescriptionId}`;
        navigator.clipboard.writeText(url);
        toast.success('Checkout Link Copied!');
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [statusFilter]);

    useEffect(() => {
        if (selected) {
            if (selected.status === 'Verified' || selected.status === 'Ordered') {
                setIsReadOnly(true);
                setNote(selected.adminNote || '');
                if (selected.verifiedItems && selected.verifiedItems.length > 0) {
                    setVerifiedItems(selected.verifiedItems.map(i => ({
                        ...defaultItem, 
                        ...i, 
                        price: i.price || '',
                        isManualAllowed: !i.margPID
                    })));
                } else {
                    setVerifiedItems([{ ...defaultItem }]);
                }
            } else if (selected.status === 'Doctor Approval Pending') {
                setIsReadOnly(true);
                setNote(selected.adminNote || 'Doctor permission requested. Awaiting decision on Doctor Dashboard.');
                if (selected.verifiedItems && selected.verifiedItems.length > 0) {
                    setVerifiedItems(selected.verifiedItems.map(i => ({
                        ...defaultItem, 
                        ...i, 
                        price: i.price || '',
                        isManualAllowed: !i.margPID
                    })));
                } else {
                    setVerifiedItems([{ ...defaultItem }]);
                }
            } else {
                setIsReadOnly(false);
                setNote('');
                setVerifiedItems([{ ...defaultItem }]);
            }
        }
        setErrors([]);
    }, [selected]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/prescriptions?limit=100&status=${statusFilter}`);
            const allPrescriptions = res.data.prescriptions || res.data;
            // Filter out 'Ordered' as they have moved to the Order Management system
            const activeQueue = allPrescriptions.filter(p => p.status !== 'Ordered');
            
            // Check if new pending prescriptions arrived to trigger audible screen alarm
            if (activeQueue.length > prescriptions.length && statusFilter === 'Pending') {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High A pitch
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.8);
                } catch (e) {
                    console.log('Audio alert blocked by browser policy until user interacts');
                }
            }

            setPrescriptions(activeQueue);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setVerifiedItems([...verifiedItems, { ...defaultItem }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = verifiedItems.filter((_, i) => i !== index);
        setVerifiedItems(newItems.length ? newItems : [{ ...defaultItem }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...verifiedItems];
        newItems[index][field] = value;
        setVerifiedItems(newItems);
        // Clear error if they start typing
        if (errors.includes(index)) {
            setErrors(errors.filter(e => e !== index));
        }

        // Handle Medicine Name Search
        if (field === 'medicineName') {
            newItems[index].margPID = undefined;
            newItems[index].batches = [];
            newItems[index].margBatch = '';
            newItems[index].margExpiry = '';
            newItems[index].isManualAllowed = false;

            if (value.length > 2) {
                searchMargProducts(index, value);
            } else {
                setSuggestions([]);
                setSearchingIndex(null);
            }
        }
    };

    const searchMargProducts = (index, query) => {
        setSearchingIndex(index);
        setIsSearching(true);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/marg/search-products?search=${query}`);
                const products = res.data.products || [];
                setSuggestions(products);
                
                if (products.length === 0) {
                    setVerifiedItems(prev => {
                        const updated = [...prev];
                        if (updated[index]) {
                            updated[index].isManualAllowed = true;
                        }
                        return updated;
                    });
                }
            } catch (err) {
                console.error("MARG Search failed", err);
                setVerifiedItems(prev => {
                    const updated = [...prev];
                    if (updated[index]) {
                        updated[index].isManualAllowed = true;
                    }
                    return updated;
                });
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleSelectProduct = (index, product) => {
        const newItems = [...verifiedItems];
        newItems[index] = {
            ...newItems[index],
            medicineName: product.Name,
            price: product.mrp || product.rateA || 0,
            fulfillmentStatus: product.totalStock > 0 ? 'In Stock' : 'Shortlisted',
            margPID: product.PID,
            margPack: product.Pack || 0,
            batches: product.stocks || []
        };
        
        if (product.stocks && product.stocks.length > 0) {
            newItems[index].margBatch = product.stocks[0].Batch || '';
            if (product.stocks[0].Expiry) {
                newItems[index].margExpiry = new Date(product.stocks[0].Expiry).toISOString().split('T')[0] || '';
            }
            newItems[index].price = product.stocks[0].MRP || product.stocks[0].RateA || newItems[index].price;
        }

        setVerifiedItems(newItems);
        setSuggestions([]);
        setSearchingIndex(null);
        toast.success(`Selected: ${product.Name}`);
    };

    const handleVerify = async (status) => {
        if (status === 'Verified') {
            const newErrors = [];
            verifiedItems.forEach((item, index) => {
                if (!item.medicineName || !item.quantity || item.price === '' || item.price === null || item.price === undefined) {
                    newErrors.push(index);
                }
            });
            if (newErrors.length > 0) {
                setErrors(newErrors);
                toast.error("Please fill medicine name, quantity, and price for all items.");
                return;
            }
        } else if (status === 'Doctor Approval Pending') {
            const hasAnyItem = verifiedItems.some(i => i.medicineName && i.medicineName.trim() !== '');
            if (hasAnyItem) {
                const newErrors = [];
                verifiedItems.forEach((item, index) => {
                    if (item.medicineName && (!item.quantity || item.price === '' || item.price === null || item.price === undefined)) {
                        newErrors.push(index);
                    }
                });
                if (newErrors.length > 0) {
                    setErrors(newErrors);
                    toast.error("Please fill quantity and price for entered medicines.");
                    return;
                }
            }
        }
        setErrors([]);
        try {
            await api.patch(`/prescriptions/${selected._id}/verify`, {
                status,
                verifiedItems: (status === 'Verified' || status === 'Doctor Approval Pending') ? verifiedItems : [],
                adminNote: note,
                requiresDoctorConsultation: status === 'Doctor Approval Pending'
            });
            toast.success(
                status === 'Doctor Approval Pending'
                    ? "Consultation ticket sent to Doctor Dashboard!"
                    : (status === 'Verified' ? "Prescription verified & User notified!" : "Prescription marked as Rejected")
            );
            setSelected(null);
            setVerifiedItems([{ ...defaultItem }]);
            setNote('');
            fetchPrescriptions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="admin-prescriptions-premium">
            <header className="page-header-admin">
                <div className="title-area">
                    <h1>Prescription Verification</h1>
                    <p>Review medical uploads and confirm stock availability</p>
                </div>
                <div className="stats-pills">
                    <div className="stat-pill">
                        <span className="count">{prescriptions.length}</span>
                        <span className="lbl">{statusFilter} Queue</span>
                    </div>
                </div>
            </header>

            <div className="admin-flex-container">
                {/* List Column */}
                <aside className="queue-sidebar">
                    <div className="sidebar-header">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search customer..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="status-tabs-container">
                        {[
                            { label: 'Pending', value: 'Pending' },
                            { label: 'Doctor Pending', value: 'Doctor Approval Pending' },
                            { label: 'Verified', value: 'Verified' },
                            { label: 'All', value: 'All' }
                        ].map(tab => (
                            <button
                                key={tab.value}
                                className={`status-tab ${statusFilter === tab.value ? 'active' : ''}`}
                                onClick={() => setStatusFilter(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="queue-list">
                        {loading ? (
                            <div className="side-loading">
                                <div className="dot-spin"></div>
                            </div>
                        ) : prescriptions.length === 0 ? (
                            <div className="empty-sidebar">
                                <Check size={40} color="#cbd5e0" />
                                <p>All caught up!</p>
                            </div>
                        ) : (() => {
                            const filteredPrescriptions = prescriptions.filter(p => {
                                if (!customerSearch.trim()) return true;
                                const q = customerSearch.toLowerCase().trim();
                                const customerName = (p.user?.name || p.guestName || '').toLowerCase();
                                const customerMobile = (p.user?.mobile || p.guestMobile || '').toLowerCase();
                                const id = (p._id || '').toLowerCase();
                                return customerName.includes(q) || customerMobile.includes(q) || id.includes(q);
                            });

                            if (filteredPrescriptions.length === 0) {
                                return (
                                    <div className="empty-sidebar">
                                        <AlertCircle size={32} color="#94a3b8" />
                                        <p style={{ marginTop: '8px' }}>No matches found</p>
                                    </div>
                                );
                            }

                            return filteredPrescriptions.map(p => (
                                <div key={p._id} className={`queue-card ${selected?._id === p._id ? 'active' : ''}`} onClick={() => setSelected(p)}>
                                    <div className="thumb">
                                        {p.image ? (
                                            <img src={p.image} alt="Presc" />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#eff6ff' }}>
                                                <Package size={20} color="#2563eb" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="meta">
                                        <h4>{p.user?.name || p.guestName || 'Guest User'}</h4>
                                        {p.orderSource === 'Created by Medical/Admin' && (
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#1d4ed8',
                                                backgroundColor: '#eff6ff',
                                                padding: '1px 6px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                width: 'fit-content',
                                                marginBottom: '3px'
                                            }}>
                                                Created by Medical/Admin
                                            </div>
                                        )}
                                        <span>{new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        <div style={{
                                            fontSize: '0.75rem', 
                                            marginTop: '4px', 
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            color: p.status === 'Pending' 
                                                ? '#eab308' 
                                                : (p.status === 'Doctor Approval Pending' ? '#7c3aed' : (p.status === 'Rejected' ? '#ef4444' : '#10b981'))
                                        }}>
                                            {p.status === 'Doctor Approval Pending' && <Stethoscope size={12} />}
                                            {p.status}
                                        </div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-icon view" onClick={() => setSelected(p)}><Eye size={18} /></button>
                                        {p.status === 'Verified' && (
                                            <button 
                                                className="btn-icon share" 
                                                onClick={(e) => { e.stopPropagation(); handleCopyLink(p._id); }}
                                                title="Copy Payment Link"
                                                style={{ color: '#10b981' }}
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </aside>
                <div className="admin-v-divider"></div>
                {/* Verification Desktop */}
                <main className="verification-master">
                    {selected ? (
                        <div className="master-inner glass-card-admin">
                            <div className="master-header">
                                <div className="user-short">
                                    <div className="user-avatar">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3>{selected.user?.name || selected.guestName || 'Guest User'}</h3>
                                        <div className="user-sub">
                                            <span><Phone size={12} /> {selected.user?.mobile || selected.guestMobile}</span>
                                            <span className="sep">•</span>
                                            <span><Calendar size={12} /> {new Date(selected.createdAt).toLocaleString()}</span>
                                            {selected.orderSource === 'Created by Medical/Admin' && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: '#1d4ed8',
                                                    backgroundColor: '#eff6ff',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontWeight: '600',
                                                    marginLeft: '10px',
                                                    display: 'inline-block'
                                                }}>
                                                    Created by Medical/Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-close-p" onClick={() => setSelected(null)}>✕</button>
                            </div>

                            <div className="master-grid">
                                {/* Right: Verification Form */}
                                <div className="form-view-pane">
                                    {/* Doctor Approval Pending Banner */}
                                    {selected.status === 'Doctor Approval Pending' && (
                                        <div style={{
                                            background: '#f5f3ff',
                                            border: '1.5px solid #c4b5fd',
                                            borderRadius: '12px',
                                            padding: '14px 18px',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Stethoscope size={24} color="#7c3aed" />
                                                <div>
                                                    <strong style={{ color: '#5b21b6', fontSize: '14px', display: 'block' }}>
                                                        Doctor Permission Requested (चिकित्सक परामर्श लंबित)
                                                    </strong>
                                                    <span style={{ fontSize: '12px', color: '#6d28d9' }}>
                                                        {selected.adminNote || 'This prescription has been sent to the Doctor Dashboard for clinical review and approval.'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{
                                                background: '#7c3aed',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                Dr. Consultation Pending
                                            </span>
                                        </div>
                                    )}

                                    {/* Prescription Image at Top */}
                                    {selected.image ? (
                                        <div className="image-view-pane" style={{ padding: '0 0 30px 0', background: 'none' }}>
                                            <div className="img-wrapper" onClick={() => setImageModalSrc(selected.image)} style={{ maxWidth: '400px', margin: '0 auto' }}>
                                                <img src={selected.image} alt="Full Prescription" />
                                                <div className="zoom-overlay">
                                                    <Search size={24} />
                                                    <span>Click to Zoom</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                                            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                                            <p>No prescription image uploaded. Manually generated order.</p>
                                        </div>
                                    )}

                                    {(selected.notes || (selected.faqAnswers && selected.faqAnswers.length > 0) || selected.needAllMedicines || selected.courseDays) && (
                                        <section className="form-section" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                                            <div className="sec-title" style={{ marginBottom: '10px' }}>
                                                <AlertCircle size={18} color="#3b82f6" />
                                                <h4 style={{ color: '#1e293b', margin: 0 }}>Patient Information & Order Preferences</h4>
                                            </div>

                                            {/* Order Preferences (दवाई चयन & कोर्स अवधि) */}
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '220px' }}>
                                                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>पर्ची की दवाई का चयन (Preference):</div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: selected.needAllMedicines === 'PARTIAL' ? '#d97706' : '#2563eb' }}>
                                                        {selected.needAllMedicines === 'PARTIAL'
                                                            ? '⚠️ कुछ दवाई चाहिए (Notes में लिखे अनुसार)'
                                                            : '✓ पर्ची की सभी दवाई चाहिए (All Medicines)'}
                                                    </div>
                                                </div>
                                                {selected.courseDays && (
                                                    <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '160px' }}>
                                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>कोर्स की अवधि (Course Duration):</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: '#059669' }}>
                                                            {selected.courseDays} दिन का कोर्स
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {selected.faqAnswers && selected.faqAnswers.length > 0 && (
                                                <div style={{ marginBottom: selected.notes ? '15px' : '0' }}>
                                                    {selected.faqAnswers.map((faq, idx) => (
                                                        <div key={idx} style={{ marginBottom: '8px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Q: {faq.question}</div>
                                                            <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '2px' }}>A: {faq.answer}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {selected.notes && (
                                                <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Additional Notes:</div>
                                                    <div style={{ fontSize: '14px', color: '#0f172a', whiteSpace: 'pre-wrap' }}>{selected.notes}</div>
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    <section className="form-section">
                                        <div className="sec-title" style={{justifyContent: 'space-between'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                <Package size={18} />
                                                <h4>Identified Medicines {isReadOnly && <span style={{fontSize:'0.8rem', background:'#e2e8f0', padding:'2px 8px', borderRadius:'10px', marginLeft:'10px'}}><Lock size={12}/> Locked</span>}</h4>
                                            </div>
                                            {isReadOnly && (
                                                <button onClick={() => setIsReadOnly(false)} style={{background:'none', border:'1px solid #cbd5e0', padding:'4px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center'}}>
                                                    <Edit2 size={14}/> Edit
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="medicines-editor">
                                            {verifiedItems.map((item, index) => (
                                                <div key={index} className="medicine-row-premium" style={{flexDirection: 'column', gap: '15px'}}>
                                                    <div style={{display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-end'}}>
                                                        <div className="input-group-p name" style={{flex: 1, position: 'relative'}}>
                                                            <label>Medicine Name</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.medicineName}
                                                                onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                                                                placeholder="Search MARG ERP..."
                                                                disabled={isReadOnly}
                                                                autoComplete="off"
                                                                style={{ borderColor: errors.includes(index) && !item.medicineName ? '#ef4444' : undefined }}
                                                            />
                                                            {searchingIndex === index && (suggestions.length > 0 || isSearching) && (
                                                                <div className="marg-suggestions-dropdown">
                                                                    {isSearching && <div className="suggestion-loading">Searching MARG...</div>}
                                                                    {suggestions.map((p) => (
                                                                        <div 
                                                                            key={p.PID} 
                                                                            className="suggestion-item"
                                                                            onClick={() => handleSelectProduct(index, p)}
                                                                        >
                                                                            <div className="s-info">
                                                                                <span className="s-name">{p.Name}</span>
                                                                                <span className="s-meta">{p.Unit} | {p.Pack} Pack</span>
                                                                            </div>
                                                                            <div className="s-pricing">
                                                                                <span className="s-price">₹{p.mrp || p.rateA || 0}</span>
                                                                                <span className={`s-stock ${p.totalStock > 0 ? 'in' : 'out'}`}>
                                                                                    {p.totalStock > 0 ? `${p.totalStock} in stock` : 'Out of Stock'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {!isSearching && suggestions.length === 0 && (
                                                                        <div className="suggestion-item no-match" style={{ padding: '12px', textAlign: 'center', color: '#ea580c', fontWeight: '600', cursor: 'pointer' }} onClick={() => {
                                                                            const newItems = [...verifiedItems];
                                                                            newItems[index].isManualAllowed = true;
                                                                            setVerifiedItems(newItems);
                                                                            setSuggestions([]);
                                                                            setSearchingIndex(null);
                                                                            toast.success("Manual entry unlocked for this item!");
                                                                        }}>
                                                                            ⚠️ No MARG products found. Click here to allow manual entry.
                                                                        </div>
                                                                    )}
                                                                    {!isSearching && suggestions.length > 0 && (
                                                                        <div className="suggestion-item custom-fallback" style={{ borderTop: '1px dashed #cbd5e1', padding: '10px', textAlign: 'center', color: '#3b82f6', fontWeight: '600', cursor: 'pointer' }} onClick={() => {
                                                                            const newItems = [...verifiedItems];
                                                                            newItems[index].isManualAllowed = true;
                                                                            setVerifiedItems(newItems);
                                                                            setSuggestions([]);
                                                                            setSearchingIndex(null);
                                                                            toast.success("Manual entry unlocked for this item!");
                                                                        }}>
                                                                            ➕ Not in list? Force unlock manual entry
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="input-group-p qty" style={{width: '70px', position: 'relative'}}>
                                                            <label>Qty (Tabs)</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                onWheel={(e) => e.target.blur()}
                                                                min="1"
                                                                disabled={isReadOnly}
                                                                style={{ borderColor: errors.includes(index) && (!item.quantity) ? '#ef4444' : undefined }}
                                                            />
                                                            {item.margPack > 1 && item.quantity > 0 && (
                                                                <div style={{ position: 'absolute', top: '100%', left: '0', fontSize: '0.65rem', color: '#10b981', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: '600' }}>
                                                                    {Math.floor(item.quantity / item.margPack)} Strip, {item.quantity % item.margPack} Tab
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="input-group-p status" style={{width: '120px'}}>
                                                            <label>Fulfillment</label>
                                                            <select 
                                                                value={item.fulfillmentStatus || 'In Stock'} 
                                                                onChange={(e) => handleItemChange(index, 'fulfillmentStatus', e.target.value)}
                                                                disabled={isReadOnly}
                                                                style={{padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%'}}
                                                            >
                                                                <option value="In Stock">In Stock (Pack)</option>
                                                                <option value="Shortlisted">Shortlist (Wait)</option>
                                                            </select>
                                                        </div>
                                                        {item.fulfillmentStatus === 'Shortlisted' && (
                                                            <div className="input-group-p eta" style={{width: '80px'}}>
                                                                <label>Days</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={item.estimatedArrivalDays || ''}
                                                                    onChange={(e) => handleItemChange(index, 'estimatedArrivalDays', e.target.value)}
                                                                    onWheel={(e) => e.target.blur()}
                                                                    placeholder="ETA"
                                                                    min="1"
                                                                    disabled={isReadOnly}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="input-group-p price" style={{width: '90px'}}>
                                                            <label>Price (₹)</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.price}
                                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                                onWheel={(e) => e.target.blur()}
                                                                placeholder="Auto"
                                                                min="0"
                                                                disabled={isReadOnly}
                                                                style={{ borderColor: errors.includes(index) && (item.price === '' || item.price === null || item.price === undefined) ? '#ef4444' : undefined }}
                                                            />
                                                        </div>
                                                        {!isReadOnly && (
                                                            <button className="btn-remove" style={{padding: '10px'}} onClick={() => handleRemoveItem(index)}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: errors.includes(index) ? '1px solid #ef4444' : 'none'}}>
                                                        {/*
                                                        <div className="input-group-p" style={{flex: 1, minWidth: '120px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Frequency</label>
                                                            <select value={item.frequency || ''} onChange={(e) => handleItemChange(index, 'frequency', e.target.value)} disabled={isReadOnly} style={{padding: '8px', borderRadius: '6px', border: errors.includes(index) && !item.frequency ? '1px solid #ef4444' : '1px solid #cbd5e0', width: '100%'}}>
                                                                <option value="" disabled>Select...</option>
                                                                <option value="once a day">Once a day</option>
                                                                <option value="twice a day">Twice a day</option>
                                                                <option value="thrice a day">Thrice a day</option>
                                                                <option value="four times a day">Four times a day</option>
                                                                <option value="as needed">As needed</option>
                                                            </select>
                                                        </div>
                                                        <div className="input-group-p" style={{flex: 2, minWidth: '220px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Time (Multi-select)</label>
                                                            <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px'}}>
                                                                {['morning', 'afternoon', 'evening', 'night'].map(t => {
                                                                    const isSelected = item.time?.includes(t);
                                                                    return (
                                                                        <button 
                                                                            key={t}
                                                                            type="button"
                                                                            disabled={isReadOnly}
                                                                            onClick={() => {
                                                                                let maxTimes = 1;
                                                                                const freq = item.frequency || 'once a day';
                                                                                if (freq === 'twice a day') maxTimes = 2;
                                                                                else if (freq === 'thrice a day') maxTimes = 3;
                                                                                else if (freq === 'four times a day') maxTimes = 4;
                                                                                else if (freq === 'as needed') maxTimes = 4;

                                                                                let currentTimes = item.time ? item.time.split(',').map(x=>x.trim()).filter(x=>x) : [];
                                                                                
                                                                                if (currentTimes.includes(t)) {
                                                                                    currentTimes = currentTimes.filter(x => x !== t);
                                                                                } else {
                                                                                    if (maxTimes === 1) {
                                                                                        currentTimes = [t]; // Auto-replace for single frequency
                                                                                    } else if (currentTimes.length < maxTimes) {
                                                                                        currentTimes.push(t);
                                                                                    } else {
                                                                                        currentTimes.shift(); // Deselect oldest
                                                                                        currentTimes.push(t);
                                                                                    }
                                                                                }
                                                                                handleItemChange(index, 'time', currentTimes.join(', '));
                                                                            }}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                borderRadius: '12px',
                                                                                border: isSelected ? '1px solid #3b82f6' : (errors.includes(index) && !item.time ? '1px solid #ef4444' : '1px solid #cbd5e0'),
                                                                                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                                                                color: isSelected ? '#1d4ed8' : (errors.includes(index) && !item.time ? '#ef4444' : '#64748b'),
                                                                                fontSize: '0.75rem',
                                                                                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                                                textTransform: 'capitalize',
                                                                                fontWeight: isSelected ? '600' : 'normal'
                                                                            }}
                                                                        >
                                                                            {t}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="input-group-p" style={{flex: 1, minWidth: '120px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Food Relation</label>
                                                            <select value={item.foodRelation || ''} onChange={(e) => handleItemChange(index, 'foodRelation', e.target.value)} disabled={isReadOnly} style={{padding: '8px', borderRadius: '6px', border: errors.includes(index) && !item.foodRelation ? '1px solid #ef4444' : '1px solid #cbd5e0', width: '100%'}}>
                                                                <option value="" disabled>Select...</option>
                                                                <option value="before food">Before food</option>
                                                                <option value="after food">After food</option>
                                                                <option value="empty stomach">Empty stomach</option>
                                                                <option value="with food">With food</option>
                                                            </select>
                                                        </div>
                                                        <div className="input-group-p" style={{flex: 1, minWidth: '100px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Intake Method</label>
                                                            <select value={item.intakeMethod || ''} onChange={(e) => handleItemChange(index, 'intakeMethod', e.target.value)} disabled={isReadOnly} style={{padding: '8px', borderRadius: '6px', border: errors.includes(index) && !item.intakeMethod ? '1px solid #ef4444' : '1px solid #cbd5e0', width: '100%'}}>
                                                                <option value="" disabled>Select...</option>
                                                                <option value="with water">With water</option>
                                                                <option value="with milk">With milk</option>
                                                                <option value="dry">Dry</option>
                                                                <option value="dissolved in water">Dissolve in water</option>
                                                            </select>
                                                        </div>
                                                        */}
                                                        <div className="input-group-p" style={{flex: 1, minWidth: '120px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Batch</label>
                                                            {item.batches && item.batches.length > 0 ? (
                                                                <select 
                                                                    value={item.margBatch || ''} 
                                                                    onChange={(e) => {
                                                                        const b = item.batches.find(x => x.Batch === e.target.value);
                                                                        handleItemChange(index, 'margBatch', e.target.value);
                                                                        if (b && b.Expiry) handleItemChange(index, 'margExpiry', new Date(b.Expiry).toISOString().split('T')[0]);
                                                                        if (b && (b.MRP || b.RateA)) handleItemChange(index, 'price', b.MRP || b.RateA);
                                                                    }} 
                                                                    disabled={isReadOnly} 
                                                                    style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%'}}
                                                                >
                                                                    <option value="">Select...</option>
                                                                    {item.batches.map(b => (
                                                                        <option key={b.Batch} value={b.Batch}>{b.Batch} (Stk: {b.Stock})</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input 
                                                                    type="text" 
                                                                    value={item.margBatch || ''} 
                                                                    onChange={(e) => handleItemChange(index, 'margBatch', e.target.value)} 
                                                                    disabled={isReadOnly || (!item.isManualAllowed)} 
                                                                    style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', backgroundColor: (isReadOnly || (!item.isManualAllowed)) ? '#f1f5f9' : '#ffffff'}} 
                                                                    placeholder={(!item.isManualAllowed && !item.margPID) ? "Search MARG first..." : "Batch No"}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="input-group-p" style={{flex: 1, minWidth: '120px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Expiry</label>
                                                            <input 
                                                                type="month" 
                                                                value={item.margExpiry ? item.margExpiry.substring(0, 7) : ''} 
                                                                onChange={(e) => handleItemChange(index, 'margExpiry', e.target.value)} 
                                                                disabled={isReadOnly || (!item.isManualAllowed && !item.margPID)} 
                                                                style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', backgroundColor: (isReadOnly || (!item.isManualAllowed && !item.margPID)) ? '#f1f5f9' : '#ffffff'}}
                                                            />
                                                        </div>
                                                        <div className="input-group-p" style={{flex: 1, minWidth: '100px'}}>
                                                            <label style={{fontSize: '0.75rem'}}>Bill No (VCN)</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.margBillNo || ''} 
                                                                onChange={(e) => handleItemChange(index, 'margBillNo', e.target.value)} 
                                                                disabled={isReadOnly || (!item.isManualAllowed)} 
                                                                style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', width: '100%', backgroundColor: (isReadOnly || (!item.isManualAllowed)) ? '#f1f5f9' : '#ffffff'}} 
                                                                placeholder={(!item.isManualAllowed && !item.margPID) ? "Search MARG first..." : "Auto/Man"}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                            ))}
                                            {!isReadOnly && (
                                                <button className="btn-add-p" onClick={handleAddItem}>
                                                    <Plus size={16} /> Add another item
                                                </button>
                                            )}
                                        </div>
                                    </section>

                                    <section className="form-section">
                                        <div className="sec-title">
                                            <AlertCircle size={18} />
                                            <h4>Admin Comments</h4>
                                        </div>
                                        <textarea 
                                            className="admin-textarea"
                                            placeholder="Add instructions or reason for rejection..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            disabled={isReadOnly}
                                        ></textarea>
                                    </section>

                                    {!isReadOnly && (
                                        <div className="action-footer" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <button 
                                                type="button" 
                                                className="btn-reject-p" 
                                                onClick={() => handleVerify('Rejected')}
                                                style={{ flex: 1, minWidth: '110px' }}
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn-approve-p" 
                                                onClick={() => handleVerify('Doctor Approval Pending')}
                                                style={{ 
                                                    flex: 1.5, 
                                                    minWidth: '220px', 
                                                    backgroundColor: '#7c3aed', 
                                                    borderColor: '#6d28d9',
                                                    color: '#ffffff',
                                                    boxShadow: '0 8px 16px rgba(124, 58, 237, 0.25)' 
                                                }}
                                            >
                                                <Stethoscope size={18} /> Request Doctor Permission
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn-approve-p" 
                                                onClick={() => handleVerify('Verified')}
                                                style={{ flex: 1.5, minWidth: '190px' }}
                                            >
                                                <Check size={18} /> Approve & notify User
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection-master">
                            <div className="empty-illust">
                                <Search size={64} strokeWidth={1} />
                            </div>
                            <h2>Please Select an Order</h2>
                            <p>Pick a prescription from the left sidebar to start verification.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Image Viewer Modal */}
            {imageModalSrc && (
                <div className="image-viewer-modal-overlay" onClick={() => setImageModalSrc(null)}>
                    <div className="image-viewer-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-viewer" onClick={() => setImageModalSrc(null)}>
                            <X size={24} color="white" />
                        </button>
                        <img src={imageModalSrc} alt="Full Prescription View" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPrescriptions;
