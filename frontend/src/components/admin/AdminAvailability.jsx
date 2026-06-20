import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../services/api';
import './AdminAvailability.css';

const API_URL = `${API_BASE_URL}/api`;

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
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [monthDates, setMonthDates] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [quickSetType, setQuickSetType] = useState('all'); // 'all' or 'custom'
    const [selectedWeekdays, setSelectedWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);

    // Custom Dropdown State
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [scheduleForm, setScheduleForm] = useState({
        timeSlots: [
            { period: 'Morning', startTime: '09:00', endTime: '12:00', status: 'Available' }
        ],
        isEnabled: true,
        emergencyAvailable: false,
        notes: ''
    });

    useEffect(() => {
        fetchDoctors();

        // Click outside listener for dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        generateMonthDates();
    }, [currentMonth]);

    useEffect(() => {
        if (selectedDoctor && monthDates.length > 0) {
            fetchAvailability();
        }
    }, [selectedDoctor, monthDates]);

    const generateMonthDates = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth(); // 0-11
        const lastDay = new Date(year, month + 1, 0).getDate();

        const dates = [];
        for (let i = 1; i <= lastDay; i++) {
            const date = new Date(year, month, i);
            date.setHours(0, 0, 0, 0);
            dates.push(date);
        }
        setMonthDates(dates);
    };

    const fetchDoctors = async () => {
        try {
            const response = await fetch(`${API_URL}/doctors?isActive=true`);
            const data = await response.json();
            setDoctors(data);
            if (data.length > 0) {
                setSelectedDoctor(data[0]);
            }
        } catch (error) {
            toast.error('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailability = async () => {
        if (!selectedDoctor || monthDates.length === 0) return;

        try {
            const startDate = formatDateLocal(monthDates[0]);
            const endDate = formatDateLocal(monthDates[monthDates.length - 1]);

            console.log('Fetching availability:', { doctorId: selectedDoctor._id, startDate, endDate });

            const response = await fetch(
                `${API_URL}/availability?doctorId=${selectedDoctor._id}&startDate=${startDate}&endDate=${endDate}`
            );
            const data = await response.json();
            console.log('Fetched availability data:', data);
            setAvailability(data);
        } catch (error) {
            console.error('Error fetching availability:', error);
            toast.error('Failed to fetch availability');
        }
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getAvailabilityForDate = (date, type) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return availability.find(a => {
            const availDate = new Date(a.date);
            const localDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate());

            const matchesDate = localDate.getTime() === targetDate.getTime();
            const matchesType = !type || a.hospitalType === type;

            return matchesDate && matchesType;
        });
    };

    const loadScheduleIntoForm = (date, type) => {
        const existing = getAvailabilityForDate(date, type);

        if (existing) {
            const cleanTimeSlots = existing.timeSlots.map(slot => ({
                period: slot.period,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: slot.status
            }));

            setScheduleForm({
                timeSlots: cleanTimeSlots,
                isEnabled: existing.isEnabled,
                emergencyAvailable: existing.emergencyAvailable,
                notes: existing.notes || '',
                hospitalType: type
            });
        } else {
            setScheduleForm({
                timeSlots: [
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', status: 'Available' }
                ],
                isEnabled: true,
                emergencyAvailable: false,
                notes: '',
                hospitalType: type
            });
        }
    };

    const openScheduleModal = (date) => {
        setSelectedDate(date);
        const initialType = selectedDoctor.type === 'both' ? 'government' : selectedDoctor.type;
        loadScheduleIntoForm(date, initialType);
        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async () => {
        if (!selectedDoctor || !selectedDate) {
            toast.error('Please select doctor and date');
            return;
        }

        try {
            // Format date properly - use local date components to avoid timezone issues
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            // If doctor works in both, use the selected hospital type from form, otherwise use doctor's type
            const hospitalType = (selectedDoctor.type === 'both')
                ? scheduleForm.hospitalType
                : selectedDoctor.type;

            const payload = {
                doctorId: selectedDoctor._id,
                date: dateString, // YYYY-MM-DD format in local timezone
                hospitalType,
                dayName: getDayName(selectedDate),
                timeSlots: scheduleForm.timeSlots,
                isEnabled: scheduleForm.isEnabled,
                emergencyAvailable: scheduleForm.emergencyAvailable,
                notes: scheduleForm.notes || ''
            };

            console.log('=== SAVING SCHEDULE ===');
            console.log('Payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(`${API_URL}/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                toast.success('Schedule saved successfully!');
                console.log('✅ Saved! Refreshing...');
                await fetchAvailability(); // Wait for refresh
                setShowScheduleModal(false);
            } else {
                console.error('❌ Server error:', data);
                toast.error(data.message || 'Failed to save schedule');
            }
        } catch (error) {
            console.error('❌ Catch error:', error);
            toast.error('Error: ' + error.message);
        }
    };

    const addTimeSlot = () => {
        setScheduleForm(prev => ({
            ...prev,
            timeSlots: [
                ...prev.timeSlots,
                { period: 'Afternoon', startTime: '14:00', endTime: '17:00', status: 'Available' }
            ]
        }));
    };

    const removeTimeSlot = (index) => {
        setScheduleForm(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter((_, i) => i !== index)
        }));
    };

    const updateTimeSlot = (index, field, value) => {
        setScheduleForm(prev => {
            const updatedSlots = prev.timeSlots.map((slot, i) => {
                if (i === index) {
                    const updatedSlot = { ...slot, [field]: value };

                    // Auto-select period if startTime changes
                    if (field === 'startTime') {
                        const hour = parseInt(value.split(':')[0]);
                        if (hour < 12) {
                            updatedSlot.period = 'Morning';
                        } else if (hour < 16) {
                            updatedSlot.period = 'Afternoon';
                        } else {
                            updatedSlot.period = 'Evening';
                        }
                    }

                    return updatedSlot;
                }
                return slot;
            });

            return {
                ...prev,
                timeSlots: updatedSlots
            };
        });
    };

    const handleConfirmQuickSet = async () => {
        setShowConfirmModal(false);
        if (!selectedDoctor) return;

        try {
            const availabilities = [];

            monthDates.forEach((date) => {
                const dayOfWeek = date.getDay(); // 0 = Sunday, etc.
                if (quickSetType === 'custom' && !selectedWeekdays.includes(dayOfWeek)) {
                    return;
                }
                const dateString = formatDateLocal(date);
                const dayName = getDayName(date);

                // Add Government availability if applicable
                if (selectedDoctor.type === 'government' || selectedDoctor.type === 'both') {
                    const govSlotsFiltered = selectedDoctor.defaultTimeSlots
                        ? selectedDoctor.defaultTimeSlots.filter(slot => slot.hospitalType === 'government' || !slot.hospitalType)
                        : [];

                    const govSlots = govSlotsFiltered.map(slot => ({
                        period: slot.period,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        status: 'Available'
                    }));

                    availabilities.push({
                        date: dateString,
                        dayName,
                        timeSlots: govSlots,
                        isEnabled: true,
                        hospitalType: 'government',
                        emergencyAvailable: false,
                        notes: ''
                    });
                }

                // Add Private Clinic availability if applicable
                if (selectedDoctor.type === 'clinic' || selectedDoctor.type === 'both') {
                    const clinicSlotsFiltered = selectedDoctor.defaultTimeSlots
                        ? selectedDoctor.defaultTimeSlots.filter(slot => slot.hospitalType === 'clinic')
                        : [];

                    const clinicSlots = clinicSlotsFiltered.map(slot => ({
                        period: slot.period,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        status: 'Available'
                    }));

                    availabilities.push({
                        date: dateString,
                        dayName,
                        timeSlots: clinicSlots,
                        isEnabled: true,
                        hospitalType: 'clinic',
                        emergencyAvailable: false,
                        notes: ''
                    });
                }
            });

            const response = await fetch(`${API_URL}/availability/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: selectedDoctor._id,
                    availabilities
                })
            });

            if (response.ok) {
                toast.success('Month schedule set successfully!');
                fetchAvailability();
            } else {
                toast.error('Failed to set month schedule');
            }
        } catch (error) {
            toast.error('Error setting month schedule');
        }
    };

    if (loading) {
        return <div className="admin-availability-loading">Loading...</div>;
    }

    return (
        <div className="admin-availability">
            <div className="admin-availability-header">
                <h3>Doctor Availability Management</h3>
                <button className="btn-quick-set" onClick={() => {
                    setQuickSetType('all');
                    setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6]);
                    setShowConfirmModal(true);
                }}>
                    ⚡ Quick Set Month
                </button>
            </div>



            <div className="doctor-selector">
                <label>Select Doctor ({doctors.length}):</label>

                <div className="custom-dropdown" ref={dropdownRef}>
                    <div
                        className="dropdown-selected"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {selectedDoctor
                            ? `${selectedDoctor.name} - ${selectedDoctor.title} (${selectedDoctor.type === 'government' ? 'Government' : 'Clinic'})`
                            : '-- Select a Doctor --'}
                        <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                    </div>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-search">
                                <input
                                    type="text"
                                    placeholder="Search doctor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="dropdown-list">
                                {doctors
                                    .filter(doctor => {
                                        return (doctor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (doctor.title || '').toLowerCase().includes(searchTerm.toLowerCase());
                                    })
                                    .map(doctor => (
                                        <div
                                            key={doctor._id}
                                            className={`dropdown-item ${selectedDoctor?._id === doctor._id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedDoctor(doctor);
                                                setIsDropdownOpen(false);
                                                setSearchTerm('');
                                            }}
                                        >
                                            <div className="item-name">{doctor.name}</div>
                                            <div className="item-meta">
                                                {doctor.title} • {doctor.type === 'government' ? 'Government' : doctor.type === 'clinic' ? 'Clinic' : 'Works in Both'}
                                            </div>
                                        </div>
                                    ))}
                                {doctors.filter(doctor => {
                                    return (doctor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (doctor.title || '').toLowerCase().includes(searchTerm.toLowerCase());
                                }).length === 0 && (
                                        <div className="dropdown-no-results">No doctors found</div>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedDoctor && (
                <div className="selected-doctor-info">
                    <div className="doctor-info-card">
                        <div className="doctor-photo-small">
                            {selectedDoctor.photo ? (
                                <img src={selectedDoctor.photo} alt={selectedDoctor.name} />
                            ) : (
                                <div className="photo-placeholder-small">👨‍⚕️</div>
                            )}
                        </div>
                        <div>
                            <h3>{selectedDoctor.name}</h3>
                            <p>{selectedDoctor.title}</p>
                            <span className={`type-badge ${selectedDoctor.type}`}>
                                {selectedDoctor.type === 'government' ? '🏥 Government' : selectedDoctor.type === 'clinic' ? '🏨 Clinic' : '🏥 Works in Both'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="week-calendar">
                <div className="calendar-header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <h2 style={{ margin: 0 }}>
                        Schedule for {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="month-nav-btns" style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className="btn-month-nav"
                            onClick={() => {
                                const prev = new Date(currentMonth);
                                prev.setMonth(currentMonth.getMonth() - 1);
                                setCurrentMonth(prev);
                            }}
                            style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            &larr; Previous Month
                        </button>
                        <button
                            type="button"
                            className="btn-month-nav"
                            onClick={() => {
                                const next = new Date(currentMonth);
                                next.setMonth(currentMonth.getMonth() + 1);
                                setCurrentMonth(next);
                            }}
                            style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Next Month &rarr;
                        </button>
                    </div>
                </div>
                <div className="calendar-grid">
                    {monthDates.map((date, index) => {
                        const dayAvailabilities = availability.filter(a => {
                            const availDate = new Date(a.date);
                            const localDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate());
                            const targetDate = new Date(date);
                            targetDate.setHours(0, 0, 0, 0);
                            return localDate.getTime() === targetDate.getTime();
                        }).filter(a => a.timeSlots && a.timeSlots.length > 0);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <div
                                key={index}
                                className={`calendar-day ${isToday ? 'today' : ''} ${dayAvailabilities.length > 0 ? 'has-schedule' : ''}`}
                                onClick={() => openScheduleModal(date)}
                            >
                                <div className="day-header">
                                    <div className="day-name">{getDayName(date)}</div>
                                    <div className="day-date">{date.getDate()}</div>
                                </div>

                                {dayAvailabilities.length > 0 ? (
                                    <div className="day-schedule">
                                        {dayAvailabilities.map((avail, idx) => (
                                            <div key={idx} className="hospital-group">
                                                <div className={`hospital-mini-badge ${avail.hospitalType}`}>
                                                    {avail.hospitalType === 'government' ? '🏥 Govt' : '🏨 Clinic'}
                                                </div>
                                                {avail.timeSlots.map((slot, i) => (
                                                    <div key={i} className={`time-slot ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                        <div className="slot-time">{slot.startTime} - {slot.endTime}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-schedule">
                                        <p>Click to add schedule</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {showScheduleModal && selectedDate && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                Schedule for {selectedDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h2>
                            <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
                        </div>

                        <div className="schedule-form">
                            {selectedDoctor.type === 'both' && (
                                <div className="form-group hospital-type-selector">
                                    <label>Setting Schedule For:</label>
                                    <div className="type-toggle">
                                        <button
                                            className={`toggle-btn ${scheduleForm.hospitalType === 'government' ? 'active' : ''}`}
                                            onClick={() => loadScheduleIntoForm(selectedDate, 'government')}
                                        >
                                            🏥 Government Hospital
                                        </button>
                                        <button
                                            className={`toggle-btn ${scheduleForm.hospitalType === 'clinic' ? 'active' : ''}`}
                                            onClick={() => loadScheduleIntoForm(selectedDate, 'clinic')}
                                        >
                                            🏨 Private Clinic
                                        </button>
                                    </div>
                                    <p className="type-note">Note: You can set different schedules for both hospitals on the same day.</p>
                                </div>
                            )}
                            <div className="time-slots-section">
                                <div className="section-header">
                                    <h3>Time Slots</h3>
                                    <button className="btn-add-slot" onClick={addTimeSlot}>+ Add Slot</button>
                                </div>

                                {scheduleForm.timeSlots.map((slot, index) => (
                                    <div key={index} className="time-slot-form">
                                        <div className="slot-form-row">
                                            <div className="form-group">
                                                <label>Period</label>
                                                <select
                                                    value={slot.period}
                                                    onChange={(e) => updateTimeSlot(index, 'period', e.target.value)}
                                                >
                                                    <option value="Morning">Morning</option>
                                                    <option value="Afternoon">Afternoon</option>
                                                    <option value="Evening">Evening</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Start Time</label>
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>End Time</label>
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Status</label>
                                                <select
                                                    value={slot.status}
                                                    onChange={(e) => updateTimeSlot(index, 'status', e.target.value)}
                                                >
                                                    <option value="Available">Available</option>
                                                    <option value="Not Available">Not Available</option>
                                                </select>
                                            </div>

                                            {scheduleForm.timeSlots.length > 1 && (
                                                <button
                                                    className="btn-remove-slot"
                                                    onClick={() => removeTimeSlot(index)}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="schedule-options">
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={scheduleForm.isEnabled}
                                            onChange={(e) => setScheduleForm(prev => ({
                                                ...prev,
                                                isEnabled: e.target.checked
                                            }))}
                                        />
                                        <span>Enable this schedule</span>
                                    </label>
                                </div>

                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={scheduleForm.emergencyAvailable}
                                            onChange={(e) => setScheduleForm(prev => ({
                                                ...prev,
                                                emergencyAvailable: e.target.checked
                                            }))}
                                        />
                                        <span>🚨 Emergency Available</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={scheduleForm.notes}
                                    onChange={(e) => setScheduleForm(prev => ({
                                        ...prev,
                                        notes: e.target.value
                                    }))}
                                    placeholder="Any special notes for this day..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button className="btn-cancel" onClick={() => setShowScheduleModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn-submit" onClick={handleSaveSchedule}>
                                    Save Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal-content confirm-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚡ Quick Set Availability</h2>
                            <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
                        </div>
                        <div className="confirm-modal-body" style={{ padding: '20px 24px' }}>
                            <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                Apply this doctor's default weekly time slots to the calendar. Select the schedule scope below:
                            </p>

                            <div className="quickset-options" style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' }}>
                                    <input
                                        type="radio"
                                        name="quickSetType"
                                        value="all"
                                        checked={quickSetType === 'all'}
                                        onChange={() => setQuickSetType('all')}
                                    />
                                    <span>All Days in Month</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' }}>
                                    <input
                                        type="radio"
                                        name="quickSetType"
                                        value="custom"
                                        checked={quickSetType === 'custom'}
                                        onChange={() => setQuickSetType('custom')}
                                    />
                                    <span>Custom Weekdays</span>
                                </label>
                            </div>

                            {quickSetType === 'custom' && (
                                <div className="custom-days-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                                    {[
                                        { label: 'Sunday', value: 0 },
                                        { label: 'Monday', value: 1 },
                                        { label: 'Tuesday', value: 2 },
                                        { label: 'Wednesday', value: 3 },
                                        { label: 'Thursday', value: 4 },
                                        { label: 'Friday', value: 5 },
                                        { label: 'Saturday', value: 6 }
                                    ].map((day) => {
                                        const isChecked = selectedWeekdays.includes(day.value);

                                        return (
                                            <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedWeekdays(prev => [...prev, day.value]);
                                                        } else {
                                                            setSelectedWeekdays(prev => prev.filter(v => v !== day.value));
                                                        }
                                                    }}
                                                />
                                                <span style={{ fontWeight: '600' }}>{day.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="form-actions" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
                            <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleConfirmQuickSet}
                                disabled={quickSetType === 'custom' && selectedWeekdays.length === 0}
                                style={{
                                    opacity: (quickSetType === 'custom' && selectedWeekdays.length === 0) ? 0.5 : 1,
                                    cursor: (quickSetType === 'custom' && selectedWeekdays.length === 0) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Set Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAvailability;
