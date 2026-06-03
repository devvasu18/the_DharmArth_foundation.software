import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { MessageSquare, RefreshCw, Power, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminWhatsApp.css';

const DEFAULT_SESSION_ID = 'admin';

const AdminWhatsApp = () => {
    const [statusData, setStatusData] = useState({
        status: 'disconnected',
        qr: null,
        phone_number: null
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchStatus = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const { data } = await api.get(`/whatsapp/status/${DEFAULT_SESSION_ID}`);
            setStatusData(data);
        } catch (error) {
            console.error("Failed to fetch WhatsApp status", error);
            // Don't show toast on background poll errors to avoid spam
            if (showLoading) toast.error("Could not connect to WhatsApp Service");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus(true);
    }, [fetchStatus]);

    // Polling logic
    useEffect(() => {
        let interval;
        if (statusData.status === 'qr_ready' || statusData.status === 'initializing' || statusData.status === 'connecting') {
            interval = setInterval(() => {
                fetchStatus(false);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [statusData.status, fetchStatus]);

    const handleReconnect = async () => {
        setActionLoading(true);
        try {
            await api.post('/whatsapp/reconnect', { sessionId: DEFAULT_SESSION_ID });
            toast.success("Reconnecting session...");
            // Immediately fetch status to show initializing state
            setTimeout(() => fetchStatus(false), 1000);
        } catch (error) {
            toast.error("Failed to reconnect");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect? Automated notifications will stop working.")) return;

        setActionLoading(true);
        try {
            await api.delete(`/whatsapp/session/${DEFAULT_SESSION_ID}`);
            toast.success("Session stopped");
            fetchStatus(false);
        } catch (error) {
            toast.error("Failed to disconnect");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusInfo = () => {
        switch (statusData.status) {
            case 'connected':
                return {
                    label: 'Connected',
                    color: 'status-connected',
                    icon: <CheckCircle2 size={16} />
                };
            case 'qr_ready':
                return {
                    label: 'Scan Required',
                    color: 'status-qr_ready',
                    icon: <RefreshCw size={16} className="loading-spinner" />
                };
            case 'initializing':
            case 'connecting':
                return {
                    label: 'Initializing...',
                    color: 'status-initializing',
                    icon: <Loader2 size={16} className="loading-spinner" />
                };
            default:
                return {
                    label: 'Disconnected',
                    color: 'status-disconnected',
                    icon: <AlertCircle size={16} />
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="whatsapp-admin-container">
            <div className="whatsapp-card">
                <div className="whatsapp-card-header">
                    <h2>
                        <MessageSquare className="header-icon" />
                        WhatsApp Gateway
                    </h2>
                    {!loading && (
                        <div className={`status-badge ${statusInfo.color}`}>
                            <span className="status-dot"></span>
                            {statusInfo.icon}
                            {statusInfo.label}
                        </div>
                    )}
                </div>

                <div className="whatsapp-content">
                    {loading ? (
                        <div className="qr-container">
                            <Loader2 size={48} className="loading-spinner" style={{ color: '#cbd5e1' }} />
                        </div>
                    ) : (
                        <>
                            {statusData.status === 'connected' ? (
                                <div className="connected-info">
                                    <div className="sender-profile">
                                        <div className="sender-avatar">
                                            <MessageSquare size={40} />
                                        </div>
                                        <div className="sender-details">
                                            <span className="sender-label">Registered Sender Number</span>
                                            <div className="phone-number">+{statusData.phone_number || 'Linked'}</div>
                                        </div>
                                    </div>
                                    <div className="connection-success-card">
                                        <CheckCircle2 size={24} className="success-icon" />
                                        <p>Your WhatsApp is successfully linked and ready for automated notifications.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="qr-container">
                                        {statusData.qr ? (
                                            <img src={statusData.qr} alt="WhatsApp QR Code" className="qr-image" />
                                        ) : (
                                            <div className="qr-overlay">
                                                <Loader2 size={32} className="loading-spinner" style={{ color: '#cbd5e1' }} />
                                                <p className="info-text">Generating QR Code...</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="instructions">
                                        <h4>How to connect:</h4>
                                        <ol>
                                            <li>Open WhatsApp on your phone</li>
                                            <li>Tap Menu (⋮) or Settings (⚙️) and select <b>Linked Devices</b></li>
                                            <li>Tap on <b>Link a Device</b></li>
                                            <li>Point your phone to this screen to capture the code</li>
                                        </ol>
                                    </div>
                                </>
                            )}

                            <div className="whatsapp-actions">
                                <button
                                    className="btn-whatsapp btn-reconnect"
                                    onClick={handleReconnect}
                                    disabled={actionLoading}
                                >
                                    <RefreshCw size={18} className={actionLoading ? 'loading-spinner' : ''} />
                                    {statusData.status === 'connected' ? 'Force Reconnect' : 'Refresh QR'}
                                </button>
                                {statusData.status === 'connected' && (
                                    <button
                                        className="btn-whatsapp btn-disconnect"
                                        onClick={handleDisconnect}
                                        disabled={actionLoading}
                                    >
                                        <Power size={18} />
                                        Disconnect
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminWhatsApp;
