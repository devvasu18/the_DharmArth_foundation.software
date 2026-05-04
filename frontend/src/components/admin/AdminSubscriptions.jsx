import React, { useState } from 'react';
import SubscriptionList from '../donation/SubscriptionList';
import { CreditCard, Search, Filter } from 'lucide-react';

const AdminSubscriptions = () => {
    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="header-content">
                    <h1 className="admin-title">
                        <CreditCard className="title-icon" />
                        Subscription Management
                    </h1>
                </div>
            </div>

            <div className="admin-content-section">
                <SubscriptionList isAdmin={true} />
            </div>

            <style>{`
                .admin-page-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .admin-header {
                    margin-bottom: 1.5rem;
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
                .admin-content-section {
                    margin-top: 0;
                }
            `}</style>
        </div>
    );
};

export default AdminSubscriptions;
