import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, TrendingUp, Calendar, CreditCard, Filter } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const today = new Date();
    const [stats, setStats] = useState({
        userCount: 0,
        totalDonations: 0,
        activeCampaigns: 5,
        donationGrowth: { val: 0, isPositive: true },
        userGrowth: { val: 0, isPositive: true }
    });

    // Table Data State
    const [recentDonations, setRecentDonations] = useState([]);

    // Filter State
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // 1. Initial Load: Fetch ALL data for Stats & Charts
    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const [usersRes, donationsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/donate') // All time for stats
                ]);

                const donationList = donationsRes.data;
                const userList = usersRes.data;

                // --- Calculate Real Stats over Time ---
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const prevMonth = prevMonthDate.getMonth();
                const prevYear = prevMonthDate.getFullYear();

                // Filtration for Growth Stats
                const currentMonthDonations = donationList.filter(d => {
                    const dDate = new Date(d.createdAt);
                    return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
                });
                const prevMonthDonations = donationList.filter(d => {
                    const dDate = new Date(d.createdAt);
                    return dDate.getMonth() === prevMonth && dDate.getFullYear() === prevYear;
                });

                const currentMonthTotal = currentMonthDonations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const prevMonthTotal = prevMonthDonations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                const donationGrowthVal = calculateGrowth(currentMonthTotal, prevMonthTotal);

                const currentMonthUsers = userList.filter(u => {
                    const uDate = new Date(u.createdAt);
                    return uDate.getMonth() === currentMonth && uDate.getFullYear() === currentYear;
                });
                const prevMonthUsers = userList.filter(u => {
                    const uDate = new Date(u.createdAt);
                    return uDate.getMonth() === prevMonth && uDate.getFullYear() === prevYear;
                });
                const userGrowthVal = calculateGrowth(currentMonthUsers.length, prevMonthUsers.length);

                // Total Aggregate
                const totalAmount = donationList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

                // Chart Data (Last 7 Days from ALL data)
                const groupedByDate = donationList.reduce((acc, curr) => {
                    const date = new Date(curr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    acc[date] = (acc[date] || 0) + (Number(curr.amount) || 0);
                    return acc;
                }, {});

                const processedChartData = Object.keys(groupedByDate).map(date => ({
                    name: date,
                    amount: groupedByDate[date]
                })).slice(-7);

                setStats({
                    userCount: userList.length,
                    totalDonations: totalAmount,
                    activeCampaigns: 5,
                    donationGrowth: {
                        val: Math.abs(donationGrowthVal).toFixed(1),
                        isPositive: donationGrowthVal >= 0
                    },
                    userGrowth: {
                        val: Math.abs(userGrowthVal).toFixed(1),
                        isPositive: userGrowthVal >= 0
                    }
                });
                setChartData(processedChartData);
            } catch (error) {
                console.error("Dashboard global fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalStats();
    }, []);

    // 2. Filter Change: Fetch Filtered Data for Table
    useEffect(() => {
        const fetchFilteredDonations = async () => {
            setTableLoading(true);
            try {
                const res = await api.get(`/donate?month=${selectedMonth}&year=${selectedYear}`);
                setRecentDonations(res.data);
            } catch (error) {
                console.error("Filtered fetch error", error);
            } finally {
                setTableLoading(false);
            }
        };

        fetchFilteredDonations();
    }, [selectedMonth, selectedYear]);

    // Mock data for Pie Chart
    const pieData = [
        { name: 'Direct', value: 400 },
        { name: 'Referral', value: 300 },
        { name: 'Social', value: 300 },
        { name: 'Organic', value: 200 },
    ];
    const COLORS = ['#b66dff', '#00cbdc', '#fe7096', '#fdb901'];

    const months = [
        { val: 1, name: 'January' }, { val: 2, name: 'February' }, { val: 3, name: 'March' },
        { val: 4, name: 'April' }, { val: 5, name: 'May' }, { val: 6, name: 'June' },
        { val: 7, name: 'July' }, { val: 8, name: 'August' }, { val: 9, name: 'September' },
        { val: 10, name: 'October' }, { val: 11, name: 'November' }, { val: 12, name: 'December' }
    ];

    // Generate Year List (Current - 5)
    const currentYearVal = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYearVal - i);

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Loading dashboard analytics...
        </div>
    );

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <span className="dashboard-icon">
                        <Activity size={20} />
                    </span>
                    Dashboard Overview
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-gradient-1">
                    <div className="stat-content">
                        <h4>Total Donations</h4>
                        <p className="stat-value">₹{stats.totalDonations.toLocaleString()}</p>
                        <span className="stat-subtext">
                            {stats.donationGrowth.isPositive ? "Increased" : "Decreased"} by {stats.donationGrowth.val}%
                        </span>
                    </div>
                    <DollarSign className="stat-icon" size={40} />
                </div>

                <div className="stat-card stat-card-gradient-2">
                    <div className="stat-content">
                        <h4>Total Users</h4>
                        <p className="stat-value">{stats.userCount}</p>
                        <span className="stat-subtext">
                            {stats.userGrowth.isPositive ? "Increased" : "Decreased"} by {stats.userGrowth.val}%
                        </span>
                    </div>
                    <Users className="stat-icon" size={40} />
                </div>

                <div className="stat-card stat-card-gradient-3">
                    <div className="stat-content">
                        <h4>Active Campaigns</h4>
                        <p className="stat-value">{stats.activeCampaigns}</p>
                        <span className="stat-subtext">Running Smoothly</span>
                    </div>
                    <TrendingUp className="stat-icon" size={40} />
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Donation Trends</h3>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>Last 7 Activity Days</div>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#b66dff" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#b66dff" stopOpacity={0.1} />
                                    </linearGradient>
                                    <filter id="shadow" height="200%">
                                        <feDropShadow dx="0" dy="10" stdDeviation="15" floodColor="#b66dff" floodOpacity="0.4" />
                                    </filter>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#9c9fa6"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#6c757d', fontSize: 12, fontWeight: 500 }}
                                />
                                <YAxis
                                    stroke="#9c9fa6"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `₹${value}`}
                                    tick={{ fill: '#6c757d', fontSize: 12, fontWeight: 500 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(182, 109, 255, 0.2)', padding: '12px' }}
                                    itemStyle={{ color: '#b66dff', fontWeight: '600' }}
                                    formatter={(value) => [`₹${value}`, 'Amount']}
                                    cursor={{ stroke: '#b66dff', strokeWidth: 1, strokeDasharray: '5 5' }}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#b66dff"
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                    strokeWidth={4}
                                    filter="url(#shadow)"
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#b66dff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Traffic Sources</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
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
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Donations Table */}
            <div className="recent-donations-card">
                <div className="chart-header">
                    <h3 className="chart-title">Recent Donations</h3>
                    <div className="filter-controls" style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="form-select"
                                style={{ minWidth: '120px', paddingRight: '25px', cursor: 'pointer' }}
                            >
                                {months.map(m => (
                                    <option key={m.val} value={m.val}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="form-select"
                                style={{ minWidth: '100px', cursor: 'pointer' }}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                {tableLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Updating list...</div>
                ) : recentDonations.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                        No donations found for {months.find(m => m.val === selectedMonth)?.name} {selectedYear}.
                    </p>
                ) : (
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Donor</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Motivator</th>
                                    <th>ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDonations.map(d => (
                                    <tr key={d._id}>
                                        <td>
                                            <div className="donor-info">
                                                <span className="donor-name">{d.donorName}</span>
                                                <span className="donor-meta">{d.donorMobile}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="amount-badge">₹{d.amount}</span>
                                        </td>
                                        <td style={{ color: '#6c757d' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Calendar size={14} />
                                                {new Date(d.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ color: '#6c757d' }}>
                                            {d.motivatorMobile || <span style={{ opacity: 0.5 }}>Direct</span>}
                                        </td>
                                        <td>
                                            <span className="id-badge">{d._id.slice(-6).toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
