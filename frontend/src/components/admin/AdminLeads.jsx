import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search, Loader, Phone, Calendar, CheckCircle, Clock, XCircle, FileSpreadsheet, FileText as FilePdf, MessageSquare, Smartphone, Globe, Bot, Heart } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import './AdminLeads.css';

// Source tag configuration
const SOURCE_CONFIG = {
    mobile_app:        { label: '📱 Mobile App',       color: '#6366f1', bg: '#ede9fe' },
    web_contact_page:  { label: '🌐 Web Contact Page',  color: '#0d9488', bg: '#ccfbf1' },
    cms_contact_form:  { label: '📝 CMS Form',          color: '#0284c7', bg: '#e0f2fe' },
    contact_form:      { label: '📝 Contact Form',      color: '#0284c7', bg: '#e0f2fe' },
    donation_exit:     { label: '💛 Donate Reminder',   color: '#d97706', bg: '#fef3c7' },
    chat:              { label: '🤖 AI Chatbot',        color: '#64748b', bg: '#f1f5f9' },
    body_test_booking: { label: '🔬 Body Test Booking', color: '#8b5cf6', bg: '#f5f3ff' },
};

const TYPE_CONFIG = {
    contact:       { label: 'Contact',         color: '#0d9488', bg: '#ccfbf1' },
    donation_exit: { label: 'Donate Reminder', color: '#d97706', bg: '#fef3c7' },
    chat:          { label: 'Chat',            color: '#64748b', bg: '#f1f5f9' },
};

const SourceBadge = ({ source, type }) => {
    const key = source || type || 'chat';
    const cfg = SOURCE_CONFIG[key] || { label: key, color: '#64748b', bg: '#f1f5f9' };
    return (
        <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: cfg.color,
            backgroundColor: cfg.bg,
            whiteSpace: 'nowrap',
        }}>
            {cfg.label}
        </span>
    );
};

const AdminLeads = () => {
    const { showConfirm } = useConfirm();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchLeads();
    }, [page, statusFilter, typeFilter, searchTerm]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/leads?page=${page}&limit=10${statusFilter ? `&status=${statusFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
            setLeads(res.data.leads);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("Error fetching leads", error);
            toast.error("Failed to load leads");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const isConfirmed = await showConfirm(
            "Update Lead Status",
            `Are you sure you want to mark this lead as "${newStatus}"?`
        );
        if (!isConfirmed) return;

        const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
        try {
            await api.put(`/leads/${id}`, { status: newStatus });
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));
            toast.success(`Status updated to ${newStatus}`, { id: loadingToast });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status", { id: loadingToast });
        }
    };

    const [exportLoading, setExportLoading] = useState(false);

    const fetchAllForExport = async () => {
        setExportLoading(true);
        try {
            const res = await api.get(`/leads?all=true${statusFilter ? `&status=${statusFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
            return res.data.leads;
        } catch (error) {
            toast.error("Failed to fetch data for export");
            return [];
        } finally {
            setExportLoading(false);
        }
    };

    const exportToExcel = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(data.map(lead => ({
            Name: lead.name || 'N/A',
            Mobile: lead.mobile,
            Email: lead.email || '-',
            Source: SOURCE_CONFIG[lead.source || lead.type]?.label || lead.source || '-',
            Type: TYPE_CONFIG[lead.type]?.label || lead.type || '-',
            Notes: lead.notes || '-',
            Language: lead.language?.toUpperCase() || 'EN',
            Status: lead.status?.toUpperCase(),
            Date: new Date(lead.createdAt).toLocaleString()
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        XLSX.writeFile(workbook, `All_Leads_${new Date().toLocaleDateString()}.xlsx`);
        toast.success("Excel exported successfully!");
    };

    const exportToPDF = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const doc = new jsPDF();
        doc.text("All Leads Report", 14, 15);

        const tableColumn = ["Name", "Mobile", "Source", "Status", "Date"];
        const tableRows = data.map(lead => [
            lead.name || 'N/A',
            lead.mobile,
            SOURCE_CONFIG[lead.source || lead.type]?.label || lead.source || '-',
            lead.status?.toUpperCase(),
            new Date(lead.createdAt).toLocaleString()
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save(`All_Leads_${new Date().toLocaleDateString()}.pdf`);
        toast.success("PDF exported successfully!");
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <h2>All Leads</h2>
                <div className="admin-actions">
                    <div className="search-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Type / Source Filter */}
                    <select
                        className="admin-select"
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Sources</option>
                        <option value="contact">📝 Contact Messages</option>
                        <option value="donation_exit">💛 Donation Reminders</option>
                        <option value="chat">🤖 AI Chatbot</option>
                    </select>

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

                    <div className="export-actions">
                        <button
                            className="btn-export excel"
                            onClick={exportToExcel}
                            disabled={exportLoading}
                            title="Export to Excel"
                        >
                            <FileSpreadsheet size={18} />
                            <span>Excel</span>
                        </button>
                        <button
                            className="btn-export pdf"
                            onClick={exportToPDF}
                            disabled={exportLoading}
                            title="Export to PDF"
                        >
                            <FilePdf size={18} />
                            <span>PDF</span>
                        </button>
                    </div>
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
                                <th>Source</th>
                                <th>Language</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center">No leads found</td>
                                </tr>
                            ) : (
                                leads.map(lead => (
                                    <React.Fragment key={lead._id}>
                                        <tr
                                            style={{ cursor: lead.notes ? 'pointer' : 'default' }}
                                            onClick={() => lead.notes && setExpandedId(expandedId === lead._id ? null : lead._id)}
                                        >
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{lead.name || '-'}</div>
                                                {lead.email && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{lead.email}</div>}
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <Phone size={16} className="text-muted" />
                                                    <span>{lead.mobile}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <SourceBadge source={lead.source} type={lead.type} />
                                            </td>
                                            <td>
                                                <span className={`badge ${lead.language === 'hi' ? 'badge-warning' : 'badge-info'}`}>
                                                    {(lead.language || 'en').toUpperCase()}
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
                                                    {lead.status === 'new' && (
                                                        <button
                                                            className="btn-icon"
                                                            title="Mark Contacted"
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(lead._id, 'contacted'); }}
                                                        >
                                                            <Clock size={18} color="orange" />
                                                        </button>
                                                    )}
                                                    {lead.status !== 'converted' && (
                                                        <button
                                                            className="btn-icon"
                                                            title="Mark Converted"
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(lead._id, 'converted'); }}
                                                        >
                                                            <CheckCircle size={18} color="green" />
                                                        </button>
                                                    )}
                                                    {lead.status !== 'closed' && (
                                                        <button
                                                            className="btn-icon"
                                                            title="Close Lead"
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(lead._id, 'closed'); }}
                                                        >
                                                            <XCircle size={18} color="red" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable notes row */}
                                        {expandedId === lead._id && lead.notes && (
                                            <tr style={{ background: '#f8fafc' }}>
                                                <td colSpan="7" style={{ padding: '12px 20px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: 10,
                                                        alignItems: 'flex-start',
                                                        background: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: 12,
                                                        padding: '14px 18px'
                                                    }}>
                                                        <MessageSquare size={16} color="#00bfa5" style={{ marginTop: 2, flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Message / Notes</div>
                                                            <div style={{ fontSize: '0.95rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{lead.notes}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
};

export default AdminLeads;
