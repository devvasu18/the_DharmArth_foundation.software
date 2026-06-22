import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    FileText,
    Calendar,
    User,
    Download,
    AlertCircle,
    Info,
    ChevronLeft,
    Clock
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import './PatientReportView.css';

const PatientReportView = () => {
    const { token } = useParams();
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expired, setExpired] = useState(false);

    // Dynamic backend URL extraction
    const getBackendUrl = () => {
        return API_BASE_URL;
    };

    const fetchMetadata = async () => {
        setLoading(true);
        setError(null);
        setExpired(false);
        try {
            const response = await axios.get(`${getBackendUrl()}/api/reports/metadata/${token}`);
            setMetadata(response.data);
        } catch (err) {
            console.error('Error fetching report details:', err);
            if (err.response?.status === 410) {
                setExpired(true);
            } else {
                setError(err.response?.data?.message || 'Failed to load report. The link may be broken.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchMetadata();
        }
    }, [token]);

    const viewUrl = `${getBackendUrl()}/api/reports/view/${token}`;

    if (loading) {
        return (
            <div className="patient-report-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="animate-spin" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid var(--primary)',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Verifying secure connection and fetching report...</p>
                </div>
            </div>
        );
    }

    // Expired screen
    if (expired) {
        return (
            <div className="patient-report-container">
                <header className="patient-report-header">
                    <div className="header-content-report">
                        <Link to="/" className="brand-logo-report">
                            The Dharmarth Foundation
                        </Link>
                    </div>
                </header>
                <div className="error-screen-report-wrapper">
                    <div className="error-screen-card-report expired">
                        <div className="error-screen-icon-report">
                            <Clock size={36} />
                        </div>
                        <h2>Link Expired</h2>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#f57c00' }}>
                            Sorry, we only show data of the last 3 months.
                        </p>
                        <p style={{ fontSize: '0.9rem' }}>
                            For privacy and security regulations, medical reports are automatically purged from our servers after 90 days. Please contact our support team if you require a new copy.
                        </p>
                        <Link to="/" className="btn-home-report">
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // General error screen (invalid link)
    if (error || !metadata) {
        return (
            <div className="patient-report-container">
                <header className="patient-report-header">
                    <div className="header-content-report">
                        <Link to="/" className="brand-logo-report">
                            The Dharmarth Foundation
                        </Link>
                    </div>
                </header>
                <div className="error-screen-report-wrapper">
                    <div className="error-screen-card-report">
                        <div className="error-screen-icon-report">
                            <AlertCircle size={36} />
                        </div>
                        <h2>Link Invalid</h2>
                        <p>{error || 'The requested medical report link is invalid or has been disabled.'}</p>
                        <Link to="/" className="btn-home-report">
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="patient-report-container">
            {/* Nav Header */}
            <header className="patient-report-header">
                <div className="header-content-report">
                    <Link to="/" className="brand-logo-report">
                        The Dharmarth Foundation
                    </Link>
                    <a href={viewUrl} download={metadata.fileName || 'report.pdf'} className="btn-download-pdf-report">
                        <Download size={16} /> Download Report
                    </a>
                </div>
            </header>

            {/* Main content */}
            <main className="patient-report-body">
                {/* Metadata Card */}
                <div className="report-metadata-card">
                    <div className="metadata-item-report">
                        <span className="metadata-label-report">Patient Name</span>
                        <span className="metadata-value-report" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={18} style={{ color: 'var(--primary)' }} />
                            {metadata.patientName || 'Patient'}
                        </span>
                    </div>
                    <div className="metadata-item-report">
                        <span className="metadata-label-report">Uploaded Date</span>
                        <span className="metadata-value-report" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={18} style={{ color: 'var(--primary)' }} />
                            {new Date(metadata.uploadedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                    <div className="metadata-item-report">
                        <span className="metadata-label-report">Remarks</span>
                        <span className="metadata-value-report">
                            {metadata.remarks || 'Medical Report'}
                        </span>
                    </div>
                    <div className="metadata-item-report" style={{ alignItems: 'flex-end' }}>
                        <a href={viewUrl} download={metadata.fileName || 'report.pdf'} className="btn-download-pdf-report">
                            <Download size={16} /> Download
                        </a>
                    </div>
                </div>

                {/* Download Warning Banner */}
                <div className="report-download-warning">
                    <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                    <p className="report-download-warning-text">
                        कृपया इस रिपोर्ट को डाउनलोड करें, यह 3 महीने के बाद वैध या डाउनलोड करने योग्य नहीं होगी। / Please download this report, it will not be valid or downloadable after 3 months.
                    </p>
                </div>

                {/* Mobile Preview Tip */}
                <div className="mobile-view-pdf-warning">
                    <Info size={20} style={{ color: '#f57c00', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#5c3e00', lineHeight: 1.4 }}>
                        PDF preview may not load automatically in some mobile browsers. If the box below is blank, please click the <strong>Download Report</strong> button above to save and view the document on your device.
                    </p>
                </div>

                {/* PDF preview iframe card */}
                {metadata.hasPdf && (
                    <div className="pdf-viewer-card-report">
                        <div className="pdf-viewer-header-report">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FileText size={16} />
                                {metadata.fileName || 'Report-Viewer.pdf'}
                            </span>
                            <span>Secure Encrypted View</span>
                        </div>
                        <iframe
                            src={`${viewUrl}#toolbar=0`}
                            className="pdf-viewer-iframe-report"
                            title="Patient Medical Report"
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientReportView;
