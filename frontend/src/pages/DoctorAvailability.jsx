import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './DoctorAvailability.css';
import SEO from '../components/common/SEO';

const API_URL = `${API_BASE_URL}/api`;

const DoctorAvailability = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('category'); // Always 'category' now
    const [selectedType, setSelectedType] = useState(null); // 'government' or 'clinic'
    const [emergencyDoctors, setEmergencyDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [doctorFaqs, setDoctorFaqs] = useState([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);

    // Doctor Category Search States
    const [searchCategories, setSearchCategories] = useState([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchCategoryId, setSearchCategoryId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Admin Settings State (for mobile dialer)
    const [adminMobile, setAdminMobile] = useState('918306305569');
    const [contactPhone, setContactPhone] = useState('8306305569');

    useEffect(() => {
        fetchEmergencyDoctors();
        fetchDoctorFaqs();
        fetchSettings();
        fetchSearchCategories();
    }, []);

    const fetchSearchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/doctor-categories?isActive=true`);
            if (response.ok) {
                const data = await response.json();
                setSearchCategories(data);
            }
        } catch (error) {
            console.error('Failed to fetch doctor categories', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/content/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.admin_suspension_mobile) {
                    setAdminMobile(data.admin_suspension_mobile);
                }
                setContactPhone(data.contact_phone || '8306305569');
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
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

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSearchQuery('');
        setShowSearchModal(true);
    };

    const handleSearchSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!selectedType || !searchCategoryId) {
            toast.error('Please select a specialist category');
            return;
        }

        try {
            setSearching(true);
            setSearchPerformed(true);
            setShowSearchModal(false);

            // Format date to YYYY-MM-DD locally to avoid timezone shifts
            const offset = searchDate.getTimezoneOffset();
            const localDate = new Date(searchDate.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            const response = await fetch(
                `${API_URL}/availability/search?hospitalType=${selectedType}&categoryId=${searchCategoryId}&date=${dateStr}`
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            setSearchResult(data);
        } catch (error) {
            console.error('Error during search:', error);
            toast.error('Search failed. Please try again.');
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleBackToTypeSelection = () => {
        setSelectedType(null);
        setAvailability([]);
        setSearchPerformed(false);
        setSearchResult(null);
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

    const sortDoctorsByAvailability = (doctors, targetDate) => {
        return [...doctors].sort((a, b) => {
            const availA = checkDoctorAvailability(a.timeSlots, targetDate);
            const availB = checkDoctorAvailability(b.timeSlots, targetDate);
            return availA.sortOrder - availB.sortOrder;
        });
    };

    const getActiveSearchDate = () => {
        if (!searchResult) return searchDate;
        return searchResult.available ? searchDate : new Date(searchResult.nextAvailableDate);
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

    const medicalBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": "The DharmArth Foundation Sujangarh Healthcare Services",
        "description": "Check real-time doctor availability and government hospital service updates in Sujangarh, Churu District, Rajasthan. Get healthcare assistance and diagnostic test guides.",
        "url": "https://thedharmarth.com/doctors",
        "image": "https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778822813/the_dharmarth_foundation/logo.jpg",
        "telephone": contactPhone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jadaw Marg, Duliya Bypass",
            "addressLocality": "Sujangarh",
            "addressRegion": "Rajasthan",
            "postalCode": "331507",
            "addressCountry": "IN"
        }
    };

    return (
        <>
            <SEO 
                title="Doctor Availability & Government Hospital Services in Sujangarh"
                description="Check live doctor availability and updates on government hospital services in Sujangarh, Churu District, Rajasthan. Get healthcare assistance and diagnostic test guides from The DharmArth Foundation."
                keywords="Doctor Availability, Government Hospital Services, Sujangarh Hospital, Rajasthan Doctor Booking, Diagnostic Tests, Sujangarh doctors, Healthcare assistance Rajasthan"
                jsonLd={medicalBusinessSchema}
            />
            <Navbar />
            <div className="doctor-availability-page">
                {/* Hero Section */}
                <div className="availability-hero">
                    <div className="container">
                        <h1>Doctor Availability & Government Hospital Services in Sujangarh</h1>
                        <p>Check doctor schedules, clinics, and hospital updates in Sujangarh, Churu District, Rajasthan</p>
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
                                    <div className="category-view-header" style={{ textAlign: 'center', marginBottom: '40px', padding: '20px 0' }}>
                                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0' }}>Select Hospital Setting</h2>
                                        <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>Choose a facility to find available doctors and schedules</p>
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
                                                <span className="category-label">
                                                    {selectedType === 'government' ? '🏥 Government Hospital' : '🏨 Private Clinic'}
                                                </span>
                                                <h2 className="category-name-modern">
                                                    {searchCategoryId === 'all'
                                                        ? '🩺 All Specialists'
                                                        : searchCategoryId && searchCategories.find(c => c._id === searchCategoryId)
                                                            ? `${searchCategories.find(c => c._id === searchCategoryId).icon || '🩺'} ${searchCategories.find(c => c._id === searchCategoryId).name}`
                                                            : 'Specialist Search'}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="header-right">
                                            <div className="date-selection-chip" onClick={() => setShowSearchModal(true)}>
                                                <div className="chip-icon">🔍</div>
                                                <div className="chip-content">
                                                    <span className="chip-value">
                                                        {searchDate?.toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <span className="chip-action">Modify</span>
                                            </div>
                                        </div>
                                    </div>

                                    {searching ? (
                                        <div className="loading-doctors">
                                            <div className="loading-spinner"></div>
                                            <p>Searching for available doctors...</p>
                                        </div>
                                    ) : searchResult ? (
                                        <>
                                            {/* Fallback Message for Future Date */}
                                            {!searchResult.available && searchResult.nextAvailableDate && (
                                                <div className="fallback-notice-banner" style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(251, 191, 36, 0.05)' }}>
                                                    <div style={{ fontSize: '1.8rem' }}>⚠️</div>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px 0', color: '#b45309', fontWeight: '700', fontSize: '0.95rem' }}>No doctors are available on the selected date.</h4>
                                                        <p style={{ margin: 0, color: '#d97706', fontSize: '0.85rem', fontWeight: '600' }}>
                                                            Next available date for this category: {new Date(searchResult.nextAvailableDate).toLocaleDateString('en-GB')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {searchResult.doctors && searchResult.doctors.length > 0 ? (
                                                <div className="doctors-grid">
                                                    {sortDoctorsByAvailability(searchResult.doctors, getActiveSearchDate()).map(avail => {
                                                        const activeDate = getActiveSearchDate();
                                                        const availabilityInfo = checkDoctorAvailability(avail.timeSlots, activeDate);
                                                        const isUpcoming = !availabilityInfo.isAvailableNow &&
                                                            availabilityInfo.status !== 'Not Available Today' &&
                                                            availabilityInfo.status !== 'Shift Ended' &&
                                                            availabilityInfo.status !== 'Not Available';

                                                        return (
                                                            <div
                                                                key={avail._id}
                                                                className={`doctor-availability-card ${avail.hospitalType} ${availabilityInfo.isAvailableNow ? 'available-now' : ''}`}
                                                            >
                                                                <div className="doctor-photo">
                                                                    {avail.doctorId.photo ? (
                                                                        <img 
                                                                            src={avail.doctorId.photo.startsWith('http') ? avail.doctorId.photo : `${API_BASE_URL}${avail.doctorId.photo.startsWith('/') ? '' : '/'}${avail.doctorId.photo}`} 
                                                                            alt={`Dr. ${avail.doctorId.name} - Doctor Availability`} 
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

                                                                    {avail.doctorId.description && (
                                                                        <p className="doctor-description-text">
                                                                            {avail.doctorId.description}
                                                                        </p>
                                                                    )}

                                                                    {avail.hospitalType === 'clinic' && avail.doctorId.privateFee !== undefined && avail.doctorId.privateFee > 0 && (
                                                                        <div className="doctor-fee-row">
                                                                            <span>💵</span>
                                                                            <span>Fee: ₹{avail.doctorId.privateFee}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="doctor-badges">
                                                                        {!isUpcoming && (
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
                                                                        )}

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
                                                    <p>{searchResult.message || 'There are no doctors scheduled for this category in the near future. Please select a different category or change the hospital setting.'}</p>
                                                    <div className="blank-actions">
                                                        <button className="btn-primary-modern" onClick={() => setShowSearchModal(true)}>
                                                            Modify Search
                                                        </button>
                                                        <button className="btn-secondary-modern" onClick={handleBackToTypeSelection}>
                                                            Change Hospital
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="no-availability-premium">
                                            <div className="premium-blank-illustration">
                                                <span className="illustration-emoji">🔍</span>
                                            </div>
                                            <h3>No Search Results</h3>
                                            <p>Please click below to define your search parameters.</p>
                                            <div className="blank-actions">
                                                <button className="btn-primary-modern" onClick={() => setShowSearchModal(true)}>
                                                    Search Doctors
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Find a Doctor - Category Search Modal */}
                            {showSearchModal && (
                                <div className="date-picker-overlay" onClick={() => setShowSearchModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                                    <div className="date-picker-modal search-modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(255, 255, 255, 0.8)', background: 'white' }}>
                                        <div className="date-picker-header" style={{ padding: '20px 24px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>Find a Doctor</h3>
                                            <button className="close-btn" onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                                        </div>
                                        <form onSubmit={handleSearchSubmit} style={{ padding: '24px' }}>
                                            {/* Search/Filter dropdown */}
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Select Specialist</label>
                                                
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => {
                                                            setSearchQuery(e.target.value);
                                                            // Clear selected if they search something else
                                                            const val = e.target.value.toLowerCase();
                                                            const exactMatch = searchCategories.find(c => c.name.toLowerCase() === val);
                                                            if (exactMatch) {
                                                                setSearchCategoryId(exactMatch._id);
                                                            } else if (val === 'all' || val === 'all specialists') {
                                                                setSearchCategoryId('all');
                                                            } else {
                                                                setSearchCategoryId('');
                                                            }
                                                        }}
                                                        placeholder="Which specialist are you looking for?"
                                                        style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', background: '#f8fafc' }}
                                                        required
                                                    />
                                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748b' }}>🔍</span>
                                                </div>

                                                {/* Filtered Dropdown list */}
                                                <div style={{
                                                    maxHeight: '180px',
                                                    overflowY: 'auto',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    marginTop: '6px',
                                                    background: 'white',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    {("all specialists".includes(searchQuery.toLowerCase()) || "all".includes(searchQuery.toLowerCase()) || searchQuery === '') && (
                                                        <div
                                                            onClick={() => {
                                                                setSearchCategoryId('all');
                                                                setSearchQuery('All Specialists');
                                                            }}
                                                            style={{
                                                                padding: '10px 14px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '0.9rem',
                                                                fontWeight: searchCategoryId === 'all' ? '600' : '400',
                                                                background: searchCategoryId === 'all' ? '#eff6ff' : 'transparent',
                                                                color: searchCategoryId === 'all' ? '#1d4ed8' : '#334155',
                                                                borderBottom: '1px solid #f1f5f9'
                                                            }}
                                                        >
                                                            <span>🩺</span>
                                                            <span>All Specialists</span>
                                                        </div>
                                                    )}
                                                    {searchCategories
                                                        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                        .map(c => (
                                                            <div
                                                                key={c._id}
                                                                onClick={() => {
                                                                    setSearchCategoryId(c._id);
                                                                    setSearchQuery(c.name);
                                                                }}
                                                                style={{
                                                                    padding: '10px 14px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: searchCategoryId === c._id ? '600' : '400',
                                                                    background: searchCategoryId === c._id ? '#eff6ff' : 'transparent',
                                                                    color: searchCategoryId === c._id ? '#1d4ed8' : '#334155',
                                                                    borderBottom: '1px solid #f1f5f9'
                                                                }}
                                                            >
                                                                <span>{c.icon || '🩺'}</span>
                                                                <span>{c.name}</span>
                                                            </div>
                                                        ))}
                                                    {searchCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                                                        !("all specialists".includes(searchQuery.toLowerCase()) || "all".includes(searchQuery.toLowerCase()) || searchQuery === '') && (
                                                            <div style={{ padding: '12px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>No specialist found</div>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Date selection */}
                                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Preferred Date</label>
                                                <input
                                                    type="date"
                                                    value={searchDate.toISOString().split('T')[0]}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => setSearchDate(new Date(e.target.value))}
                                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', background: '#f8fafc' }}
                                                    required
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="btn-secondary-modern"
                                                    onClick={() => setShowSearchModal(false)}
                                                    style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-primary-modern"
                                                    disabled={!searchCategoryId}
                                                    style={{
                                                        padding: '10px 20px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: !searchCategoryId ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                                        color: 'white',
                                                        cursor: !searchCategoryId ? 'not-allowed' : 'pointer',
                                                        fontWeight: '600',
                                                        boxShadow: !searchCategoryId ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                                                    }}
                                                >
                                                    Find Availability
                                                </button>
                                            </div>
                                        </form>
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
                                                    alt={`Dr. ${doctor.name} - Emergency Doctor at The DharmArth Foundation`} 
                                                />
                                            ) : (
                                                <div className="photo-placeholder">👨‍⚕️</div>
                                            )}
                                        </div>
                                        <h3>{doctor.name}</h3>
                                        <p className="doctor-title">{doctor.title}</p>

                                        {doctor.description && (
                                            <p className="doctor-description-text" style={{ textAlign: 'left' }}>
                                                {doctor.description}
                                            </p>
                                        )}

                                        {(doctor.type === 'clinic' || doctor.type === 'both') && doctor.privateFee !== undefined && doctor.privateFee > 0 && (
                                            <div className="doctor-fee-row" style={{ margin: '8px auto' }}>
                                                <span>💵</span>
                                                <span>Fee: ₹{doctor.privateFee}</span>
                                            </div>
                                        )}

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
                                                <h3>{(i18n.language?.startsWith('hi') && faq.question_hi) ? faq.question_hi : faq.question}</h3>
                                                <span className="faq-toggle">{openFaqIndex === index ? '−' : '+'}</span>
                                            </div>
                                            <div className="faq-answer">
                                                <p>{(i18n.language?.startsWith('hi') && faq.answer_hi) ? faq.answer_hi : faq.answer}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default DoctorAvailability;
