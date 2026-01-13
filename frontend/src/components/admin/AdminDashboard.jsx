import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        userCount: 0,
        totalDonations: 0,
        activeCampaigns: 5, // Mock for now
        growth: "+5%"
    });
    const [donations, setDonations] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [usersRes, donationsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/donate')
                ]);

                const donationList = donationsRes.data;
                const totalAmount = donationList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

                // Process data for Chart (Last 6 months/days) - Simplified for demo: Group by Date
                // We'll group by "Day" for the Area Chart
                const groupedByDate = donationList.reduce((acc, curr) => {
                    const date = new Date(curr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    acc[date] = (acc[date] || 0) + (Number(curr.amount) || 0);
                    return acc;
                }, {});

                const processedChartData = Object.keys(groupedByDate).map(date => ({
                    name: date,
                    amount: groupedByDate[date]
                })).slice(-7); // Last 7 data points for clean view

                setStats({
                    userCount: usersRes.data.length,
                    totalDonations: totalAmount,
                    activeCampaigns: 5,
                    growth: "+12%" // calculated dynamically in real app
                });
                setDonations(donationList.slice(0, 10)); // Top 10 recent
                setChartData(processedChartData);
            } catch (error) {
                console.error("Dashboard fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Mock data for Pie Chart (Traffic Sources)
    const pieData = [
        { name: 'Direct', value: 400 },
        { name: 'Referral', value: 300 },
        { name: 'Social', value: 300 },
        { name: 'Organic', value: 200 },
    ];
    const COLORS = ['#b66dff', '#00cbdc', '#fe7096', '#fdb901'];

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
                        <span className="stat-subtext">Increased by 60%</span>
                    </div>
                    <DollarSign className="stat-icon" size={40} />
                </div>

                <div className="stat-card stat-card-gradient-2">
                    <div className="stat-content">
                        <h4>Total Users</h4>
                        <p className="stat-value">{stats.userCount}</p>
                        <span className="stat-subtext">Decreased by 10%</span>
                    </div>
                    <Users className="stat-icon" size={40} />
                </div>

                <div className="stat-card stat-card-gradient-3">
                    <div className="stat-content">
                        <h4>Active Campaigns</h4>
                        <p className="stat-value">{stats.activeCampaigns}</p>
                        <span className="stat-subtext">Increased by 5%</span>
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
                                        <stop offset="5%" stopColor="#b66dff" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#b66dff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#cbd5e0" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#cbd5e0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`₹${value}`, 'Amount']}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <Area type="monotone" dataKey="amount" stroke="#b66dff" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={3} />
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
                </div>
                {donations.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#999' }}>No donations found.</p>
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
                                {donations.map(d => (
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
