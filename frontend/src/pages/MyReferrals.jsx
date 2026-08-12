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
    const { t, i18n } = useTranslation();
    const userSession = JSON.parse(localStorage.getItem('user') || '{}');
    const currentLang = i18n.language || userSession?.language || localStorage.getItem('i18nextLng') || 'hi';
    const isHindi = currentLang.startsWith('hi');

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
            toast.error(isHindi ? 'रेफरल लोड करने में विफल' : 'Failed to load referrals');
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
        const motivatorName = user?.name || (isHindi ? 'आपके प्रेरक' : 'Your Motivator');
        const mobile = referral.donorMobile;
        const amount = referral.amount;
        const is80G = referral.donorUserId?.pan ? 'true' : 'false';
        const pan = referral.donorUserId?.pan || '';
        const aadhaar = referral.donorUserId?.aadhaar || '';

        // Construct the re-donation link
        const baseUrl = window.location.origin;
        const donationUrl = `${baseUrl}/donate?motivator=${user?.mobile}&name=${encodeURIComponent(donorName)}&mobile=${mobile}&amount=${amount}&is80G=${is80G}&pan=${pan}&aadhaar=${aadhaar}`;

        const message = isHindi
            ? `नमस्ते ${donorName}, मैं द धर्मअर्थ मेडिकल फाउंडेशन से ${motivatorName} बोल रहा/रही हूँ। 🕉️\n\nआपका ₹${amount} का मासिक योगदान रुक गया है। हम आपको हमारे मिशन के लिए अपना महान समर्थन जारी रखने के लिए आमंत्रित करते हैं। 🙏\n\nआप केवल एक क्लिक में अपना दान फिर से शुरू कर सकते हैं: ${donationUrl}\n\nआपकी दयालुता के लिए धन्यवाद!`
            : `Namaste ${donorName}, this is ${motivatorName} from The Dharmarth Medical Foundation. 🕉️\n\nYour monthly contribution of ₹${amount} has stopped. We invite you to continue your noble support for our mission. 🙏\n\nYou can restart your donation with just one click here: ${donationUrl}\n\nThank you for your kindness!`;

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
                [isHindi ? 'दाता नाम' : 'Donor Name']: ref.donorName,
                [isHindi ? 'मोबाइल' : 'Mobile']: ref.donorMobile,
                [isHindi ? 'राशि' : 'Amount']: ref.amount,
                [isHindi ? 'स्थिति' : 'Status']: ref.status.toUpperCase(),
                [isHindi ? 'प्रारंभ तिथि' : 'Started On']: new Date(ref.createdAt).toLocaleDateString(),
                [isHindi ? 'यूजर कोड' : 'User Code']: ref.donorUserId?.referralCode || 'N/A',
                [isHindi ? 'ईमेल' : 'Email']: ref.donorUserId?.email || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(worksheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Referrals');
            XLSX.writeFile(wb, `Referrals_${statusFilter}_${new Date().toLocaleDateString()}.xlsx`);
            toast.success(isHindi ? 'एक्सेल सफलतापूर्वक एक्सपोर्ट हो गया' : 'Excel exported successfully');
        } catch (err) {
            toast.error(isHindi ? 'एक्सपोर्ट विफल' : 'Export failed');
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
            doc.text(`${isHindi ? 'मेरे रेफरल्स' : 'My Referrals'} (${statusFilter.toUpperCase()})`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            const tableColumn = [isHindi ? 'दाता' : 'Donor', isHindi ? 'मोबाइल' : 'Mobile', isHindi ? 'राशि' : 'Amount', isHindi ? 'प्रारंभ तिथि' : 'Started On', isHindi ? 'स्थिति' : 'Status'];
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
            toast.success(isHindi ? 'पीडीएफ सफलतापूर्वक एक्सपोर्ट हो गया' : 'PDF exported successfully');
        } catch (err) {
            toast.error(isHindi ? 'एक्सपोर्ट विफल' : 'Export failed');
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
                            {isHindi ? 'मेरे रेफरल्स' : 'My Referrals'}
                        </h1>
                        <p>{isHindi ? 'आपके द्वारा प्रेरित दाताओं को ट्रैक करें और सहायता में बने रहने में मदद करें।' : 'Track donors motivated by you and help them stay connected.'}</p>
                    </div>
                </header>

                <div className="referrals-controls">
                    <div className="status-filter-wrapper">
                        <div className="filter-group">
                            <Filter size={18} className="filter-icon" />
                            <span className="filter-label">{isHindi ? 'स्थिति:' : 'Status:'}</span>
                            <select
                                className="status-select"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="active">{isHindi ? 'सक्रिय दाता' : 'Active Donors'}</option>
                                <option value="inactive">{isHindi ? 'निष्क्रिय दाता' : 'Inactive Donors'}</option>
                            </select>
                        </div>
                    </div>

                    <div className="export-actions">
                        <div className="export-group">
                            <span className="export-label">{isHindi ? 'सभी एक्सपोर्ट करें:' : 'Export All:'}</span>
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
                        <div className="loading-state">{isHindi ? 'आपके रेफरल लोड हो रहे हैं...' : 'Loading your referrals...'}</div>
                    ) : referrals.length === 0 ? (
                        <div className="empty-state">
                            <Users size={48} />
                            <h3>{isHindi ? `कोई ${statusFilter === 'active' ? 'सक्रिय' : 'निष्क्रिय'} रेफरल नहीं मिले` : `No ${statusFilter} referrals found`}</h3>
                            <p>{isHindi ? 'अधिक लोगों को प्रेरित करने के लिए अपना रेफरल कोड शेयर करें!' : 'Share your referral code to motivate more people!'}</p>
                        </div>
                    ) : (
                        <>
                            <div className="referral-table-container hide-mobile">
                                <table className="referral-table">
                                    <thead>
                                        <tr>
                                            <th>{isHindi ? 'दाता' : 'Donor'}</th>
                                            <th>{isHindi ? 'मोबाइल' : 'Mobile'}</th>
                                            <th>{isHindi ? 'योगदान' : 'Contribution'}</th>
                                            <th>{isHindi ? 'प्रारंभ तिथि' : 'Started On'}</th>
                                            <th>{isHindi ? 'स्थिति' : 'Status'}</th>
                                            <th>{isHindi ? 'कार्रवाइयां' : 'Actions'}</th>
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
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span className={`level-badge ${ref.level1UserId === user?._id ? 'l1' : 'l2'}`}>
                                                                    {ref.level1UserId === user?._id ? 'L1' : 'L2'}
                                                                </span>
                                                                <span className="donor-name-text">{ref.donorName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{ref.donorMobile}</td>
                                                <td>
                                                    <span className="amount-text">₹{ref.amount}{isHindi ? '/महीना' : '/mo'}</span>
                                                </td>
                                                <td>{new Date(ref.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className={`status-pill-small ${ref.status}`}>
                                                        {ref.status === 'active' ? (isHindi ? 'सक्रिय' : 'ACTIVE') : (isHindi ? 'निष्क्रिय' : ref.status.toUpperCase())}
                                                    </div>
                                                </td>
                                                <td>
                                                    {statusFilter === 'inactive' ? (
                                                        <button
                                                            className="rejoin-btn-small"
                                                            onClick={() => handleRejoinWhatsApp(ref)}
                                                        >
                                                            <Send size={14} />
                                                            {isHindi ? 'पुनः आमंत्रित करें' : 'Re-invite'}
                                                        </button>
                                                    ) : (
                                                        <span className="active-label">{isHindi ? 'सक्रिय' : 'Active'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card Grid */}
                            <div className="referral-card-grid show-mobile">
                                {referrals.map((ref) => (
                                    <div className="referral-mobile-card" key={ref._id}>
                                        <div className="card-top">
                                            <div className="donor-info">
                                                <div className="donor-avatar">{ref.donorName.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span className={`level-badge ${ref.level1UserId === user?._id ? 'l1' : 'l2'}`}>
                                                            {ref.level1UserId === user?._id ? 'L1' : 'L2'}
                                                        </span>
                                                        <div className="name">{ref.donorName}</div>
                                                    </div>
                                                    <div className="mobile">{ref.donorMobile}</div>
                                                </div>
                                            </div>
                                            <div className={`status-badge ${ref.status}`}>
                                                {ref.status === 'active' ? (isHindi ? 'सक्रिय' : 'ACTIVE') : (isHindi ? 'निष्क्रिय' : ref.status.toUpperCase())}
                                            </div>
                                        </div>
                                        <div className="card-details">
                                            <div className="detail-item">
                                                <span className="label">{isHindi ? 'मासिक योगदान' : 'Monthly Contribution'}</span>
                                                <span className="value primary">₹{ref.amount}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">{isHindi ? 'प्रारंभ तिथि' : 'Started On'}</span>
                                                <span className="value">{new Date(ref.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {statusFilter === 'inactive' && (
                                            <button
                                                className="mobile-action-btn rejoin"
                                                onClick={() => handleRejoinWhatsApp(ref)}
                                            >
                                                <Send size={16} />
                                                {isHindi ? 'व्हाट्सएप पर पुनः आमंत्रित करें' : 'Send Re-invite on WhatsApp'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="referral-pagination">
                                    <div className="pagination-info">
                                        {isHindi
                                            ? `${totalRecords} दाताओं में से ${(currentPage - 1) * limit + 1} से ${Math.min(currentPage * limit, totalRecords)} दिख रहे हैं`
                                            : `Showing ${(currentPage - 1) * limit + 1} to ${Math.min(currentPage * limit, totalRecords)} of ${totalRecords} donors`
                                        }
                                    </div>
                                    <div className="pagination-buttons">
                                        <button
                                            className="p-btn"
                                            disabled={currentPage === 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                        >
                                            {isHindi ? 'पिछला' : 'Previous'}
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
                                            {isHindi ? 'अगला' : 'Next'}
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
                    color: #00bfa5;
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
                    border-color: #00bfa5;
                    color: #00bfa5;
                    background: #e6fffa;
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
                    color: #00bfa5;
                    font-size: 0.85rem;
                }
                .donor-name-text {
                    font-weight: 600;
                    color: #1e293b;
                }

                .level-badge {
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: white;
                    text-transform: uppercase;
                }
                .level-badge.l1 { background: #00bfa5; }
                .level-badge.l2 { background: #10b981; }

                .amount-text {
                    font-weight: 700;
                    color: #00bfa5;
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
                    border-color: #00bfa5;
                    color: #00bfa5;
                    background: #e6fffa;
                }
                .p-btn.active {
                    background: #00bfa5;
                    color: white;
                    border-color: #00bfa5;
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

                /* Responsive Logic */
                .show-mobile { display: none; }
                .hide-mobile { display: block; }

                @media (max-width: 768px) {
                    .my-referrals-container { padding: 1rem; }
                    .referrals-header h1 { font-size: 1.5rem; }
                    .referrals-header p { font-size: 0.95rem; }
                    
                    .referrals-controls {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .status-filter-wrapper, .export-actions {
                        width: 100%;
                    }
                    .export-actions {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .filter-group { width: 100%; justify-content: space-between; }
                    
                    .hide-mobile { display: none; }
                    .show-mobile { display: block; }

                    .referral-card-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }
                    .referral-mobile-card {
                        background: white;
                        border-radius: 16px;
                        border: 1px solid #e2e8f0;
                        padding: 1.25rem;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .card-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1.25rem;
                    }
                    .donor-info {
                        display: flex;
                        gap: 0.75rem;
                        align-items: center;
                    }
                    .donor-avatar {
                        width: 40px;
                        height: 40px;
                        background: #e6fffa;
                        color: #00bfa5;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 800;
                    }
                    .donor-info .name {
                        font-weight: 700;
                        color: #1e293b;
                        font-size: 1rem;
                    }
                    .donor-info .mobile {
                        font-size: 0.8rem;
                        color: #64748b;
                    }
                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 0.65rem;
                        font-weight: 800;
                        text-transform: uppercase;
                    }
                    .status-badge.active { background: #ecfdf5; color: #059669; }
                    .status-badge.inactive { background: #fef2f2; color: #dc2626; }
                    
                    .card-details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                        padding: 1rem 0;
                        border-top: 1px solid #f1f5f9;
                    }
                    .detail-item { display: flex; flex-direction: column; gap: 4px; }
                    .detail-item .label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                    .detail-item .value { font-size: 0.9rem; font-weight: 600; color: #334155; }
                    .detail-item .value.primary { color: #7c3aed; font-weight: 800; }

                    .mobile-action-btn {
                        width: 100%;
                        margin-top: 0.5rem;
                        padding: 0.75rem;
                        border-radius: 10px;
                        border: none;
                        font-weight: 700;
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        cursor: pointer;
                    }
                    .mobile-action-btn.rejoin { background: #25d366; color: white; }

                    .referral-pagination {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    .pagination-buttons {
                        width: 100%;
                        justify-content: center;
                        overflow-x: auto;
                        padding-bottom: 5px;
                    }
                }
            `}</style>

            </div>
        </div>
    );
};

export default MyReferrals;
