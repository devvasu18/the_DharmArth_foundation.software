import React, { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { Search, Loader, Phone, Calendar, CheckCircle, Clock, XCircle, FileSpreadsheet, FileText as FilePdf } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import './AdminLeads.css';

const AdminLeads = () => {
    const { showConfirm } = useConfirm();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter] = useState('donation_exit');

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
            Language: lead.language?.toUpperCase() || 'EN',
            Status: lead.status?.toUpperCase(),
            Date: new Date(lead.createdAt).toLocaleString()
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        XLSX.writeFile(workbook, `Donation_Reminders_${new Date().toLocaleDateString()}.xlsx`);
        toast.success("Excel exported successfully!");
    };

    const exportToPDF = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const doc = new jsPDF();
        doc.text("Donation Reminders Report", 14, 15);
        
        const tableColumn = ["Name", "Mobile", "Language", "Status", "Date"];
        const tableRows = data.map(lead => [
            lead.name || 'N/A',
            lead.mobile,
            lead.language?.toUpperCase() || 'EN',
            lead.status?.toUpperCase(),
            new Date(lead.createdAt).toLocaleString()
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        
        doc.save(`Donation_Reminders_${new Date().toLocaleDateString()}.pdf`);
        toast.success("PDF exported successfully!");
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <h2>Donation Reminders</h2>
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
                                <th>Language</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">No reminders found</td>
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

        </div>
    );
};

export default AdminLeads;
