import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { Download, Filter, Calendar, TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, ChevronLeft, ChevronRight, Search, FileText, ArrowRight, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './CommissionReports.css';

const COLORS = ['#00bfa5', '#8b5cf6', '#FFBB28', '#FF8042'];

const CommissionReports = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        preset: 'MONTH', // 'TODAY', 'WEEK', 'MONTH', 'CUSTOM'
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        transactionType: 'ALL'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchId, setSearchId] = useState('');

    // Fetch Data
    useEffect(() => {
        fetchReports();
    }, [filters, currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                period: filters.preset === 'MONTH' || filters.preset === 'CUSTOM' ? 'day' : 'day', // For chart granularity
                page: currentPage,
                limit: 20
            };

            const res = await api.get('/transactions/commission-reports', { params });

            // Fill missing dates in trend chart with 0
            if (res.data?.charts?.trend && (filters.preset === 'MONTH' || filters.preset === 'CUSTOM' || filters.preset === 'WEEK')) {
                const filledTrend = [];
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);

                // Create a map for quick lookup
                const trendMap = new Map(res.data.charts.trend.map(item => [item._id, item.amount]));

                // Iterate from start to end date
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    filledTrend.push({
                        _id: dateStr,
                        amount: trendMap.get(dateStr) || 0
                    });
                }
                res.data.charts.trend = filledTrend;
            }

            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Handlers
    const handlePresetChange = (preset) => {
        const today = new Date();
        let start = '';
        let end = today.toISOString().split('T')[0];

        if (preset === 'TODAY') {
            start = end;
        } else if (preset === 'WEEK') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);
            start = weekStart.toISOString().split('T')[0];
        } else if (preset === 'MONTH') {
            start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        setFilters(prev => ({ ...prev, preset, startDate: start, endDate: end }));
        setCurrentPage(1);
    };

    const handleDateChange = (e, field) => {
        setFilters(prev => ({ ...prev, [field]: e.target.value, preset: 'CUSTOM' }));
        setCurrentPage(1);
    };

    // Exports
    const exportExcel = () => {
        if (!data?.table?.data) return;

        // Flatten data for export
        const exportData = data.table.data.map(row => ({
            Date: new Date(row.date).toLocaleDateString(),
            'Transaction ID': row.transactionId,
            'Donation Amount': row.amount,
            'L1 Commission': row.l1Commission,
            'L2 Commission': row.l2Commission,
            'Total Commission': row.totalCommission,
            'Platform Balance': row.platformBalance,
            Status: row.status
        }));

        // Add Summary Row at bottom or separate sheet? Single sheet is easier.
        // Let's add specific summary sheet
        const summaryData = [
            { Metric: 'Total Donations', Value: data.summary.totalDonations },
            { Metric: 'Wallet Donations', Value: data.summary.totalWalletDonations },
            { Metric: 'Total Commission Paid', Value: data.summary.totalCommissionPaid },
            { Metric: 'Platform Balance', Value: data.summary.platformBalance }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);

        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        XLSX.writeFile(wb, "Commission_Report.xlsx");
    };

    const exportPDF = () => {
        if (!data?.table?.data) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Commission Report", 14, 20);

        doc.setFontSize(10);
        doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 30);
        doc.text(`Total Donations: ₹${data.summary.totalDonations}`, 14, 38);
        doc.text(`Wallet Donations: ₹${data.summary.totalWalletDonations}`, 80, 38);
        doc.text(`Platform Balance: ₹${data.summary.platformBalance}`, 14, 44);

        const tableColumn = ["Date", "Txn ID", "Amount", "L1 Comm", "L2 Comm", "Balance"];
        const tableRows = [];

        data.table.data.forEach(row => {
            const date = new Date(row.date).toLocaleDateString();
            const txnData = [
                date,
                row.transactionId || '-',
                row.amount,
                row.l1Commission.toFixed(1),
                row.l2Commission.toFixed(1),
                row.platformBalance.toFixed(1)
            ];
            tableRows.push(txnData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
        });

        doc.save("Commission_Report.pdf");
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

    if (!data && loading) return <div className="p-8">Loading Report Data...</div>;
    if (!data) return <div className="p-8">No data available</div>;

    const { summary, charts, insights } = data;

    // Pie Data
    const pieData = [
        { name: 'Level 1', value: summary.l1Commission },
        { name: 'Level 2', value: summary.l2Commission }
    ];

    return (
        <div className="commission-reports-container">
            {/* Header */}
            <div className="report-header">
                <div className="report-title">
                    <h1>Commission Reports</h1>
                    <p>Financial overview of platform commissions and balances</p>
                </div>

                {/* Export Tools */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="export-btn" onClick={exportExcel}>
                        <Download size={18} /> Excel
                    </button>
                    <button className="export-btn" onClick={exportPDF} style={{ background: '#ef4444' }}>
                        <FileText size={18} /> PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="filter-group">
                    <Filter size={18} className="text-gray-400" />
                    <label>Period:</label>
                    <div className="filter-presets">
                        {['TODAY', 'WEEK', 'MONTH'].map(p => (
                            <button
                                key={p}
                                className={`preset-btn ${filters.preset === p ? 'active' : ''}`}
                                onClick={() => handlePresetChange(p)}
                            >
                                {p === 'TODAY' ? 'Today' : p === 'WEEK' ? 'This Week' : 'This Month'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <label>Custom:</label>
                    <input type="date" className="filter-input" value={filters.startDate} onChange={e => handleDateChange(e, 'startDate')} />
                    <span>to</span>
                    <input type="date" className="filter-input" value={filters.endDate} onChange={e => handleDateChange(e, 'endDate')} />
                </div>

                <div className="filter-group" style={{ marginLeft: 'auto' }}>
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Search Txn ID..."
                        style={{ width: 140 }}
                    />
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="summary-cards-grid">
                {/* 1. Total Donations */}
                <div className="summary-card">
                    <div className="card-icon"><DollarSign size={24} /></div>
                    <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', paddingRight: '40px' }}>
                        <span className="card-label" style={{ marginBottom: 0 }}>Total Donations</span>
                        <button
                            className="view-btn-mini"
                            onClick={() => navigate('/admin/transaction-management', {
                                state: {
                                    filters: {
                                        start: filters.startDate,
                                        end: filters.endDate,
                                        commissionFilter: 'ALL'
                                    }
                                }
                            })}
                        >
                            View <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="card-content">
                        <span className="card-value">{formatCurrency(summary.totalDonations)}</span>
                        <small className="text-neutral">Collected</small>
                    </div>
                </div>

                {/* 2. Total Commission (Expense) */}
                <div className="summary-card">
                    <div className="card-icon"><TrendingUp size={24} /></div>
                    <div className="card-content">
                        <span className="card-label">Total Commission</span>
                        <span className="card-value text-danger">-{formatCurrency(summary.totalCommissionPaid)}</span>

                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                            {summary.growthPercentage >= 0 ?
                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <TrendingUp size={14} /> {summary.growthPercentage?.toFixed(1) || 0}%
                                </span>
                                :
                                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <TrendingDown size={14} /> {Math.abs(summary.growthPercentage || 0).toFixed(1)}%
                                </span>
                            }
                            <span className="text-neutral" style={{ marginLeft: 6 }}>vs last period</span>
                        </div>
                    </div>
                </div>

                {/* 3. L1 Commission */}
                <div className="summary-card">
                    <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span className="card-label" style={{ marginBottom: 0 }}>L1 Commission</span>
                        <button
                            className="view-btn-mini"
                            onClick={() => navigate('/admin/transaction-management', {
                                state: {
                                    filters: {
                                        start: filters.startDate,
                                        end: filters.endDate,
                                        commissionFilter: 'L1'
                                    }
                                }
                            })}
                        >
                            View <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="card-content">
                        <span className="card-value">{formatCurrency(summary.l1Commission)}</span>
                    </div>
                </div>

                {/* 4. L2 Commission */}
                <div className="summary-card">
                    <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span className="card-label" style={{ marginBottom: 0 }}>L2 Commission</span>
                        <button
                            className="view-btn-mini"
                            onClick={() => navigate('/admin/transaction-management', {
                                state: {
                                    filters: {
                                        start: filters.startDate,
                                        end: filters.endDate,
                                        commissionFilter: 'L2'
                                    }
                                }
                            })}
                        >
                            View <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="card-content">
                        <span className="card-value">{formatCurrency(summary.l2Commission)}</span>
                    </div>
                </div>

                <div className="summary-card highlight">
                    <div className="card-icon"><DollarSign size={24} /></div>
                    <div className="card-content">
                        <span className="card-label">Platform Balance</span>
                        <span className="card-value">{formatCurrency(summary.platformBalance)}</span>
                        <small style={{ opacity: 0.8 }}>Net Earnings</small>
                    </div>
                </div>

                {/* 6. Wallet Donations */}
                <div className="summary-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <div className="card-icon" style={{ color: '#8b5cf6' }}><DollarSign size={24} /></div>
                    <div className="card-content">
                        <span className="card-label">Wallet Donations</span>
                        <span className="card-value">{formatCurrency(summary.totalWalletDonations)}</span>
                        <small className="text-neutral">From Internal Wallets</small>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Pie Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Commission Distribution</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Monthly Commission Trend</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={charts.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(val) => [formatCurrency(val), 'Commission']}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#00bfa5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Insights Section */}
            <div className="insights-grid" style={{ marginBottom: '2rem' }}>
                <div className="insight-card">
                    <div className="insight-header">
                        <h3>Pending Commissions</h3>
                    </div>
                    <div className="leader-item">
                        <div className="leader-info">
                            <span className="leader-name">Estimated Pending</span>
                            <span className="leader-mobile">{summary.pendingCount} pending donations</span>
                        </div>
                        <div className="leader-amount text-neutral">
                            {formatCurrency(summary.pendingAmount)}
                        </div>
                    </div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <h3>Top L1 Earners</h3>
                    </div>
                    <div className="leaderboard-list">
                        {insights.topL1.map((user, idx) => (
                            <div className="leader-item" key={idx}>
                                <div className="leader-info">
                                    <span className="leader-name">{user.name}</span>
                                    <span className="leader-mobile">ID: {String(user._id).substring(0, 8)}...</span>
                                </div>
                                <div className="leader-amount">
                                    {formatCurrency(user.total)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <h3>Top L2 Earners</h3>
                    </div>
                    <div className="leaderboard-list">
                        {insights.topL2.map((user, idx) => (
                            <div className="leader-item" key={idx}>
                                <div className="leader-info">
                                    <span className="leader-name">{user.name}</span>
                                    <span className="leader-mobile">ID: {String(user._id).substring(0, 8)}...</span>
                                </div>
                                <div className="leader-amount">
                                    {formatCurrency(user.total)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <h3>Highest Donation Sources</h3>
                    </div>
                    <div className="leaderboard-list">
                        {insights.topSource.map((user, idx) => (
                            <div className="leader-item" key={idx}>
                                <div className="leader-info">
                                    <span className="leader-name">{user.name}</span>
                                    <span className="leader-mobile">ID: {String(user._id).substring(0, 8)}...</span>
                                </div>
                                <div className="leader-amount">
                                    {formatCurrency(user.totalDonated)}
                                </div>
                            </div>
                        ))}
                        {insights.topSource.length === 0 && <div style={{ padding: 10, color: '#94a3b8', fontSize: '0.9rem' }}>No data available</div>}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default CommissionReports;
