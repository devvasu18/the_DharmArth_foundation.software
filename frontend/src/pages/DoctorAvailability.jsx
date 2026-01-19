import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './DoctorAvailability.css';

const API_URL = 'http://localhost:5000/api';

const DoctorAvailability = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'category'
    const [selectedType, setSelectedType] = useState(null); // 'government' or 'clinic'
    const [selectedDate, setSelectedDate] = useState(null);
    const [weekDates, setWeekDates] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [emergencyDoctors, setEmergencyDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        generateWeekDates();
        fetchEmergencyDoctors();
    }, []);

    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchWeekAvailability();
        }
    }, [viewMode]);

    useEffect(() => {
        if (selectedDate && selectedType) {
            fetchDateAvailability();
        }
    }, [selectedDate, selectedType]);

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

    const fetchWeekAvailability = async () => {
        try {
            const response = await fetch(`${API_URL}/availability/week`);
            const data = await response.json();
            setAvailability(data);
        } catch (error) {
            console.error('Failed to fetch availability');
        } finally {
            setLoading(false);
        }
    };

    const fetchDateAvailability = async () => {
        if (!selectedDate || !selectedType) return;

        try {
            setLoading(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const response = await fetch(`${API_URL}/availability/date/${dateStr}?type=${selectedType}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setAvailability(data);
        } catch (error) {
            console.error('Failed to fetch date availability:', error);
            setAvailability([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmergencyDoctors = async () => {
        try {
            const response = await fetch(`${API_URL}/doctors/emergency`);
            const data = await response.json();
            setEmergencyDoctors(data);
        } catch (error) {
            console.error('Failed to fetch emergency doctors');
        }
    };

    const getDayName = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getAvailabilityCountForDate = (date) => {
        return availability.filter(a => {
            const availDate = new Date(a.date);
            availDate.setHours(0, 0, 0, 0);
            return availDate.getTime() === date.getTime();
        }).length;
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setViewMode('category');
        setSelectedType(null);
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setLoading(true);
    };

    const handleBackToCalendar = () => {
        setViewMode('calendar');
        setSelectedDate(null);
        setSelectedType(null);
        fetchWeekAvailability();
    };

    const handleBackToTypeSelection = () => {
        setSelectedType(null);
        setAvailability([]);
    };

    const handleCategoryView = () => {
        setViewMode('category');
        setSelectedDate(new Date());
        setSelectedType(null);
    };

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        setShowDatePicker(false);
        setLoading(true);
    };

    const getAvailabilityCountForDatePicker = (date) => {
        // This would need to fetch availability for the date picker dates
        // For now, we'll use a placeholder
        return Math.floor(Math.random() * 10) + 1;
    };

    const formatTime = (time24) => {
        // Convert 24-hour format (HH:MM) to 12-hour format (HH:MM AM/PM)
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const getCurrentTimeInMinutes = () => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    };

    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const checkDoctorAvailability = (timeSlots) => {
        const currentMinutes = getCurrentTimeInMinutes();

        // Check if doctor is currently available
        for (const slot of timeSlots) {
            if (slot.status !== 'Available') continue;

            const startMinutes = timeToMinutes(slot.startTime);
            const endMinutes = timeToMinutes(slot.endTime);

            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                return {
                    isAvailableNow: true,
                    status: 'Available Now',
                    nextSlot: null,
                    sortOrder: 0
                };
            }
        }

        // Find next available slot
        let nextSlot = null;
        let minDiff = Infinity;

        for (const slot of timeSlots) {
            if (slot.status !== 'Available') continue;

            const startMinutes = timeToMinutes(slot.startTime);

            if (startMinutes > currentMinutes) {
                const diff = startMinutes - currentMinutes;
                if (diff < minDiff) {
                    minDiff = diff;
                    nextSlot = slot;
                }
            }
        }

        if (nextSlot) {
            const hoursUntil = Math.floor(minDiff / 60);
            const minutesUntil = minDiff % 60;

            let statusMessage;
            if (hoursUntil === 0) {
                statusMessage = `Available in ${minutesUntil} minutes`;
            } else if (hoursUntil === 1 && minutesUntil === 0) {
                statusMessage = `Available in 1 hour`;
            } else if (minutesUntil === 0) {
                statusMessage = `Available in ${hoursUntil} hours`;
            } else {
                statusMessage = `Available at ${formatTime(nextSlot.startTime)}`;
            }

            return {
                isAvailableNow: false,
                status: statusMessage,
                nextSlot: nextSlot,
                sortOrder: 1 + minDiff // Sort by time until available
            };
        }

        return {
            isAvailableNow: false,
            status: 'Not Available Today',
            nextSlot: null,
            sortOrder: 999999 // Put at the end
        };
    };

    const sortDoctorsByAvailability = (doctors) => {
        return [...doctors].sort((a, b) => {
            const availA = checkDoctorAvailability(a.timeSlots);
            const availB = checkDoctorAvailability(b.timeSlots);
            return availA.sortOrder - availB.sortOrder;
        });
    };

    if (loading && viewMode === 'calendar') {
        return (
            <>
                <Navbar />
                <div className="doctor-availability-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading doctor availability...</p>
                </div>
                <Footer />
            </>
        );
    }

    const filteredEmergencyDoctors = selectedType
        ? emergencyDoctors.filter(doc => doc.type === selectedType)
        : emergencyDoctors;

    return (
        <>
            <Navbar />
            <div className="doctor-availability-page">
                {/* Hero Section */}
                <div className="availability-hero">
                    <div className="container">
                        <h1>Doctor Availability</h1>
                        <p>Find the right doctor at the right time</p>
                    </div>
                </div>



                <div className="container">
                    {/* View Mode Selector */}
                    <div className="view-mode-selector">
                        <button
                            className={`mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                            onClick={handleBackToCalendar}
                        >
                            📅 Weekly Calendar
                        </button>
                        <button
                            className={`mode-btn ${viewMode === 'category' ? 'active' : ''}`}
                            onClick={handleCategoryView}
                        >
                            👨‍⚕️ Find by Category
                        </button>
                    </div>

                    {/* Calendar View */}
                    {viewMode === 'calendar' && (
                        <div className="calendar-view">
                            <h2>Next 7 Days</h2>
                            <p className="calendar-subtitle">Click on any date to see available doctors</p>

                            <div className="week-grid">
                                {weekDates.map((date, index) => {
                                    const count = getAvailabilityCountForDate(date);
                                    const isToday = date.toDateString() === new Date().toDateString();

                                    return (
                                        <div
                                            key={index}
                                            className={`week-day-card ${isToday ? 'today' : ''} ${count > 0 ? 'has-doctors' : ''}`}
                                            onClick={() => handleDateClick(date)}
                                        >
                                            <div className="day-name">{getDayName(date)}</div>
                                            <div className="day-date">{date.getDate()}</div>
                                            <div className="day-month">
                                                {date.toLocaleDateString('en-US', { month: 'short' })}
                                            </div>

                                            {count > 0 ? (
                                                <div className="doctor-count">
                                                    <span className="count-number">{count}</span>
                                                    <span className="count-label">
                                                        {count === 1 ? 'Doctor' : 'Doctors'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="no-doctors">Not Available</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Category Selection View */}
                    {viewMode === 'category' && !selectedType && (
                        <div className="category-view">
                            {selectedDate && (
                                <div className="selected-date-header">
                                    <button className="btn-back" onClick={handleBackToCalendar}>
                                        ← Back to Calendar
                                    </button>
                                    <h2>
                                        {selectedDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </h2>
                                    <p>Choose where you want to visit</p>
                                </div>
                            )}

                            <div className="category-options">
                                <div
                                    className="category-card government"
                                    onClick={() => handleTypeSelect('government')}
                                >
                                    <div className="category-icon">🏥</div>
                                    <h3>Government Hospital</h3>
                                    <p>Scheduled appointments</p>
                                    <div className="category-badge">Scheduled</div>
                                </div>

                                <div
                                    className="category-card clinic"
                                    onClick={() => handleTypeSelect('clinic')}
                                >
                                    <div className="category-icon">🏨</div>
                                    <h3>Private Clinic</h3>
                                    <p>High availability doctors</p>
                                    <div className="category-badge priority">High Availability</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Doctor Cards View */}
                    {viewMode === 'category' && selectedType && (
                        <div className="doctors-view">
                            <div className="doctors-view-header">
                                <button className="btn-back" onClick={handleBackToTypeSelection}>
                                    ← Back
                                </button>
                                <div className="header-content">
                                    <h2>
                                        {selectedType === 'government' ? '🏥 Government Hospital' : '🏨 Private Clinic'}
                                    </h2>
                                    <div className="date-selector-wrapper">
                                        <div className="date-selector">
                                            <button
                                                className="date-display"
                                                onClick={() => setShowDatePicker(true)}
                                            >
                                                📅 {selectedDate?.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </button>
                                        </div>
                                        <button
                                            className="change-date-link"
                                            onClick={() => setShowDatePicker(true)}
                                        >
                                            Change Date
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Date Picker Modal */}
                            {showDatePicker && (
                                <div className="date-picker-overlay" onClick={() => setShowDatePicker(false)}>
                                    <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
                                        <div className="date-picker-header">
                                            <h3>Select a Date</h3>
                                            <button className="close-btn" onClick={() => setShowDatePicker(false)}>×</button>
                                        </div>
                                        <div className="date-picker-grid">
                                            {weekDates.map((date, index) => {
                                                const count = getAvailabilityCountForDatePicker(date);
                                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                                const isToday = date.toDateString() === new Date().toDateString();

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`date-picker-card ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                                        onClick={() => handleDateChange(date)}
                                                    >
                                                        <div className="date-card-day">{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                                                        <div className="date-card-date">{date.getDate()}</div>
                                                        <div className="date-card-month">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                                                        <div className="date-card-count">{count}</div>
                                                        <div className="date-card-label">Doctors</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="loading-doctors">
                                    <div className="loading-spinner"></div>
                                    <p>Loading doctors...</p>
                                </div>
                            ) : availability.length > 0 ? (
                                <div className="doctors-grid">
                                    {sortDoctorsByAvailability(availability).map(avail => {
                                        const availabilityInfo = checkDoctorAvailability(avail.timeSlots);

                                        return (
                                            <div
                                                key={avail._id}
                                                className={`doctor-availability-card ${avail.doctorId.type} ${availabilityInfo.isAvailableNow ? 'available-now' : ''}`}
                                            >
                                                <div className="doctor-photo">
                                                    {avail.doctorId.photo ? (
                                                        <img src={avail.doctorId.photo} alt={avail.doctorId.name} />
                                                    ) : (
                                                        <div className="photo-placeholder">👨‍⚕️</div>
                                                    )}
                                                </div>

                                                <div className="doctor-details">
                                                    <h3>{avail.doctorId.name}</h3>
                                                    <p className="doctor-title">{avail.doctorId.title}</p>
                                                    <p className="doctor-experience">📅 {avail.doctorId.experience}</p>
                                                    {/* Real-time Availability Status */}
                                                    <div className={`availability-status ${availabilityInfo.isAvailableNow ? 'available' : availabilityInfo.status === 'Not Available Today' ? 'closed' : 'upcoming'}`}>
                                                        <span>
                                                            {availabilityInfo.isAvailableNow ? '●' : availabilityInfo.status === 'Not Available Today' ? '✕' : '🕒'}
                                                        </span>
                                                        <span>{availabilityInfo.status}</span>
                                                    </div>

                                                    {avail.emergencyAvailable && (
                                                        <div className="emergency-available">
                                                            <span>🚨</span>
                                                            <span>Emergency Available</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="time-slots">
                                                    <h4>Available Times</h4>
                                                    {avail.timeSlots.map((slot, idx) => (
                                                        <div key={idx} className={`time-slot ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                            <div className="slot-info">
                                                                <span className="slot-period">{slot.period}</span>
                                                                <span className="slot-time">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                                            </div>
                                                            <div className={`slot-status ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                                {slot.status === 'Available' && '✓ Available'}
                                                                {slot.status === 'Not Available' && '✗ Not Available'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    className={`btn-book ${availabilityInfo.isAvailableNow ? '' : availabilityInfo.status === 'Not Available Today' ? 'closed-btn' : 'wait-btn'}`}
                                                    disabled={availabilityInfo.status === 'Not Available Today'}
                                                >
                                                    {availabilityInfo.isAvailableNow ? 'Visit Now' : availabilityInfo.status === 'Not Available Today' ? 'Not available today' : 'Wait for Slot'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-doctors-available">
                                    <div className="no-doctors-icon">😔</div>
                                    <h3>No Doctors Available</h3>
                                    <p>There are no doctors available for this date and category.</p>
                                    <button className="btn-back-alt" onClick={handleBackToTypeSelection}>
                                        Try Another Category
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Emergency Doctors Section */}
                {filteredEmergencyDoctors.length > 0 && (
                    <div className="emergency-section">
                        <div className="container">
                            <div className="emergency-header">
                                <div>
                                    <h2>In case of emergency,  Doctors Available Right Now :</h2>
                                    <p>Emergency doctors ready to help</p>
                                </div>
                            </div>

                            <div className="emergency-doctors-grid">
                                {filteredEmergencyDoctors.map(doctor => (
                                    <div key={doctor._id} className="emergency-doctor-card">
                                        <div className="emergency-badge-float">Available Now</div>
                                        <div className="doctor-photo">
                                            {doctor.photo ? (
                                                <img src={doctor.photo} alt={doctor.name} />
                                            ) : (
                                                <div className="photo-placeholder">👨‍⚕️</div>
                                            )}
                                        </div>
                                        <h3>{doctor.name}</h3>
                                        <p className="doctor-title">{doctor.title}</p>
                                        <p className="doctor-experience">📅 {doctor.experience}</p>
                                        <div className={`doctor-type-badge ${doctor.type}`}>
                                            {doctor.type === 'clinic' ? '🏥 Private Clinic' : '🏥 Government Hospital'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Helpline Banner */}
                <div className="helpline-banner">
                    <div className="container">
                        <div className="helpline-content">
                            <div className="helpline-icon">📞</div>
                            <div className="helpline-text">
                                <h3>Need immediate assistance?</h3>
                                <p>Can't find a doctor? Our support team is here to help you find the nearest available facility.</p>
                            </div>
                            <button className="btn-call-helpline" onClick={() => window.location.href = 'tel:108'}>Call Now</button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default DoctorAvailability;
