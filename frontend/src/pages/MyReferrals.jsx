import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, Filter, CheckCircle, XCircle, Send, ArrowRight, Smartphone, Download, FileText as FilePdf, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MyReferrals = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('active'); // active, inactive

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit] = useState(10);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchReferrals(currentPage);
    }, [statusFilter, currentPage]);

    const fetchReferrals = async (page = 1) => {
        try {
            setLoading(true);
            const { data } = await api.get('/subscriptions/motivator/referrals', {
                params: { status: statusFilter, page, limit }
            });

            if (data.pagination) {
                setReferrals(data.subscriptions);
                setTotalPages(data.pagination.totalPages);
                setTotalRecords(data.pagination.totalRecords);
            } else {
                setReferrals(data);
            }
        } catch (error) {
            console.error('Error fetching referrals:', error);
            toast.error('Failed to load referrals');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleRejoinWhatsApp = (referral) => {
        const donorName = referral.donorName;
        const motivatorName = user?.name || 'Your Motivator';
        const mobile = referral.donorMobile;
        const amount = referral.amount;
        const is80G = referral.donorUserId?.pan ? 'true' : 'false';
        const pan = referral.donorUserId?.pan || '';
        const aadhaar = referral.donorUserId?.aadhaar || '';

        // Construct the re-donation link
        const baseUrl = window.location.origin;
        const donationUrl = `${baseUrl}/donate?motivator=${user?.mobile}&name=${encodeURIComponent(donorName)}&mobile=${mobile}&amount=${amount}&is80G=${is80G}&pan=${pan}&aadhaar=${aadhaar}`;

        const message = `Namaste ${donorName}, this is ${motivatorName} from The DharmArth Foundation. 🕉️\n\nYour monthly contribution of ₹${amount} has stopped. We invite you to continue your noble support for our mission. 🙏\n\nYou can restart your donation with just one click here: ${donationUrl}\n\nThank you for your kindness!`;

        const whatsappUrl = `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const exportToExcel = async (exportAll = false) => {
        try {
            setIsExporting(true);
            let dataToExport = referrals;

            if (exportAll) {
                const res = await api.get('/subscriptions/motivator/referrals', {
                    params: { status: statusFilter, exportAll: true }
                });
                dataToExport = res.data;
            }

            const worksheetData = dataToExport.map(ref => ({
                'Donor Name': ref.donorName,
                'Mobile': ref.donorMobile,
                'Amount': ref.amount,
                'Status': ref.status.toUpperCase(),
                'Started On': new Date(ref.createdAt).toLocaleDateString(),
                'User Code': ref.donorUserId?.referralCode || 'N/A',
                'Email': ref.donorUserId?.email || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(worksheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Referrals');
            XLSX.writeFile(wb, `Referrals_${statusFilter}_${new Date().toLocaleDateString()}.xlsx`);
            toast.success('Excel exported successfully');
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const exportToPDF = async (exportAll = false) => {
        try {
            setIsExporting(true);
            let dataToExport = referrals;

            if (exportAll) {
                const res = await api.get('/subscriptions/motivator/referrals', {
                    params: { status: statusFilter, exportAll: true }
                });
                dataToExport = res.data;
            }

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`My Referrals (${statusFilter.toUpperCase()})`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            const tableColumn = ["Donor", "Mobile", "Amount", "Started On", "Status"];
            const tableRows = dataToExport.map(ref => [
                ref.donorName,
                ref.donorMobile,
                `INR ${ref.amount}`,
                new Date(ref.createdAt).toLocaleDateString(),
                ref.status.toUpperCase()
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'striped',
                headStyles: { fillColor: [124, 58, 237] }
            });

            doc.save(`Referrals_${statusFilter}_${new Date().toLocaleDateString()}.pdf`);
            toast.success('PDF exported successfully');
        } catch (err) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="page-wrapper">
            <Navbar />
            <div className="my-referrals-container">
                <header className="referrals-header">
                    <div className="header-content">
                        <h1>
                            <Users className="header-icon" />
                            My Referrals
                        </h1>
                        <p>Track donors motivated by you and help them stay connected.</p>
                    </div>
                </header>

                <div className="referrals-controls">
                    <div className="status-filter-wrapper">
                        <div className="filter-group">
                            <Filter size={18} className="filter-icon" />
                            <span className="filter-label">Status:</span>
                            <select 
                                className="status-select"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="active">Active Donors</option>
                                <option value="inactive">Inactive Donors</option>
                            </select>
                        </div>
                    </div>

                    <div className="export-actions">
                        <div className="export-group">
                            <span className="export-label">Export page:</span>
                            <button className="btn-export excel" onClick={() => exportToExcel(false)} disabled={isExporting}>
                                <FileSpreadsheet size={16} />
                            </button>
                            <button className="btn-export pdf" onClick={() => exportToPDF(false)} disabled={isExporting}>
                                <FilePdf size={16} />
                            </button>
                        </div>
                        <div className="export-group">
                            <span className="export-label">Export All:</span>
                            <button className="btn-export-all excel" onClick={() => exportToExcel(true)} disabled={isExporting}>
                                Excel
                            </button>
                            <button className="btn-export-all pdf" onClick={() => exportToPDF(true)} disabled={isExporting}>
                                PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="referrals-list">
                    {loading ? (
                        <div className="loading-state">Loading your referrals...</div>
                    ) : referrals.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <h3>No {statusFilter} referrals found</h3>
                            <p>Share your referral code to motivate more people!</p>
                        </div>
                    ) : (
                        <>
                            <div className="referral-table-container">
                                <table className="referral-table">
                                    <thead>
                                        <tr>
                                            <th>Donor</th>
                                            <th>Mobile</th>
                                            <th>Contribution</th>
                                            <th>Started On</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals.map((ref) => (
                                            <tr key={ref._id}>
                                                <td>
                                                    <div className="donor-info-cell">
                                                        <div className="donor-avatar-small">
                                                            {ref.donorName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="donor-name-text">{ref.donorName}</span>
                                                    </div>
                                                </td>
                                                <td>{ref.donorMobile}</td>
                                                <td>
                                                    <span className="amount-text">₹{ref.amount}/mo</span>
                                                </td>
                                                <td>{new Date(ref.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className={`status-pill-small ${ref.status}`}>
                                                        {ref.status.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td>
                                                    {statusFilter === 'inactive' ? (
                                                        <button
                                                            className="rejoin-btn-small"
                                                            onClick={() => handleRejoinWhatsApp(ref)}
                                                        >
                                                            <Send size={14} />
                                                            Re-invite
                                                        </button>
                                                    ) : (
                                                        <span className="active-label">Active</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="referral-pagination">
                                    <div className="pagination-info">
                                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} donors
                                    </div>
                                    <div className="pagination-buttons">
                                        <button
                                            className="p-btn"
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                            if (
                                                totalPages <= 5 ||
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        className={`p-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === currentPage - 2 ||
                                                pageNum === currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="p-dots">...</span>;
                                            }
                                            return null;
                                        })}

                                        <button
                                            className="p-btn"
                                            disabled={currentPage === totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <style>{`
                .my-referrals-container {
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .referrals-header {
                    margin-bottom: 2.5rem;
                }
                .referrals-header h1 {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                .header-icon {
                    color: #7c3aed;
                }
                .referrals-header p {
                    color: #64748b;
                    font-size: 1.1rem;
                }

                .referrals-controls {
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                }
                .status-filter-wrapper {
                    display: flex;
                    align-items: center;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: white;
                    padding: 0.5rem 1rem;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }
                .filter-icon {
                    color: #64748b;
                }
                .filter-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .status-select {
                    border: none;
                    background: transparent;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1e293b;
                    cursor: pointer;
                    outline: none;
                    padding-right: 0.5rem;
                }

                .export-actions {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                }
                .export-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .export-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .btn-export {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-export:hover {
                    border-color: #7c3aed;
                    color: #7c3aed;
                    background: #f5f3ff;
                }
                .btn-export.pdf:hover {
                    border-color: #ef4444;
                    color: #ef4444;
                    background: #fef2f2;
                }
                .btn-export-all {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-export-all.excel {
                    background: #ecfdf5;
                    color: #059669;
                    border: 1px solid #bbf7d0;
                }
                .btn-export-all.pdf {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fee2e2;
                }
                .btn-export-all:hover {
                    filter: brightness(0.95);
                }

                .referral-table-container {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .referral-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .referral-table th {
                    background: #f8fafc;
                    padding: 1rem 1.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e2e8f0;
                }
                .referral-table td {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                    font-size: 0.95rem;
                }
                .referral-table tr:last-child td {
                    border-bottom: none;
                }

                .donor-info-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .donor-avatar-small {
                    width: 32px;
                    height: 32px;
                    background: #f3f4f6;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: #7c3aed;
                    font-size: 0.85rem;
                }
                .donor-name-text {
                    font-weight: 600;
                    color: #1e293b;
                }

                .amount-text {
                    font-weight: 700;
                    color: #7c3aed;
                }

                .status-pill-small {
                    display: inline-flex;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }
                .status-pill-small.active {
                    background: #ecfdf5;
                    color: #059669;
                }
                .status-pill-small.cancelled, .status-pill-small.created {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .rejoin-btn-small {
                    padding: 0.5rem 1rem;
                    background: #25d366;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: filter 0.2s;
                }
                .rejoin-btn-small:hover {
                    filter: brightness(0.9);
                }
                .active-label {
                    color: #64748b;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                /* Pagination Styles */
                .referral-pagination {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }
                .pagination-info {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .pagination-buttons {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }
                .p-btn {
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .p-btn:hover:not(:disabled) {
                    border-color: #7c3aed;
                    color: #7c3aed;
                    background: #f5f3ff;
                }
                .p-btn.active {
                    background: #7c3aed;
                    color: white;
                    border-color: #7c3aed;
                }
                .p-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .p-dots {
                    color: #94a3b8;
                    padding: 0 4px;
                }

                .loading-state, .empty-state {
                    text-align: center;
                    padding: 5rem 2rem;
                    color: #64748b;
                }
                .empty-state h3 {
                    color: #1e293b;
                    margin: 1rem 0 0.5rem;
                }
            `}</style>

            </div>
        </div>
    );
};

export default MyReferrals;
