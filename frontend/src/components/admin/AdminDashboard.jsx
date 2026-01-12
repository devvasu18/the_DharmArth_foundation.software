import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity } from 'lucide-react';
import api from '../../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        userCount: 0,
        totalDonations: 0,
        activeCampaigns: 5 // Mock for now
    });
    const [donations, setDonations] = useState([]);
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

                setStats({
                    userCount: usersRes.data.length,
                    totalDonations: totalAmount,
                    activeCampaigns: 5
                });
                setDonations(donationList);
            } catch (error) {
                console.error("Dashboard fetch error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#e6fffa', borderRadius: '50%', color: '#319795' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#718096' }}>Total Users</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>{stats.userCount}</span>
                    </div>
                </div>

                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#ebf8ff', borderRadius: '50%', color: '#3182ce' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#718096' }}>Total Donations</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>₹{stats.totalDonations.toLocaleString()}</span>
                    </div>
                </div>

                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#faf5ff', borderRadius: '50%', color: '#805ad5' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#718096' }}>Active Campaigns</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>{stats.activeCampaigns}</span>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3>Recent Donations</h3>
                {donations.length === 0 ? (
                    <p>No donations yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Donor Name</th>
                                    <th>Donor Mobile</th>
                                    <th>Amount</th>
                                    <th>Motivator</th>
                                    <th>Donation ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.map(d => (
                                    <tr key={d._id}>
                                        <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                                        <td>{d.donorName}</td>
                                        <td>{d.donorMobile}</td>
                                        <td style={{ fontWeight: 'bold', color: '#38a169' }}>₹{d.amount}</td>
                                        <td>{d.motivatorMobile || '-'}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#666' }}>{d._id}</td>
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
