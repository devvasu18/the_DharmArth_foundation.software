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
        if (selectedDoctor) {
            fetchAvailability();
        }
    }, [selectedDoctor]);

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
        if (!selectedDoctor) return;

        try {
            const startDate = weekDates[0].toISOString().split('T')[0];
            const endDate = weekDates[6].toISOString().split('T')[0];

            const response = await fetch(
                `${API_URL}/availability?doctorId=${selectedDoctor._id}&startDate=${startDate}&endDate=${endDate}`
            );
            const data = await response.json();
            setAvailability(data);
        } catch (error) {
            toast.error('Failed to fetch availability');
        }
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getAvailabilityForDate = (date) => {
        return availability.find(a => {
            const availDate = new Date(a.date);
            availDate.setHours(0, 0, 0, 0);
            return availDate.getTime() === date.getTime();
        });
    };

    const openScheduleModal = (date) => {
        setSelectedDate(date);
        const existing = getAvailabilityForDate(date);

        if (existing) {
            setScheduleForm({
                timeSlots: existing.timeSlots,
                isEnabled: existing.isEnabled,
                emergencyAvailable: existing.emergencyAvailable,
                notes: existing.notes
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
        }

        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async () => {
        if (!selectedDoctor || !selectedDate) return;

        try {
            const payload = {
                doctorId: selectedDoctor._id,
                date: selectedDate.toISOString(),
                dayName: getDayName(selectedDate),
                ...scheduleForm
            };

            const response = await fetch(`${API_URL}/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success('Schedule saved successfully!');
                fetchAvailability();
                setShowScheduleModal(false);
            } else {
                toast.error('Failed to save schedule');
            }
        } catch (error) {
            toast.error('Error saving schedule');
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

            <div className="doctor-selector">
                <label>Select Doctor:</label>
                <select
                    value={selectedDoctor?._id || ''}
                    onChange={(e) => {
                        const doctor = doctors.find(d => d._id === e.target.value);
                        setSelectedDoctor(doctor);
                    }}
                >
                    {doctors.map(doctor => (
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
                                                    <option value="Limited">Limited</option>
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
