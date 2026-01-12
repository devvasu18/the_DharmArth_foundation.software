import React from 'react';
import { Users, DollarSign, Activity } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#e6fffa', borderRadius: '50%', color: '#319795' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#718096' }}>Total Users</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>12</span>
                    </div>
                </div>

                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#ebf8ff', borderRadius: '50%', color: '#3182ce' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#718096' }}>Total Donations</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>₹45,000</span>
                    </div>
                </div>

                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#faf5ff', borderRadius: '50%', color: '#805ad5' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#718096' }}>Active Campaigns</h4>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>5</span>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h3>Recent Activity</h3>
                <p>No recent activity.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
