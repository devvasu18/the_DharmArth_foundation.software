import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import {
    Plus,
    Trash2,
    Upload,
    Search,
    FileText,
    Send,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
    Info,
    Eye
} from 'lucide-react';
import './AdminDoctorReports.css';

const AdminDoctorReports = () => {
    // Report Creation state
    const [patients, setPatients] = useState([{ mobile: '', name: '', remarks: '' }]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [templateLanguage, setTemplateLanguage] = useState('hi');
    const [messageType, setMessageType] = useState('template'); // 'template' or 'custom'
    const [customMessage, setCustomMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // List/Logs state
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);

    // Stats summary
    const [stats, setStats] = useState({
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchReports();
    }, [page, statusFilter, dateFilter]);

    // Periodically refresh stats if there are pending or processing items in queue
    useEffect(() => {
        const needsRefresh = stats.pending > 0 || stats.processing > 0;
        let interval;
        if (needsRefresh) {
            interval = setInterval(() => {
                fetchReports(true); // silent refresh
            }, 8000);
        }
        return () => clearInterval(interval);
    }, [stats.pending, stats.processing]);

    const fetchReports = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await api.get('/reports', {
                params: {
                    search: searchTerm,
                    status: statusFilter,
                    dateFilter,
                    page,
                    limit: 10
                }
            });

            setReports(response.data.reports);
            setTotalReports(response.data.pagination.total);
            setTotalPages(response.data.pagination.pages);

            // Compute statistics from recent database snapshot
            calculateStatsSummary(response.data.reports);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            if (!silent) toast.error('Failed to load reports');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const calculateStatsSummary = (reportsList) => {
        const localStats = { pending: 0, processing: 0, sent: 0, failed: 0 };
        reportsList.forEach(r => {
            if (r.whatsappStatus === 'pending') localStats.pending++;
            else if (r.whatsappStatus === 'processing') localStats.processing++;
            else if (r.whatsappStatus === 'sent' || r.whatsappStatus === 'delivered' || r.whatsappStatus === 'read') localStats.sent++;
            else if (r.whatsappStatus === 'failed') localStats.failed++;
        });

        setStats(localStats);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchReports();
    };

    const handleAddPatientRow = () => {
        setPatients([...patients, { mobile: '', name: '', remarks: '' }]);
    };

    const handleRemovePatientRow = (index) => {
        if (patients.length === 1) {
            setPatients([{ mobile: '', name: '', remarks: '' }]);
            return;
        }
        const updated = patients.filter((_, i) => i !== index);
        setPatients(updated);
    };

    const handlePatientChange = (index, field, value) => {
        const updated = [...patients];
        updated[index][field] = value;
        setPatients(updated);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const pdfFiles = files.filter(f => f.type === 'application/pdf');

        if (pdfFiles.length !== files.length) {
            toast.error('Only PDF files are supported.');
        }

        setSelectedFiles(pdfFiles);
    };

    const handleRemoveFile = (index) => {
        const updated = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updated);
    };

    const handleSendReports = async (e) => {
        e.preventDefault();

        // Validations
        const validPatients = patients.filter(p => p.mobile.trim());
        if (validPatients.length === 0) {
            toast.error('Please enter at least one patient with a mobile number');
            return;
        }

        for (let p of validPatients) {
            const cleanMobile = p.mobile.replace(/\D/g, '');
            if (cleanMobile.length < 10) {
                toast.error(`Invalid mobile number: ${p.mobile}. Must be at least 10 digits.`);
                return;
            }
        }

        const formData = new FormData();

        // Append files
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // Append metadata
        formData.append('metadata', JSON.stringify(validPatients));
        formData.append('templateLanguage', templateLanguage);
        
        if (messageType === 'custom' && customMessage.trim()) {
            formData.append('customMessage', customMessage);
        }

        setSubmitting(true);
        const toastId = toast.loading('Uploading PDFs and scheduling report delivery...');

        try {
            await api.post('/reports/send', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Reports queued for delivery!', { id: toastId });
            
            // Reset form
            setPatients([{ mobile: '', name: '', remarks: '' }]);
            setSelectedFiles([]);
            setCustomMessage('');
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Refresh logs
            setPage(1);
            fetchReports();
        } catch (error) {
            console.error('Error sending reports:', error);
            const msg = error.response?.data?.message || 'Failed to send reports';
            toast.error(msg, { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = async (reportId) => {
        try {
            const response = await api.post(`/reports/retry/${reportId}`);
            toast.success(response.data.message || 'Report queued for retry successfully!');
            fetchReports();
        } catch (error) {
            console.error('Failed to retry sending report:', error);
            toast.error('Failed to retry sending report');
        }
    };

    // Calculate message preview
    const getPreviewMessage = () => {
        const dummyPatient = patients[0] || { name: 'Rahul Sharma', remarks: 'Blood Test' };
        const name = dummyPatient.name || 'Rahul Sharma';
        const remarks = dummyPatient.remarks || 'Blood Test';
        const dummyUrl = 'https://thedharmarth.com/report/view/sample-secure-token';

        if (messageType === 'custom') {
            if (!customMessage) return 'Type a message in the editor below...';
            return customMessage
                .replace(/{PATIENT_NAME}/g, name)
                .replace(/{REPORT_URL}/g, dummyUrl)
                .replace(/{REMARKS}/g, remarks);
        }

        if (templateLanguage === 'hi') {
            return `प्रिय मरीज ${name},\n\nआपकी मेडिकल रिपोर्ट तैयार है।\n\nरिपोर्ट देखने के लिए:\n${dummyUrl}\n\n${remarks}\n\nधन्यवाद।`;
        } else {
            return `Dear Patient ${name},\n\nYour medical report is ready.\n\nView Report:\n${dummyUrl}\n\n${remarks}\n\nThank You.`;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'processing': return 'Sending';
            case 'sent': return 'Sent';
            case 'delivered': return 'Delivered';
            case 'read': return 'Read';
            case 'failed': return 'Failed';
            default: return status;
        }
    };

    return (
        <div className="adr-container">
            {/* Header */}
            <div className="adr-header">
                <div>
                    <h1>Doctor Reports</h1>
                    <p className="adr-subtitle">Deliver patient reports securely via rate-limited sequential WhatsApp queues</p>
                </div>
            </div>

            {/* Active Queue Statistics Banner */}
            <div className="adr-stats-grid">
                <div className="adr-stat-card pending">
                    <div className="adr-stat-icon-wrapper">
                        <Clock size={20} />
                    </div>
                    <div className="adr-stat-info">
                        <h3>In Queue</h3>
                        <div className="adr-stat-number">{stats.pending}</div>
                    </div>
                </div>
                <div className="adr-stat-card processing">
                    <div className="adr-stat-icon-wrapper">
                        <RefreshCw className="animate-spin" size={20} />
                    </div>
                    <div className="adr-stat-info">
                        <h3>Processing</h3>
                        <div className="adr-stat-number">{stats.processing}</div>
                    </div>
                </div>
                <div className="adr-stat-card sent">
                    <div className="adr-stat-icon-wrapper">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="adr-stat-info">
                        <h3>Sent / Active</h3>
                        <div className="adr-stat-number">{stats.sent}</div>
                    </div>
                </div>
                <div className="adr-stat-card failed">
                    <div className="adr-stat-icon-wrapper">
                        <AlertCircle size={20} />
                    </div>
                    <div className="adr-stat-info">
                        <h3>Failed</h3>
                        <div className="adr-stat-number">{stats.failed}</div>
                    </div>
                </div>
            </div>

            {/* Send Form Section */}
            <div className="adr-section-card">
                <h2><Send size={20} style={{ color: 'var(--primary)' }} /> Send Medical Reports</h2>
                
                <form onSubmit={handleSendReports}>
                    {/* File Upload Dropzone */}
                    <div className="adr-form-group">
                        <label className="adr-label">Upload Patient Reports (PDF only)</label>
                        <div className="adr-dropzone">
                            <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '8px', opacity: 0.8 }} />
                            <p style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                Drag & Drop PDF files here or click to browse
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Supports multiple file selection
                            </p>
                            <input
                                type="file"
                                accept="application/pdf"
                                multiple
                                onChange={handleFileChange}
                                ref={fileInputRef}
                            />
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="adr-uploaded-files-list">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="adr-file-tag">
                                        <FileText size={14} />
                                        <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.name}
                                        </span>
                                        <button type="button" onClick={() => handleRemoveFile(idx)}>&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PDF Matching Alert Info */}
                    <div className="adr-info-box">
                        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <span style={{ fontWeight: '700' }}>File Matching Logic:</span>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                                <li><strong>Single PDF Uploaded:</strong> The same PDF file is sent to all patients in the list (Broadcast).</li>
                                <li><strong>Multiple PDFs Uploaded:</strong> PDFs are matched 1-to-1 with patients by their row index (Patient #1 gets PDF #1, Patient #2 gets PDF #2, etc.). Make sure the order aligns!</li>
                            </ul>
                        </div>
                    </div>

                    {/* Patient Rows Input Section */}
                    <div style={{ marginBottom: '20px' }}>
                        <div className="adr-patient-row-header">
                            <div>Mobile Number *</div>
                            <div>Patient Name (Optional)</div>
                            <div>Report Remarks (Optional)</div>
                            <div>Action</div>
                        </div>

                        <div className="adr-patient-rows-container">
                            {patients.map((patient, index) => (
                                <div key={index} className="adr-patient-row-entry">
                                    <div className="adr-form-group" style={{ marginBottom: 0 }}>
                                        <input
                                            type="text"
                                            className="adr-input"
                                            placeholder="e.g. 9876543210"
                                            value={patient.mobile}
                                            onChange={(e) => handlePatientChange(index, 'mobile', e.target.value)}
                                            required={index === 0}
                                        />
                                    </div>
                                    <div className="adr-form-group" style={{ marginBottom: 0 }}>
                                        <input
                                            type="text"
                                            className="adr-input"
                                            placeholder="e.g. Rahul Sharma"
                                            value={patient.name}
                                            onChange={(e) => handlePatientChange(index, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="adr-form-group" style={{ marginBottom: 0 }}>
                                        <input
                                            type="text"
                                            className="adr-input"
                                            placeholder="e.g. CBC / Sugar Report"
                                            value={patient.remarks}
                                            onChange={(e) => handlePatientChange(index, 'remarks', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="adr-btn-remove-row"
                                        onClick={() => handleRemovePatientRow(index)}
                                        title="Remove Patient"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="adr-btn-add-row"
                            onClick={handleAddPatientRow}
                        >
                            <Plus size={16} /> Add Another Patient
                        </button>
                    </div>

                    {/* Message Options Tabs */}
                    <div className="adr-tabs-container">
                        <button
                            type="button"
                            className={`adr-tab-btn ${messageType === 'template' ? 'active' : ''}`}
                            onClick={() => setMessageType('template')}
                        >
                            WhatsApp Templates
                        </button>
                        <button
                            type="button"
                            className={`adr-tab-btn ${messageType === 'custom' ? 'active' : ''}`}
                            onClick={() => setMessageType('custom')}
                        >
                            Custom Message
                        </button>
                    </div>

                    {messageType === 'template' ? (
                        <div className="adr-form-group" style={{ marginBottom: '20px' }}>
                            <label className="adr-label">Select Template Language</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setTemplateLanguage('hi')}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1.5px solid',
                                        borderColor: templateLanguage === 'hi' ? 'var(--primary)' : '#cbd5e1',
                                        background: templateLanguage === 'hi' ? '#f0fdfa' : 'white',
                                        color: templateLanguage === 'hi' ? 'var(--primary)' : 'var(--text-main)',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Hindi (हिंदी)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTemplateLanguage('en')}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1.5px solid',
                                        borderColor: templateLanguage === 'en' ? 'var(--primary)' : '#cbd5e1',
                                        background: templateLanguage === 'en' ? '#f0fdfa' : 'white',
                                        color: templateLanguage === 'en' ? 'var(--primary)' : 'var(--text-main)',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    English
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="adr-form-group" style={{ marginBottom: '20px' }}>
                            <label className="adr-label">Custom Message Template</label>
                            <textarea
                                className="adr-textarea"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Dear Patient {PATIENT_NAME}, your report is here: {REPORT_URL}. Notes: {REMARKS}."
                                rows={4}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                Use replacement tags: <strong>{`{PATIENT_NAME}`}</strong>, <strong>{`{REPORT_URL}`}</strong>, <strong>{`{REMARKS}`}</strong> to inject values dynamically.
                            </p>
                        </div>
                    )}

                    {/* Live Preview Box */}
                    <div className="adr-preview-container">
                        <h4>Real-Time Message Preview</h4>
                        <div className="adr-preview-bubble" translate="no">
                            {getPreviewMessage()}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="submit"
                            className="adr-btn-submit"
                            disabled={submitting}
                        >
                            <Send size={18} /> {submitting ? 'Scheduling...' : 'Send Reports'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Reports Log History Section */}
            <div className="adr-section-card">
                <h2>Queue Delivery History & Audit Logs</h2>

                {/* Filters / Toolbar */}
                <div className="adr-toolbar">
                    <form onSubmit={handleSearchSubmit} className="adr-search-wrapper">
                        <Search className="adr-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs by mobile, name or file name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                    <div className="adr-filters">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Delivery Statuses</option>
                            <option value="pending">Pending Queue</option>
                            <option value="processing">Processing</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                        </select>
                        
                        <select
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">All Dates</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => fetchReports()}
                            style={{
                                padding: '10px',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: 'var(--radius-md)',
                                background: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Refresh Logs"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Table Data */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                        <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Loading reports history...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <Info size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                        <p>No reports found matching your search criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className="adr-table-container">
                            <table className="adr-table">
                                <thead>
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Mobile Number</th>
                                        <th>File Name</th>
                                        <th>Uploaded At</th>
                                        <th>Status</th>
                                        <th>Retries</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report._id}>
                                            <td style={{ fontWeight: '600' }}>
                                                {report.patientName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Anonymous</span>}
                                            </td>
                                            <td>{report.patientMobile}</td>
                                            <td style={{ fontSize: '0.9rem' }}>
                                                {report.fileName ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FileText size={14} style={{ color: '#64748b' }} />
                                                        {report.fileName}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No PDF</span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                {new Date(report.uploadedAt).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`adr-status-badge ${report.whatsappStatus}`}>
                                                    {getStatusText(report.whatsappStatus)}
                                                </span>
                                                {report.failureReason && report.whatsappStatus === 'failed' && (
                                                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={report.failureReason}>
                                                        {report.failureReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {report.retryCount} / 3
                                            </td>
                                            <td className="adr-actions-cell">
                                                {report.secureToken && (
                                                    <a
                                                        href={`/report/view/${report.secureToken}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="adr-btn-action view"
                                                        title="Preview Report"
                                                        translate="no"
                                                    >
                                                        <Eye size={14} /> Preview
                                                    </a>
                                                )}
                                                {report.whatsappStatus === 'failed' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRetry(report._id)}
                                                        className="adr-btn-action retry"
                                                        title="Retry Sending Now"
                                                    >
                                                        <RefreshCw size={14} /> Retry
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        <div className="adr-pagination">
                            <div className="adr-pagination-info">
                                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalReports)} of {totalReports} entries
                            </div>
                            <div className="adr-pagination-buttons">
                                <button
                                    className="adr-pagination-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    <ChevronLeft size={16} style={{ verticalAlign: 'middle' }} /> Previous
                                </button>
                                <button
                                    className="adr-pagination-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDoctorReports;
