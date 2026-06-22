import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../services/api';
import './AdminAvailability.css';

const API_URL = `${API_BASE_URL}/api`;

const getAuthHeaders = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const { token } = JSON.parse(storedUser);
            if (token) {
                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };
            }
        } catch (e) {
            console.error('Error getting auth token', e);
        }
    }
    return { 'Content-Type': 'application/json' };
};

const formatDateLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AdminAvailability = () => {
    const [doctors, setDoctors] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [activeTab, setActiveTab] = useState('government'); // 'government' or 'clinic'
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        fetchDailyAvailability();
    }, [activeTab]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/doctors`);
            const data = await response.json();
            setDoctors(data);
        } catch (error) {
            toast.error('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyAvailability = async () => {
        if (activeTab !== 'government') return;
        try {
            const dateStr = formatDateLocal(new Date());
            const response = await fetch(
                `${API_URL}/availability?startDate=${dateStr}&endDate=${dateStr}&type=government`
            );
            if (response.ok) {
                const data = await response.json();
                setAvailability(data);
            }
        } catch (error) {
            console.error('Failed to fetch daily availability', error);
        }
    };

    const handleToggleDailyAvailability = async (doctorId, isEnabled) => {
        try {
            const dateStr = formatDateLocal(new Date());
            const response = await fetch(`${API_URL}/availability/toggle-daily`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ doctorId, date: dateStr, isEnabled })
            });
            if (response.ok) {
                toast.success(`Daily status updated to ${isEnabled ? 'Enabled' : 'Disabled'}`);
                fetchDailyAvailability();
            } else {
                toast.error('Failed to update daily availability');
            }
        } catch (error) {
            toast.error('Error updating availability');
        }
    };

    // Filter doctors based on active tab and search term
    const filteredDoctors = doctors.filter(doctor => {
        const matchesTab = activeTab === 'government'
            ? (doctor.type === 'government' || doctor.type === 'both')
            : (doctor.type === 'clinic' || doctor.type === 'both');

        const matchesSearch = 
            (doctor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doctor.title || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const getDailyStatusForDoctor = (doctorId) => {
        const record = availability.find(a => a.doctorId && a.doctorId._id === doctorId);
        return record ? record.isEnabled : true; // Default to true if no record exists yet
    };

    if (loading && doctors.length === 0) {
        return <div className="admin-availability-loading">Loading doctors list...</div>;
    }

    return (
        <div className="admin-availability">
            <div className="admin-availability-header">
                <h2>Doctor Availability Management</h2>
            </div>

            {/* Custom Tab Navigation */}
            <div className="availability-tabs">
                <button
                    className={`tab-button ${activeTab === 'government' ? 'active' : ''}`}
                    onClick={() => setActiveTab('government')}
                >
                    🏥 Government Doctors
                </button>
                <button
                    className={`tab-button ${activeTab === 'clinic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clinic')}
                >
                    🏨 Private Doctors
                </button>
            </div>

            <div className="tab-content-panel">
                <div className="control-bar">
                    {/* Search Field */}
                    <div className="search-field">
                        <input
                            type="text"
                            placeholder="Search by doctor name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* Today indicator (Only for Government tab) */}
                    {activeTab === 'government' && (
                        <div className="private-info-banner" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                            <span>📅</span> Daily availability is managed specifically for <strong>Today ({new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})</strong>.
                        </div>
                    )}

                    {/* Auto-Enabled Banner (Only for Private Clinic Tab) */}
                    {activeTab === 'clinic' && (
                        <div className="private-info-banner">
                            <span>⚡</span> Private clinic availability is automatically active for the entire month as long as the doctor status is active.
                        </div>
                    )}
                </div>

                {/* Doctors Table */}
                <div className="table-responsive">
                    <table className="availability-table">
                        <thead>
                            <tr>
                                <th>Doctor Details</th>
                                <th>Specialty</th>
                                <th width="220" style={{ textAlign: 'center' }}>Daily Availability</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="no-data-cell">
                                        No doctors found matching the search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredDoctors.map((doctor) => {
                                    const isDailyAvailable = activeTab === 'government' 
                                        ? getDailyStatusForDoctor(doctor._id) 
                                        : true;

                                    return (
                                        <tr 
                                            key={doctor._id} 
                                            className={!doctor.isActive ? 'inactive-row' : ''}
                                        >
                                            <td>
                                                <div className="doctor-profile-cell">
                                                    {doctor.photo ? (
                                                        <img 
                                                            src={doctor.photo.startsWith('http') ? doctor.photo : `${API_BASE_URL}${doctor.photo.startsWith('/') ? '' : '/'}${doctor.photo}`} 
                                                            alt={doctor.name} 
                                                            className="doctor-avatar-mini"
                                                        />
                                                    ) : (
                                                        <div className="doctor-avatar-placeholder">👨‍⚕️</div>
                                                    )}
                                                    <div className="doctor-name-info">
                                                        <span className="doctor-name">{doctor.name}</span>
                                                        {doctor.name_hi && (
                                                            <span className="doctor-name-hi">{doctor.name_hi}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="specialty-cell">
                                                    <span className="specialty-text">{doctor.title}</span>
                                                    <span className="hospital-badge-mini">
                                                        {doctor.type === 'both' ? 'Both Setting' : doctor.type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {activeTab === 'government' ? (
                                                    <div className="toggle-container">
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={isDailyAvailable}
                                                                disabled={!doctor.isActive}
                                                                onChange={(e) => handleToggleDailyAvailability(doctor._id, e.target.checked)}
                                                            />
                                                            <span className="slider round"></span>
                                                        </label>
                                                        <span 
                                                            className={`status-text ${!doctor.isActive ? 'disabled' : isDailyAvailable ? 'active' : 'inactive'}`}
                                                        >
                                                            {!doctor.isActive ? 'Disabled (Doctor Inactive)' : isDailyAvailable ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '20px',
                                                        background: doctor.isActive ? '#e6faf5' : '#fee2e2',
                                                        color: doctor.isActive ? '#00bf9a' : '#ef4444',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '700',
                                                        border: doctor.isActive ? '1px solid #c2f4e8' : '1px solid #fca5a5',
                                                        display: 'inline-block'
                                                    }}>
                                                        {doctor.isActive ? 'Auto-Enabled' : 'Doctor Inactive'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAvailability;
