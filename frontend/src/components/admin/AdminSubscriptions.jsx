import React, { useState } from 'react';
import SubscriptionList from '../donation/SubscriptionList';
import { CreditCard, Search, Filter } from 'lucide-react';

const AdminSubscriptions = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="header-content">
                    <h1 className="admin-title">
                        <CreditCard className="title-icon" /> 
                        Subscription Management
                    </h1>
                    <p className="admin-subtitle">Monitor and manage all recurring monthly donations</p>
                </div>
            </div>

            <div className="admin-controls-card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search by Donor Name, Mobile or Subscription ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-group">
                    <Filter size={18} />
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="admin-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="created">Pending</option>
                    </select>
                </div>
            </div>

            <div className="admin-content-section">
                <SubscriptionList isAdmin={true} searchTerm={searchTerm} statusFilter={statusFilter} />
            </div>

            <style>{`
                .admin-page-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .admin-header {
                    margin-bottom: 2rem;
                }
                .admin-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e293b;
                }
                .title-icon {
                    color: var(--primary);
                }
                .admin-subtitle {
                    color: #64748b;
                    margin-top: 0.5rem;
                }
                .admin-controls-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .search-box {
                    flex: 1;
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .search-box input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 3rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .search-box input:focus {
                    border-color: var(--primary);
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #64748b;
                }
                .admin-select {
                    padding: 0.75rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    outline: none;
                    cursor: pointer;
                }
                .admin-content-section {
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
};

export default AdminSubscriptions;
