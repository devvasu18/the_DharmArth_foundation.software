import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, Eye, Package, Truck, Search } from 'lucide-react';
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
            fetchPrescriptions();
        } catch (err) {
            alert(err.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="admin-prescriptions">
            <header className="admin-header">
                <h2>Prescription Verification Queue</h2>
                <div className="stats">
                    <span className="badge">{prescriptions.length} Pending Review</span>
                </div>
            </header>

            <div className="admin-content">
                <div className="prescription-list">
                    {prescriptions.map(p => (
                        <div key={p._id} className={`p-card ${selected?._id === p._id ? 'active' : ''}`} onClick={() => setSelected(p)}>
                            <div className="p-img">
                                <img src={p.image} alt="Prescription" />
                            </div>
                            <div className="p-info">
                                <h3>{p.user?.name || 'Unknown User'}</h3>
                                <p>{p.user?.mobile}</p>
                                <span>{new Date(p.createdAt).toLocaleString()}</span>
                            </div>
                            <Eye size={20} className="eye-icon" />
                        </div>
                    ))}
                </div>

                <div className="verification-panel">
                    {selected ? (
                        <div className="panel-inner glassmorphism">
                            <div className="panel-header">
                                <h3>Verifying for {selected.user?.name}</h3>
                                <button className="btn-close" onClick={() => setSelected(null)}>✕</button>
                            </div>

                            <div className="panel-body">
                                <div className="prescription-view">
                                    <img src={selected.image} alt="Prescription Full View" onClick={() => window.open(selected.image)} />
                                    <p className="hint">Click image to zoom</p>
                                </div>

                                <div className="verification-form">
                                    <h4>Step 1: Identify Medicines</h4>
                                    {verifiedItems.map((item, index) => (
                                        <div key={index} className="item-row">
                                            <input 
                                                type="text" 
                                                placeholder="Medicine Name" 
                                                value={item.medicineName}
                                                onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Dosage (e.g. 1-0-1)" 
                                                value={item.dosage}
                                                onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Qty" 
                                                className="qty-input"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                    <button className="btn-link" onClick={handleAddItem}>+ Add Another Medicine</button>

                                    <div className="note-area">
                                        <h4>Step 2: Admin Notes</h4>
                                        <textarea 
                                            placeholder="Add instructions or rejection reason..." 
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="actions">
                                        <button className="btn btn-danger" onClick={() => handleVerify('Rejected')}>
                                            <X size={18} /> Reject Prescription
                                        </button>
                                        <button className="btn btn-success" onClick={() => handleVerify('Verified')}>
                                            <Check size={18} /> Verify & Send to User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <Search size={64} color="#ddd" />
                            <p>Select a prescription from the list to start verification</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPrescriptions;
