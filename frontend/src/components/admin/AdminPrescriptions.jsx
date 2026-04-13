import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, Eye, Package, Truck, Search, User, Phone, Calendar, AlertCircle, Trash2, Plus } from 'lucide-react';
import './AdminPrescriptions.css';

const AdminPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [verifiedItems, setVerifiedItems] = useState([{ medicineName: '', dosage: '', quantity: 1 }]);
    const [note, setNote] = useState('');

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/prescriptions?status=Pending');
            setPrescriptions(res.data.prescriptions || res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setVerifiedItems([...verifiedItems, { medicineName: '', dosage: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = verifiedItems.filter((_, i) => i !== index);
        setVerifiedItems(newItems.length ? newItems : [{ medicineName: '', dosage: '', quantity: 1 }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...verifiedItems];
        newItems[index][field] = value;
        setVerifiedItems(newItems);
    };

    const handleVerify = async (status) => {
        try {
            await api.patch(`/prescriptions/${selected._id}/verify`, {
                status,
                verifiedItems: status === 'Verified' ? verifiedItems : [],
                adminNote: note
            });
            setSelected(null);
            setVerifiedItems([{ medicineName: '', dosage: '', quantity: 1 }]);
            setNote('');
            fetchPrescriptions();
        } catch (err) {
            alert(err.response?.data?.message || 'Verification failed');
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
                                    <div className="img-wrapper" onClick={() => window.open(selected.image)}>
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
                                        <div className="sec-title">
                                            <Package size={18} />
                                            <h4>Identified Medicines</h4>
                                        </div>
                                        
                                        <div className="medicines-editor">
                                            {verifiedItems.map((item, index) => (
                                                <div key={index} className="medicine-row-premium">
                                                    <div className="input-group-p name">
                                                        <label>Medicine Name</label>
                                                        <input 
                                                            type="text" 
                                                            value={item.medicineName}
                                                            onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                                                            placeholder="e.g. Paracetamol 500mg"
                                                        />
                                                    </div>
                                                    <div className="input-group-p dosage">
                                                        <label>Dosage</label>
                                                        <input 
                                                            type="text" 
                                                            value={item.dosage}
                                                            onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                                                            placeholder="1-0-1"
                                                        />
                                                    </div>
                                                    <div className="input-group-p qty">
                                                        <label>Qty</label>
                                                        <input 
                                                            type="number" 
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        />
                                                    </div>
                                                    <button className="btn-remove" onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button className="btn-add-p" onClick={handleAddItem}>
                                                <Plus size={16} /> Add another item
                                            </button>
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
                                        ></textarea>
                                    </section>

                                    <div className="action-footer">
                                        <button className="btn-reject-p" onClick={() => handleVerify('Rejected')}>
                                            <X size={18} /> Reject
                                        </button>
                                        <button className="btn-approve-p" onClick={() => handleVerify('Verified')}>
                                            <Check size={18} /> Approve & notify User
                                        </button>
                                    </div>
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
        </div>
    );
};

export default AdminPrescriptions;
