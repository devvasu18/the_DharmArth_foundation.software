import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Camera, ShieldCheck, Zap, Truck, ArrowRight } from 'lucide-react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './OrderMedicine.css';

const OrderMedicine = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [myPrescriptions, setMyPrescriptions] = useState([]);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/prescriptions/my');
            setMyPrescriptions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('prescription', file);

        setLoading(true);
        try {
            await api.post('/prescriptions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setFile(null);
            setPreview(null);
            setTimeout(() => setSuccess(false), 5000);
            fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="status-badge pending"><Clock size={14} /> Pending</span>;
            case 'Verified': return <span className="status-badge verified"><CheckCircle size={14} /> Verified</span>;
            case 'Rejected': return <span className="status-badge rejected"><AlertCircle size={14} /> Rejected</span>;
            case 'Under Review': return <span className="status-badge review"><FileText size={14} /> Reviewing</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div className="order-medicine-container">
            <Navbar />
            
            <main className="order-medicine-main">
                {/* Hero Header */}
                <section className="hero-head">
                    <div className="container">
                        <div className="badge-pill">Express Pharmacy Service</div>
                        <h1>Order Medicines with Ease</h1>
                        <p>Our pharmacists bridge the gap between your prescription and doorstep. Fast, secure, and reliable delivery via our dedicated transport network.</p>
                    </div>
                </section>

                {/* Info Steps */}
                <section className="steps-sec">
                    <div className="container">
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-icon"><Camera size={24} /></div>
                                <h4>1. Upload Photo</h4>
                                <p>Take a clear photo of your doctor's prescription.</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><ShieldCheck size={24} /></div>
                                <h4>2. Verification</h4>
                                <p>Our pharmacist reviews and confirms stock availability.</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><Truck size={24} /></div>
                                <h4>3. Fast Delivery</h4>
                                <p>Get medicines delivered via our express bus routes.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="main-features container">
                    <div className="grid-layout">
                        {/* LEFT: Upload Form */}
                        <div className="form-column">
                            <div className="upload-box glass-card">
                                <div className="card-header">
                                    <h3>Send Your Prescription</h3>
                                    <Zap size={20} color="#f6ad55" />
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div 
                                        className={`drop-area ${preview ? 'preview-active' : ''}`}
                                        onClick={() => document.getElementById('presc-upload').click()}
                                    >
                                        {preview ? (
                                            <div className="preview-container">
                                                <img src={preview} alt="Upload Preview" />
                                                <div className="change-btn">Change Photo</div>
                                            </div>
                                        ) : (
                                            <div className="placeholder">
                                                <div className="icon-circle">
                                                    <Upload size={32} />
                                                </div>
                                                <p>Drop your prescription image here</p>
                                                <span>Supports JPG, PNG (Max 5MB)</span>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            id="presc-upload" 
                                            hidden 
                                            onChange={handleFileChange} 
                                            accept="image/*"
                                        />
                                    </div>

                                    {error && <div className="alert alert-error">{error}</div>}
                                    {success && <div className="alert alert-success">Successfully uploaded! Review in progress.</div>}

                                    <button className="btn-submit-premium" disabled={loading}>
                                        {loading ? (
                                            <div className="loader"></div>
                                        ) : (
                                            <>
                                                <Zap size={18} fill="currentColor" />
                                                Submit Now
                                            </>
                                        )}
                                    </button>
                                </form>
                                <div className="security-tag">
                                    <ShieldCheck size={14} />
                                    <span>Encrypted & Private</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: History */}
                        <div className="history-column">
                            <div className="history-box glass-card">
                                <div className="card-header">
                                    <h3>Order History</h3>
                                    <button className="refresh-btn" onClick={fetchHistory}>
                                        <Clock size={16} /> Sync
                                    </button>
                                </div>
                                
                                <div className="order-list-premium">
                                    {myPrescriptions.length === 0 ? (
                                        <div className="empty-state-cool">
                                            <FileText size={64} strokeWidth={1} />
                                            <p>No orders yet</p>
                                            <span>Your medical history will appear here</span>
                                        </div>
                                    ) : (
                                        myPrescriptions.map(p => (
                                            <div key={p._id} className="order-card-premium">
                                                <div className="presc-thumb">
                                                    <img src={p.image} alt="Presc" onClick={() => window.open(p.image)} />
                                                </div>
                                                <div className="order-meta">
                                                    <div className="meta-row">
                                                        <span className="order-date">{new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        {getStatusBadge(p.status)}
                                                    </div>
                                                    <div className="meta-footer">
                                                        {p.status === 'Verified' ? (
                                                            <button className="btn-action-primary">Review & Checkout</button>
                                                        ) : (
                                                            <div className="status-msg">
                                                                {p.status === 'Pending' ? 'Pharmacist is looking at it' : 'Verification failed'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default OrderMedicine;
