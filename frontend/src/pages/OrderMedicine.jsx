import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Camera, ShieldCheck, Zap, Truck, ArrowRight, X, Info, MapPin, Plus, Edit2, Phone, User, Share2, ShoppingBag } from 'lucide-react';
import api, { API_BASE_URL } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/common/SEO';
import SimplifyDosage from '../components/SimplifyDosage';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './OrderMedicine.css';

const getStatusIndex = (status) => {
    if (status === 'Awaiting Approval') return 0;
    const order = ['Payment Pending', 'Processing', 'Ready for Packing', 'Ready for Dispatch', 'Out for Delivery', 'Delivered'];
    return order.indexOf(status);
};

const VerifiedItemRow = ({ item }) => {
    const { t } = useTranslation();
    const [showDosage, setShowDosage] = useState(false);
    const hasDosage = item.time || item.frequency || item.foodRelation || item.intakeMethod || item.dosage;

    return (
        <div style={{ marginBottom: '15px', borderBottom: '2px solid #cbd5e0', paddingBottom: '10px' }}>
            <div className="item-row" style={{ borderBottom: 'none', padding: 0, marginBottom: '8px' }}>
                <div className="item-name" style={{ fontWeight: '600', color: '#2d3748', fontSize: '1.1rem' }}>
                    {item.medicineName} ({t('pharmacy.unit')}: {item.quantity || 1})
                </div>
                <div className="item-price" style={{ fontWeight: 'bold' }}>₹{Number(item.price || 0).toFixed(2)}</div>
            </div>
            {hasDosage ? (
                <div style={{ marginTop: '0px' }}>
                    <button
                        type="button"
                        onClick={() => setShowDosage(!showDosage)}
                        style={{
                            background: 'none', border: 'none', color: '#3182ce', fontSize: '14px',
                            cursor: 'pointer', padding: 0, fontWeight: '500', display: 'flex', alignItems: 'center'
                        }}
                    >
                        {showDosage ? t('pharmacy.hideDosage') : t('pharmacy.viewDosage')}
                    </button>
                    {showDosage && (
                        <div style={{ marginTop: '12px', animation: 'fadeIn 0.3s ease-in-out' }}>
                            <SimplifyDosage
                                time={item.time}
                                frequency={item.frequency}
                                foodRelation={item.foodRelation}
                                intakeMethod={item.intakeMethod}
                                additionalNotes={item.dosage}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>
                    <Info size={12} style={{ display: 'inline', marginRight: '4px' }} /> {t('pharmacy.noDosage')}
                </div>
            )}
        </div>
    );
};

const OrderMedicine = () => {
    const { t, i18n } = useTranslation();
    const isHindi = i18n.language === 'hi' || i18n.language?.startsWith('hi');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showAlert } = useConfirm();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [myPrescriptions, setMyPrescriptions] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [guestHistoryError, setGuestHistoryError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Online');
    const [isSyncing, setIsSyncing] = useState(false);
    const [historyTab, setHistoryTab] = useState('prescriptions'); // 'prescriptions' or 'orders'
    const [showPostUploadModal, setShowPostUploadModal] = useState(false);
    const [showRecentModal, setShowRecentModal] = useState(false);

    // Checkout Modal State
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState(null);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // Guest Info Modal State
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestMobile, setGuestMobile] = useState('');

    // Image Viewer Modal State
    const [imageModalSrc, setImageModalSrc] = useState(null);

    // Track Order Modal State
    const [trackModalOpen, setTrackModalOpen] = useState(false);
    const [selectedTrackOrder, setSelectedTrackOrder] = useState(null);
    const [isReorderFlow, setIsReorderFlow] = useState(false);
    const [pharmacyConfig, setPharmacyConfig] = useState(null);
    const [contactPhone, setContactPhone] = useState('8306305569');

    const [shippingDetails, setShippingDetails] = useState({
        _id: null,
        street: '',
        city: '',
        villageName: '',
        state: '',
        zip: '',
        phone: '',
        altPhone: ''
    });
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
    const [isOrderingForSomeoneElse, setIsOrderingForSomeoneElse] = useState(false);
    const [activeStep, setActiveStep] = useState(1);

    const [notes, setNotes] = useState('');
    const [faqAnswers, setFaqAnswers] = useState({});
    const [pincodeError, setPincodeError] = useState('');
    const zipTimeoutRef = useRef(null);

    // Client Flowchart Page 1 Requirements
    const [courseDays, setCourseDays] = useState('');
    const [needAllMedicines, setNeedAllMedicines] = useState(true); // true: 'पर्ची की सभी दवाई चाहिए', false: 'पर्ची की कुछ दवाई चाहिए'
    const [showPastRxModal, setShowPastRxModal] = useState(false);
    const [selectedPastRx, setSelectedPastRx] = useState(null);
    const [showUploadPickerModal, setShowUploadPickerModal] = useState(false);

    // Auto-dismiss upload picker modal whenever a preview is present
    useEffect(() => {
        if (preview) {
            setShowUploadPickerModal(false);
        }
    }, [preview]);

    const openCameraPicker = (e) => {
        if (e && e.stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowUploadPickerModal(false);
        setTimeout(() => {
            const camInput = document.getElementById('presc-upload-camera');
            if (camInput) {
                camInput.value = '';
                camInput.click();
            }
        }, 50);
    };

    const openGalleryPicker = (e) => {
        if (e && e.stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowUploadPickerModal(false);
        setTimeout(() => {
            const galInput = document.getElementById('presc-upload-gallery');
            if (galInput) {
                galInput.value = '';
                galInput.click();
            }
        }, 50);
    };

    const validatePincode = (pincodeValue) => {
        const pin = (pincodeValue || '').trim();
        if (!pin) {
            setPincodeError('');
            return true;
        }
        if (pharmacyConfig?.acceptedPincodes && pharmacyConfig.acceptedPincodes.trim() !== '') {
            const allowedPincodes = pharmacyConfig.acceptedPincodes.split(',').map(p => p.trim());
            if (!allowedPincodes.includes(pin)) {
                const villages = pharmacyConfig?.serviceableVillages || (isHindi ? "छापर, सांडवा, बीदासर" : "Chhapar, Sandwa, Bidasar");
                const defaultNotice = isHindi 
                    ? `इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा ${villages} के लिए उपलब्ध है`
                    : `Service is not yet available in this town/village. It will start soon. Currently, this service is available for ${villages}`;
                const errMsg = (isHindi ? pharmacyConfig?.unserviceableNoticeHi : pharmacyConfig?.unserviceableNotice) || pharmacyConfig?.unserviceableNotice || defaultNotice;
                setPincodeError(errMsg);
                return false;
            }
        }
        setPincodeError('');
        return true;
    };

    const getVillagesForPincode = (pincodeValue) => {
        const pin = (pincodeValue || '').trim();
        if (!pin) return [];
        const match = (pharmacyConfig?.pincodeVillages || []).find(pv => (pv.pincode || '').trim() === pin);
        if (match && match.villages) {
            return match.villages.split(',').map(v => v.trim()).filter(Boolean);
        }
        if (pharmacyConfig?.serviceableVillages) {
            return pharmacyConfig.serviceableVillages.split(',').map(v => v.trim()).filter(Boolean);
        }
        return ['छापर', 'सांडवा', 'बीदासर'];
    };

    const handleManualZipChange = (newZip) => {
        setShippingDetails(prev => ({ ...prev, zip: newZip }));
        if (zipTimeoutRef.current) {
            clearTimeout(zipTimeoutRef.current);
        }
        if (newZip.trim().length < 4) {
            setPincodeError('');
            return;
        }
        zipTimeoutRef.current = setTimeout(() => {
            const isValid = validatePincode(newZip);
            if (isValid) {
                const villages = getVillagesForPincode(newZip);
                if (villages.length > 0 && !shippingDetails.villageName) {
                    setShippingDetails(prev => ({ 
                        ...prev, 
                        city: prev.city || villages[0], 
                        villageName: prev.villageName || villages[0] 
                    }));
                }
            }
        }, 400);
    };

    const [suggestions, setSuggestions] = useState([]);
    const [activeInputContext, setActiveInputContext] = useState(''); // 'main' or 'modal'
    const autocompleteServiceRef = useRef(null);
    const sessionTokenRef = useRef(null);

    // Dynamically load Google Maps Javascript API with places library
    useEffect(() => {
        if (window.google?.maps?.places) return;
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        // Check if there is already a script with maps.googleapis.com
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, []);

    // Global listener to close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setSuggestions([]);
        };
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const fetchSuggestions = (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        if (!window.google?.maps?.places) return;

        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }

        autocompleteServiceRef.current.getPlacePredictions(
            {
                input: query,
                sessionToken: sessionTokenRef.current,
                componentRestrictions: { country: 'in' }
            },
            (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions);
                } else {
                    setSuggestions([]);
                }
            }
        );
    };

    const handleSelectSuggestion = (placeId) => {
        if (!window.google?.maps?.places) return;

        const dummyDiv = document.createElement('div');
        const service = new window.google.maps.places.PlacesService(dummyDiv);

        service.getDetails(
            {
                placeId: placeId,
                fields: ['address_components', 'formatted_address'],
                sessionToken: sessionTokenRef.current
            },
            (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    const components = place.address_components;
                    let street = place.formatted_address || '';
                    let city = '';
                    let state = '';
                    let zip = '';

                    components.forEach(c => {
                        if (c.types.includes('locality')) {
                            city = c.long_name;
                        } else if (c.types.includes('administrative_area_level_1')) {
                            state = c.long_name;
                        } else if (c.types.includes('postal_code')) {
                            zip = c.long_name;
                        }
                    });

                    setShippingDetails(prev => ({
                        ...prev,
                        street: street,
                        city: city || prev.city,
                        state: state || prev.state,
                        zip: zip || prev.zip
                    }));

                    if (zip) {
                        validatePincode(zip);
                    }

                    // Reset suggestions and session token
                    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
                    setSuggestions([]);
                }
            }
        );
    };

    const handleStreetChange = (val, context) => {
        setShippingDetails(prev => ({ ...prev, street: val }));
        setActiveInputContext(context);
        fetchSuggestions(val);
    };

    const getContactTiming = () => {
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 8) {
            return {
                text: i18n.language === 'hi'
                    ? (pharmacyConfig?.nightTimeContactTextHi || pharmacyConfig?.nightTimeContactText || "फाउंडेशन आपसे सुबह 8:30 बजे संपर्क करेगा")
                    : (pharmacyConfig?.nightTimeContactText || "Foundation will contact you at 8:30 AM"),
                icon: <Clock size={14} />,
                type: 'night'
            };
        } else {
            return {
                text: i18n.language === 'hi'
                    ? (pharmacyConfig?.dayTimeContactTextHi || pharmacyConfig?.dayTimeContactText || "फार्मासिस्ट आपसे 10-20 मिनट में संपर्क करेगा")
                    : (pharmacyConfig?.dayTimeContactText || "Pharmacist will contact you in 10-20 minutes"),
                icon: <Zap size={14} />,
                type: 'day'
            };
        }
    };

    const fetchPharmacyConfig = async () => {
        try {
            const res = await api.get('/settings/pharmacy/public');
            setPharmacyConfig(res.data);
        } catch (err) {
            console.error("Failed to fetch pharmacy config", err);
        }
    };

    const fetchOrders = async () => {
        try {
            const isUserLoggedIn = !!localStorage.getItem('user');
            const gMobile = localStorage.getItem('guestMobile');

            let res;
            if (isUserLoggedIn) {
                res = await api.get('/orders/my');
            } else if (gMobile) {
                try {
                    res = await api.get(`/orders/guest-history/${gMobile}`);
                } catch (err) {
                    if (err.response?.status === 401) {
                        setGuestHistoryError(err.response.data?.message || t('pharmacy.loginRequired') || 'This mobile number is registered. Please login to view history.');
                        setMyOrders([]);
                        return;
                    }
                    throw err;
                }
            } else {
                return;
            }
            setGuestHistoryError(null);
            setMyOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const fetchHistory = async () => {
        try {
            const isUserLoggedIn = !!localStorage.getItem('user');
            const gMobile = localStorage.getItem('guestMobile');

            let res;
            if (isUserLoggedIn) {
                res = await api.get('/prescriptions/my');
            } else if (gMobile) {
                try {
                    res = await api.get(`/prescriptions/guest-history/${gMobile}`);
                } catch (err) {
                    if (err.response?.status === 401) {
                        setGuestHistoryError(err.response.data?.message || t('pharmacy.loginRequired') || 'This mobile number is registered. Please login to view history.');
                        setMyPrescriptions([]);
                        return;
                    }
                    throw err;
                }
            } else {
                return;
            }
            setGuestHistoryError(null);
            setMyPrescriptions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    async function handleSync() {
        setIsSyncing(true);
        try {
            await Promise.all([fetchHistory(), fetchOrders()]);
            toast.success(t('pharmacy.logUpdated'));
        } catch (err) {
            toast.error(t('pharmacy.syncFailed'));
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    }

    const [isDetecting, setIsDetecting] = useState(false);
    const [showLocationHelp, setShowLocationHelp] = useState(false);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetecting(true);
        toast.loading(t('pharmacy.detectingLocation') || "Detecting location...", { id: 'detect-location' });
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                    const data = await response.json();

                    if (data.status === 'OK' && data.results[0]) {
                        const components = data.results[0].address_components;
                        let street = data.results[0].formatted_address;
                        let city = '';
                        let state = '';
                        let zip = '';

                        components.forEach(c => {
                            if (c.types.includes('locality')) city = c.long_name;
                            else if (c.types.includes('sublocality_level_1') && !city) city = c.long_name;
                            else if (c.types.includes('postal_town') && !city) city = c.long_name;
                            else if (c.types.includes('administrative_area_level_2') && !city) city = c.long_name;

                            if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                            if (c.types.includes('postal_code')) zip = c.long_name;
                        });

                        let matchedVillage = city;
                        if (zip) {
                            const isPinValid = validatePincode(zip);
                            if (isPinValid) {
                                const pinVillages = getVillagesForPincode(zip);
                                if (pinVillages.length > 0) {
                                    const found = pinVillages.find(v => (city || '').toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes((city || '').toLowerCase()));
                                    matchedVillage = found || pinVillages[0];
                                }
                            }
                        }

                        setShippingDetails(prev => ({
                            ...prev,
                            street,
                            city: matchedVillage || city || prev.city,
                            villageName: matchedVillage || prev.villageName,
                            state: state || prev.state || 'Rajasthan',
                            zip: zip || prev.zip
                        }));
                        toast.success(t('pharmacy.locationDetected') || "Location detected!", { id: 'detect-location' });
                    } else {
                        toast.error("Failed to fetch address. Please enter manually.", { id: 'detect-location' });
                    }
                } catch (error) {
                    console.error("Location error:", error);
                    toast.error("Error detecting location", { id: 'detect-location' });
                } finally {
                    setIsDetecting(false);
                }
            },
            (error) => {
                setIsDetecting(false);
                toast.dismiss('detect-location');
                console.error("Location error:", error);
                setShowLocationHelp(true);
            }
        );
    };

    useEffect(() => {
        const storedName = localStorage.getItem('guestName');
        const storedMobile = localStorage.getItem('guestMobile');
        if (storedName) setGuestName(storedName);
        if (storedMobile) setGuestMobile(storedMobile);
        fetchHistory();
        fetchOrders();
        fetchPharmacyConfig();
        if (localStorage.getItem('user')) {
            fetchSavedAddresses();
        } else {
            try {
                const localSaved = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
                if (localSaved && localSaved.length > 0) {
                    setSavedAddresses(localSaved);
                    setShippingDetails(localSaved[0]);
                    setIsAddingNewAddress(false);
                    validatePincode(localSaved[0].zip);
                } else {
                    const singleLocal = JSON.parse(localStorage.getItem('savedShippingDetails') || 'null');
                    if (singleLocal && singleLocal.street) {
                        setSavedAddresses([singleLocal]);
                        setShippingDetails(singleLocal);
                        setIsAddingNewAddress(false);
                        validatePincode(singleLocal.zip);
                    } else {
                        setIsAddingNewAddress(true);
                    }
                }
            } catch (e) {
                setIsAddingNewAddress(true);
            }
        }

        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/content/settings');
                setContactPhone((data && data.contact_phone) || '8306305569');
            } catch (err) {
                console.error("Failed to fetch settings in OrderMedicine", err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const lookupGuestName = async () => {
            if (guestMobile.length === 10 && !guestName) {
                try {
                    const { data } = await api.get(`/users/guest-lookup/${guestMobile}`);
                    if (data.name) {
                        setGuestName(data.name);
                        localStorage.setItem('guestName', data.name);
                    }
                } catch (err) {
                    // Ignore lookup failures
                }
            }
        };
        lookupGuestName();
    }, [guestMobile]);

    const [isDragOver, setIsDragOver] = useState(false);

    const processFile = (selectedFile) => {
        setShowUploadPickerModal(false);
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith('image/')) {
            toast.error(isHindi ? "केवल छवि फ़ाइलें (JPG, PNG) स्वीकार्य हैं" : "Only image files (JPG, PNG) are accepted");
            return;
        }
        if (selectedFile.size > 4 * 1024 * 1024) {
            toast.error(t('pharmacy.maxSizeError'));
            return;
        }
        setFile(selectedFile);
        setSelectedPastRx(null);
        setPreview(URL.createObjectURL(selectedFile));
        setShowUploadPickerModal(false);
        setError(null);
    };

    const handleFileChange = (e) => {
        setShowUploadPickerModal(false);
        const selectedFile = e.target.files && e.target.files[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e, isGuest = false) => {
        if (e) e.preventDefault();

        const isUserLoggedIn = !!localStorage.getItem('user');

        if (!isUserLoggedIn && !isGuest) {
            if (guestName && guestMobile) {
                return handleSubmit(null, true);
            }
            setShowGuestModal(true);
            return;
        }

        // Validate Address details first
        if (!shippingDetails.street || !shippingDetails.city || !shippingDetails.state || !shippingDetails.zip) {
            const errStr = isHindi ? "कृपया डिलीवरी का पूरा पता भरें" : "Please fill in all delivery address fields.";
            toast.error(errStr);
            setError(errStr);
            return;
        }

        // Phone is required for delivery
        const deliveryPhone = shippingDetails.phone || guestMobile || (user ? user.mobile : '');
        if (!deliveryPhone) {
            const errStr = isHindi ? "डिलीवरी के लिए मोबाइल नंबर आवश्यक है" : "A contact number is required for delivery.";
            toast.error(errStr);
            setError(errStr);
            return;
        }

        // Validate Pincode serviceability
        const userPincode = shippingDetails.zip.trim();
        if (pharmacyConfig?.acceptedPincodes && pharmacyConfig.acceptedPincodes.trim() !== '') {
            const allowedPincodes = pharmacyConfig.acceptedPincodes.split(',').map(pin => pin.trim());
            if (!allowedPincodes.includes(userPincode)) {
                const errMsg = `${isHindi ? "क्षमा करें, हम इस पिन कोड पर डिलीवरी नहीं करते हैं। सेवा योग्य पिन कोड हैं" : "Sorry, we do not deliver to this pin code. Serviceable pin codes are"}: ${allowedPincodes.join(', ')}`;
                setPincodeError(errMsg);
                return;
            }
        }

        if (!file && !selectedPastRx) {
            setError(t('pharmacy.selectFile'));
            return;
        }

        if (pharmacyConfig?.faqs && pharmacyConfig.faqs.length > 0) {
            const missingAnswers = pharmacyConfig.faqs.filter(faq => !faqAnswers[faq.id] || faqAnswers[faq.id].trim() === '');
            if (missingAnswers.length > 0) {
                toast.error(`${t('pharmacy.yourAnswer')}: ${missingAnswers[0].question}`);
                setError(t('pharmacy.answerRequired'));
                return;
            }
        }

        const formData = new FormData();
        if (file) {
            formData.append('prescription', file);
        }
        if (notes) formData.append('notes', notes);
        formData.append('courseDays', (courseDays && Number(courseDays) > 0) ? Number(courseDays) : 15);
        formData.append('needAllMedicines', needAllMedicines ? 'ALL' : 'PARTIAL');
        if (selectedPastRx) {
            formData.append('reusedPrescriptionId', selectedPastRx._id);
        }

        const answerArray = (pharmacyConfig?.faqs || [])
            .filter(faq => faqAnswers[faq.id])
            .map(faq => ({ question: faq.question, answer: faqAnswers[faq.id] }));

        if (answerArray.length > 0) {
            formData.append('faqAnswers', JSON.stringify(answerArray));
        }

        if (isGuest) {
            formData.append('guestName', guestName);
            formData.append('guestMobile', guestMobile);
        }

        formData.append('shippingAddress', JSON.stringify({
            ...shippingDetails,
            phone: deliveryPhone
        }));

        setLoading(true);
        try {
            await api.post('/prescriptions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowPostUploadModal(true);
            setShowGuestModal(false);
            setFile(null);
            setPreview(null);
            setSelectedPastRx(null);
            const fileInput = document.getElementById('presc-upload');
            if (fileInput) fileInput.value = '';
            // Persist the confirmed address to localStorage for future orders
            try {
                const currentShipping = {
                    ...shippingDetails,
                    phone: deliveryPhone,
                    _id: shippingDetails._id || `addr_${Date.now()}`,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('savedShippingDetails', JSON.stringify(currentShipping));
                const existingSaved = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
                const foundIdx = existingSaved.findIndex(a => 
                    (a._id && a._id === currentShipping._id) || 
                    (a.street === currentShipping.street && a.zip === currentShipping.zip)
                );
                if (foundIdx >= 0) {
                    existingSaved[foundIdx] = currentShipping;
                } else {
                    existingSaved.unshift(currentShipping);
                }
                localStorage.setItem('savedAddresses', JSON.stringify(existingSaved));
            } catch (e) {}

            if (isUserLoggedIn) {
                fetchHistory();
                fetchOrders();
            } else if (isGuest) {
                localStorage.setItem('guestMobile', guestMobile);
                localStorage.setItem('guestName', guestName);
                fetchHistory();
                fetchOrders();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        if (!guestName || !guestMobile) {
            toast.error(t('pharmacy.fillGuest'));
            return;
        }
        if (guestMobile.length < 10) {
            toast.error(t('pharmacy.validMobile'));
            return;
        }
        handleSubmit(null, true);
    };

    const handleCopyLink = (prescriptionId) => {
        const url = `${window.location.origin}/checkout/${prescriptionId}`;
        navigator.clipboard.writeText(url);
        toast.success(t('pharmacy.linkCopied'));
    };

    const getOrderBadge = (status) => {
        switch (status) {
            case 'Payment Pending': return <span className="status-badge pending" style={{ background: '#fff3cd', color: '#856404' }}>{t('pharmacy.badges.pendingPayment')}</span>;
            case 'Processing': return <span className="status-badge review" style={{ background: '#d1ecf1', color: '#0c5460' }}>{t('pharmacy.badges.processing')}</span>;
            case 'Ready for Packing': return <span className="status-badge review" style={{ background: '#fef3c7', color: '#d97706' }}>{t('pharmacy.badges.readyForPacking')}</span>;
            case 'Ready for Dispatch': return <span className="status-badge review" style={{ background: '#ecfdf5', color: '#059669' }}>{t('pharmacy.badges.readyForDispatch')}</span>;
            case 'Out for Delivery': return <span className="status-badge verified" style={{ background: '#d4edda', color: '#155724' }}>{t('pharmacy.badges.outForDelivery')}</span>;
            case 'Delivered': return <span className="status-badge verified"><CheckCircle size={14} /> {t('pharmacy.badges.delivered')}</span>;
            case 'Cancelled': return <span className="status-badge rejected"><X size={14} /> {t('pharmacy.badges.cancelled')}</span>;
            default: return <span className="status-badge pending">{status}</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="status-badge pending"><Clock size={14} /> {t('pharmacy.badges.pending')}</span>;
            case 'Verified': return <span className="status-badge verified"><CheckCircle size={14} /> {t('pharmacy.badges.verified')}</span>;
            case 'Rejected': return <span className="status-badge rejected"><AlertCircle size={14} /> {t('pharmacy.badges.rejected')}</span>;
            case 'Under Review': return <span className="status-badge review"><FileText size={14} /> {t('pharmacy.badges.reviewing')}</span>;
            case 'Ordered': return <span className="status-badge verified" style={{ background: '#ebf8ff', color: '#2b6cb0' }}><Zap size={14} /> {t('pharmacy.badges.ordered')}</span>;
            default: return <span>{status}</span>;
        }
    };

    const handleProceedToStep2 = () => {
        // If user is choosing from saved addresses and not adding new:
        if (!isAddingNewAddress && savedAddresses.length > 0) {
            const selected = shippingDetails.street ? shippingDetails : savedAddresses[0];
            if (!selected || !selected.street || !selected.street.trim()) {
                toast.error(isHindi ? "कृपया डिलीवरी का पता चुनें" : "Please select a delivery address");
                return;
            }
            if (!selected.zip || !validatePincode(selected.zip)) {
                toast.error(pincodeError || (isHindi ? "पिन कोड सेवा क्षेत्र में नहीं है" : "Pincode is not serviceable"));
                return;
            }
            const selectedVillage = selected.villageName || selected.city;
            if (!selectedVillage || !selectedVillage.trim()) {
                toast.error(isHindi ? "कृपया गाँव / कस्बा चुनें" : "Please select village/city");
                return;
            }
            const phoneToUse = selected.phone || guestMobile || (user ? user.mobile : '');
            if (!phoneToUse || phoneToUse.trim().length < 10) {
                toast.error(isHindi ? "कृपया वैध 10-अंकों का मोबाइल नंबर भरें" : "Please enter a valid 10-digit phone number");
                return;
            }
            setShippingDetails(prev => ({ ...prev, ...selected, phone: phoneToUse }));
            setActiveStep(2);
            window.scrollTo({ top: 150, behavior: 'smooth' });
            return;
        }

        // Validate newly entered address:
        if (!shippingDetails.street || !shippingDetails.street.trim()) {
            toast.error(isHindi ? "कृपया मकान/सड़क का पता भरें" : "Please enter street address");
            return;
        }
        if (!shippingDetails.zip || !shippingDetails.zip.trim()) {
            toast.error(isHindi ? "कृपया पिन कोड भरें" : "Please enter PIN code");
            return;
        }
        if (!validatePincode(shippingDetails.zip)) {
            toast.error(pincodeError || (isHindi ? "पिन कोड सेवा क्षेत्र में नहीं है" : "Pincode is not serviceable"));
            return;
        }
        const currentVillage = shippingDetails.villageName || shippingDetails.city;
        if (!currentVillage || !currentVillage.trim()) {
            toast.error(isHindi ? "कृपया गाँव / कस्बा चुनें" : "Please select village/city");
            return;
        }
        if (!shippingDetails.state || !shippingDetails.state.trim()) {
            toast.error(isHindi ? "कृपया राज्य भरें" : "Please enter state");
            return;
        }

        const phoneToUse = shippingDetails.phone || guestMobile || (user ? user.mobile : '');
        if (!phoneToUse || phoneToUse.trim().length < 10) {
            toast.error(isHindi ? "कृपया वैध 10-अंकों का मोबाइल नंबर भरें" : "Please enter a valid 10-digit phone number");
            return;
        }

        const updatedShipping = {
            ...shippingDetails,
            city: currentVillage,
            villageName: currentVillage,
            phone: phoneToUse,
            _id: shippingDetails._id || `addr_${Date.now()}`,
            updatedAt: new Date().toISOString()
        };
        setShippingDetails(updatedShipping);

        // Update savedAddresses list
        const updatedSaved = [...savedAddresses];
        const matchIdx = updatedSaved.findIndex(a => 
            (a._id && updatedShipping._id && a._id === updatedShipping._id) || 
            (a.street === updatedShipping.street && a.zip === updatedShipping.zip)
        );

        if (matchIdx >= 0) {
            updatedSaved[matchIdx] = updatedShipping;
        } else {
            updatedSaved.unshift(updatedShipping);
        }

        setSavedAddresses(updatedSaved);
        try {
            localStorage.setItem('savedAddresses', JSON.stringify(updatedSaved));
            localStorage.setItem('savedShippingDetails', JSON.stringify(updatedShipping));
        } catch (e) {
            console.error("Local storage address save error:", e);
        }

        if (localStorage.getItem('user')) {
            api.post('/users/profile/addresses', updatedShipping).catch(() => {});
        }

        setIsAddingNewAddress(false);
        setActiveStep(2);
        window.scrollTo({ top: 150, behavior: 'smooth' });
    };

    const handleProceedToStep3 = () => {
        if (!file && !selectedPastRx) {
            const msg = isHindi 
                ? "कृपया पर्चे की फोटो अपलोड करें या पुरानी पर्ची चुनें" 
                : (t('pharmacy.selectFile') || "Please upload a prescription image or select a past prescription");
            toast.error(msg);
            setError(msg);
            return;
        }
        setError(null);
        setActiveStep(3);
        window.scrollTo({ top: 150, behavior: 'smooth' });
    };

    const handleProceedToStep4 = () => {
        setError(null);
        setActiveStep(4);
        window.scrollTo({ top: 150, behavior: 'smooth' });
    };

    const fetchSavedAddresses = async () => {
        try {
            const res = await api.get('/users/profile');
            if (res.data.savedAddresses && res.data.savedAddresses.length > 0) {
                const sorted = [...res.data.savedAddresses].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setSavedAddresses(sorted);
                localStorage.setItem('savedAddresses', JSON.stringify(sorted));
                // Auto-select latest if not currently editing
                setShippingDetails(sorted[0]);
                setIsAddingNewAddress(false);
                validatePincode(sorted[0].zip);
            } else {
                const localSaved = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
                if (localSaved && localSaved.length > 0) {
                    setSavedAddresses(localSaved);
                    setShippingDetails(localSaved[0]);
                    setIsAddingNewAddress(false);
                    validatePincode(localSaved[0].zip);
                } else {
                    setIsAddingNewAddress(true);
                }
            }
        } catch (err) {
            console.error('Failed to fetch addresses', err);
            try {
                const localSaved = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
                if (localSaved && localSaved.length > 0) {
                    setSavedAddresses(localSaved);
                    setShippingDetails(localSaved[0]);
                    setIsAddingNewAddress(false);
                    validatePincode(localSaved[0].zip);
                } else {
                    setIsAddingNewAddress(true);
                }
            } catch (e) {
                setIsAddingNewAddress(true);
            }
        }
    };

    const handleReorder = async (prescription) => {
        setShowRecentModal(false);
        try {
            // 1. Get PIDs from verified items
            const pids = prescription.verifiedItems
                ?.map(i => i.margPID)
                .filter(pid => pid !== undefined);

            if (!pids || pids.length === 0) {
                // If no MARG mapping exists yet (old data), just proceed to checkout for verification
                openCheckoutModal(prescription, true);
                return;
            }

            // 2. Check stock in bulk
            toast.loading(t('pharmacy.checkingStock'), { id: 'stock-check' });
            const res = await api.post('/marg/check-stock-bulk', { pids });
            const availability = res.data.availability || {};

            // 3. Determine if everything is in stock
            const allInStock = pids.every(pid => availability[pid] === true);

            if (allInStock) {
                toast.success(t('pharmacy.allInStock'), { id: 'stock-check' });
                setShowRecentModal(false);
                openCheckoutModal(prescription, true);
            } else {
                // 4. If any item is out of stock, re-submit as prescription request
                toast(t('pharmacy.outOfStockResubmit'), { id: 'stock-check', icon: '⏳' });

                await api.post(`/prescriptions/${prescription._id}/re-submit`);

                setShowRecentModal(false);
                showAlert({
                    title: t('pharmacy.stockUpdateTitle'),
                    message: t('pharmacy.stockUpdateMsg'),
                    confirmText: t('pharmacy.gotIt'),
                    showCancel: false
                });

                // Refresh data to show the new pending prescription
                fetchHistory();
                fetchOrders();
            }
        } catch (err) {
            console.error('Reorder failed', err);
            toast.error('Could not verify stock. Please try again.', { id: 'stock-check' });
        }
    };

    const openCheckoutModal = (prescription, isReorder = false) => {
        const availableItems = prescription.verifiedItems?.filter(i => i.isAvailable) || [];
        if (availableItems.length === 0) {
            toast.error(t('pharmacy.noVerifiedItems'));
            return;
        }
        setIsReorderFlow(isReorder);
        setSelectedPrescription(prescription);
        setCheckoutSuccess(false);
        setCheckoutError(null);

        // Pre-fill shipping address from prescription's pendingShippingAddress if present
        if (prescription.pendingShippingAddress && prescription.pendingShippingAddress.street) {
            setShippingDetails(prescription.pendingShippingAddress);
            setIsAddingNewAddress(false);
            if (prescription.pendingShippingAddress.zip) {
                validatePincode(prescription.pendingShippingAddress.zip);
            }
        } else {
            fetchSavedAddresses();
        }

        setCheckoutModalOpen(true);
    };

    const calculateTotal = (items) => {
        return (items || []).filter(i => i.isAvailable).reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    };

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();

        // Validate Pincode serviceability
        const userPincode = shippingDetails.zip.trim();
        if (pharmacyConfig?.acceptedPincodes && pharmacyConfig.acceptedPincodes.trim() !== '') {
            const allowedPincodes = pharmacyConfig.acceptedPincodes.split(',').map(pin => pin.trim());
            if (!allowedPincodes.includes(userPincode)) {
                const errMsg = `${t('pharmacy.unserviceablePin') || "Sorry, we do not deliver to this pin code. Serviceable pin codes are"}: ${allowedPincodes.join(', ')}`;
                setPincodeError(errMsg);
                return;
            }
        }

        setCheckoutLoading(true);
        setCheckoutError(null);
        try {
            await api.post(`/prescriptions/${selectedPrescription._id}/approve`, {
                shippingAddress: shippingDetails,
                paymentMethod
            });
            setCheckoutSuccess(true);
            fetchOrders(); // Refresh orders list
            setTimeout(() => {
                setCheckoutModalOpen(false);
                fetchHistory(); // Refresh prescriptions
                setHistoryTab('orders'); // Auto-switch to orders tab to show progress
            }, 2500);
        } catch (err) {
            setCheckoutError(err.response?.data?.message || t('pharmacy.checkoutFailed'));
        } finally {
            setCheckoutLoading(false);
        }
    };

    const filteredPrescriptions = myPrescriptions.filter(p => p.status !== 'Ordered');

    const pharmacySchema = {
        "@context": "https://schema.org",
        "@type": "Pharmacy",
        "name": "The Dharmarth Medical Foundation Free Medicine Ordering & Express Delivery",
        "description": "Order medicines online for delivery in Rajasthan and across India. Benefit from our NGO's free medicine service and emergency medical support.",
        "url": "https://thedharmarth.com/order-medicine",
        "image": "https://res.cloudinary.com/dbe1ykvg8/image/upload/v1783602963/the_dharmarth_foundation/logo.jpg",
        "telephone": contactPhone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jadaw Marg, Duliya Bass",
            "addressLocality": "Sujangarh",
            "addressRegion": "Rajasthan",
            "postalCode": "331507",
            "addressCountry": "IN"
        }
    };

    return (
        <div className="order-medicine-container">
            <SEO
                title="Free Medicine Service & Online Ordering | Rajasthan & India"
                description="Upload your doctor's prescription and order medicines online via The Dharmarth Medical Foundation's free medicine service. Fast medicine delivery across Sujangarh, Rajasthan, and India."
                keywords="Free Medicine Service, Medicine Delivery India, Medicine Ordering Rajasthan, Emergency Medical Support, Healthcare NGO, Online Pharmacy, Sujangarh NGO"
                jsonLd={pharmacySchema}
            />
            <Navbar />

            <main className="order-medicine-main">
                {/* Hero Header 
                <div className="hero-head">
                    <h1>{t('pharmacy.orderMedicine')}</h1>
                </div>*/}

                {/* Info Steps */}
                {/* <section className="steps-sec">
                    <div className="container">
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-icon"><Camera size={24} /></div>
                                <h4>{t('pharmacy.steps.uploadTitle')}</h4>
                                <p>{t('pharmacy.steps.uploadDesc')}</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><ShieldCheck size={24} /></div>
                                <h4>{t('pharmacy.steps.verifyTitle')}</h4>
                                <p>{t('pharmacy.steps.verifyDesc')}</p>
                            </div>
                            <div className="step-arrow"><ArrowRight /></div>
                            <div className="step-card">
                                <div className="step-icon"><Truck size={24} /></div>
                                <h4>{t('pharmacy.steps.deliveryTitle')}</h4>
                                <p>{t('pharmacy.steps.deliveryDesc')}</p>
                            </div>
                        </div>
                    </div>
                </section> */}

                <section className="main-features container" style={{ padding: 0 }}>
                    <div className="grid-layout single-column" style={{ display: 'flex', justifyContent: 'center' }}>
                        {/* Upload Form */}
                        <div className="form-column" style={{ width: '100%', maxWidth: '720px' }}>
                            <div className="upload-box glass-card" style={{ borderRadius: 0 }}>
                               


                                <form id="medicine-order-form" onSubmit={(e) => {
                                    e.preventDefault();
                                    if (activeStep === 1) {
                                        handleProceedToStep2();
                                    } else if (activeStep === 2) {
                                        handleProceedToStep3();
                                    } else if (activeStep === 3) {
                                        handleProceedToStep4();
                                    } else {
                                        handleSubmit(e);
                                    }
                                }}>
                                    <div className="form-scroll-fields" style={{ paddingBottom: activeStep >= 2 ? '75px' : '0' }}>
                                        {/* ================= STEP 1: DELIVERY ADDRESS ================= */}
                                        {activeStep === 1 && (
                                            <div className="address-section-premium" style={{ marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                                        <MapPin size={18} color="#e53e3e" />
                                                        1. {isHindi ? 'डिलीवरी का पता' : (t('pharmacy.deliveryAddress') || 'Delivery Address')}
                                                    </h4>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '10px' }}>
                                                        {isHindi ? 'चरण 1 का 4' : 'Step 1 of 4'}
                                                    </span>
                                                </div>

                                                {/* CASE A: User has saved addresses and is NOT adding a new one */}
                                                {!isAddingNewAddress && savedAddresses.length > 0 ? (
                                                    <div className="saved-address-container">
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>{isHindi ? 'सहेजा गया डिलीवरी पता:' : 'Saved Delivery Address:'}</span>
                                                            {savedAddresses.length > 1 && (
                                                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                                    {isHindi ? `(${savedAddresses.length} पते सहेजे हुए)` : `(${savedAddresses.length} addresses saved)`}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Multiple address pills switcher if > 1 */}
                                                        {savedAddresses.length > 1 && (
                                                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                                                                {savedAddresses.map((addr, idx) => {
                                                                    const isSelected = (shippingDetails.street === addr.street && shippingDetails.zip === addr.zip);
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setShippingDetails(addr);
                                                                                validatePincode(addr.zip);
                                                                            }}
                                                                            style={{
                                                                                padding: '6px 12px',
                                                                                borderRadius: '8px',
                                                                                border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                                                                background: isSelected ? '#eff6ff' : '#f8fafc',
                                                                                color: isSelected ? '#1d4ed8' : '#475569',
                                                                                fontWeight: '600',
                                                                                fontSize: '12px',
                                                                                cursor: 'pointer',
                                                                                whiteSpace: 'nowrap'
                                                                            }}
                                                                        >
                                                                            📍 {addr.villageName || addr.city || (isHindi ? 'पता' : 'Address')} {idx === 0 ? (isHindi ? '(हालिया)' : '(Recent)') : ''}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Selected Address Display Card */}
                                                        <div style={{
                                                            padding: '12px 14px',
                                                            borderRadius: '12px',
                                                            border: '2px solid #3b82f6',
                                                            background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
                                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                                                            marginBottom: '10px'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                        <CheckCircle size={12} color="#fff" /> {isHindi ? 'चुना गया पता' : 'Selected Address'}
                                                                    </span>
                                                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                                                                        {shippingDetails.villageName || shippingDetails.city || (isHindi ? 'डिलीवरी पता' : 'Delivery Address')}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsAddingNewAddress(true);
                                                                    }}
                                                                    style={{
                                                                        background: '#fff',
                                                                        border: '1px solid #cbd5e1',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        color: '#334155',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <Edit2 size={12} /> {t('pharmacy.edit', { defaultValue: isHindi ? 'बदलें' : 'Edit' })}
                                                                </button>
                                                            </div>

                                                            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', marginBottom: '8px' }}>
                                                                <div style={{ fontWeight: '600' }}>{shippingDetails.street}</div>
                                                                <div>{shippingDetails.villageName || shippingDetails.city}, {shippingDetails.state} - <strong>{shippingDetails.zip}</strong></div>
                                                            </div>

                                                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                                                                <Phone size={13} color="#2563eb" />
                                                                <span>{isHindi ? 'मोबाइल:' : 'Mobile:'} <strong>{shippingDetails.phone || user?.mobile || guestMobile || (isHindi ? 'उपलब्ध नहीं' : 'Not provided')}</strong></span>
                                                                {shippingDetails.altPhone && <span>{isHindi ? '| अन्य: ' : '| Alt: '}{shippingDetails.altPhone}</span>}
                                                            </div>
                                                        </div>

                                                        {/* Add New Address Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShippingDetails({
                                                                    _id: null,
                                                                    street: '',
                                                                    city: '',
                                                                    villageName: '',
                                                                    state: '',
                                                                    zip: '',
                                                                    phone: user?.mobile || guestMobile || '',
                                                                    altPhone: ''
                                                                });
                                                                setIsAddingNewAddress(true);
                                                                setPincodeError('');
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '9px 14px',
                                                                borderRadius: '10px',
                                                                border: '2px dashed #94a3b8',
                                                                background: '#f8fafc',
                                                                color: '#2563eb',
                                                                fontWeight: '700',
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                                marginBottom: '10px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <Plus size={16} /> + {t('pharmacy.addNewAddress', { defaultValue: isHindi ? 'नया पता जोड़ें' : 'Add New Address' })}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* CASE B: User is entering or editing a new address */
                                                    <div className="new-address-form">
                                                        {savedAddresses.length > 0 && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                                                                    {isHindi ? 'नया डिलीवरी पता भरें:' : 'Enter New Delivery Address:'}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setIsAddingNewAddress(false);
                                                                        if (savedAddresses.length > 0) {
                                                                            setShippingDetails(savedAddresses[0]);
                                                                            validatePincode(savedAddresses[0].zip);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: '#2563eb',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer',
                                                                        textDecoration: 'underline'
                                                                    }}
                                                                >
                                                                    {isHindi ? '← सहेजा गया पता चुनें' : '← Use Saved Address'}
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                                            <div style={{ position: 'relative' }}>
                                                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                                                    {isHindi ? 'सड़क का पता' : (t('pharmacy.streetAddress') || 'Street Address')} <span style={{ color: '#ef4444' }}>*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={shippingDetails.street}
                                                                    onChange={(e) => handleStreetChange(e.target.value, 'main')}
                                                                    placeholder={isDetecting ? (isHindi ? "स्थान का पता लगाया जा रहा है..." : "Detecting location...") : (isHindi ? "मकान/प्लॉट नं., अपार्टमेंट, सड़क का नाम" : "House/Plot No, Apartment, Street")}
                                                                    required
                                                                    style={{ width: '100%', padding: '10px 90px 10px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                                />
                                                                {activeInputContext === 'main' && suggestions.length > 0 && (
                                                                    <ul style={{
                                                                        position: 'absolute',
                                                                        top: '100%',
                                                                        left: 0,
                                                                        right: 0,
                                                                        zIndex: 99,
                                                                        background: '#ffffff',
                                                                        border: '1px solid #cbd5e1',
                                                                        borderRadius: '8px',
                                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                        marginTop: '4px',
                                                                        listStyle: 'none',
                                                                        padding: '4px 0',
                                                                        maxHeight: '200px',
                                                                        overflowY: 'auto',
                                                                        textAlign: 'left'
                                                                    }}>
                                                                        {suggestions.map((sug) => (
                                                                            <li
                                                                                key={sug.place_id}
                                                                                onClick={() => handleSelectSuggestion(sug.place_id)}
                                                                                style={{
                                                                                    padding: '10px 12px',
                                                                                    fontSize: '13px',
                                                                                    color: '#334155',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'background-color 0.2s',
                                                                                    borderBottom: '1px solid #f1f5f9'
                                                                                }}
                                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                            >
                                                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{sug.structured_formatting?.main_text || sug.description}</div>
                                                                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sug.structured_formatting?.secondary_text}</div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={handleDetectLocation}
                                                                    disabled={isDetecting}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        right: '6px',
                                                                        bottom: '6px',
                                                                        padding: '5px 10px',
                                                                        borderRadius: '6px',
                                                                        background: '#3b82f6',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        fontSize: '11px',
                                                                        fontWeight: '600',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <MapPin size={11} />
                                                                    {isDetecting ? '...' : (isHindi ? 'पता लगाएं' : (t('pharmacy.detect') || 'Detect'))}
                                                                </button>
                                                            </div>

                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                                                <div>
                                                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                                        {isHindi ? 'पिन कोड' : (t('pharmacy.pinCode') || 'PIN Code')} <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>{isHindi ? '(स्तर 1 जाँच)' : '(Level 1 Check)'}</span> <span style={{ color: '#ef4444' }}>*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={shippingDetails.zip}
                                                                        onChange={(e) => handleManualZipChange(e.target.value)}
                                                                        placeholder={isHindi ? "उदा. 331502" : "e.g. 331502"}
                                                                        required
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                                                        {isHindi ? 'राज्य' : (t('pharmacy.state') || 'State')} <span style={{ color: '#ef4444' }}>*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={shippingDetails.state}
                                                                        onChange={(e) => setShippingDetails(prev => ({ ...prev, state: e.target.value }))}
                                                                        placeholder={isHindi ? "उदा. राजस्थान" : "e.g. Rajasthan"}
                                                                        required
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {pincodeError && (
                                                                <div style={{ color: '#e53e3e', fontSize: '12px', marginBottom: '12px', fontWeight: '600', width: '100%', textAlign: 'left', background: '#fff5f5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                                                                    {pincodeError}
                                                                </div>
                                                            )}

                                                            {/* Level 2: Dynamic Village/City Dropdown for this PIN Code */}
                                                            {shippingDetails.zip && !pincodeError && (
                                                                <div style={{ marginBottom: '12px', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                                                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                                        <CheckCircle size={15} color="#16a34a" />
                                                                        {isHindi ? `गाँव / कस्बा चुनें (स्तर 2: पिन ${shippingDetails.zip} के लिए)` : `Select Village / Town (Level 2: For PIN ${shippingDetails.zip})`} <span style={{ color: '#ef4444' }}>*</span>
                                                                    </label>
                                                                    <select
                                                                        value={shippingDetails.villageName || shippingDetails.city || ''}
                                                                        onChange={(e) => {
                                                                            const selectedVal = e.target.value;
                                                                            setShippingDetails(prev => ({ ...prev, city: selectedVal, villageName: selectedVal }));
                                                                        }}
                                                                        required
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px 12px',
                                                                            borderRadius: '8px',
                                                                            border: '2px solid #16a34a',
                                                                            background: '#ffffff',
                                                                            fontWeight: '700',
                                                                            color: '#0f172a',
                                                                            fontSize: '13px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <option value="">{isHindi ? '-- इस पिन कोड के तहत अपना गाँव / कस्बा चुनें --' : '-- Select your Village / Town for this PIN --'}</option>
                                                                        {getVillagesForPincode(shippingDetails.zip).map((village, idx) => (
                                                                            <option key={idx} value={village}>{village}</option>
                                                                        ))}
                                                                    </select>
                                                                    <small style={{ color: '#15803d', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                                                                        {isHindi ? '✓ पिन कोड स्वीकृत! कृपया डिलीवरी के लिए उपरोक्त सूची में से अपना गाँव/शहर चुनें।' : '✓ PIN code accepted! Please select your village/city from above list for delivery.'}
                                                                    </small>
                                                                </div>
                                                            )}

                                                            {user && user.mobile && (
                                                                <div style={{ marginTop: '5px' }}>
                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isOrderingForSomeoneElse}
                                                                            onChange={(e) => {
                                                                                setIsOrderingForSomeoneElse(e.target.checked);
                                                                                if (!e.target.checked) {
                                                                                    setShippingDetails(prev => ({ ...prev, phone: user.mobile }));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {isHindi ? 'किसी और के लिए ऑर्डर कर रहे हैं?' : (t('pharmacy.someoneElse') || 'Ordering for someone else?')}
                                                                    </label>
                                                                </div>
                                                            )}

                                                            {(isOrderingForSomeoneElse || !user || !user?.mobile) && (
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                                                                    <div>
                                                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                                                            {isHindi ? 'प्राप्तकर्ता का फ़ोन नंबर' : (t('pharmacy.receiverPhone') || "Receiver's Phone Number")} <span style={{ color: '#ef4444' }}>*</span>
                                                                        </label>
                                                                        <input
                                                                            type="tel"
                                                                            maxLength={10}
                                                                            value={shippingDetails.phone}
                                                                            onChange={(e) => setShippingDetails(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                                                            placeholder={isHindi ? "10 अंकों का मोबाइल नंबर" : "10-digit number"}
                                                                            required
                                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                                                                            {isHindi ? 'वैकल्पिक मोबाइल नंबर' : (t('pharmacy.altPhone') || 'Alternate Phone')}
                                                                        </label>
                                                                        <input
                                                                            type="tel"
                                                                            maxLength={10}
                                                                            value={shippingDetails.altPhone}
                                                                            onChange={(e) => setShippingDetails(prev => ({ ...prev, altPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                                                            placeholder={isHindi ? "वैकल्पिक" : "Optional"}
                                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Proceed to Step 2 Button */}
                                                <button
                                                    type="button"
                                                    onClick={handleProceedToStep2}
                                                    className="btn-submit-premium"
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        fontSize: '14px',
                                                        fontWeight: '700',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        marginTop: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <span>{isHindi ? 'आगे बढ़ें (पर्ची अपलोड करें)' : 'Proceed to Step 2'}</span>
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        )}

                                        {/* ================= STEP 2: UPLOAD PRESCRIPTION & DETAILS ================= */}
                                        {activeStep === 2 && (
                                            <div className="prescription-step-content">
                                                {/* Compact Address Summary bar */}
                                                <div style={{
                                                    marginBottom: '10px',
                                                    padding: '9px 12px',
                                                    borderRadius: '10px',
                                                    background: '#f0fdf4',
                                                    border: '1px solid #bbf7d0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '10px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#166534', minWidth: 0 }}>
                                                        <MapPin size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <strong style={{ color: '#15803d' }}>{isHindi ? 'डिलीवरी पता: ' : 'Delivery Address: '}</strong>
                                                            <span>{shippingDetails.villageName || shippingDetails.city || (isHindi ? 'पता' : 'Address')}, {shippingDetails.zip}</span>
                                                            <span style={{ color: '#475569', fontSize: '11px', marginLeft: '6px' }}>({shippingDetails.phone})</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveStep(1)}
                                                        style={{
                                                            background: '#ffffff',
                                                            border: '1px solid #86efac',
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            color: '#15803d',
                                                            cursor: 'pointer',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {t('pharmacy.change', { defaultValue: isHindi ? 'बदलें' : 'Change' })}
                                                    </button>
                                                </div>

                                                {/* Step 2 Heading */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                                        <FileText size={18} color="#3b82f6" />
                                                        2. {isHindi ? 'पर्चा अपलोड करें या फोन पर ऑर्डर करें' : (t('pharmacy.uploadPrescriptionStep') || 'Upload Prescription or Order by Phone')}
                                                    </h4>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '10px' }}>
                                                        {isHindi ? 'चरण 2 का 4' : 'Step 2 of 4'}
                                                    </span>
                                                </div>

                                                {/* Two Equal Size Ordering Cards (Phone Call vs Prescription Upload) */}
                                                {(() => {
                                                    const h = new Date().getHours();
                                                    const isServiceHours = h >= 9 && h < 19;

                                                    return (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '12px',
                                                            marginBottom: '16px'
                                                        }}>
                                                            {/* Card 1: Order by Phone */}
                                                            <div style={{
                                                                borderRadius: '16px',
                                                                background: isServiceHours ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : '#fffbeb',
                                                                border: `1.5px solid ${isServiceHours ? '#86efac' : '#fde68a'}`,
                                                                padding: '20px 16px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                textAlign: 'center',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                                                minHeight: '160px'
                                                            }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                                                    <div style={{
                                                                        width: '46px',
                                                                        height: '46px',
                                                                        borderRadius: '50%',
                                                                        background: isServiceHours ? '#dcfce7' : '#fef3c7',
                                                                        color: isServiceHours ? '#16a34a' : '#d97706',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        marginBottom: '10px',
                                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                                                                    }}>
                                                                        <Phone size={22} />
                                                                    </div>
                                                                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                                                                        {isHindi ? 'फोन पर दवाई ऑर्डर करें' : 'Order Medicine by Phone'}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4', marginBottom: '12px' }}>
                                                                        {isServiceHours 
                                                                            ? (isHindi ? 'फार्मासिस्ट उपलब्ध हैं (सुबह 9 AM - शाम 7 PM)' : 'Pharmacists available now (9 AM - 7 PM)')
                                                                            : (isHindi ? 'उपलब्ध समय: सुबह 9 AM - शाम 7 PM' : 'Service Hours: 9 AM - 7 PM')
                                                                        }
                                                                    </div>
                                                                </div>

                                                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                                                    {isServiceHours ? (
                                                                        <a
                                                                            href={`tel:${(contactPhone || '8306305569').replace(/\s+/g, '')}`}
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: '8px',
                                                                                background: '#16a34a',
                                                                                color: 'white',
                                                                                padding: '9px 18px',
                                                                                borderRadius: '10px',
                                                                                fontWeight: '700',
                                                                                fontSize: '13px',
                                                                                textDecoration: 'none',
                                                                                width: '100%',
                                                                                maxWidth: '240px',
                                                                                boxShadow: '0 3px 10px rgba(22, 163, 74, 0.25)',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                        >
                                                                            <Phone size={14} /> {isHindi ? 'कॉल करें: ' : 'Call: '}{contactPhone || '8306305569'}
                                                                        </a>
                                                                    ) : (
                                                                        <div style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: '6px',
                                                                            background: '#fef3c7',
                                                                            color: '#92400e',
                                                                            border: '1px solid #fde68a',
                                                                            padding: '8px 16px',
                                                                            borderRadius: '10px',
                                                                            fontWeight: '700',
                                                                            fontSize: '12px'
                                                                        }}>
                                                                            <Clock size={14} /> {isHindi ? 'समय: 9 AM - 7 PM' : 'Hours: 9 AM - 7 PM'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Divider: ----- OR ----- */}
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                margin: '2px 0',
                                                                userSelect: 'none'
                                                            }}>
                                                                <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to right, transparent, #cbd5e1)' }} />
                                                                <span style={{
                                                                    padding: '4px 16px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '800',
                                                                    color: '#64748b',
                                                                    background: '#f8fafc',
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: '20px',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.8px',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                                                }}>
                                                                    {isHindi ? 'या / OR' : 'OR'}
                                                                </span>
                                                                <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to left, transparent, #cbd5e1)' }} />
                                                            </div>

                                                            {/* Card 2: Upload Prescription */}
                                                            <div
                                                                className={`drop-area ${preview ? 'preview-active' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                                                onClick={() => {
                                                                    if (!preview) {
                                                                        setShowUploadPickerModal(true);
                                                                    }
                                                                }}
                                                                onDragOver={handleDragOver}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={handleDrop}
                                                                style={{
                                                                    border: '2px dashed #93c5fd',
                                                                    borderRadius: '16px',
                                                                    minHeight: '170px',
                                                                    padding: '20px 16px',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    background: isDragOver ? '#eff6ff' : '#f8fafc',
                                                                    borderColor: isDragOver ? '#2563eb' : '#93c5fd',
                                                                    transform: isDragOver ? 'scale(1.01)' : 'none',
                                                                    transition: 'all 0.2s ease',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                                                }}
                                                            >
                                                                {preview ? (
                                                                    <div className="preview-container" style={{ position: 'relative' }}>
                                                                        <img src={preview} alt="Doctor Prescription Receipt Preview for Free Medicine Delivery" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setFile(null);
                                                                                setPreview(null);
                                                                                setSelectedPastRx(null);
                                                                                const camInput = document.getElementById('presc-upload-camera');
                                                                                if (camInput) camInput.value = '';
                                                                                const galInput = document.getElementById('presc-upload-gallery');
                                                                                if (galInput) galInput.value = '';
                                                                                const fileInput = document.getElementById('presc-upload');
                                                                                if (fileInput) fileInput.value = '';
                                                                            }}
                                                                            title={isHindi ? 'हटाएं' : 'Remove'}
                                                                            aria-label="Remove prescription"
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '8px',
                                                                                right: '8px',
                                                                                width: '32px',
                                                                                height: '32px',
                                                                                borderRadius: '50%',
                                                                                background: 'rgba(239, 68, 68, 0.92)',
                                                                                color: '#ffffff',
                                                                                border: '2px solid #ffffff',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                cursor: 'pointer',
                                                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                                                                                zIndex: 10,
                                                                                transition: 'transform 0.15s ease, background 0.15s ease'
                                                                            }}
                                                                        >
                                                                            <X size={18} strokeWidth={2.5} />
                                                                        </button>
                                                                        <div
                                                                            className="change-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setShowUploadPickerModal(true);
                                                                            }}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            {t('pharmacy.changePhoto', { defaultValue: isHindi ? 'फोटो बदलें' : 'Change Photo' })}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="placeholder" style={{ padding: 0, width: '100%', textAlign: 'center' }}>
                                                                        <div className="icon-circle" style={{ margin: '0 auto 10px', width: '46px', height: '46px' }}>
                                                                            <Upload size={22} />
                                                                        </div>
                                                                        <p style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                                                                            {t('pharmacy.dropPrescription', { defaultValue: isHindi ? 'पर्चा यहाँ अपलोड करें' : 'Drop your prescription here' })}
                                                                        </p>
                                                                        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>
                                                                            {isHindi ? 'कैमरा से फोटो खींचें या गैलरी से चुनें' : 'Take a photo with camera or choose from gallery'}
                                                                        </p>

                                                                        {/* Both Options: Camera & Gallery */}
                                                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openCameraPicker();
                                                                                }}
                                                                                style={{
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '7px',
                                                                                    padding: '8px 16px',
                                                                                    borderRadius: '10px',
                                                                                    background: '#eff6ff',
                                                                                    border: '1.5px solid #93c5fd',
                                                                                    color: '#1d4ed8',
                                                                                    fontWeight: '700',
                                                                                    fontSize: '12.5px',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.15s ease',
                                                                                    boxShadow: '0 1px 3px rgba(37,99,235,0.08)'
                                                                                }}
                                                                            >
                                                                                <Camera size={16} color="#2563eb" />
                                                                                <span>{isHindi ? 'कैमरा (Camera)' : 'Camera'}</span>
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openGalleryPicker();
                                                                                }}
                                                                                style={{
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '7px',
                                                                                    padding: '8px 16px',
                                                                                    borderRadius: '10px',
                                                                                    background: '#f8fafc',
                                                                                    border: '1.5px solid #cbd5e1',
                                                                                    color: '#334155',
                                                                                    fontWeight: '700',
                                                                                    fontSize: '12.5px',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.15s ease',
                                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                                                                }}
                                                                            >
                                                                                <Upload size={16} color="#475569" />
                                                                                <span>{isHindi ? 'गैलरी (Gallery)' : 'Gallery'}</span>
                                                                            </button>
                                                                        </div>

                                                                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
                                                                            {isHindi ? 'JPG, PNG फॉर्मेट (अधिकतम 4MB)' : 'Supports JPG, PNG (Max 4MB)'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Hidden inputs placed outside the clickable drop area to prevent event bubbling */}
                                                            <input
                                                                type="file"
                                                                id="presc-upload-camera"
                                                                hidden
                                                                accept="image/*"
                                                                capture="environment"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    handleFileChange(e);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                            <input
                                                                type="file"
                                                                id="presc-upload-gallery"
                                                                hidden
                                                                accept="image/*"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    handleFileChange(e);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                            <input
                                                                type="file"
                                                                id="presc-upload"
                                                                hidden
                                                                accept="image/*"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    handleFileChange(e);
                                                                    e.target.value = '';
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })()}

                                        {/* Subtle Select from Past Prescriptions option */}
                                        <div style={{ marginTop: '14px', textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => setShowPastRxModal(true)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: selectedPastRx ? '#059669' : '#2563eb',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                <FileText size={14} />
                                                {selectedPastRx 
                                                    ? (isHindi ? `पिछली पर्ची चुनी गई (#${selectedPastRx._id.slice(-4)}) (बदलें)` : `Selected Past Rx (#${selectedPastRx._id.slice(-4)}) (Change)`) 
                                                    : (isHindi ? 'या पहले की पर्ची चुनें (पुराने ऑर्डर से)' : 'Or choose from past prescriptions')
                                                }
                                            </button>
                                        </div>

                                        {error && <div className="alert alert-error" style={{ marginTop: '14px' }}>{error}</div>}

                                        {/* Fixed/Sticky Bottom Actions for Step 2 */}
                                        <div className="fixed-bottom-actions">
                                            <div className="fixed-bottom-actions-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveStep(1)}
                                                    style={{
                                                        minHeight: '48px',
                                                        padding: '0 20px',
                                                        borderRadius: '12px',
                                                        border: '1.5px solid #cbd5e1',
                                                        background: '#f8fafc',
                                                        color: '#334155',
                                                        fontWeight: '700',
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    ← {t('pharmacy.back', { defaultValue: isHindi ? 'पता बदलें' : 'Change Address' })}
                                                </button>

                                                <button 
                                                    type="button"
                                                    onClick={handleProceedToStep3}
                                                    className="btn-submit-premium" 
                                                    style={{ 
                                                        flex: 1, 
                                                        margin: 0,
                                                        minHeight: '48px',
                                                        padding: '0 24px',
                                                        fontSize: '15px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <span>{isHindi ? 'आगे बढ़ें' : 'Continue'}</span>
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ================= STEP 3: MEDICINE SELECTION / SCOPE ================= */}
                                {activeStep === 3 && (
                                    <div className="medicine-selection-step-content">
                                        {/* Step 3 Heading */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                                <span style={{ fontSize: '18px' }}>💊</span>
                                                3. {isHindi ? 'पर्ची की दवाई का चयन' : 'Medicine Selection'}
                                            </h4>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '10px' }}>
                                                {isHindi ? 'चरण 3 का 4' : 'Step 3 of 4'}
                                            </span>
                                        </div>

                                        {/* Selected Prescription Confirmation Card */}
                                        <div style={{
                                            marginBottom: '16px',
                                            padding: '12px 14px',
                                            borderRadius: '12px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                                {preview ? (
                                                    <img 
                                                        src={preview} 
                                                        alt="Prescription Preview" 
                                                        style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <FileText size={20} color="#059669" />
                                                    </div>
                                                )}
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                        {selectedPastRx 
                                                            ? (isHindi ? `पिछली पर्ची #${selectedPastRx._id.slice(-6)}` : `Past Prescription #${selectedPastRx._id.slice(-6)}`) 
                                                            : (file?.name || (isHindi ? 'अपलोड किया गया पर्चा' : 'Uploaded Prescription'))
                                                        }
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle size={12} color="#16a34a" /> {isHindi ? 'पर्चा संलग्न है' : 'Prescription attached'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveStep(2)}
                                                style={{
                                                    padding: '5px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #cbd5e1',
                                                    background: '#ffffff',
                                                    color: '#2563eb',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {isHindi ? 'पर्चा बदलें' : 'Change'}
                                            </button>
                                        </div>

                                        {/* Medicine Selection Scope Cards */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block' }}>
                                                {isHindi ? 'कृपया अपनी आवश्यकता अनुसार विकल्प चुनें:' : 'Please choose your requirement:'}
                                            </label>

                                            {/* Option 1: Need All Medicines */}
                                            <div 
                                                onClick={() => setNeedAllMedicines(true)}
                                                style={{
                                                    padding: '16px',
                                                    borderRadius: '14px',
                                                    border: `2px solid ${needAllMedicines ? '#2563eb' : '#e2e8f0'}`,
                                                    background: needAllMedicines ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' : '#ffffff',
                                                    boxShadow: needAllMedicines ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '14px'
                                                }}
                                            >
                                                <div style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    border: `2px solid ${needAllMedicines ? '#2563eb' : '#94a3b8'}`,
                                                    background: needAllMedicines ? '#2563eb' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginTop: '2px'
                                                }}>
                                                    {needAllMedicines && <CheckCircle size={14} color="#ffffff" />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: needAllMedicines ? '#1d4ed8' : '#1e293b', marginBottom: '4px' }}>
                                                        {isHindi ? 'पर्ची की सभी दवाई चाहिए' : 'Need All Medicines from Prescription'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                                                        {isHindi 
                                                            ? 'डॉक्टर द्वारा पर्चे में लिखी सभी दवाइयाँ तैयार करके आपके पते पर भेजी जाएँगी।' 
                                                            : 'All medicines prescribed by the doctor will be prepared and delivered.'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Option 2: Need Specific Medicines */}
                                            <div 
                                                onClick={() => setNeedAllMedicines(false)}
                                                style={{
                                                    padding: '16px',
                                                    borderRadius: '14px',
                                                    border: `2px solid ${!needAllMedicines ? '#2563eb' : '#e2e8f0'}`,
                                                    background: !needAllMedicines ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' : '#ffffff',
                                                    boxShadow: !needAllMedicines ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '14px'
                                                }}
                                            >
                                                <div style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '50%',
                                                    border: `2px solid ${!needAllMedicines ? '#2563eb' : '#94a3b8'}`,
                                                    background: !needAllMedicines ? '#2563eb' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    marginTop: '2px'
                                                }}>
                                                    {!needAllMedicines && <CheckCircle size={14} color="#ffffff" />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: !needAllMedicines ? '#1d4ed8' : '#1e293b', marginBottom: '4px' }}>
                                                        {isHindi ? 'कुछ विशेष दवाई चाहिए (अगले स्टेप में नोट्स में लिखें)' : 'Need Specific Medicines (Specify in next step)'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                                                        {isHindi 
                                                            ? 'यदि आपको केवल कुछ दवाइयाँ चाहिए, तो अगले स्टेप में आप उनके नाम आसानी से लिख सकेंगे।' 
                                                            : 'If you only need select medicines, you will be able to list their names in the next step.'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {error && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{error}</div>}

                                        {/* Fixed/Sticky Bottom Actions for Step 3 */}
                                        <div className="fixed-bottom-actions">
                                            <div className="fixed-bottom-actions-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveStep(2)}
                                                    style={{
                                                        minHeight: '48px',
                                                        padding: '0 20px',
                                                        borderRadius: '12px',
                                                        border: '1.5px solid #cbd5e1',
                                                        background: '#f8fafc',
                                                        color: '#334155',
                                                        fontWeight: '700',
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    ← {t('pharmacy.back', { defaultValue: isHindi ? 'पीछे जाएँ' : 'Back' })}
                                                </button>

                                                <button 
                                                    type="button"
                                                    onClick={handleProceedToStep4}
                                                    className="btn-submit-premium" 
                                                    style={{ 
                                                        flex: 1, 
                                                        margin: 0,
                                                        minHeight: '48px',
                                                        padding: '0 24px',
                                                        fontSize: '15px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <span>{isHindi ? 'आगे बढ़ें' : 'Next'}</span>
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ================= STEP 4: COURSE DURATION & FINAL DETAILS ================= */}
                                {activeStep === 4 && (
                                    <div className="course-duration-step-content">
                                        {/* Step 4 Heading */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                                <span style={{ fontSize: '18px' }}>📅</span>
                                                4. {isHindi ? 'कोर्स अवधि एवं अंतिम विवरण' : 'Course Duration & Final Details'}
                                            </h4>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '10px' }}>
                                                {isHindi ? 'चरण 4 का 4' : 'Step 4 of 4'}
                                            </span>
                                        </div>

                                        {/* Course Duration Selector */}
                                        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={16} color="#059669" />
                                                    {isHindi ? 'दवाई कितने दिन की चाहिए:' : 'Course Duration:'}
                                                </span>
                                                {courseDays && (
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '8px' }}>
                                                        {courseDays} {isHindi ? 'दिन का कोर्स' : 'Days Course'}
                                                    </span>
                                                )}
                                            </label>

                                            {/* Quick preset chips */}
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                {[7, 15, 30, 45, 60, 90].map((d) => (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => setCourseDays(d)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '8px',
                                                            border: `1.5px solid ${Number(courseDays) === d ? '#10b981' : '#cbd5e1'}`,
                                                            background: Number(courseDays) === d ? '#ecfdf5' : '#ffffff',
                                                            color: Number(courseDays) === d ? '#047857' : '#475569',
                                                            fontWeight: '700',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        {d} {isHindi ? 'दिन' : 'Days'}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom days input */}
                                            <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="365"
                                                    value={courseDays} 
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCourseDays(val === '' ? '' : Math.max(1, Math.min(365, parseInt(val) || 1)));
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor = '#cbd5e1';
                                                    }}
                                                    placeholder={isHindi ? "दिन संख्या लिखें" : "Enter days"}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 48px 10px 14px',
                                                        borderRadius: '10px',
                                                        border: '2px solid #cbd5e1',
                                                        fontSize: '14px',
                                                        fontWeight: '700',
                                                        color: '#0f172a',
                                                        background: '#ffffff',
                                                        outline: 'none',
                                                        boxSizing: 'border-box'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                                />
                                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: '700', color: '#64748b', pointerEvents: 'none' }}>
                                                    {isHindi ? 'दिन' : 'Days'}
                                                </span>
                                            </div>
                                            <small style={{ color: '#64748b', fontSize: '11px', marginTop: '8px', display: 'block' }}>
                                                {isHindi ? 'मरीज अपनी आवश्यकता अनुसार जितने दिन की दवाई चाहिए यहाँ संख्या (दिन) भर सकते हैं।' : 'Enter the number of days for which medicines are required.'}
                                            </small>
                                        </div>

                                        {/* Patient Notes / Specific Medicines List */}
                                        <div style={{ 
                                            marginBottom: '16px', 
                                            padding: !needAllMedicines ? '14px' : '0', 
                                            background: !needAllMedicines ? '#fffbeb' : 'transparent',
                                            borderRadius: '12px',
                                            border: !needAllMedicines ? '1.5px solid #fde68a' : 'none'
                                        }}>
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: !needAllMedicines ? '#92400e' : '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileText size={15} color={!needAllMedicines ? '#d97706' : '#64748b'} />
                                                {!needAllMedicines 
                                                    ? (isHindi ? 'आवश्यक दवाइयों के नाम व निर्देश (यहाँ लिखें):' : 'Specify Medicine Names & Instructions:')
                                                    : (isHindi ? 'अतिरिक्त निर्देश / वैकल्पिक नोट्स (वैकल्पिक):' : (t('pharmacy.optionalNotes') || 'Additional Notes (Optional)'))
                                                }
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder={!needAllMedicines 
                                                    ? (isHindi ? "उदा. मुझे केवल Paracetamol 650 और Cetirizine 10mg चाहिए..." : "e.g. I only need Paracetamol 650 and Cetirizine 10mg...")
                                                    : (t('pharmacy.placeholderNotes') || "Any specific instructions for the pharmacy or delivery person...")
                                                }
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '12px', 
                                                    borderRadius: '10px', 
                                                    border: '1.5px solid #cbd5e1', 
                                                    background: '#ffffff', 
                                                    fontSize: '13px', 
                                                    minHeight: '80px', 
                                                    resize: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>

                                        {/* Pharmacy FAQs */}
                                        {pharmacyConfig?.faqs?.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block' }}>{t('pharmacy.additionalInfo')}</label>
                                                {pharmacyConfig.faqs.map((faq, idx) => (
                                                    <div key={idx} style={{ marginBottom: '12px' }}>
                                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                                                            {(isHindi && faq.question_hi) ? faq.question_hi : faq.question} <span style={{ color: '#ef4444' }}>*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={faqAnswers[faq.id] || ''}
                                                            onChange={(e) => setFaqAnswers(prev => ({ ...prev, [faq.id]: e.target.value }))}
                                                            placeholder={t('pharmacy.yourAnswer')}
                                                            required
                                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Contact Timing Notification Banner */}
                                        <div style={{ marginBottom: '15px', padding: '10px 15px', borderRadius: '10px', background: getContactTiming().type === 'day' ? '#f0fdf4' : '#fffbeb', border: `1px solid ${getContactTiming().type === 'day' ? '#bbf7d0' : '#fef3c7'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ color: getContactTiming().type === 'day' ? '#16a34a' : '#d97706' }}>
                                                {getContactTiming().icon}
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: getContactTiming().type === 'day' ? '#15803d' : '#92400e' }}>
                                                {getContactTiming().text}
                                            </span>
                                        </div>

                                        {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}
                                        {success && <div className="alert alert-success" style={{ marginBottom: '12px' }}>{isHindi ? 'सफलतापूर्वक अपलोड किया गया! समीक्षा जारी है।' : 'Successfully uploaded! Review in progress.'}</div>}

                                        {/* Fixed/Sticky Bottom Actions for Step 4 */}
                                        <div className="fixed-bottom-actions">
                                            <div className="fixed-bottom-actions-inner">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveStep(3)}
                                                    style={{
                                                        minHeight: '48px',
                                                        padding: '0 20px',
                                                        borderRadius: '12px',
                                                        border: '1.5px solid #cbd5e1',
                                                        background: '#f8fafc',
                                                        color: '#334155',
                                                        fontWeight: '700',
                                                        fontSize: '13px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    ← {t('pharmacy.back', { defaultValue: isHindi ? 'पीछे जाएँ' : 'Back' })}
                                                </button>

                                                <button 
                                                    type="submit" 
                                                    className="btn-submit-premium" 
                                                    disabled={loading} 
                                                    style={{ 
                                                        flex: 1, 
                                                        margin: 0,
                                                        minHeight: '48px',
                                                        padding: '0 24px',
                                                        fontSize: '15px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    {loading ? (
                                                        <div className="loader"></div>
                                                    ) : (
                                                        <>
                                                            <Zap size={18} fill="currentColor" />
                                                            {t('pharmacy.submitNow', { defaultValue: isHindi ? 'ऑर्डर सबमिट करें' : 'Submit Order' })}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                    </div>
                                </form>


                                
                            </div>
                        </div>
                    </div>
                </section>

                {/* <div style={{ margin: '40px 0 20px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        className="refresh-btn"
                        onClick={() => navigate('/order-history')}
                        style={{ background: '#3182ce', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600' }}
                    >
                        <Clock size={18} /> {t('pharmacy.viewHistory')}
                    </button>
                </div> */} 
            </main>

            <Footer />

            {/* Checkout Modal */}
            {checkoutModalOpen && selectedPrescription && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card">
                        <div className="checkout-header">
                            <h2>{selectedPrescription.status === 'Ordered' ? t('pharmacy.orderDetailsDosage') : t('pharmacy.confirmReorder')}</h2>
                            <button className="btn-close" onClick={() => setCheckoutModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="verified-items-list">
                            <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>{t('pharmacy.verifiedItemsAvailable')}</h4>
                            {selectedPrescription.verifiedItems.filter(i => i.isAvailable).map((item, idx) => (
                                <VerifiedItemRow key={idx} item={item} />
                            ))}
                            <div className="checkout-total">
                                <span>{t('pharmacy.grandTotal')}</span>
                                <span>₹{(Number(calculateTotal(selectedPrescription.verifiedItems)) || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        {checkoutSuccess ? (
                            <div className="checkout-alert alert-success">
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                {t('pharmacy.orderPlacedSuccess')}
                            </div>
                        ) : (selectedPrescription.status === 'Ordered' && !isReorderFlow) ? (
                            <div className="checkout-alert alert-success" style={{ marginTop: '20px' }}>
                                <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                {t('pharmacy.orderAlreadyPlaced')}
                            </div>
                        ) : (
                            <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                                <div className="shipping-address-section" style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, color: '#4a5568' }}>{t('pharmacy.shippingAddress')}</h4>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                className="btn-add-new-addr"
                                                onClick={handleDetectLocation}
                                                style={{ fontSize: '12px', background: '#ebf8ff', border: '1px solid #90cdf4', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#2b6cb0' }}
                                            >
                                                <MapPin size={14} /> {t('pharmacy.detectLocation')}
                                            </button>
                                            {savedAddresses.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn-add-new-addr"
                                                    onClick={() => {
                                                        setIsAddingNewAddress(true);
                                                        setIsOrderingForSomeoneElse(false);
                                                        setShippingDetails({ _id: null, street: '', city: '', state: '', zip: '', phone: '', altPhone: '' });
                                                        setPincodeError('');
                                                    }}
                                                    style={{ fontSize: '12px', background: '#f7fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Plus size={14} /> {t('pharmacy.addNew')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {!isAddingNewAddress && savedAddresses.length > 0 ? (
                                        <div className="saved-addresses-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '2px' }}>
                                            {savedAddresses.map(addr => (
                                                <div
                                                    key={addr._id}
                                                    className={`saved-addr-card ${shippingDetails._id === addr._id ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setShippingDetails(addr);
                                                        validatePincode(addr.zip);
                                                    }}
                                                    style={{
                                                        padding: '12px', borderRadius: '8px', border: shippingDetails._id === addr._id ? '2px solid #3182ce' : '1px solid #e2e8f0',
                                                        cursor: 'pointer', backgroundColor: shippingDetails._id === addr._id ? '#ebf8ff' : '#fff',
                                                        position: 'relative', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <MapPin size={18} color={shippingDetails._id === addr._id ? '#3182ce' : '#a0aec0'} style={{ marginTop: '2px' }} />
                                                        <div style={{ fontSize: '14px', flex: 1 }}>
                                                            <div style={{ fontWeight: '600', marginBottom: '2px' }}>{addr.label || t('pharmacy.home')}</div>
                                                            <div style={{ color: '#4a5568' }}>{addr.street}, {addr.city}, {addr.zip}</div>
                                                            <div style={{ color: '#718096', fontSize: '12px', marginTop: '4px' }}>
                                                                {isHindi ? 'मोबाइल: ' : 'Phone: '}{addr.phone} {addr.altPhone && `| ${isHindi ? 'अन्य: ' : 'Alt: '}${addr.altPhone}`}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            title="Edit"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsAddingNewAddress(true);
                                                                setShippingDetails(addr);
                                                                validatePincode(addr.zip);
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', padding: '4px' }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="new-address-form" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '3px solid #cbd5e1' }}>
                                            <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }}>
                                                <label>{t('pharmacy.streetAddress')}</label>
                                                <input type="text" required value={shippingDetails.street} onChange={e => handleStreetChange(e.target.value, 'modal')} placeholder={t('pharmacy.placeholderStreet')} />
                                                {activeInputContext === 'modal' && suggestions.length > 0 && (
                                                    <ul style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        zIndex: 99,
                                                        background: '#ffffff',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                        marginTop: '4px',
                                                        listStyle: 'none',
                                                        padding: '4px 0',
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        textAlign: 'left'
                                                    }}>
                                                        {suggestions.map((sug) => (
                                                            <li
                                                                key={sug.place_id}
                                                                onClick={() => handleSelectSuggestion(sug.place_id)}
                                                                style={{
                                                                    padding: '10px 12px',
                                                                    fontSize: '13px',
                                                                    color: '#334155',
                                                                    cursor: 'pointer',
                                                                    transition: 'background-color 0.2s',
                                                                    borderBottom: '1px solid #f1f5f9'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{sug.structured_formatting?.main_text || sug.description}</div>
                                                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sug.structured_formatting?.secondary_text}</div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>{t('pharmacy.pinCode')} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{isHindi ? '(पहला चरण)' : '(Step 1)'}</span></label>
                                                    <input type="text" required value={shippingDetails.zip} onChange={e => handleManualZipChange(e.target.value)} placeholder={t('pharmacy.placeholderPin')} />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>{t('pharmacy.state')}</label>
                                                    <input type="text" required value={shippingDetails.state} onChange={e => setShippingDetails({ ...shippingDetails, state: e.target.value })} placeholder={t('pharmacy.state')} />
                                                </div>
                                            </div>

                                            {pincodeError && (
                                                <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '-5px', marginBottom: '15px', fontWeight: '600', width: '100%', textAlign: 'left', background: '#fff5f5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                                                    {pincodeError}
                                                </div>
                                            )}

                                            {/* Level 2: Dynamic Village/City Dropdown for this PIN Code */}
                                            {shippingDetails.zip && !pincodeError && (
                                                <div className="form-group" style={{ marginBottom: '15px', background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                        <CheckCircle size={16} color="#16a34a" />
                                                        {isHindi ? `गाँव / कस्बा चुनें (चरण 2: पिन ${shippingDetails.zip} के लिए)` : `Select Village / Town (Step 2: For PIN ${shippingDetails.zip})`} <span style={{ color: '#ef4444' }}>*</span>
                                                    </label>
                                                    <select
                                                        value={shippingDetails.villageName || shippingDetails.city || ''}
                                                        onChange={(e) => {
                                                            const selectedVal = e.target.value;
                                                            setShippingDetails(prev => ({ ...prev, city: selectedVal, villageName: selectedVal }));
                                                        }}
                                                        required
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 12px',
                                                            borderRadius: '8px',
                                                            border: '2px solid #16a34a',
                                                            background: '#ffffff',
                                                            fontWeight: '700',
                                                            color: '#0f172a',
                                                            fontSize: '13px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="">{isHindi ? '-- इस पिन कोड के तहत अपना गाँव / कस्बा चुनें --' : '-- Select your Village / Town for this PIN --'}</option>
                                                        {getVillagesForPincode(shippingDetails.zip).map((village, idx) => (
                                                            <option key={idx} value={village}>{village}</option>
                                                        ))}
                                                    </select>
                                                    <small style={{ color: '#15803d', fontSize: '11px', marginTop: '5px', display: 'block', fontWeight: '500' }}>
                                                        {isHindi ? '✓ पिन कोड स्वीकृत! कृपया डिलीवरी के लिए उपरोक्त सूची में से अपना गाँव/शहर चुनें।' : '✓ PIN code accepted! Please select your village/city from above list for delivery.'}
                                                    </small>
                                                </div>
                                            )}
                                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', justifyContent: 'flex-start' }} onClick={() => setIsOrderingForSomeoneElse(!isOrderingForSomeoneElse)}>
                                                <input
                                                    type="checkbox"
                                                    id="someone-else"
                                                    checked={isOrderingForSomeoneElse}
                                                    onChange={e => {
                                                        e.stopPropagation();
                                                        setIsOrderingForSomeoneElse(e.target.checked);
                                                    }}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                                                />
                                                <label htmlFor="someone-else" style={{ margin: 0, cursor: 'pointer', fontWeight: '500', color: '#3182ce', fontSize: '14px' }}>{t('pharmacy.orderingForSomeoneElse')}</label>
                                            </div>

                                            {isOrderingForSomeoneElse && (
                                                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                    <div className="form-group" style={{ flex: 1 }}>
                                                        <label>{t('pharmacy.receiverPhone')}</label>
                                                        <input type="text" required value={shippingDetails.phone} onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })} placeholder={t('pharmacy.placeholderMobile')} />
                                                    </div>
                                                    <div className="form-group" style={{ flex: 1 }}>
                                                        <label>{t('pharmacy.altPhoneOptional')}</label>
                                                        <input type="text" value={shippingDetails.altPhone || ''} onChange={e => setShippingDetails({ ...shippingDetails, altPhone: e.target.value })} placeholder={t('pharmacy.placeholderAltPhone')} />
                                                    </div>
                                                </div>
                                            )}
                                            {savedAddresses.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingNewAddress(false);
                                                        if (savedAddresses.length > 0) {
                                                            setShippingDetails(savedAddresses[0]);
                                                            validatePincode(savedAddresses[0].zip);
                                                        }
                                                    }}
                                                    style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid #cbd5e0', borderRadius: '6px', color: '#4a5568', fontSize: '13px', cursor: 'pointer' }}
                                                >
                                                    {t('pharmacy.cancelSavedAddress')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>{t('pharmacy.paymentMethod')}</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="Online">{t('pharmacy.onlinePayment')}</option>
                                        <option value="COD">{t('pharmacy.codPayment')}</option>
                                    </select>
                                </div>

                                {checkoutError && <div className="alert alert-error" style={{ padding: '10px', marginTop: 0 }}>{checkoutError}</div>}

                                <button type="submit" className="btn-pay-now" disabled={checkoutLoading} style={{ background: '#1e293b' }}>
                                    {checkoutLoading ? <div className="loader" style={{ margin: '0 auto' }}></div> : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            <Zap size={18} fill="currentColor" />
                                            <span>{t('pharmacy.confirmPlaceReorder', { total: (Number(calculateTotal(selectedPrescription.verifiedItems)) || 0).toFixed(2) })}</span>
                                        </div>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Prescriptions Modal (90 Days) */}
            {showRecentModal && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card" style={{ maxWidth: '600px' }}>
                        <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px 24px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'white' }}>{t('pharmacy.recentVerifiedPrescriptions')}</h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7, color: 'white' }}>{t('pharmacy.selectToReorder')}</p>
                            </div>
                            <button className="close-btn-light" onClick={() => setShowRecentModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-p" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
                                {t('pharmacy.reorderLimitInfo')}
                            </p>

                            {(() => {
                                const ninetyDaysAgo = new Date();
                                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

                                const recentOnes = myPrescriptions.filter(p =>
                                    new Date(p.createdAt) >= ninetyDaysAgo &&
                                    (p.status === 'Verified' || p.status === 'Ordered')
                                ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                                if (recentOnes.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <FileText size={48} color="#cbd5e0" style={{ margin: '0 auto 15px' }} />
                                            <p style={{ color: '#a0aec0' }}>{t('pharmacy.noVerifiedLast90')}</p>
                                        </div>
                                    );
                                }

                                return recentOnes.map(p => (
                                    <div
                                        key={p._id}
                                        className="order-card-premium"
                                        style={{ marginBottom: '15px', padding: '15px', border: '1px solid #e2e8f0' }}
                                    >
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                <img
                                                    src={p.image.startsWith('http') ? p.image : `${API_BASE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`}
                                                    alt="Verified Medicine Order Prescription Thumbnail - The Dharmarth Medical Foundation"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: '700', color: '#2d3748' }}>
                                                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {getStatusBadge(p.status)}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#718096' }}>
                                                    {t('pharmacy.verifiedMedicinesCount', { count: p.verifiedItems?.length || 0 })}
                                                </div>
                                            </div>
                                            <button
                                                className="btn-action-primary"
                                                style={{ padding: '8px 24px', fontSize: '13px', borderRadius: '10px' }}
                                                onClick={() => handleReorder(p)}
                                            >
                                                {t('pharmacy.reorderNow')}
                                            </button>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Track Order Detail Modal */}
            {trackModalOpen && selectedTrackOrder && (
                <div className="order-modal-overlay">
                    <div className="premium-modal">
                        <div className="modal-header-gradient">
                            <div className="header-text">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="order-badge color-white">{t('pharmacy.orderIdPrefix', { id: selectedTrackOrder._id.substring(selectedTrackOrder._id.length - 8).toUpperCase() })}</div>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/track/${selectedTrackOrder._id}`;
                                            navigator.clipboard.writeText(url);
                                            toast.success(t('pharmacy.trackingLinkCopied'));
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', color: '#cbd5e1', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Share2 size={12} /> {t('pharmacy.copyLink')}
                                    </button>
                                </div>
                                <h2 style={{ margin: 0, fontSize: '20px' }}>{t('pharmacy.orderTracker')}</h2>
                            </div>
                            <button className="close-btn-light" onClick={() => setTrackModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body-premium">
                            {/* Progress Bar */}
                            <div className="status-progress-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
                                {/* Progress Line Fill */}
                                <div className="progress-line-fill" style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '10px',
                                    width: `${(() => {
                                        const idx = getStatusIndex(selectedTrackOrder.status);
                                        return idx >= 0 ? (idx / 5) * 100 : 0;
                                    })()}%`,
                                    height: '2px',
                                    background: '#38a169',
                                    zIndex: 1,
                                    transition: 'width 0.4s ease'
                                }}></div>

                                {(() => {
                                    const currentIdx = getStatusIndex(selectedTrackOrder.status);
                                    const steps = [
                                        { label: t('pharmacy.progress.pending'), idx: 0 },
                                        { label: t('pharmacy.progress.processing'), idx: 1 },
                                        { label: t('pharmacy.progress.readyForPacking'), idx: 2 },
                                        { label: t('pharmacy.progress.readyForDispatch'), idx: 3 },
                                        { label: t('pharmacy.progress.shipping'), idx: 4 },
                                        { label: t('pharmacy.progress.delivered'), idx: 5 }
                                    ];
                                    return steps.map(step => (
                                        <div key={step.idx} className={`progress-step ${currentIdx >= step.idx ? 'active' : ''}`}>
                                            <div className="step-point"></div>
                                            <span>{step.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>

                            <div className="premium-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: (selectedTrackOrder.status === 'Out for Delivery' || selectedTrackOrder.status === 'Delivered') ? '1.1fr 0.9fr' : '1fr',
                                gap: '30px',
                                maxWidth: (selectedTrackOrder.status === 'Out for Delivery' || selectedTrackOrder.status === 'Delivered') ? '100%' : '600px',
                                margin: '0 auto'
                            }}>
                                {/* Box 1: Dispatch & Logistics (Conditionally Shown) */}
                                {(selectedTrackOrder.status === 'Out for Delivery' || selectedTrackOrder.status === 'Delivered') && (
                                    <section className="customer-info-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '550px', background: 'white', borderRadius: '20px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                                        <div className="pane-header" style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="icon-circle" style={{ width: '32px', height: '32px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Truck size={18} /></div>
                                            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{t('pharmacy.dispatchLogistics')}</h3>
                                        </div>
                                        <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="pill-info" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.vehicleName')}</span>
                                                        <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.vehicleName || 'N/A'}</span>
                                                    </div>
                                                    <div className="data-row">
                                                        <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.busNumber')}</span>
                                                        <span className="data-value" style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.busNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.meetBusAt')}</span>
                                                    <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.pickupStoppage || t('pharmacy.finalizingStation')}</span>
                                                </div>
                                                <div className="data-row">
                                                    <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.driverNumber')}</span>
                                                    <span className="data-value" style={{ display: 'block', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{selectedTrackOrder.dispatchDetails?.conductorNumber || selectedTrackOrder.shippingAddress?.phone}</span>
                                                </div>
                                            </div>

                                            <div className="data-row" style={{ marginTop: '5px' }}>
                                                <span className="data-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{t('pharmacy.estimatedArrival')}</span>
                                                <span className="data-value" style={{ display: 'block', fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{selectedTrackOrder.dispatchDetails?.estimatedArrivalTime || t('pharmacy.awaitingSchedule')}</span>
                                            </div>

                                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', height: '140px', marginTop: 'auto' }} onClick={() => {
                                                const img = selectedTrackOrder.dispatchDetails?.busId?.image || selectedTrackOrder.dispatchDetails?.busImage;
                                                if (img) setImageModalSrc(img);
                                            }}>
                                                {(() => {
                                                    const finalImage = selectedTrackOrder.dispatchDetails?.busId?.image || selectedTrackOrder.dispatchDetails?.busImage;
                                                    if (!finalImage) return <div style={{ padding: '50px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>{t('pharmacy.identityPhotoPending')}</div>;
                                                    const resolvedUrl = finalImage.startsWith('http')
                                                        ? finalImage
                                                        : `${API_BASE_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
                                                    return <img src={resolvedUrl} alt="Express Medicine Delivery Vehicle - The Dharmarth Medical Foundation Logistics" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                                })()}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Box 2: Order Summary */}
                                <section className="items-info-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '550px', background: 'white', borderRadius: '24px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                    <div className="pane-header" style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="icon-circle" style={{ width: '36px', height: '36px', background: '#38a169', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><ShoppingBag size={20} /></div>
                                            <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, color: '#1e293b' }}>{t('pharmacy.orderSummary')}</h3>
                                        </div>
                                        <div style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', textTransform: 'uppercase' }}>{t('pharmacy.verifiedPacket')}</div>
                                    </div>

                                    <div className="pane-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div className="medicine-items-scroll" style={{ flex: 1, marginBottom: '20px' }}>
                                            {selectedTrackOrder.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontSize: '16px' }}>💊</span>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', lineHeight: '1.2' }}>{item.name || item.medicineName}</span>
                                                            <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '14px' }}>₹{item.price?.toFixed(2)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t('pharmacy.unitCount', { count: item.quantity, plural: item.quantity > 1 ? 's' : '' })}</span>
                                                            {item.frequency && (
                                                                <span style={{ width: '3px', height: '3px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                                                            )}
                                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{item.frequency}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="receipt-footer" style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                            <div style={{ marginBottom: '15px' }}>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{t('pharmacy.deliverTo')}</div>
                                                <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
                                                    {selectedTrackOrder.shippingAddress?.street},<br />
                                                    {selectedTrackOrder.shippingAddress?.city} - {selectedTrackOrder.shippingAddress?.zip}
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px dashed #e2e8f0', margin: '15px 0', paddingTop: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>{t('pharmacy.itemsTotal')}</span>
                                                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '700' }}>₹{(Number(selectedTrackOrder.totalAmount) || 0).toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                                    <span style={{ fontSize: '15px', color: '#1e293b', fontWeight: '800' }}>{t('pharmacy.amountPaid')}</span>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '22px', color: '#16a34a', fontWeight: '900', lineHeight: '1' }}>₹{(Number(selectedTrackOrder.totalAmount) || 0).toFixed(2)}</div>
                                                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>{t('pharmacy.transactionSuccess')}</div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => window.open(`${API_BASE_URL}/api/orders/public/${selectedTrackOrder._id}/invoice`, '_blank')}
                                                    style={{
                                                        width: '100%',
                                                        marginTop: '20px',
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: '#fff',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#475569',
                                                        fontWeight: '700',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                                                    onMouseOut={(e) => e.target.style.background = '#fff'}
                                                >
                                                    <FileText size={16} />
                                                    {t('pharmacy.downloadInvoice')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>


                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {imageModalSrc && (
                <div className="image-viewer-modal-overlay" onClick={() => setImageModalSrc(null)}>
                    <div className="image-viewer-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-close-viewer" onClick={() => setImageModalSrc(null)}>
                            <X size={24} color="white" />
                        </button>
                        <img
                            src={imageModalSrc.startsWith('http')
                                ? imageModalSrc
                                : `${API_BASE_URL}${imageModalSrc.startsWith('/') ? '' : '/'}${imageModalSrc}`
                            }
                            alt="Uploaded Doctor Prescription Receipt Full View - The Dharmarth Medical Foundation"
                        />
                    </div>
                </div>
            )}
            {/* Post-Upload Success Modal */}
            {showPostUploadModal && (
                <div className="checkout-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="checkout-modal-card" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#f0fff4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#38a169' }}>
                            <CheckCircle size={40} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '16px' }}>{t('pharmacy.prescriptionSubmitted')}</h2>
                        <div style={{ color: '#718096', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '30px' }}>
                            <p style={{ marginBottom: '15px' }}>{t('pharmacy.uploadedSuccess')}</p>
                            <p style={{ marginBottom: '15px', fontWeight: '600', color: '#4a5568' }}>{t('pharmacy.verifyHours')}</p>
                            <p>{localStorage.getItem('user') ? t('pharmacy.afterVerifyUser') : t('pharmacy.afterVerifyGuest')}</p>
                        </div>
                        <button
                            className="btn-submit-premium"
                            style={{ marginTop: '0' }}
                            onClick={() => {
                                setShowPostUploadModal(false);
                                if (!localStorage.getItem('user')) {
                                    toast.success(
                                        isHindi 
                                            ? "पर्चा सफलतापूर्वक जमा हो गया! सत्यापन के बाद आपको SMS/WhatsApp पर सूचना मिलेगी।"
                                            : "Prescription submitted! You will receive updates via SMS/WhatsApp."
                                    );
                                }
                                navigate('/order-history');
                            }}
                        >
                            {t('pharmacy.gotItThanks')}
                        </button>
                    </div>
                </div>
            )}

            {/* Guest Info Modal */}
            {showGuestModal && (
                <div className="checkout-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="checkout-modal-card" style={{ maxWidth: '450px', padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#2d3748' }}>{t('pharmacy.guestInfo')}</h2>
                            <button onClick={() => setShowGuestModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: '#718096', marginBottom: '24px', fontSize: '0.95rem' }}>
                            {t('pharmacy.guestPrompt')}
                        </p>
                        <form onSubmit={handleGuestSubmit}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>{t('pharmacy.fullName')}</label>
                                <input
                                    type="text"
                                    required
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    placeholder={t('pharmacy.fullNamePlaceholder')}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568' }}>{t('pharmacy.mobileNumber')}</label>
                                <input
                                    type="tel"
                                    required
                                    maxLength="10"
                                    value={guestMobile}
                                    onChange={e => setGuestMobile(e.target.value.replace(/\D/g, ''))}
                                    placeholder={t('pharmacy.mobilePlaceholder')}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-submit-premium"
                                disabled={loading}
                                style={{ width: '100%', margin: 0 }}
                            >
                                {loading ? <div className="loader"></div> : t('pharmacy.confirmSubmit')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Prescription Source Chooser Modal (Camera vs Gallery) */}
            {showUploadPickerModal && (
                <div
                    className="checkout-modal-overlay"
                    style={{ zIndex: 2000 }}
                    onClick={() => setShowUploadPickerModal(false)}
                >
                    <div
                        className="checkout-modal-card"
                        style={{ maxWidth: '400px', padding: '24px', borderRadius: '20px', textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '800' }}>
                                {isHindi ? 'पर्चा अपलोड करें' : 'Upload Prescription'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowUploadPickerModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px' }}>
                            {isHindi ? 'कृपया पर्चा जोड़ने के लिए विकल्प चुनें:' : 'Please choose an option to upload prescription:'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            {/* Camera Option */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCameraPicker(e);
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '18px 12px',
                                    borderRadius: '16px',
                                    background: '#eff6ff',
                                    border: '2px solid #bfdbfe',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    background: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 10px rgba(37,99,235,0.25)'
                                }}>
                                    <Camera size={22} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#1d4ed8' }}>
                                        {isHindi ? 'कैमरा' : 'Camera'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                        {isHindi ? 'फोटो खींचें' : 'Take photo'}
                                    </div>
                                </div>
                            </button>

                            {/* Gallery Option */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openGalleryPicker(e);
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '18px 12px',
                                    borderRadius: '16px',
                                    background: '#f8fafc',
                                    border: '2px solid #cbd5e1',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    background: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 10px rgba(15,23,42,0.2)'
                                }}>
                                    <Upload size={22} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '13.5px', color: '#1e293b' }}>
                                        {isHindi ? 'गैलरी' : 'Gallery'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                        {isHindi ? 'फाइल्स से चुनें' : 'From files'}
                                    </div>
                                </div>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowUploadPickerModal(false)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '10px',
                                background: '#f1f5f9',
                                border: 'none',
                                color: '#64748b',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            {isHindi ? 'रद्द करें' : 'Cancel'}
                        </button>
                    </div>
                </div>
            )}

            {/* Past Prescription Archive Selector Modal ("पहले की पर्ची चुनें") */}
            {showPastRxModal && (
                <div className="modal-overlay" onClick={() => setShowPastRxModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                                {isHindi ? 'पहले की पर्ची चुनें' : 'Select from Past Prescriptions'}
                            </h3>
                            <button onClick={() => setShowPastRxModal(false)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {myPrescriptions.length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b' }}>
                                <FileText size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                                <p style={{ margin: 0 }}>
                                    {isHindi ? 'आपके खाते में कोई पिछला पर्चा नहीं मिला।' : 'No past uploaded prescriptions found in your account.'}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {myPrescriptions.map((rx) => {
                                    const rxImg = rx.image ? (rx.image.startsWith('http') ? rx.image : `${API_BASE_URL}${rx.image.startsWith('/') ? '' : '/'}${rx.image}`) : null;
                                    return (
                                        <div
                                            key={rx._id}
                                            onClick={() => {
                                                setFile(null);
                                                const fileInput = document.getElementById('presc-upload');
                                                if (fileInput) fileInput.value = '';
                                                setSelectedPastRx(rx);
                                                setPreview(rxImg);
                                                setShowPastRxModal(false);
                                                toast.success(isHindi ? `पर्ची चुनी गई #${rx._id.slice(-4)}` : `Selected past prescription #${rx._id.slice(-4)}`);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                background: '#f8fafc'
                                            }}
                                        >
                                            {rxImg && (
                                                <img
                                                    src={rxImg}
                                                    alt="Rx thumbnail"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block' }}>
                                                {isHindi ? 'संदर्भ: #' : 'Ref: #'}{rx._id.slice(-6).toUpperCase()}
                                            </strong>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                {isHindi ? 'अपलोड तिथि: ' : 'Uploaded: '}{new Date(rx.createdAt).toLocaleDateString()}
                                            </span>
                                            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                                                {isHindi ? 'स्थिति: ' : 'Status: '}{rx.status}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            {isHindi ? 'चुनें' : 'Choose'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderMedicine;
