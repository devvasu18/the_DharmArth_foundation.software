import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE_URL } from '../services/api';
import './DoctorAvailability.css';

const API_URL = `${API_BASE_URL}/api`;

const DoctorAvailability = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('category'); // Always 'category' now
    const [selectedType, setSelectedType] = useState(null); // 'government' or 'clinic'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekDates, setWeekDates] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [emergencyDoctors, setEmergencyDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
        generateWeekDates();
        fetchEmergencyDoctors();
    }, []);

    // Removed fetchWeekAvailability useEffect as we default to category view with today selected

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
            // Adjust for timezone to ensure we send the correct local date string
            const offset = selectedDate.getTimezoneOffset();
            const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];
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

    const checkDoctorAvailability = (timeSlots, targetDate) => {
        const now = new Date();
        const isToday = targetDate && targetDate.toDateString() === now.toDateString();
        const isFuture = targetDate && targetDate > now && !isToday;

        const currentMinutes = getCurrentTimeInMinutes();
        const hasAvailableSlots = timeSlots.some(slot => slot.status === 'Available');

        if (!hasAvailableSlots) {
            return {
                isAvailableNow: false,
                status: 'Not Available Today',
                nextSlot: null,
                sortOrder: 999999
            };
        }

        // If it's a future date, just show "Scheduled"
        if (isFuture) {
            return {
                isAvailableNow: false,
                status: 'Scheduled',
                nextSlot: null,
                sortOrder: 50
            };
        }

        // If it's today, check current time
        if (isToday) {
            // Check if doctor is currently available
            for (const slot of timeSlots) {
                if (slot.status !== 'Available') continue;

                const startMinutes = timeToMinutes(slot.startTime);
                const endMinutes = timeToMinutes(slot.endTime);
                
                // Handle cross-midnight shifts (e.g., 9 PM to 12 AM or 12 PM next day)
                const adjustedEnd = (endMinutes <= startMinutes) ? endMinutes + 1440 : endMinutes;

                if (currentMinutes >= startMinutes && currentMinutes <= adjustedEnd) {
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
                    sortOrder: 1 + minDiff
                };
            }

            // If we are here, it means all available slots for today have passed
            return {
                isAvailableNow: false,
                status: 'Shift Ended',
                nextSlot: null,
                sortOrder: 900000
            };
        }

        // Fallback for past dates or other cases
        return {
            isAvailableNow: false,
            status: 'Not Available',
            nextSlot: null,
            sortOrder: 999999
        };
    };

    const sortDoctorsByAvailability = (doctors) => {
        return [...doctors].sort((a, b) => {
            const availA = checkDoctorAvailability(a.timeSlots, selectedDate);
            const availB = checkDoctorAvailability(b.timeSlots, selectedDate);
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

                {/* Medicine Order Promo */}
                <div className="medicine-promo-banner">
                    <div className="container">
                        <div className="promo-card glassmorphism-modern">
                            <div className="promo-content">
                                <div className="promo-icon">💊</div>
                                <div className="promo-text">
                                    <h3>Need Medicines?</h3>
                                    <p>Upload your doctor's prescription and get medicines delivered via our express express service.</p>
                                </div>
                                <button className="btn-primary-modern" onClick={() => navigate('/order-medicine')}>Order Now</button>
                            </div>
                        </div>
                    </div>
                </div>



                <div className="container">




                    {/* Combined Sidebar and Main Content */}
                    <div className="availability-layout">


                        {/* Main Content: Category OR Doctors */}
                        <div className="availability-main full-width">
                            {/* Category Selection View */}
                            {!selectedType && (
                                <div className="category-view">
                                    <div className="selected-date-header">
                                        <div className="date-display-row">
                                            <h2>
                                                {selectedDate?.toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </h2>
                                            <button
                                                className="btn-change-date"
                                                onClick={() => setShowDatePicker(true)}
                                            >
                                                📅 Change Date
                                            </button>
                                        </div>
                                        <p>Select category to view available doctors</p>
                                    </div>

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
                            {selectedType && (
                                <div className="doctors-view">
                                    <div className="premium-header-card">
                                        <div className="header-left">
                                            <button className="btn-back-circle" onClick={handleBackToTypeSelection}>
                                                <span className="back-arrow">←</span>
                                            </button>
                                            <div className="category-info-mini">
                                                <span className="category-label">Category</span>
                                                <h2 className="category-name-modern">
                                                    {selectedType === 'government' ? '🏥 Government Hospital' : '🏨 Private Clinic'}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="header-right">
                                            <div className="date-selection-chip" onClick={() => setShowDatePicker(true)}>
                                                <div className="chip-icon">📅</div>
                                                <div className="chip-content">

                                                    <span className="chip-value">
                                                        {selectedDate?.toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <span className="chip-action">Change</span>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="loading-doctors">
                                            <div className="loading-spinner"></div>
                                            <p>Loading doctors...</p>
                                        </div>
                                    ) : availability.length > 0 ? (
                                        <div className="doctors-grid">
                                            {sortDoctorsByAvailability(availability).map(avail => {
                                                const availabilityInfo = checkDoctorAvailability(avail.timeSlots, selectedDate);

                                                return (
                                                    <div
                                                        key={avail._id}
                                                        className={`doctor-availability-card ${avail.hospitalType} ${availabilityInfo.isAvailableNow ? 'available-now' : ''}`}
                                                    >
                                                        <div className="doctor-photo">
                                                            {avail.doctorId.photo ? (
                                                                <img 
                                                                    src={avail.doctorId.photo.startsWith('http') ? avail.doctorId.photo : `${API_BASE_URL}${avail.doctorId.photo.startsWith('/') ? '' : '/'}${avail.doctorId.photo}`} 
                                                                    alt={avail.doctorId.name} 
                                                                />
                                                            ) : (
                                                                <div className="photo-placeholder">👨‍⚕️</div>
                                                            )}
                                                        </div>

                                                        <div className="doctor-details">
                                                            <h3>{avail.doctorId.name}</h3>
                                                            <div className="doctor-meta-row">
                                                                <span className="doctor-title">{avail.doctorId.title}</span>
                                                                <span className="doctor-experience">- {avail.doctorId.experience}</span>
                                                            </div>
                                                            <div className="doctor-badges">
                                                                <div className={`availability-status ${
                                                                    availabilityInfo.isAvailableNow ? 'available' : 
                                                                    (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? 'closed' : 
                                                                    'upcoming'
                                                                }`}>
                                                                    <span>
                                                                        {availabilityInfo.isAvailableNow ? '●' : 
                                                                         (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? '✕' : 
                                                                         '🕒'}
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
                                                        </div>

                                                        <div className="time-slots">
                                                            {avail.timeSlots.map((slot, idx) => (
                                                                <div key={idx} className={`time-slot ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                                    <div className="slot-info">
                                                                        <span className="slot-period">{slot.period} :</span>
                                                                        <span className="slot-time">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>

                                                                        <div className={`slot-status ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                                            {slot.status === 'Available' && '✓ Available'}
                                                                            {slot.status === 'Not Available' && '✗ Not Available'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-availability-premium">
                                            <div className="premium-blank-illustration">
                                                <span className="illustration-emoji">😔</span>
                                            </div>
                                            <h3>No Doctors Available</h3>
                                            <p>There are no doctors scheduled for this specific date and category. Please try selecting a different date or a different hospital type.</p>
                                            <div className="blank-actions">
                                                <button className="btn-primary-modern" onClick={() => setShowDatePicker(true)}>
                                                    Change Date
                                                </button>
                                                <button className="btn-secondary-modern" onClick={handleBackToTypeSelection}>
                                                    Change Category
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Custom Date Picker Modal */}
                            {showDatePicker && (
                                <div className="date-picker-overlay" onClick={() => setShowDatePicker(false)}>
                                    <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
                                        <div className="date-picker-header">
                                            <h3>Select Date</h3>
                                            <button className="close-btn" onClick={() => setShowDatePicker(false)}>×</button>
                                        </div>
                                        <div className="date-picker-grid-simple">
                                            {weekDates.map((date, index) => {
                                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                                const isToday = date.toDateString() === new Date().toDateString();

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`date-picker-card-simple ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                                        onClick={() => handleDateChange(date)}
                                                    >
                                                        <div className="dp-day">{getDayName(date)}</div>
                                                        <div className="dp-number">{date.getDate()}</div>
                                                        <div className="dp-number">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                                                        {isToday && <span className="dp-today-badge">Today</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency Doctors Section */}
                {filteredEmergencyDoctors.length > 0 && (
                    <div className="emergency-section">
                        <div className="container">
                            <div className="emergency-header">
                                <div>
                                    <h2>In case of emergency,  Doctors Availability :</h2>
                                    <p>Emergency doctors ready to help</p>
                                </div>
                            </div>

                            <div className="emergency-doctors-grid">
                                {filteredEmergencyDoctors.map(doctor => (
                                    <div key={doctor._id} className="emergency-doctor-card">
                                        <div className="emergency-badge-float">Available Now</div>
                                        <div className="doctor-photo">
                                            {doctor.photo ? (
                                                <img 
                                                    src={doctor.photo.startsWith('http') ? doctor.photo : `${API_BASE_URL}${doctor.photo.startsWith('/') ? '' : '/'}${doctor.photo}`} 
                                                    alt={doctor.name} 
                                                />
                                            ) : (
                                                <div className="photo-placeholder">👨‍⚕️</div>
                                            )}
                                        </div>
                                        <h3>{doctor.name}</h3>
                                        <p className="doctor-title">{doctor.title}</p>

                                        <div className={`doctor-type-badge ${doctor.type}`}>
                                            {doctor.type === 'clinic' ? '🏨 Private Clinic' : doctor.type === 'government' ? '🏥 Government Hospital' : '🏥 Works in Both'}
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

                {/* Available Tests Section */}
                <div className="tests-section">
                    <div className="container">
                        <div className="section-header center-text">
                            <h2>Available Medical Tests</h2>
                            <p>Comprehensive diagnostic services at affordable prices</p>
                        </div>
                        <div className="tests-grid">
                            {[
                                {
                                    id: 1,
                                    name: "Full Body Checkup",
                                    price: "₹1999",
                                    image: "https://placehold.co/600x400/2c3e50/ffffff?text=Body+Checkup",
                                    category: "General Health",
                                    time: "45 mins"
                                },
                                {
                                    id: 2,
                                    name: "Complete Blood Count",
                                    price: "₹350",
                                    image: "https://placehold.co/600x400/e74c3c/ffffff?text=Blood+Test",
                                    category: "Pathology",
                                    time: "10 mins"
                                },
                                {
                                    id: 3,
                                    name: "Digital X-Ray",
                                    price: "₹500",
                                    image: "https://placehold.co/600x400/3498db/ffffff?text=X-Ray",
                                    category: "Radiology",
                                    time: "15 mins"
                                },
                                {
                                    id: 4,
                                    name: "MRI Scan",
                                    price: "₹4500",
                                    image: "https://placehold.co/600x400/9b59b6/ffffff?text=MRI",
                                    category: "Radiology",
                                    time: "30 mins"
                                }
                            ].map(test => (
                                <div key={test.id} className="test-card">
                                    <div className="test-image">
                                        <img src={test.image} alt={test.name} />
                                        <div className="test-category">{test.category}</div>
                                    </div>
                                    <div className="test-content">
                                        <h3>{test.name}</h3>
                                        <div className="test-meta">
                                            <span>⏱️ {test.time}</span>
                                            <span className="test-price">{test.price}</span>
                                        </div>
                                        <button className="btn-book-test">Book This Test</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="faq-section">
                        <div className="container">
                            <div className="section-header center-text">
                                <h2>Common Questions</h2>
                                <p>Everything you need to know about our services</p>
                            </div>

                            <div className="faq-grid">
                                {[
                                    {
                                        question: "Do I need an appointment for the Government Hospital?",
                                        answer: "For general visits, appointments are on a first-come, first-served basis. However, specialized consultations may require prior booking."
                                    },
                                    {
                                        question: "What documents do I need to carry?",
                                        answer: "Please carry a valid government ID (Aadhar Card/Voter ID) and any previous medical records or prescriptions for a better diagnosis."
                                    },
                                    {
                                        question: "Can I book medical tests online?",
                                        answer: "Yes, you can browse available tests in the section above and book them directly. You will receive a confirmation time via SMS."
                                    },
                                    {
                                        question: "Is emergency care available 24/7?",
                                        answer: "Yes, our emergency doctors are available 24/7. Look for the 'Emergency Available' badge on doctor cards or visit the Emergency section immediately."
                                    }
                                ].map((faq, index) => (
                                    <div
                                        key={index}
                                        className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}
                                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                    >
                                        <div className="faq-question">
                                            <h3>{faq.question}</h3>
                                            <span className="faq-toggle">{openFaqIndex === index ? '−' : '+'}</span>
                                        </div>
                                        <div className="faq-answer">
                                            <p>{faq.answer}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default DoctorAvailability;
