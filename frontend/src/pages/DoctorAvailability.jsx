import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Stethoscope, Search, Hospital, Building2, Calendar, Filter, RotateCw, ChevronDown, User, BadgeCheck, X } from 'lucide-react';
import './DoctorAvailability.css';
import SEO from '../components/common/SEO';

const API_URL = `${API_BASE_URL}/api`;

// Helper to format date to YYYY-MM-DD locally to avoid timezone shifts
const getLocalDateString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to parse YYYY-MM-DD string into a local Date object set to 00:00:00
const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const categoryTranslations = {
    'Cardiologist': 'हृदय रोग विशेषज्ञ (Cardiologist)',
    'Dentist': 'दंत चिकित्सक (Dentist)',
    'Dermatologist': 'त्वचा रोग विशेषज्ञ (Dermatologist)',
    'ENT Specialist': 'नाक-कान-गला विशेषज्ञ (ENT Specialist)',
    'General Physician': 'सामान्य चिकित्सक (General Physician)',
    'Gynecologist': 'स्त्री रोग विशेषज्ञ (Gynecologist)',
    'Orthopedic': 'हड्डी रोग विशेषज्ञ (Orthopedic)',
    'Pediatrician': 'बाल रोग विशेषज्ञ (Pediatrician)',
    'Ophthalmologist': 'नेत्र रोग विशेषज्ञ (Ophthalmologist)',
    'Neurologist': 'नसों के रोग विशेषज्ञ (Neurologist)',
    'Urologist': 'मूत्र रोग विशेषज्ञ (Urologist)',
    'Oncologist': 'कैंसर रोग विशेषज्ञ (Oncologist)',
    'Psychiatrist': 'मनोचिकित्सक (Psychiatrist)',
    'Surgeon': 'सर्जन (Surgeon)'
};

const DoctorAvailability = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('category'); // Always 'category' now
    const [selectedType, setSelectedType] = useState(null); // 'government' or 'clinic'
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
        fetchDoctorFaqs();
        fetchSettings();
        fetchSearchCategories();
    }, []);

    useEffect(() => {
        if (searchCategoryId === 'all') {
            setSearchQuery(i18n.language === 'hi' ? 'सभी विशेषज्ञ' : 'All Specialists');
        } else if (searchCategoryId) {
            const cat = searchCategories.find(c => c._id === searchCategoryId);
            if (cat) {
                setSearchQuery(i18n.language === 'hi' ? (categoryTranslations[cat.name] || cat.name) : cat.name);
            }
        }
    }, [i18n.language, searchCategoryId, searchCategories]);

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
        setSearchCategoryId('all');
        setSearchQuery(i18n.language === 'hi' ? 'सभी विशेषज्ञ' : 'All Specialists');
        setShowSearchModal(true);
    };

    const handleCloseSearchModal = () => {
        setShowSearchModal(false);
        if (!searchPerformed) {
            setSelectedType(null);
        }
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

            let url = `${API_URL}/availability/search?hospitalType=${selectedType}&categoryId=${searchCategoryId}`;
            if (selectedType !== 'clinic') {
                // Format date to YYYY-MM-DD locally to avoid timezone shifts
                const dateStr = getLocalDateString(searchDate);
                url += `&date=${dateStr}`;
            }

            const response = await fetch(url);

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
                        <p>Check doctor schedules, clinics, and hospital updates in Sujangarh, Churu District, Rajasthan</p>
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
                                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0' }}>
                                            {i18n.language === 'hi' ? 'अस्पताल सेटिंग चुनें' : 'Select Hospital Setting'}
                                        </h2>
                                        <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>
                                            {i18n.language === 'hi' ? 'उपलब्ध डॉक्टरों और शेड्यूल को खोजने के लिए एक सुविधा चुनें' : 'Choose a facility to find available doctors and schedules'}
                                        </p>
                                    </div>

                                    <div className="category-options">
                                        <div
                                            className="category-card government"
                                            onClick={() => handleTypeSelect('government')}
                                        >
                                            <div className="category-icon">🏥</div>
                                            <h3>{i18n.language === 'hi' ? 'सरकारी अस्पताल' : 'Government Hospital'}</h3>
                                            <p>{i18n.language === 'hi' ? 'निर्धारित नियुक्तियां' : 'Scheduled appointments'}</p>
                                            <div className="category-badge">{i18n.language === 'hi' ? 'निर्धारित' : 'Scheduled'}</div>
                                        </div>

                                        <div
                                            className="category-card clinic"
                                            onClick={() => handleTypeSelect('clinic')}
                                        >
                                            <div className="category-icon">🏨</div>
                                            <h3>{i18n.language === 'hi' ? 'निजी क्लिनिक' : 'Private Clinic'}</h3>
                                            <p>{i18n.language === 'hi' ? 'उच्च उपलब्धता वाले डॉक्टर' : 'High availability doctors'}</p>
                                            <div className="category-badge priority">{i18n.language === 'hi' ? 'उच्च उपलब्धता' : 'High Availability'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Doctor Cards View */}
                            {selectedType && (
                                <div className="doctors-view">
                                    <div className="premium-header-card">
                                        <div className="header-left">
                                            <button className="btn-back-square" onClick={handleBackToTypeSelection}>
                                                <ArrowLeft className="back-arrow-icon" size={20} />
                                            </button>
                                            
                                            <div className="header-divider-line"></div>
                                            
                                            <div className="category-avatar-bubble">
                                                {selectedType === 'government' ? (
                                                    <Hospital size={22} className="category-avatar-icon" />
                                                ) : (
                                                    <Building2 size={22} className="category-avatar-icon" />
                                                )}
                                            </div>

                                            <div className="category-info-mini">
                                                <div className="category-label-wrapper">
                                                    <span className="category-label-text">
                                                        {selectedType === 'government' ? (
                                                            i18n.language === 'hi' ? 'सरकारी अस्पताल' : 'Government Hospital'
                                                        ) : (
                                                            i18n.language === 'hi' ? 'निजी क्लिनिक' : 'Private Clinic'
                                                        )}
                                                    </span>
                                                    <BadgeCheck size={14} className="verified-badge-icon" />
                                                </div>
                                                
                                                <h2 className="category-name-modern">
                                                    {searchCategoryId === 'all'
                                                        ? (i18n.language === 'hi' ? 'सभी विशेषज्ञ' : 'All Specialists')
                                                        : searchCategoryId && searchCategories.find(c => c._id === searchCategoryId)
                                                            ? (i18n.language === 'hi'
                                                                ? (categoryTranslations[searchCategories.find(c => c._id === searchCategoryId).name] || searchCategories.find(c => c._id === searchCategoryId).name)
                                                                : searchCategories.find(c => c._id === searchCategoryId).name)
                                                            : (i18n.language === 'hi' ? 'विशेषज्ञ खोज' : 'Specialist Search')}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="header-right-actions">
                                            {/* Filter Button */}
                                            <button className="action-btn-filter" onClick={() => setShowSearchModal(true)}>
                                                <Filter size={15} className="action-icon-green" />
                                                <span className="action-btn-text">
                                                    {i18n.language === 'hi' ? 'फ़िल्टर' : 'Filter'}
                                                </span>
                                            </button>

                                            {/* Change/Modify Button */}
                                            <button className="action-btn-change" onClick={() => setShowSearchModal(true)}>
                                                <RotateCw size={14} className="action-icon-white" />
                                                <span className="action-btn-text">
                                                    {i18n.language === 'hi' ? 'बदलें' : 'Modify'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {searching ? (
                                        <div className="loading-doctors">
                                            <div className="loading-spinner"></div>
                                            <p>{i18n.language === 'hi' ? 'उपलब्ध डॉक्टरों की खोज की जा रही है...' : 'Searching for available doctors...'}</p>
                                        </div>
                                    ) : searchResult ? (
                                        <>
                                            {searchResult.doctors && searchResult.doctors.length > 0 ? (
                                                <div className="doctors-grid">
                                                    {(selectedType === 'clinic' ? searchResult.doctors : sortDoctorsByAvailability(searchResult.doctors, getActiveSearchDate())).map(avail => {
                                                        const activeDate = selectedType === 'clinic' ? null : getActiveSearchDate();
                                                        const availabilityInfo = selectedType === 'clinic' ? null : checkDoctorAvailability(avail.timeSlots, activeDate);
                                                        const isUpcoming = selectedType === 'clinic' ? false : (!availabilityInfo.isAvailableNow &&
                                                            availabilityInfo.status !== 'Not Available Today' &&
                                                            availabilityInfo.status !== 'Shift Ended' &&
                                                            availabilityInfo.status !== 'Not Available');

                                                        return (
                                                            <div
                                                                key={avail._id}
                                                                className={`doctor-availability-card ${avail.hospitalType} ${selectedType !== 'clinic' && availabilityInfo?.isAvailableNow ? 'available-now' : ''}`}
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
                                                                    <h3>{i18n.language === 'hi' ? (avail.doctorId.name_hi || avail.doctorId.name) : avail.doctorId.name}</h3>
                                                                    <div className="doctor-meta-row">
                                                                        <span className="doctor-title">{i18n.language === 'hi' ? (avail.doctorId.title_hi || avail.doctorId.title) : avail.doctorId.title}</span>
                                                                        <span className="doctor-experience">- {i18n.language === 'hi' ? (avail.doctorId.experience_hi || avail.doctorId.experience) : avail.doctorId.experience}</span>
                                                                    </div>

                                                                    {(i18n.language === 'hi' ? (avail.doctorId.description_hi || avail.doctorId.description) : avail.doctorId.description) && (
                                                                        <p className="doctor-description-text">
                                                                            {i18n.language === 'hi' ? (avail.doctorId.description_hi || avail.doctorId.description) : avail.doctorId.description}
                                                                        </p>
                                                                    )}

                                                                    {avail.hospitalType === 'clinic' && avail.doctorId.privateFee !== undefined && avail.doctorId.privateFee > 0 && (
                                                                        <div className="doctor-fee-row">
                                                                            <span>💵</span>
                                                                            <span>{i18n.language === 'hi' ? 'फीस' : 'Fee'}: ₹{avail.doctorId.privateFee}</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="doctor-badges">
                                                                        {selectedType !== 'clinic' && !isUpcoming && (
                                                                            <div className={`availability-status ${availabilityInfo.isAvailableNow ? 'available' :
                                                                                (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? 'closed' :
                                                                                    'upcoming'
                                                                                }`}>
                                                                                <span>
                                                                                    {availabilityInfo.isAvailableNow ? '●' :
                                                                                        (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? '✕' :
                                                                                            '🕒'}
                                                                                </span>
                                                                                <span>
                                                                                    {i18n.language === 'hi' ? (() => {
                                                                                        const status = availabilityInfo.status;
                                                                                        if (status === 'Available Now') return 'अभी उपलब्ध';
                                                                                        if (status === 'Not Available Today') return 'आज उपलब्ध नहीं';
                                                                                        if (status === 'Shift Ended') return 'शिफ्ट समाप्त';
                                                                                        if (status === 'Not Available') return 'उपलब्ध नहीं';
                                                                                        if (status === 'Scheduled') return 'निर्धारित';
                                                                                        if (status.startsWith('Available in')) {
                                                                                            return status.replace('Available in', '').replace('minutes', 'मिनट में उपलब्ध').replace('hours', 'घंटे में उपलब्ध').replace('hour', 'घंटे में उपलब्ध').trim();
                                                                                        }
                                                                                        if (status.startsWith('Available at')) {
                                                                                            return status.replace('Available at', '').trim() + ' पर उपलब्ध';
                                                                                        }
                                                                                        return status;
                                                                                    })() : availabilityInfo.status}
                                                                                </span>
                                                                            </div>
                                                                        )}


                                                                    </div>
                                                                </div>

                                                                {selectedType === 'clinic' ? (
                                                                    <>
                                                                        {avail.timing && (
                                                                            <div className="clinic-timing-row" style={{ padding: '0 20px', margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', fontSize: '0.9rem', fontWeight: '700' }}>
                                                                                <span style={{ fontSize: '1rem' }}>🕒</span>
                                                                                <span>
                                                                                    {i18n.language === 'hi' ? 'समय: ' : 'Timing: '}
                                                                                    {formatTime(avail.timing.startTime)} - {formatTime(avail.timing.endTime)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="available-dates-container" style={{ marginTop: '15px', padding: '10px 20px 15px 20px', borderTop: '1px dashed #e2e8f0' }}>
                                                                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                <Calendar size={14} style={{ color: '#00bf9a' }} />
                                                                                {i18n.language === 'hi' 
                                                                                    ? `उपलब्ध तिथियां (${new Date().toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' })}):` 
                                                                                    : `Available Dates (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}):`}
                                                                            </h4>
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                            {avail.availableDates && avail.availableDates.length > 0 ? (
                                                                                avail.availableDates.map(dayNum => (
                                                                                    <span 
                                                                                        key={dayNum} 
                                                                                        style={{ 
                                                                                            background: '#e6faf5', 
                                                                                            color: '#00bf9a', 
                                                                                            padding: '4px 10px', 
                                                                                            borderRadius: '20px', 
                                                                                            fontSize: '0.85rem', 
                                                                                            fontWeight: '600',
                                                                                            border: '1px solid #c2f4e8'
                                                                                        }}
                                                                                    >
                                                                                        {dayNum}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                                                    {i18n.language === 'hi' ? 'कोई उपलब्ध तिथि नहीं' : 'No available dates'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                    <div className="time-slots">
                                                                        {avail.timeSlots.map((slot, idx) => (
                                                                            <div key={idx} className={`time-slot ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                                                <div className="slot-info">
                                                                                    <span className="slot-period">{slot.period} :</span>
                                                                                    <span className="slot-time">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>

                                                                                    <div className={`slot-status ${slot.status.toLowerCase().replace(' ', '-')}`}>
                                                                                        {slot.status === 'Available' && (i18n.language === 'hi' ? '✓ उपलब्ध' : '✓ Available')}
                                                                                        {slot.status === 'Not Available' && (i18n.language === 'hi' ? '✗ उपलब्ध नहीं' : '✗ Not Available')}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="no-availability-premium">
                                                    <div className="premium-blank-illustration">
                                                        <span className="illustration-emoji">😔</span>
                                                    </div>
                                                    <h3>{i18n.language === 'hi' ? 'कोई डॉक्टर उपलब्ध नहीं है' : 'No Doctors Available'}</h3>
                                                    <p>
                                                        {searchResult.message || (i18n.language === 'hi' 
                                                            ? 'निकट भविष्य में इस श्रेणी के लिए कोई डॉक्टर निर्धारित नहीं हैं। कृपया एक अलग श्रेणी चुनें या अस्पताल सेटिंग बदलें।' 
                                                            : 'There are no doctors scheduled for this category in the near future. Please select a different category or change the hospital setting.')}
                                                    </p>
                                                    <div className="blank-actions">
                                                        <button className="btn-primary-modern" onClick={() => setShowSearchModal(true)}>
                                                            {i18n.language === 'hi' ? 'खोज बदलें' : 'Modify Search'}
                                                        </button>
                                                        <button className="btn-secondary-modern" onClick={handleBackToTypeSelection}>
                                                            {i18n.language === 'hi' ? 'अस्पताल बदलें' : 'Change Hospital'}
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
                                            <h3>{i18n.language === 'hi' ? 'कोई खोज परिणाम नहीं' : 'No Search Results'}</h3>
                                            <p>{i18n.language === 'hi' ? 'कृपया अपने खोज मापदंडों को परिभाषित करने के लिए नीचे क्लिक करें।' : 'Please click below to define your search parameters.'}</p>
                                            <div className="blank-actions">
                                                <button className="btn-primary-modern" onClick={() => setShowSearchModal(true)}>
                                                    {i18n.language === 'hi' ? 'डॉक्टरों की खोज करें' : 'Search Doctors'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Find a Doctor - Category Search Modal */}
                            {showSearchModal && (
                                <div className="date-picker-overlay" onClick={handleCloseSearchModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                                    <div className="date-picker-modal search-modal-premium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(255, 255, 255, 0.8)', background: 'white' }}>
                                        <div className="date-picker-header" style={{ padding: '20px 24px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>{i18n.language === 'hi' ? 'डॉक्टर खोजें' : 'Find a Doctor'}</h3>
                                            <button className="close-btn" onClick={handleCloseSearchModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                                        </div>
                                        <form onSubmit={handleSearchSubmit} style={{ padding: '24px' }}>
                                            {/* Search/Filter dropdown */}
                                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>{i18n.language === 'hi' ? 'विशेषज्ञ चुनें' : 'Select Specialist'}</label>

                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setSearchQuery(val);
                                                            const lowerVal = val.toLowerCase().trim();
                                                            const exactMatch = searchCategories.find(c => {
                                                                const engName = c.name.toLowerCase();
                                                                const hiName = (categoryTranslations[c.name] || '').toLowerCase();
                                                                return engName === lowerVal || hiName === lowerVal;
                                                            });
                                                            if (exactMatch) {
                                                                setSearchCategoryId(exactMatch._id);
                                                            } else if (lowerVal === 'all' || lowerVal === 'all specialists' || lowerVal === 'सभी' || lowerVal === 'सभी विशेषज्ञ') {
                                                                setSearchCategoryId('all');
                                                            } else {
                                                                setSearchCategoryId('');
                                                            }
                                                        }}
                                                        placeholder={i18n.language === 'hi' ? 'आप किस विशेषज्ञ की तलाश कर रहे हैं?' : 'Which specialist are you looking for?'}
                                                        style={{ width: '100%', padding: '10px 36px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', background: '#f8fafc' }}
                                                        required
                                                    />
                                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#64748b' }}>🔍</span>
                                                    {searchQuery && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchQuery('');
                                                                setSearchCategoryId('');
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                right: '12px',
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: '#94a3b8',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                padding: '4px',
                                                                borderRadius: '50%',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = '#f1f5f9'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                                                            aria-label="Clear search"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
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
                                                    {(() => {
                                                        const lowerQuery = searchQuery.toLowerCase().trim();
                                                        const showAllSpecialists = 
                                                            lowerQuery === '' || 
                                                            'all specialists'.includes(lowerQuery) || 
                                                            'all'.includes(lowerQuery) || 
                                                            'सभी विशेषज्ञ'.includes(lowerQuery) || 
                                                            'सभी'.includes(lowerQuery);

                                                        // If "All Specialists" (or equivalent) is the search query, show all categories in the dropdown list
                                                        const isAllSelected = 
                                                            lowerQuery === '' || 
                                                            lowerQuery === 'all' || 
                                                            lowerQuery === 'all specialists' || 
                                                            lowerQuery === 'सभी' || 
                                                            lowerQuery === 'सभी विशेषज्ञ';

                                                        const filteredCategories = isAllSelected 
                                                            ? searchCategories 
                                                            : searchCategories.filter(c => {
                                                                const engName = c.name.toLowerCase();
                                                                const hiName = (categoryTranslations[c.name] || '').toLowerCase();
                                                                return engName.includes(lowerQuery) || hiName.includes(lowerQuery);
                                                            });

                                                        return (
                                                            <>
                                                                {showAllSpecialists && (
                                                                    <div
                                                                        onClick={() => {
                                                                            setSearchCategoryId('all');
                                                                            setSearchQuery(i18n.language === 'hi' ? 'सभी विशेषज्ञ' : 'All Specialists');
                                                                        }}
                                                                        style={{
                                                                            padding: '10px 14px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            fontSize: '0.9rem',
                                                                            fontWeight: searchCategoryId === 'all' ? '600' : '400',
                                                                            background: searchCategoryId === 'all' ? '#e6faf5' : 'transparent',
                                                                            color: searchCategoryId === 'all' ? '#00bf9a' : '#334155',
                                                                            borderBottom: '1px solid #f1f5f9'
                                                                        }}
                                                                    >
                                                                        <span>🩺</span>
                                                                        <span>{i18n.language === 'hi' ? 'सभी विशेषज्ञ' : 'All Specialists'}</span>
                                                                    </div>
                                                                )}
                                                                {filteredCategories.map(c => (
                                                                    <div
                                                                        key={c._id}
                                                                        onClick={() => {
                                                                            setSearchCategoryId(c._id);
                                                                            setSearchQuery(i18n.language === 'hi' ? (categoryTranslations[c.name] || c.name) : c.name);
                                                                        }}
                                                                        style={{
                                                                            padding: '10px 14px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            fontSize: '0.9rem',
                                                                            fontWeight: searchCategoryId === c._id ? '600' : '400',
                                                                            background: searchCategoryId === c._id ? '#e6faf5' : 'transparent',
                                                                            color: searchCategoryId === c._id ? '#00bf9a' : '#334155',
                                                                            borderBottom: '1px solid #f1f5f9'
                                                                        }}
                                                                    >
                                                                        <span>{c.icon || '🩺'}</span>
                                                                        <span>{i18n.language === 'hi' ? (categoryTranslations[c.name] || c.name) : c.name}</span>
                                                                    </div>
                                                                ))}
                                                                {!showAllSpecialists && filteredCategories.length === 0 && (
                                                                    <div style={{ padding: '12px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                                                                        {i18n.language === 'hi' ? 'कोई विशेषज्ञ नहीं मिला' : 'No specialist found'}
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                                                <button
                                                    type="button"
                                                    className="btn-secondary-modern"
                                                    onClick={handleCloseSearchModal}
                                                    style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', textAlign: 'center' }}
                                                >
                                                    {i18n.language === 'hi' ? 'रद्द करें' : 'Cancel'}
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-primary-modern"
                                                    disabled={!searchCategoryId}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 15px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background: !searchCategoryId ? '#94a3b8' : 'linear-gradient(135deg, #00bf9a, #00bf9a)',
                                                        color: 'white',
                                                        cursor: !searchCategoryId ? 'not-allowed' : 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '0.9rem',
                                                        textAlign: 'center',
                                                        boxShadow: !searchCategoryId ? 'none' : '0 4px 6px -1px rgba(0, 191, 154, 0.2)'
                                                    }}
                                                >
                                                    {i18n.language === 'hi' ? 'उपलब्धता खोजें' : 'Find Availability'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
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
