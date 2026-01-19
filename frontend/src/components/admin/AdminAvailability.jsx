import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import './AdminAvailability.css';

const API_URL = 'http://localhost:5000/api';

const AdminAvailability = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [weekDates, setWeekDates] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // 'all', 'clinic', 'government'
    const [showScheduleModal, setShowScheduleModal] = useState(false);
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
        generateWeekDates();
    }, []);

    useEffect(() => {
        if (selectedDoctor && weekDates.length > 0) {
            fetchAvailability();
        }
    }, [selectedDoctor, weekDates]);

    const generateWeekDates = () => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }

        setWeekDates(dates);
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
        if (!selectedDoctor || weekDates.length === 0) return;

        try {
            const startDate = weekDates[0].toISOString().split('T')[0];
            const endDate = weekDates[6].toISOString().split('T')[0];

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

    const getAvailabilityForDate = (date) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return availability.find(a => {
            const availDate = new Date(a.date);
            // Get the date in local timezone
            const localDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate());

            console.log('Comparing:', {
                target: targetDate.toISOString().split('T')[0],
                avail: localDate.toISOString().split('T')[0],
                match: localDate.getTime() === targetDate.getTime()
            });

            return localDate.getTime() === targetDate.getTime();
        });
    };

    const openScheduleModal = (date) => {
        setSelectedDate(date);
        const existing = getAvailabilityForDate(date);

        console.log('Opening modal for date:', date);
        console.log('Existing schedule:', existing);

        if (existing) {
            // Clean the timeSlots by removing MongoDB _id fields
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
                notes: existing.notes || ''
            });

            console.log('Loaded existing schedule into form:', {
                timeSlots: cleanTimeSlots,
                isEnabled: existing.isEnabled,
                emergencyAvailable: existing.emergencyAvailable
            });
        } else {
            setScheduleForm({
                timeSlots: [
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', status: 'Available' }
                ],
                isEnabled: true,
                emergencyAvailable: false,
                notes: ''
            });
            console.log('No existing schedule, using default');
        }

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

            const payload = {
                doctorId: selectedDoctor._id,
                date: dateString, // YYYY-MM-DD format in local timezone
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
        setScheduleForm(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.map((slot, i) =>
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const quickSetWeek = async () => {
        if (!selectedDoctor) return;
        if (!confirm('Set default availability for all 7 days?')) return;

        const defaultSlots = [
            { period: 'Morning', startTime: '09:00', endTime: '12:00', status: 'Available' },
            { period: 'Afternoon', startTime: '14:00', endTime: '17:00', status: 'Available' }
        ];

        try {
            const availabilities = weekDates.map(date => ({
                date: date.toISOString(),
                dayName: getDayName(date),
                timeSlots: defaultSlots,
                isEnabled: true,
                emergencyAvailable: false,
                notes: ''
            }));

            const response = await fetch(`${API_URL}/availability/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: selectedDoctor._id,
                    availabilities
                })
            });

            if (response.ok) {
                toast.success('Week schedule set successfully!');
                fetchAvailability();
            } else {
                toast.error('Failed to set week schedule');
            }
        } catch (error) {
            toast.error('Error setting week schedule');
        }
    };

    if (loading) {
        return <div className="admin-availability-loading">Loading...</div>;
    }

    return (
        <div className="admin-availability">
            <div className="admin-availability-header">
                <h1>Doctor Availability Management</h1>
                <button className="btn-quick-set" onClick={quickSetWeek}>
                    ⚡ Quick Set Week
                </button>
            </div>

            <div className="filter-controls">
                <span>Filter by Type:</span>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filterType === 'clinic' ? 'active' : ''}`}
                        onClick={() => setFilterType('clinic')}
                    >
                        🏥 Clinics
                    </button>
                    <button
                        className={`filter-btn ${filterType === 'government' ? 'active' : ''}`}
                        onClick={() => setFilterType('government')}
                    >
                        🏥 Government
                    </button>
                </div>
            </div>

            <div className="doctor-selector">
                <label>Select Doctor ({doctors.filter(d => filterType === 'all' || d.type === filterType).length}):</label>
                <select
                    value={selectedDoctor?._id || ''}
                    onChange={(e) => {
                        const doctor = doctors.find(d => d._id === e.target.value);
                        setSelectedDoctor(doctor);
                    }}
                >
                    <option value="">-- Select a Doctor --</option>
                    {doctors
                        .filter(doctor => filterType === 'all' || doctor.type === filterType)
                        .map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                                {doctor.name} - {doctor.title} ({doctor.type === 'government' ? 'Government' : 'Clinic'})
                            </option>
                        ))}
                </select>
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
                                {selectedDoctor.type === 'government' ? '🏥 Government' : '🏨 Clinic'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="week-calendar">
                <h2>Next 7 Days Schedule</h2>
                <div className="calendar-grid">
                    {weekDates.map((date, index) => {
                        const avail = getAvailabilityForDate(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <div
                                key={index}
                                className={`calendar-day ${isToday ? 'today' : ''} ${avail ? 'has-schedule' : ''}`}
                                onClick={() => openScheduleModal(date)}
                            >
                                <div className="day-header">
                                    <div className="day-name">{getDayName(date)}</div>
                                    <div className="day-date">{date.getDate()}</div>
                                </div>

                                {avail ? (
                                    <div className="day-schedule">
                                        {avail.timeSlots.map((slot, i) => (
                                            <div key={i} className={`time-slot ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                <div className="slot-period">{slot.period}</div>
                                                <div className="slot-time">{slot.startTime} - {slot.endTime}</div>
                                                <div className="slot-status">{slot.status}</div>
                                            </div>
                                        ))}
                                        {avail.emergencyAvailable && (
                                            <div className="emergency-indicator">🚨 Emergency</div>
                                        )}
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
        </div>
    );
};

export default AdminAvailability;
