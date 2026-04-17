import React, { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { Search, Loader, Phone, Calendar, MessageSquare, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import './AdminLeads.css'; // We'll assume some basic styles or reuse AdminUsers.css

const AdminLeads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const [selectedChat, setSelectedChat] = useState(null);

    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchLeads();
    }, [page, statusFilter]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/leads?page=${page}&limit=10${statusFilter ? `&status=${statusFilter}` : ''}`);
            setLeads(res.data.leads);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("Error fetching leads", error);
            toast.error("Failed to load leads");
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedChat) return;

        try {
            const newMessage = {
                sender: 'support',
                text: replyText,
                timestamp: new Date()
            };

            await api.post(`/leads/${selectedChat._id}/messages`, {
                message: newMessage
            });

            // Update local state
            setSelectedChat(prev => ({
                ...prev,
                chatHistory: [...(prev.chatHistory || []), newMessage]
            }));

            // Allow time for state update or re-fetch if precise sync needed
            // But local update is faster for UI

            setReplyText('');
            toast.success("Reply sent");

            // Optionally update the main list 'leads' if needed, but chat history is deep in object
        } catch (error) {
            console.error("Failed to send reply", error);
            toast.error("Failed to send reply");
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/leads/${id}`, { status: newStatus });
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <h2>Leads & Chat Inquiries</h2>
                <div className="admin-actions">
                    <select
                        className="admin-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                {loading ? (
                    <div className="loading-state"><Loader className="spin" /> Loading...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Language</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No leads found</td>
                                </tr>
                            ) : (
                                leads.map(lead => (
                                    <tr key={lead._id}>
                                        <td>{lead.name || '-'}</td>
                                        <td>
                                            <div className="user-cell">
                                                <Phone size={16} className="text-muted" />
                                                <span>{lead.mobile}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${lead.language === 'hi' ? 'badge-warning' : 'badge-info'}`}>
                                                {lead.language.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${lead.status}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td>{new Date(lead.createdAt).toLocaleString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-icon"
                                                    title="View Chat"
                                                    onClick={() => setSelectedChat(lead)}
                                                >
                                                    <MessageSquare size={18} color="#6366f1" />
                                                </button>
                                                {lead.status === 'new' && (
                                                    <button
                                                        className="btn-icon"
                                                        title="Mark Contacted"
                                                        onClick={() => handleStatusChange(lead._id, 'contacted')}
                                                    >
                                                        <Clock size={18} color="orange" />
                                                    </button>
                                                )}
                                                {lead.status !== 'converted' && (
                                                    <button
                                                        className="btn-icon"
                                                        title="Mark Converted"
                                                        onClick={() => handleStatusChange(lead._id, 'converted')}
                                                    >
                                                        <CheckCircle size={18} color="green" />
                                                    </button>
                                                )}
                                                {lead.status !== 'closed' && (
                                                    <button
                                                        className="btn-icon"
                                                        title="Close Lead"
                                                        onClick={() => handleStatusChange(lead._id, 'closed')}
                                                    >
                                                        <XCircle size={18} color="red" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="pagination">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            {selectedChat && (
                <div className="modal-overlay" onClick={() => setSelectedChat(null)}>
                    <div className="modal-content chat-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chat History - {selectedChat.name ? `${selectedChat.name} (${selectedChat.mobile})` : selectedChat.mobile}</h3>
                            <button className="close-btn" onClick={() => setSelectedChat(null)}>
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="modal-body chat-history-body">
                            {selectedChat.chatHistory && selectedChat.chatHistory.length > 0 ? (
                                selectedChat.chatHistory.filter(m => m.sender !== 'bot').length > 0 ? (
                                    selectedChat.chatHistory.filter(m => m.sender !== 'bot').map((msg, idx) => (
                                        <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-reply'}`}>
                                            <div className={`chat-bubble-content ${msg.sender !== 'user' ? 'chat-reply-content' : ''}`}>
                                                {msg.text || msg.translationKey}
                                                <div className="chat-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted text-center" style={{ padding: '20px' }}>No user messages found.</p>
                                )
                            ) : (
                                <p className="text-muted text-center">No chat history available.</p>
                            )}
                        </div>
                        <div className="modal-footer chat-input-footer">
                            <input
                                type="text"
                                className="admin-chat-input"
                                placeholder="Type a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                            />
                            <button className="btn-send-reply" onClick={handleSendReply}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
