import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, Eye, Package, Truck, Search, User, Phone, Calendar, AlertCircle, Trash2, Plus, Edit2, Lock } from 'lucide-react';
import { useConfirm } from '../../context/ConfirmContext';
import './AdminPrescriptions.css';

const AdminPrescriptions = () => {
    const { showAlert } = useConfirm();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState('');
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState(null);
    const [verifiedItems, setVerifiedItems] = useState([{ medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '' }]);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    useEffect(() => {
        if (selected) {
            if (selected.status === 'Verified' || selected.status === 'Ordered') {
                setIsReadOnly(true);
                setNote(selected.adminNote || '');
                if (selected.verifiedItems && selected.verifiedItems.length > 0) {
                    setVerifiedItems(selected.verifiedItems.map(i => ({...i, price: i.price || ''})));
                } else {
                    setVerifiedItems([{ medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '' }]);
                }
            } else {
                setIsReadOnly(false);
                setNote('');
                setVerifiedItems([{ medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '' }]);
            }
        }
        setErrors([]);
    }, [selected]);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/prescriptions?limit=50');
            setPrescriptions(res.data.prescriptions || res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setVerifiedItems([...verifiedItems, { medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = verifiedItems.filter((_, i) => i !== index);
        setVerifiedItems(newItems.length ? newItems : [{ medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...verifiedItems];
        newItems[index][field] = value;
        setVerifiedItems(newItems);
        // Clear error if they start typing
        if (errors.includes(index)) {
            setErrors(errors.filter(e => e !== index));
        }
    };

    const handleVerify = async (status) => {
        if (status === 'Verified') {
            const newErrors = [];
            verifiedItems.forEach((item, index) => {
                if (!item.frequency || !item.time || !item.foodRelation || !item.intakeMethod || !item.medicineName || !item.quantity || item.price === '' || item.price === null || item.price === undefined) {
                    newErrors.push(index);
                }
            });
            if (newErrors.length > 0) {
                setErrors(newErrors);
                return;
            }
        }
        setErrors([]);
        try {
            await api.patch(`/prescriptions/${selected._id}/verify`, {
                status,
                verifiedItems: status === 'Verified' ? verifiedItems : [],
                adminNote: note
            });
            setSelected(null);
            setVerifiedItems([{ medicineName: '', frequency: '', time: '', foodRelation: '', intakeMethod: '', quantity: 1, price: '' }]);
            setNote('');
            fetchPrescriptions();
        } catch (err) {
            showAlert(err.response?.data?.message || 'Verification failed');
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
                        <span className="lbl">To Review</span>
                    </div>
                </div>
            </header>

            <div className="admin-flex-container">
                {/* List Column */}
                <aside className="queue-sidebar">
                    <div className="sidebar-header">
                        <Search size={16} />
                        <input type="text" placeholder="Search customer..." />
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
                        ) : (
                            prescriptions.map(p => (
                                <div key={p._id} className={`queue-card ${selected?._id === p._id ? 'active' : ''}`} onClick={() => setSelected(p)}>
                                    <div className="thumb">
                                        <img src={p.image} alt="Presc" />
                                    </div>
                                    <div className="meta">
                                        <h4>{p.user?.name || 'Guest User'}</h4>
                                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                        <div style={{fontSize: '0.75rem', marginTop:'4px', color: p.status==='Pending'?'#eab308' : '#10b981'}}>
                                            {p.status}
                                        </div>
                                    </div>
                                    <Eye size={16} className="hov-icon" />
                                </div>
                            ))
                        )}
                    </div>
                </aside>

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
                                        <h3>{selected.user?.name}</h3>
                                        <div className="user-sub">
                                            <span><Phone size={12} /> {selected.user?.mobile}</span>
                                            <span className="sep">•</span>
                                            <span><Calendar size={12} /> {new Date(selected.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-close-p" onClick={() => setSelected(null)}>✕</button>
                            </div>

                            <div className="master-grid">
                                {/* Left: Prescription Image */}
                                <div className="image-view-pane">
                                    <div className="img-wrapper" onClick={() => setImageModalSrc(selected.image)}>
                                        <img src={selected.image} alt="Full Prescription" />
                                        <div className="zoom-overlay">
                                            <Search size={24} />
                                            <span>Click to Zoom</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Verification Form */}
                                <div className="form-view-pane">
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
                                                        <div className="input-group-p name" style={{flex: 1}}>
                                                            <label>Medicine Name</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.medicineName}
                                                                onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                                                                placeholder="e.g. Paracetamol 500mg"
                                                                disabled={isReadOnly}
                                                                style={{ borderColor: errors.includes(index) && !item.medicineName ? '#ef4444' : undefined }}
                                                            />
                                                        </div>
                                                        <div className="input-group-p qty" style={{width: '80px'}}>
                                                            <label>Qty</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                min="1"
                                                                disabled={isReadOnly}
                                                                style={{ borderColor: errors.includes(index) && (!item.quantity) ? '#ef4444' : undefined }}
                                                            />
                                                        </div>
                                                        <div className="input-group-p price" style={{width: '100px'}}>
                                                            <label>Price (₹)</label>
                                                            <input 
                                                                type="number" 
                                                                value={item.price}
                                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
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
                                                        {errors.includes(index) && (
                                                            <div style={{width: '100%', color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: '500'}}>
                                                                * Please complete all medicine details and dosage instructions.
                                                            </div>
                                                        )}
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
                                        <div className="action-footer">
                                            <button className="btn-reject-p" onClick={() => handleVerify('Rejected')}>
                                                <X size={18} /> Reject
                                            </button>
                                            <button className="btn-approve-p" onClick={() => handleVerify('Verified')}>
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
