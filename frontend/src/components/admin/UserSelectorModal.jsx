import React, { useState, useEffect } from 'react';
import { Search, X, Check, User, Smartphone, Mail, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../services/api';

const UserSelectorModal = ({ isOpen, onClose, onSelect, initialSelected = [] }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [selectedIds, setSelectedIds] = useState(initialSelected);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, page]);

    // Search with debounce logic simplified
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (isOpen) {
                setPage(1);
                fetchUsers();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users', {
                params: {
                    page,
                    limit: 10,
                    search
                }
            });
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId) => {
        if (selectedIds.includes(userId)) {
            setSelectedIds(selectedIds.filter(id => id !== userId));
        } else {
            setSelectedIds([...selectedIds, userId]);
        }
    };

    const handleConfirm = () => {
        onSelect(selectedIds);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 3000, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', borderRadius: '24px', width: '90%', maxWidth: '800px',
                height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Select Users</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{selectedIds.length} users selected</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: '1rem 2rem', background: '#f8fafc' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name, mobile or email..."
                            style={{
                                width: '100%', padding: '10px 12px 10px 40px', borderRadius: '12px',
                                border: '1px solid #e2e8f0', fontSize: '0.9rem'
                            }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 2rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                            <Loader2 size={32} className="animate-spin" color="#00bfa5" />
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            No users found matching your search.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {users.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => toggleUserSelection(user._id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                                        borderRadius: '12px', border: '1px solid',
                                        borderColor: selectedIds.includes(user._id) ? '#00bfa5' : '#f1f5f9',
                                        background: selectedIds.includes(user._id) ? '#f0fdfa' : 'white',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '6px', border: '2px solid',
                                        borderColor: selectedIds.includes(user._id) ? '#00bfa5' : '#cbd5e1',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        background: selectedIds.includes(user._id) ? '#00bfa5' : 'transparent'
                                    }}>
                                        {selectedIds.includes(user._id) && <Check size={14} color="white" strokeWidth={4} />}
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{user.name}</div>
                                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Smartphone size={12} /> {user.mobile}</span>
                                            {user.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {user.email}</span>}
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                        {user.referralCode}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            style={{
                                padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                                color: page === 1 ? '#cbd5e1' : '#475569'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                            Page {page} of {pagination.totalPages || 1}
                        </span>
                        <button
                            disabled={page === pagination.totalPages || !pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                            style={{
                                padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0',
                                background: 'white', cursor: (page === pagination.totalPages || !pagination.totalPages) ? 'not-allowed' : 'pointer',
                                color: (page === pagination.totalPages || !pagination.totalPages) ? '#cbd5e1' : '#475569'
                            }}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            style={{
                                padding: '10px 28px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #00bfa5 0%, #00695c 100%)',
                                color: 'white', fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0, 191, 165, 0.3)'
                            }}
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSelectorModal;
