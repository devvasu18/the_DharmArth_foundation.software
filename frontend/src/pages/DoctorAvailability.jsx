import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
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
    const [bodyTests, setBodyTests] = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [selectedTestCategory, setSelectedTestCategory] = useState('All');
    const [doctorFaqs, setDoctorFaqs] = useState([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);

    // Admin Settings State (for mobile dialer)
    const [adminMobile, setAdminMobile] = useState('918306305569');

    // Booking Modal & Form State
    const { user: authUser } = useAuth();
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedTestForBooking, setSelectedTestForBooking] = useState(null);
    const [bookingForm, setBookingForm] = useState({ name: '', mobile: '' });
    const [bookingSubmitLoading, setBookingSubmitLoading] = useState(false);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
        generateWeekDates();
        fetchEmergencyDoctors();
        fetchBodyTests();
        fetchDoctorFaqs();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/content/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.admin_suspension_mobile) {
                    setAdminMobile(data.admin_suspension_mobile);
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    useEffect(() => {
        if (bookingModalOpen && authUser) {
            setBookingForm({
                name: authUser.name || '',
                mobile: authUser.mobile || ''
            });
        }
    }, [bookingModalOpen, authUser]);

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        if (!bookingForm.name.trim() || bookingForm.mobile.length !== 10) {
            toast.error("Please fill in all details with a valid 10-digit mobile number");
            return;
        }

        setBookingSubmitLoading(true);
        try {
            const response = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: bookingForm.name.trim(),
                    mobile: bookingForm.mobile,
                    type: 'contact',
                    source: 'body_test_booking',
                    notes: `Requested Booking for Test: "${selectedTestForBooking.name}"\nCategory: ${selectedTestForBooking.category}\nPrice: ${selectedTestForBooking.price.startsWith('₹') ? selectedTestForBooking.price : `₹${selectedTestForBooking.price}`}\n\nWe will contact you soon.`,
                    language: localStorage.getItem('i18nextLng') || 'en'
                })
            });

            if (response.ok) {
                toast.success("Booking request submitted! We will contact you soon.");
                setBookingModalOpen(false);
                setBookingForm({ name: '', mobile: '' });
            } else {
                const errData = await response.json();
                toast.error(errData.message || "Failed to submit booking. Please try again.");
            }
        } catch (error) {
            console.error("Booking submit error:", error);
            toast.error("Failed to submit booking. Please try again.");
        } finally {
            setBookingSubmitLoading(false);
        }
    };

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

    const fetchBodyTests = async () => {
        try {
            setLoadingTests(true);
            const response = await fetch(`${API_URL}/body-tests?isActive=true`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setBodyTests(data);
        } catch (error) {
            console.error('Failed to fetch body tests:', error);
        } finally {
            setLoadingTests(false);
        }
    };

    const fetchDoctorFaqs = async () => {
        try {
            setLoadingFaqs(true);
            const response = await fetch(`${API_URL}/doctor-faqs?isVisible=true`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setDoctorFaqs(data);
        } catch (error) {
            console.error('Failed to fetch doctor FAQs:', error);
        } finally {
            setLoadingFaqs(false);
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

                        {/* Category filter tabs */}
                        {!loadingTests && bodyTests.length > 0 && (
                            <div className="test-categories-container">
                                <div className="test-categories-filter">
                                    {['All', ...new Set(bodyTests.map(t => t.category))].map(cat => (
                                        <button
                                            key={cat}
                                            className={`test-category-chip ${selectedTestCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedTestCategory(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loadingTests ? (
                            <div className="tests-grid">
                                {[1, 2, 3, 4].map(n => (
                                    <div key={n} className="test-card skeleton">
                                        <div className="test-image skeleton-pulse"></div>
                                        <div className="test-content">
                                            <div className="skeleton-line skeleton-title skeleton-pulse"></div>
                                            <div className="skeleton-line skeleton-text skeleton-pulse"></div>
                                            <div className="skeleton-line skeleton-meta skeleton-pulse"></div>
                                            <div className="skeleton-button skeleton-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : bodyTests.length === 0 ? (
                            <div className="no-tests-premium">
                                <div className="no-tests-emoji">🔬</div>
                                <h3>No Medical Tests Listed</h3>
                                <p>We are currently updating our checkup packages. Please check back soon or call our helpline.</p>
                            </div>
                        ) : (
                            <div className="tests-grid">
                                {bodyTests
                                    .filter(t => selectedTestCategory === 'All' || t.category === selectedTestCategory)
                                    .map(test => (
                                        <div key={test._id} className="test-card">
                                            <div className="test-image">
                                                {test.image ? (
                                                    <img 
                                                        src={test.image.startsWith('http') ? test.image : `${API_BASE_URL}${test.image.startsWith('/') ? '' : '/'}${test.image}`} 
                                                        alt={test.name} 
                                                    />
                                                ) : (
                                                    <div className="test-placeholder-image">🔬</div>
                                                )}
                                                <div className="test-category">{test.category}</div>
                                            </div>
                                            <div className="test-content">
                                                <h3>{test.name}</h3>
                                                <p className="test-description">{test.description || 'Professional diagnostic checkup package.'}</p>
                                                <div className="test-meta">
                                                    <span>⏱️ {test.time}</span>
                                                    <span className="test-price">{test.price.startsWith('₹') ? test.price : `₹${test.price}`}</span>
                                                </div>
                                                <button 
                                                    className="btn-book-test"
                                                    onClick={() => {
                                                        if (window.innerWidth < 1024) {
                                                            window.location.href = `tel:${adminMobile}`;
                                                        } else {
                                                            setSelectedTestForBooking(test);
                                                            setBookingModalOpen(true);
                                                        }
                                                    }}
                                                >
                                                    Book This Test
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* FAQ Section */}
                    <div className="faq-section">
                        <div className="container">
                            <div className="section-header center-text">
                                <h2>Common Questions</h2>
                                <p>Everything you need to know about our services</p>
                            </div>

                            <div className="faq-grid">
                                {loadingFaqs ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                        Loading questions...
                                    </div>
                                ) : doctorFaqs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                        No FAQs available currently.
                                    </div>
                                ) : (
                                    doctorFaqs.map((faq, index) => (
                                        <div
                                            key={faq._id}
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
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {bookingModalOpen && selectedTestForBooking && (
                <div className="test-booking-modal-overlay" onClick={() => setBookingModalOpen(false)}>
                    <div className="test-booking-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="test-booking-modal-close" onClick={() => setBookingModalOpen(false)}>
                            ✕
                        </button>
                        <div className="test-booking-modal-header">
                            <h2>Book Diagnostic Test</h2>
                            <p>Please enter your details. We will contact you soon to schedule your checkup.</p>
                        </div>
                        
                        <div className="selected-test-summary">
                            <div className="summary-icon">🔬</div>
                            <div className="summary-info">
                                <h4>{selectedTestForBooking.name}</h4>
                                <p className="summary-desc">{selectedTestForBooking.description}</p>
                                <div className="summary-price-tag">
                                    <span>Price:</span>
                                    <strong>{selectedTestForBooking.price.startsWith('₹') ? selectedTestForBooking.price : `₹${selectedTestForBooking.price}`}</strong>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="test-booking-modal-form">
                            <div className="form-group-custom">
                                <label>Your Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter your full name" 
                                    value={bookingForm.name}
                                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group-custom">
                                <label>Mobile Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="Enter 10-digit mobile number" 
                                    value={bookingForm.mobile}
                                    onChange={(e) => setBookingForm({ ...bookingForm, mobile: e.target.value })}
                                    maxLength={10}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-booking-submit" disabled={bookingSubmitLoading}>
                                {bookingSubmitLoading ? 'Submitting...' : 'Confirm Booking'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default DoctorAvailability;
