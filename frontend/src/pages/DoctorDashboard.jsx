import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import toast from 'react-hot-toast';
import {
    Stethoscope, Phone, CheckCircle, XCircle, Clock,
    User, Calendar, Pill, AlertCircle, FileText, ChevronRight, Search
} from 'lucide-react';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [actionNotes, setActionNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchConsultations();
    }, [filter]);

    const fetchConsultations = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/doctor/consultations?status=${filter}`);
            setConsultations(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load consultation queue');
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (decision) => {
        if (!selectedConsultation) return;
        if (decision === 'Rejected' && !actionNotes.trim()) {
            toast.error('Please enter a clinical reason for rejection');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/doctor/consultations/${selectedConsultation._id}/decision`, {
                decision,
                notes: actionNotes
            });
            toast.success(`Consultation successfully marked as ${decision}!`);
            setSelectedConsultation(null);
            setActionNotes('');
            fetchConsultations();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit decision');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="doctor-dashboard-layout">
            <Navbar />
            <div className="doctor-dashboard-container">
                {/* Header */}
                <div className="doctor-dash-header">
                    <div>
                        <h1>
                            <Stethoscope className="icon-stethoscope" />
                            Doctor Tele-Consultation Console
                        </h1>
                        <p>Review patient symptom notes, evaluate Schedule H/H1 restricted items, and issue digital endorsements.</p>
                    </div>
                    <div className="doctor-filter-tabs">
                        {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
                            <button
                                key={tab}
                                className={`filter-tab-btn ${filter === tab ? 'active' : ''}`}
                                onClick={() => setFilter(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="doctor-dash-content">
                    {/* List Section */}
                    <div className="consultations-list-card">
                        <div className="list-card-header">
                            <h2>Patient Queue ({consultations.length})</h2>
                        </div>
                        {loading ? (
                            <div className="loading-state">
                                <Clock className="spin-icon" />
                                <p>Loading patient consultation tickets...</p>
                            </div>
                        ) : consultations.length === 0 ? (
                            <div className="empty-state">
                                <CheckCircle className="empty-icon" />
                                <h3>No {filter} Consultations</h3>
                                <p>All requested patient permissions have been processed.</p>
                            </div>
                        ) : (
                            <div className="consultation-items-wrapper">
                                {consultations.map((item) => (
                                    <div
                                        key={item._id}
                                        className={`consultation-item ${selectedConsultation?._id === item._id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedConsultation(item);
                                            setActionNotes(item.doctorConsultation?.notes || '');
                                        }}
                                    >
                                        <div className="item-main-info">
                                            <div className="patient-name-row">
                                                <User className="user-icon" />
                                                <strong>{item.recipientDetails?.patientName || item.guestName || item.user?.name || 'Walk-in Patient'}</strong>
                                                <span className={`status-pill ${item.doctorConsultation?.status?.toLowerCase() || 'pending'}`}>
                                                    {item.doctorConsultation?.status || 'Pending'}
                                                </span>
                                            </div>
                                            <div className="patient-meta-row">
                                                <span><Phone className="mini-icon" /> {item.recipientDetails?.patientPhone || item.guestMobile || item.user?.mobile || 'No Phone'}</span>
                                                <span><Clock className="mini-icon" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                                                {item.courseDays && <span><Calendar className="mini-icon" /> {item.courseDays} Days Supply</span>}
                                            </div>
                                        </div>
                                        <ChevronRight className="arrow-icon" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail & Decision Workspace */}
                    <div className="consultation-detail-card">
                        {selectedConsultation ? (
                            <div className="detail-workspace">
                                <div className="workspace-header">
                                    <h3>Patient Consultation Detail</h3>
                                    <span className="badge-rx-id">Ref: #{selectedConsultation._id.slice(-6).toUpperCase()}</span>
                                </div>

                                {/* Patient Profile Card */}
                                <div className="patient-quick-card">
                                    <div className="quick-row">
                                        <span className="label">Patient Name:</span>
                                        <span className="val">{selectedConsultation.recipientDetails?.patientName || selectedConsultation.guestName || selectedConsultation.user?.name}</span>
                                    </div>
                                    <div className="quick-row">
                                        <span className="label">Contact Phone:</span>
                                        <a href={`tel:${selectedConsultation.recipientDetails?.patientPhone || selectedConsultation.guestMobile || selectedConsultation.user?.mobile}`} className="call-btn-link">
                                            <Phone size={14} /> Call {selectedConsultation.recipientDetails?.patientPhone || selectedConsultation.guestMobile || selectedConsultation.user?.mobile}
                                        </a>
                                    </div>
                                    <div className="quick-row">
                                        <span className="label">Course Duration:</span>
                                        <span className="val">{selectedConsultation.courseDays || 15} Days</span>
                                    </div>
                                    {selectedConsultation.notes && (
                                        <div className="notes-box">
                                            <strong>Patient Symptom / Request Notes:</strong>
                                            <p>{selectedConsultation.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Requested Medicines Table */}
                                <div className="medicines-section">
                                    <h4><Pill size={16} /> Requested Medicines for Endorsement</h4>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Medicine Name</th>
                                                    <th>Dosage</th>
                                                    <th>Qty</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedConsultation.verifiedItems?.map((med, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>{med.medicineName}</strong></td>
                                                        <td>{med.dosage || med.frequency || 'As directed'}</td>
                                                        <td>{med.quantity || 1}</td>
                                                        <td>
                                                            <span className="badge-warning">Req. Approval</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Doctor Decision Form */}
                                <div className="decision-form-box">
                                    <h4>Doctor's Evaluation & Recommendation</h4>
                                    <textarea
                                        rows={3}
                                        placeholder="Add clinical observation, dosage advice, or reason if rejecting..."
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                    />
                                    <div className="decision-actions-row">
                                        <button
                                            className="btn-approve"
                                            disabled={submitting}
                                            onClick={() => handleDecision('Approved')}
                                        >
                                            <CheckCircle size={18} /> YES (Approve & Endorse)
                                        </button>
                                        <button
                                            className="btn-reject"
                                            disabled={submitting}
                                            onClick={() => handleDecision('Rejected')}
                                        >
                                            <XCircle size={18} /> NO (Decline / Reject)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="select-prompt">
                                <Stethoscope size={48} className="prompt-icon" />
                                <h3>Select a Patient Consultation</h3>
                                <p>Choose a ticket from the left queue to review patient details and approve prescription dispensing.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DoctorDashboard;
